import * as z from "zod";
import type { CommandDef } from "../define-command.js";
import { RelationshipType, NodeStatus } from "../../schema.js";
import {
  updateNode,
  addRelationship,
  removeRelationship,
  updateMetadata,
} from "../../mutate.js";
import { loadDocument, saveDocument } from "../../io.js";
import { jsonToMarkdownMultiDoc } from "../../json-to-md.js";

// ---------------------------------------------------------------------------
// Type aliases for action handlers
// ---------------------------------------------------------------------------

type NodeArgs = { input: string; id: string };
type NodeOpts = {
  description?: string;
  status?: string;
  context?: string;
  rationale?: string;
  lifecycle?: string[];
  dryRun?: boolean;
  sync?: string;
  json?: boolean;
};

type AddRelArgs = { input: string; from: string; type: string; to: string };
type AddRelOpts = { dryRun?: boolean; sync?: string; json?: boolean };

type RemoveRelArgs = { input: string; from: string; type: string; to: string };
type RemoveRelOpts = { dryRun?: boolean; sync?: string; json?: boolean };

type MetaArgs = { input: string };
type MetaOpts = { fields?: string[]; dryRun?: boolean; sync?: string; json?: boolean };

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

function parseLifecycleValue(rawVal: string): boolean | string {
  if (rawVal === "true") {
    return true;
  }
  if (rawVal === "false") {
    return false;
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(rawVal)) {
    return rawVal; // ISO date string
  }
  return rawVal;
}

function parseMetaValue(val: string): unknown {
  const numVal = Number(val);
  return Number.isFinite(numVal) && val === String(numVal) ? numVal : val;
}

// ---------------------------------------------------------------------------
// Subcommands
// ---------------------------------------------------------------------------

const nodeSubcommand: CommandDef = {
  name: "node",
  description: "Update node fields (description, status, context, rationale, lifecycle)",
  apiLink: "updateNode",
  args: z.object({
    input: z.string().describe("SysProM document to update"),
    id: z.string().describe("node ID to update"),
  }),
  opts: z.object({
    description: z.string().optional().describe("update node description"),
    status: NodeStatus.optional().describe("update node status"),
    context: z.string().optional().describe("update node context"),
    rationale: z.string().optional().describe("update node rationale"),
    lifecycle: z.array(z.string()).optional().describe("set lifecycle state (key=value format)"),
    dryRun: z.boolean().optional().default(false).describe("preview changes without saving"),
    sync: z.string().optional().describe("sync to markdown folder after update"),
    json: z.boolean().optional().default(false).describe("output updated fields as JSON"),
  }),
  action(args: unknown, opts: unknown) {
    const typedArgs = args as NodeArgs;
    const typedOpts = opts as NodeOpts;
    const { doc, format, path } = loadDocument(typedArgs.input);
    const node = doc.nodes.find((n) => n.id === typedArgs.id);
    if (!node) {
      console.error(`Node not found: ${typedArgs.id}`);
      process.exit(1);
    }

    const fields: Record<string, unknown> = {};

    if (typedOpts.description !== undefined) fields.description = typedOpts.description;
    if (typedOpts.status !== undefined) fields.status = typedOpts.status;
    if (typedOpts.context !== undefined) fields.context = typedOpts.context;
    if (typedOpts.rationale !== undefined) fields.rationale = typedOpts.rationale;

    if (typedOpts.lifecycle && typedOpts.lifecycle.length > 0) {
      const lifecycle = { ...node.lifecycle };
      for (const kv of typedOpts.lifecycle) {
        const eqIdx = kv.indexOf("=");
        if (eqIdx < 0) {
          console.error(`Invalid --lifecycle format: ${kv} (expected key=value)`);
          process.exit(1);
        }
        const key = kv.slice(0, eqIdx);
        const rawVal = kv.slice(eqIdx + 1);
        lifecycle[key] = parseLifecycleValue(rawVal);
      }
      fields.lifecycle = lifecycle;
    }

    if (Object.keys(fields).length === 0) {
      console.error("No fields specified to update.");
      console.error("Use --description, --status, --context, --rationale, or --lifecycle.");
      process.exit(1);
    }

    const newDoc = updateNode(doc, typedArgs.id, fields);

    if (!typedOpts.dryRun) {
      saveDocument(newDoc, format, path);

      if (typedOpts.sync) {
        jsonToMarkdownMultiDoc(newDoc, typedOpts.sync);
        console.log(`Synced to ${typedOpts.sync}`);
      }
    }

    if (typedOpts.json) {
      console.log(JSON.stringify(fields, null, 2));
    } else {
      console.log(
        `${typedOpts.dryRun ? "[dry-run] Would update" : "Updated"} ${node.type} ${typedArgs.id} — ${node.name}`
      );
    }
  },
};

