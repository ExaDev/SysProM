import * as z from "zod";
import { resolve, dirname } from "node:path";
import { existsSync } from "node:fs";
import type { CommandDef } from "../define-command.js";
import { loadDocument, saveDocument } from "../../io.js";
import type { SysProMDocument, Node } from "../../schema.js";
import {
  parseSpecKitFeature,
  parseConstitution,
  parseSpec,
  parsePlan,
  parseTasks,
  parseChecklist,
} from "../../speckit/parse.js";
import {
  generateSpecKitProject,
  generateConstitution,
  generateSpec,
  generatePlan,
  generateTasks,
  generateChecklist,
} from "../../speckit/generate.js";
import { detectSpecKitProject } from "../../speckit/project.js";

// ============================================================================
// Helper: Format detection
// ============================================================================

function detectFormat(outputPath: string): "json" | "single-md" | "multi-md" {
  if (outputPath.endsWith(".json") || outputPath.endsWith(".spm.json")) {
    return "json";
  }
  if (outputPath.endsWith(".md") || outputPath.endsWith(".spm.md")) {
    return "single-md";
  }
  return "json"; // default
}

// ============================================================================
// Helper: Compare documents for sync/diff
// ============================================================================

interface NodeDiff {
  added: Node[];
  modified: Array<{ old: Node; new: Node }>;
  removed: Node[];
}

function compareDocuments(
  oldDoc: SysProMDocument,
  newDoc: SysProMDocument,
): NodeDiff {
  const oldNodes = new Map((oldDoc.nodes ?? []).map((n) => [n.id, n]));
  const newNodes = new Map((newDoc.nodes ?? []).map((n) => [n.id, n]));

  const added: Node[] = [];
  const modified: Array<{ old: Node; new: Node }> = [];
  const removed: Node[] = [];

  // Find added and modified
  for (const [id, newNode] of newNodes) {
    const oldNode = oldNodes.get(id);
    if (!oldNode) {
      added.push(newNode);
    } else if (JSON.stringify(oldNode) !== JSON.stringify(newNode)) {
      modified.push({ old: oldNode, new: newNode });
    }
  }

  // Find removed
  for (const [id, oldNode] of oldNodes) {
    if (!newNodes.has(id)) {
      removed.push(oldNode);
    }
  }

  return { added, modified, removed };
}

// ============================================================================
// Subcommands
// ============================================================================

const importArgs = z.object({
  speckitDir: z.string().describe("Path to Spec-Kit feature directory"),
  output: z.string().describe("Path to output SysProM file"),
});

const importOpts = z.object({
  prefix: z.string().optional().describe("ID prefix (defaults to directory name)"),
});

const importSubcommand: CommandDef<typeof importArgs, typeof importOpts> = {
  name: "import",
  description: "Import a Spec-Kit feature directory into SysProM",
  args: importArgs,
  opts: importOpts,
  action(args, opts) {
    const specKitDir = resolve(args.speckitDir);
    const outputPath = resolve(args.output);

    if (!existsSync(specKitDir)) {
      console.error(`Error: Spec-Kit directory does not exist: ${specKitDir}`);
      process.exit(1);
    }

    // Determine the prefix: use flag if provided, otherwise use directory name
    let idPrefix = opts.prefix;
    if (!idPrefix) {
      // Extract the feature directory name (e.g., "001-feature-name")
      const dirName = specKitDir.split("/").pop() || "FEAT";
      idPrefix = dirName;
    }

    // Find constitution file by detecting the project from parent directories
    let constitutionPath: string | undefined;
    let searchDir = dirname(specKitDir);
    for (let i = 0; i < 5; i++) {
      // Search up to 5 levels
      const project = detectSpecKitProject(searchDir);
      if (project.constitutionPath) {
        constitutionPath = project.constitutionPath;
        break;
      }
      const parent = dirname(searchDir);
      if (parent === searchDir) break; // reached root
      searchDir = parent;
    }

    // Parse Spec-Kit feature
    const doc = parseSpecKitFeature(specKitDir, idPrefix, constitutionPath);

    // Determine output format
    const format = detectFormat(outputPath);

    // Save document
    saveDocument(doc, format, outputPath);

    // Print summary
    const nodeCount = doc.nodes?.length ?? 0;
    const relationshipCount = doc.relationships?.length ?? 0;
    console.log(`Imported Spec-Kit from ${specKitDir} to ${outputPath}`);
    console.log(`  ${nodeCount} nodes, ${relationshipCount} relationships`);
  },
};

