import * as z from "zod";
import type { CommandDef } from "../define-command.js";
import { RelationshipType, NodeStatus } from "../../schema.js";
import type { Format } from "../../io.js";
import {
  updateNodeOp,
  addRelationshipOp,
  removeRelationshipOp,
  updateMetadataOp,
} from "../../operations/index.js";
import { loadDocument, saveDocument } from "../../io.js";
import { jsonToMarkdownMultiDoc } from "../../json-to-md.js";
import type { SysProMDocument } from "../../schema.js";

// ---------------------------------------------------------------------------
// CLI helper functions
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

function persistIfNeeded(
  newDoc: SysProMDocument,
  format: Format,
  path: string,
  opts: { dryRun?: boolean; sync?: string },
): void {
  if (!opts.dryRun) {
    saveDocument(newDoc, format, path);

    if (opts.sync) {
      jsonToMarkdownMultiDoc(newDoc, opts.sync);
      console.log(`Synced to ${opts.sync}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Arg/opt schemas
// ---------------------------------------------------------------------------

const updateNodeArgs = z.object({
  input: z.string().describe("SysProM document to update"),
  id: z.string().describe("node ID to update"),
});
const updateNodeOpts = z.object({
  description: z.string().optional().describe("update node description"),
  status: NodeStatus.optional().describe("update node status"),
  context: z.string().optional().describe("update node context"),
  rationale: z.string().optional().describe("update node rationale"),
  lifecycle: z.array(z.string()).optional().describe("set lifecycle state (key=value format)"),
  dryRun: z.boolean().optional().default(false).describe("preview changes without saving"),
  sync: z.string().optional().describe("sync to markdown folder after update"),
  json: z.boolean().optional().default(false).describe("output updated fields as JSON"),
});

const addRelArgs = z.object({
  input: z.string().describe("SysProM document to update"),
  from: z.string().describe("source node ID"),
  type: RelationshipType.describe("relationship type"),
  to: z.string().describe("target node ID"),
});
const addRelOpts = z.object({
  dryRun: z.boolean().optional().default(false).describe("preview changes without saving"),
  sync: z.string().optional().describe("sync to markdown folder after update"),
  json: z.boolean().optional().default(false).describe("output relationship as JSON"),
});

const removeRelArgs = z.object({
  input: z.string().describe("SysProM document to update"),
  from: z.string().describe("source node ID"),
  type: RelationshipType.describe("relationship type"),
  to: z.string().describe("target node ID"),
});
const removeRelOpts = z.object({
  dryRun: z.boolean().optional().default(false).describe("preview changes without saving"),
  sync: z.string().optional().describe("sync to markdown folder after update"),
  json: z.boolean().optional().default(false).describe("output relationship as JSON"),
});

const metaArgs = z.object({
  input: z.string().describe("SysProM document to update"),
});
const metaOpts = z.object({
  fields: z.array(z.string()).describe("metadata field updates (key=value format)"),
  dryRun: z.boolean().optional().default(false).describe("preview changes without saving"),
  sync: z.string().optional().describe("sync to markdown folder after update"),
  json: z.boolean().optional().default(false).describe("output metadata as JSON"),
});

// ---------------------------------------------------------------------------
// Subcommands
// ---------------------------------------------------------------------------

const nodeSubcommand: CommandDef = {
  name: "node",
  description: updateNodeOp.def.description,
  apiLink: updateNodeOp.def.name,
  args: updateNodeArgs,
  opts: updateNodeOpts,
  action(rawArgs: unknown, rawOpts: unknown) {
    const args = updateNodeArgs.parse(rawArgs);
    const opts = updateNodeOpts.parse(rawOpts);
    const { doc, format, path } = loadDocument(args.input);
    const node = doc.nodes.find((n) => n.id === args.id);
    if (!node) {
      console.error(`Node not found: ${args.id}`);
      process.exit(1);
    }

    const fields: Record<string, unknown> = {};

    if (opts.description !== undefined) fields.description = opts.description;
    if (opts.status !== undefined) fields.status = opts.status;
    if (opts.context !== undefined) fields.context = opts.context;
    if (opts.rationale !== undefined) fields.rationale = opts.rationale;

    if (opts.lifecycle && opts.lifecycle.length > 0) {
      const lifecycle = { ...node.lifecycle };
      for (const kv of opts.lifecycle) {
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

    const newDoc = updateNodeOp({ doc, id: args.id, fields });

    persistIfNeeded(newDoc, format, path, opts);

    if (opts.json) {
      console.log(JSON.stringify(fields, null, 2));
    } else {
      console.log(
        `${opts.dryRun ? "[dry-run] Would update" : "Updated"} ${node.type} ${args.id} — ${node.name}`
      );
    }
  },
};

const addRelSubcommand: CommandDef = {
  name: "add-rel",
  description: addRelationshipOp.def.description,
  apiLink: addRelationshipOp.def.name,
  args: addRelArgs,
  opts: addRelOpts,
  action(rawArgs: unknown, rawOpts: unknown) {
    const args = addRelArgs.parse(rawArgs);
    const opts = addRelOpts.parse(rawOpts);
    const { doc, format, path } = loadDocument(args.input);

    const newDoc = addRelationshipOp({
      doc,
      rel: { from: args.from, to: args.to, type: args.type },
    });

    persistIfNeeded(newDoc, format, path, opts);

    if (opts.json) {
      const rel = newDoc.relationships?.find(
        (r) => r.from === args.from && r.type === args.type && r.to === args.to
      );
      console.log(JSON.stringify(rel, null, 2));
    } else {
      console.log(
        `${opts.dryRun ? "[dry-run] Would add" : "Added"} relationship: ${args.from} ${args.type} ${args.to}`
      );
    }
  },
};

const removeRelSubcommand: CommandDef = {
  name: "remove-rel",
  description: removeRelationshipOp.def.description,
  apiLink: removeRelationshipOp.def.name,
  args: removeRelArgs,
  opts: removeRelOpts,
  action(rawArgs: unknown, rawOpts: unknown) {
    const args = removeRelArgs.parse(rawArgs);
    const opts = removeRelOpts.parse(rawOpts);
    const { doc, format, path } = loadDocument(args.input);

    const newDoc = removeRelationshipOp({
      doc,
      from: args.from,
      type: args.type,
      to: args.to,
    });

    persistIfNeeded(newDoc, format, path, opts);

    if (opts.json) {
      console.log(JSON.stringify({ from: args.from, type: args.type, to: args.to }, null, 2));
    } else {
      console.log(
        `${opts.dryRun ? "[dry-run] Would remove" : "Removed"} relationship: ${args.from} ${args.type} ${args.to}`
      );
    }
  },
};

const metaSubcommand: CommandDef = {
  name: "meta",
  description: updateMetadataOp.def.description,
  apiLink: updateMetadataOp.def.name,
  args: metaArgs,
  opts: metaOpts,
  action(rawArgs: unknown, rawOpts: unknown) {
    const args = metaArgs.parse(rawArgs);
    const opts = metaOpts.parse(rawOpts);
    if (opts.fields.length === 0) {
      console.error("No metadata fields specified. Use --fields key=value");
      process.exit(1);
    }

    const { doc, format, path } = loadDocument(args.input);
    const fields: Record<string, unknown> = {};

    for (const kv of opts.fields) {
      const eqIdx = kv.indexOf("=");
      if (eqIdx < 0) {
        console.error(`Invalid --fields format: ${kv} (expected key=value)`);
        process.exit(1);
      }
      const key = kv.slice(0, eqIdx);
      const val = kv.slice(eqIdx + 1);
      fields[key] = parseMetaValue(val);
    }

    const newDoc = updateMetadataOp({ doc, fields });

    persistIfNeeded(newDoc, format, path, opts);

    if (opts.json) {
      console.log(JSON.stringify(fields, null, 2));
    } else {
      console.log(
        `${opts.dryRun ? "[dry-run] Would update" : "Updated"} metadata: ${opts.fields.join(", ")}`
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