const addRelSubcommand: CommandDef = {
  name: "add-rel",
  description: "Add a relationship between two nodes",
  apiLink: "addRelationship",
  args: z.object({
    input: z.string().describe("SysProM document to update"),
    from: z.string().describe("source node ID"),
    type: RelationshipType.describe("relationship type"),
    to: z.string().describe("target node ID"),
  }),
  opts: z.object({
    dryRun: z.boolean().optional().default(false).describe("preview changes without saving"),
    sync: z.string().optional().describe("sync to markdown folder after update"),
    json: z.boolean().optional().default(false).describe("output relationship as JSON"),
  }),
  action(args: unknown, opts: unknown) {
    const typedArgs = args as AddRelArgs;
    const typedOpts = opts as AddRelOpts;
    const { doc, format, path } = loadDocument(typedArgs.input);

    try {
      const newDoc = addRelationship(doc, {
        from: typedArgs.from,
        to: typedArgs.to,
        type: RelationshipType.parse(typedArgs.type),
      });

      if (!typedOpts.dryRun) {
        saveDocument(newDoc, format, path);

        if (typedOpts.sync) {
          jsonToMarkdownMultiDoc(newDoc, typedOpts.sync);
          console.log(`Synced to ${typedOpts.sync}`);
        }
      }

      if (typedOpts.json) {
        const rel = newDoc.relationships?.find(
          (r) => r.from === typedArgs.from && r.type === typedArgs.type && r.to === typedArgs.to
        );
        console.log(JSON.stringify(rel, null, 2));
      } else {
        console.log(
          `${typedOpts.dryRun ? "[dry-run] Would add" : "Added"} relationship: ${typedArgs.from} ${typedArgs.type} ${typedArgs.to}`
        );
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(message);
      process.exit(1);
    }
  },
};

const removeRelSubcommand: CommandDef = {
  name: "remove-rel",
  description: "Remove a relationship between two nodes",
  apiLink: "removeRelationship",
  args: z.object({
    input: z.string().describe("SysProM document to update"),
    from: z.string().describe("source node ID"),
    type: RelationshipType.describe("relationship type"),
    to: z.string().describe("target node ID"),
  }),
  opts: z.object({
    dryRun: z.boolean().optional().default(false).describe("preview changes without saving"),
    sync: z.string().optional().describe("sync to markdown folder after update"),
    json: z.boolean().optional().default(false).describe("output relationship as JSON"),
  }),
  action(args: unknown, opts: unknown) {
    const typedArgs = args as RemoveRelArgs;
    const typedOpts = opts as RemoveRelOpts;
    const { doc, format, path } = loadDocument(typedArgs.input);

    try {
      const newDoc = removeRelationship(doc, typedArgs.from, RelationshipType.parse(typedArgs.type), typedArgs.to);

      if (!typedOpts.dryRun) {
        saveDocument(newDoc, format, path);

        if (typedOpts.sync) {
          jsonToMarkdownMultiDoc(newDoc, typedOpts.sync);
          console.log(`Synced to ${typedOpts.sync}`);
        }
      }

      if (typedOpts.json) {
        console.log(JSON.stringify({ from: typedArgs.from, type: typedArgs.type, to: typedArgs.to }, null, 2));
      } else {
        console.log(
          `${typedOpts.dryRun ? "[dry-run] Would remove" : "Removed"} relationship: ${typedArgs.from} ${typedArgs.type} ${typedArgs.to}`
        );
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(message);
      process.exit(1);
    }
  },
};

const metaSubcommand: CommandDef = {
  name: "meta",
  description: "Update document-level metadata",
  apiLink: "updateMetadata",
  args: z.object({
    input: z.string().describe("SysProM document to update"),
  }),
  opts: z.object({
    fields: z.array(z.string()).describe("metadata field updates (key=value format)"),
    dryRun: z.boolean().optional().default(false).describe("preview changes without saving"),
    sync: z.string().optional().describe("sync to markdown folder after update"),
    json: z.boolean().optional().default(false).describe("output metadata as JSON"),
  }),
  action(args: unknown, opts: unknown) {
    const typedArgs = args as MetaArgs;
    const typedOpts = opts as MetaOpts;
    if (!typedOpts.fields || typedOpts.fields.length === 0) {
      console.error("No metadata fields specified. Use --fields key=value");
      process.exit(1);
    }

    const { doc, format, path } = loadDocument(typedArgs.input);
    const fields: Record<string, unknown> = {};

    for (const kv of typedOpts.fields) {
      const eqIdx = kv.indexOf("=");
      if (eqIdx < 0) {
        console.error(`Invalid --fields format: ${kv} (expected key=value)`);
        process.exit(1);
      }
      const key = kv.slice(0, eqIdx);
      const val = kv.slice(eqIdx + 1);
      fields[key] = parseMetaValue(val);
    }

    const newDoc = updateMetadata(doc, fields);

    if (!typedOpts.dryRun) {
      saveDocument(newDoc, format, path);

      if (typedOpts.sync) {
        jsonToMarkdownMultiDoc(newDoc, typedOpts.sync);
        console.log(`Synced to ${typedOpts.sync}`);
      }
    }

    if (typedOpts.json) {
      console.log(JSON.stringify(fields, null, 2));
    } else {
      console.log(
        `${typedOpts.dryRun ? "[dry-run] Would update" : "Updated"} metadata: ${typedOpts.fields.join(", ")}`
      );
    }
  },
};

// ---------------------------------------------------------------------------
// Main command
// ---------------------------------------------------------------------------

export const updateCommand: CommandDef = {
  name: "update",
  description: "Update nodes, relationships, and document metadata",
  subcommands: [nodeSubcommand, addRelSubcommand, removeRelSubcommand, metaSubcommand],
};