const exportArgs = z.object({
  input: z.string().describe("Path to SysProM document"),
  speckitDir: z.string().describe("Path to Spec-Kit output directory"),
});

const exportOpts = z.object({
  prefix: z.string().describe("ID prefix identifying nodes to export"),
});

const exportSubcommand: CommandDef<typeof exportArgs, typeof exportOpts> = {
  name: "export",
  description: "Export SysProM document to Spec-Kit format",
  args: exportArgs,
  opts: exportOpts,
  action(args, opts) {
    const inputPath = resolve(args.input);
    const specKitDir = resolve(args.speckitDir);

    if (!opts.prefix) {
      console.error(
        "Error: --prefix flag is required for export (identifies which nodes to export)",
      );
      process.exit(1);
    }

    // Load SysProM document
    const { doc } = loadDocument(inputPath);

    // Generate Spec-Kit project
    generateSpecKitProject(doc, specKitDir, opts.prefix);

    // Print summary
    console.log(`Exported SysProM document from ${inputPath} to ${specKitDir}`);
    console.log(`  Generated Spec-Kit files with prefix: ${opts.prefix}`);
  },
};

const syncArgs = z.object({
  input: z.string().describe("Path to SysProM document"),
  speckitDir: z.string().describe("Path to Spec-Kit directory"),
});

const syncOpts = z.object({
  prefix: z.string().optional().describe("ID prefix (defaults to directory name)"),
});

const syncSubcommand: CommandDef<typeof syncArgs, typeof syncOpts> = {
  name: "sync",
  description: "Synchronise SysProM document with Spec-Kit directory",
  args: syncArgs,
  opts: syncOpts,
  action(args, opts) {
    const inputPath = resolve(args.input);
    const specKitDir = resolve(args.speckitDir);

    if (!existsSync(inputPath)) {
      console.error(`Error: Input file does not exist: ${inputPath}`);
      process.exit(1);
    }

    if (!existsSync(specKitDir)) {
      console.error(`Error: Spec-Kit directory does not exist: ${specKitDir}`);
      process.exit(1);
    }

    // Determine the prefix: use flag if provided, otherwise use directory name
    let idPrefix = opts.prefix;
    if (!idPrefix) {
      const dirName = specKitDir.split("/").pop() || "FEAT";
      idPrefix = dirName;
    }

    // Load SysProM document
    const { doc: syspromDoc, format } = loadDocument(inputPath);

    // Find constitution file
    let constitutionPath: string | undefined;
    let searchDir = dirname(specKitDir);
    for (let i = 0; i < 5; i++) {
      const project = detectSpecKitProject(searchDir);
      if (project.constitutionPath) {
        constitutionPath = project.constitutionPath;
        break;
      }
      const parent = dirname(searchDir);
      if (parent === searchDir) break;
      searchDir = parent;
    }

    // Parse Spec-Kit feature
    const specKitDoc = parseSpecKitFeature(
      specKitDir,
      idPrefix,
      constitutionPath,
    );

    // Compare documents
    const diff = compareDocuments(syspromDoc, specKitDoc);

    // Merge: Spec-Kit wins for content (description, status), SysProM wins for structure
    const mergedNodes = new Map((syspromDoc.nodes ?? []).map((n) => [n.id, n]));
    const specKitNodes = new Map((specKitDoc.nodes ?? []).map((n) => [n.id, n]));

    for (const [id, specKitNode] of specKitNodes) {
      const syspromNode = mergedNodes.get(id);
      if (!syspromNode) {
        // Add new node from Spec-Kit
        mergedNodes.set(id, specKitNode);
      } else {
        // Merge: Spec-Kit content wins, SysProM structure wins
        const merged: Node = {
          ...syspromNode,
          description: specKitNode.description ?? syspromNode.description,
          status: specKitNode.status ?? syspromNode.status,
          context: specKitNode.context ?? syspromNode.context,
          options: specKitNode.options ?? syspromNode.options,
          selected: specKitNode.selected ?? syspromNode.selected,
          rationale: specKitNode.rationale ?? syspromNode.rationale,
          scope: specKitNode.scope ?? syspromNode.scope,
          operations: specKitNode.operations ?? syspromNode.operations,
          plan: specKitNode.plan ?? syspromNode.plan,
        };
        mergedNodes.set(id, merged);
      }
    }

    // Remove nodes that were deleted in Spec-Kit
    for (const node of diff.removed) {
      mergedNodes.delete(node.id);
    }

    // Update merged document
    const mergedDoc: SysProMDocument = {
      ...syspromDoc,
      nodes: Array.from(mergedNodes.values()),
      relationships: syspromDoc.relationships, // Keep original relationships
    };

    // Save updated SysProM document
    saveDocument(mergedDoc, format, inputPath);

    // Re-generate Spec-Kit files from merged document
    generateSpecKitProject(mergedDoc, specKitDir, idPrefix);

    // Print what changed
    console.log(`Synced SysProM document with Spec-Kit directory`);
    if (diff.added.length > 0) {
      console.log(`  Added: ${diff.added.length} node(s)`);
    }
    if (diff.modified.length > 0) {
      console.log(`  Modified: ${diff.modified.length} node(s)`);
    }
    if (diff.removed.length > 0) {
      console.log(`  Removed: ${diff.removed.length} node(s)`);
    }
  },
};

