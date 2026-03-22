import * as z from "zod";
import type { CommandDef } from "../define-command.js";
import { loadDocument } from "../../io.js";
import type { SysProMDocument, Node } from "../../schema.js";

interface CheckResult {
  warnings: string[];
  info: string[];
}

function check(doc: SysProMDocument): CheckResult {
  const warnings: string[] = [];
  const info: string[] = [];
  const ids = new Set(doc.nodes.map((n: Node) => n.id));
  const relTargets = new Set<string>();

  for (const r of doc.relationships ?? []) {
    relTargets.add(r.from);
    relTargets.add(r.to);
  }

  for (const node of doc.nodes) {
    // Decisions without rationale
    if (node.type === "decision" && !node.rationale) {
      warnings.push(`${node.id}: decision has no rationale`);
    }

    // Decisions without context
    if (node.type === "decision" && !node.context) {
      info.push(`${node.id}: decision has no context`);
    }

    // Changes without scope
    if (
      node.type === "change" &&
      (!node.scope || node.scope.length === 0)
    ) {
      warnings.push(`${node.id}: change has no scope`);
    }

    // Changes without operations
    if (
      node.type === "change" &&
      (!node.operations || node.operations.length === 0)
    ) {
      info.push(`${node.id}: change has no operations`);
    }

    // Nodes with no description
    if (!node.description) {
      info.push(`${node.id}: no description`);
    }

    // Orphan nodes (not referenced by any relationship)
    if (!relTargets.has(node.id)) {
      // Intent nodes are expected to be roots
      if (node.type !== "intent") {
        info.push(`${node.id}: orphan node (no relationships)`);
      }
    }

    // Scope references non-existent nodes
    if (node.scope) {
      for (const s of node.scope) {
        if (!ids.has(s)) {
          warnings.push(
            `${node.id}: scope references non-existent node ${s}`,
          );
        }
      }
    }
  }

  return { warnings, info };
}

type Args = { input: string };
type Opts = { json?: boolean };

export const checkCommand: CommandDef = {
  name: "check",
  description: "Check a SysProM document for issues and warnings",
  args: z.object({
    input: z.string().describe("Path to SysProM document"),
  }),
  opts: z.object({
    json: z.boolean().optional().describe("Output results as JSON"),
  }).strict(),
  action(args: unknown, opts: unknown) {
    const typedArgs = args as Args;
    const typedOpts = opts as Opts;
    const { doc } = loadDocument(typedArgs.input);
    const result = check(doc);

    if (typedOpts.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      if (result.warnings.length === 0 && result.info.length === 0) {
        console.log("No issues found.");
      } else {
        for (const w of result.warnings) console.log(`⚠ ${w}`);
        for (const i of result.info) console.log(`ℹ ${i}`);
        console.log(
          `\n${result.warnings.length} warning(s), ${result.info.length} info`,
        );
      }
    }
  },
};