const diffArgs = z.object({
  input: z.string().describe("Path to SysProM document"),
  speckitDir: z.string().describe("Path to Spec-Kit directory"),
});

const diffOpts = z.object({
  prefix: z.string().optional().describe("ID prefix (defaults to directory name)"),
});

const diffSubcommand: CommandDef<typeof diffArgs, typeof diffOpts> = {
  name: "diff",
  description: "Show differences between SysProM document and Spec-Kit directory",
  args: diffArgs,
  opts: diffOpts,
  action(args, opts) {
    const inputPath = resolve(args.input);
    const specKitDir = resolve(args.speckitDir);

    if (!existsSync(inputPath)) {
      console.error(`Error: Input file does not exist: ${inputPath}`);
      process.exit(1);
    }

    if (!existsSync(specKitDir)) {
      console.error(`Error: Spec-Kit directory does not exist: ${specKitDir}`);
      process.exit(1);
    }

    // Determine the prefix: use flag if provided, otherwise use directory name
    let idPrefix = opts.prefix;
    if (!idPrefix) {
      const dirName = specKitDir.split("/").pop() || "FEAT";
      idPrefix = dirName;
    }

    // Load SysProM document
    const { doc: syspromDoc } = loadDocument(inputPath);

    // Find constitution file
    let constitutionPath: string | undefined;
    let searchDir = dirname(specKitDir);
    for (let i = 0; i < 5; i++) {
      const project = detectSpecKitProject(searchDir);
      if (project.constitutionPath) {
        constitutionPath = project.constitutionPath;
        break;
      }
      const parent = dirname(searchDir);
      if (parent === searchDir) break;
      searchDir = parent;
    }

    // Parse Spec-Kit feature
    const specKitDoc = parseSpecKitFeature(
      specKitDir,
      idPrefix,
      constitutionPath,
    );

    // Compare documents
    const diff = compareDocuments(syspromDoc, specKitDoc);

    // Print what would change (read-only)
    console.log(`Diff between SysProM document and Spec-Kit directory:`);
    if (
      diff.added.length === 0 &&
      diff.modified.length === 0 &&
      diff.removed.length === 0
    ) {
      console.log(`  (no changes)`);
    } else {
      if (diff.added.length > 0) {
        console.log(`  Added: ${diff.added.length} node(s)`);
        for (const node of diff.added) {
          console.log(`    - ${node.id}: ${node.name}`);
        }
      }
      if (diff.modified.length > 0) {
        console.log(`  Modified: ${diff.modified.length} node(s)`);
        for (const { old, new: newNode } of diff.modified) {
          console.log(`    - ${old.id}: ${old.name}`);
        }
      }
      if (diff.removed.length > 0) {
        console.log(`  Removed: ${diff.removed.length} node(s)`);
        for (const node of diff.removed) {
          console.log(`    - ${node.id}: ${node.name}`);
        }
      }
    }
  },
};

// ============================================================================
// Main command
// ============================================================================

export const speckitCommand: CommandDef = {
  name: "speckit",
  description: "Spec-Kit interoperability — import, export, sync, and diff",
  subcommands: [importSubcommand, exportSubcommand, syncSubcommand, diffSubcommand],
};
