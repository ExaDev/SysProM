import * as z from "zod";
import type { CommandDef } from "../define-command.js";
import { NodeType, NodeStatus, type Node } from "../../schema.js";
import { addNode, nextId } from "../../mutate.js";
import { loadDocument, saveDocument } from "../../io.js";
import { jsonToMarkdownMultiDoc } from "../../json-to-md.js";

type Args = { input: string; nodeType: string };
type Opts = {
  id?: string;
  name: string;
  description?: string;
  status?: string;
  context?: string;
  rationale?: string;
  scope?: string[];
  selected?: string;
  option?: string[];
  dryRun?: boolean;
  json?: boolean;
  sync?: string;
};

export const addCommand: CommandDef = {
  name: "add",
  description: "Add a node to a SysProM document",
  apiLink: "addNode",
  args: z.object({
    input: z.string().describe("SysProM document to modify (saved in place)"),
    nodeType: z.string().describe("Node type to add"),
  }),
  opts: z.object({
    id: z.string().optional().describe("Node ID (auto-generated if omitted)"),
    name: z.string().describe("Human-readable node name"),
    description: z.string().optional().describe("Node description"),
    status: z.string().optional().describe("Lifecycle status"),
    context: z.string().optional().describe("Decision context"),
    rationale: z.string().optional().describe("Decision rationale"),
    scope: z.array(z.string()).optional().describe("Change scope (repeatable)"),
    selected: z.string().optional().describe("Selected option ID"),
    option: z.array(z.string()).optional().describe("Option in format 'ID:description' or just 'description' (repeatable)"),
    dryRun: z.boolean().optional().describe("Show what would be added without saving"),
    json: z.boolean().optional().describe("Output result as JSON"),
    sync: z.string().optional().describe("Auto-generate markdown in this directory after adding"),
  }),

  action(args: unknown, opts: unknown) {
    // Type assertions are necessary here because define-command.ts calls action with
    // parsed but dynamically-typed values from the command-line parser.
    const typedArgs = args as Args;
    const typedOpts = opts as Opts;

    if (!typedOpts.name) {
      console.error("--name is required.");
      process.exit(1);
    }

    const { doc, format, path } = loadDocument(typedArgs.input);
    const type = typedArgs.nodeType;

    if (!NodeType.is(type)) {
      console.error(`Unknown node type: ${type}`);
      process.exit(1);
    }

    const id = typedOpts.id ?? nextId(doc, type);

    const node: Node = { id, type, name: typedOpts.name };

    if (typedOpts.description) {
      node.description = typedOpts.description;
    }

    if (typedOpts.status) {
      if (!NodeStatus.is(typedOpts.status)) {
        console.error(`Unknown status: ${typedOpts.status}`);
        process.exit(1);
      }
      node.status = typedOpts.status;
    }

    if (typedOpts.context) {
      node.context = typedOpts.context;
    }

    if (typedOpts.rationale) {
      node.rationale = typedOpts.rationale;
    }

    if (typedOpts.scope && typedOpts.scope.length > 0) {
      node.scope = typedOpts.scope;
    }

    if (typedOpts.selected) {
      node.selected = typedOpts.selected;
    }

    if (typedOpts.option && typedOpts.option.length > 0) {
      node.options = typedOpts.option.map((arg, i) => {
        const colonIdx = arg.indexOf(":");
        if (colonIdx >= 0) {
          return { id: arg.slice(0, colonIdx), description: arg.slice(colonIdx + 1) };
        }
        // Auto-generate ID: D26-OPT-A, D26-OPT-B, etc.
        const letter = String.fromCharCode(65 + i); // A, B, C, ...
        return { id: `${id}-OPT-${letter}`, description: arg };
      });
    }

    try {
      const newDoc = addNode(doc, node);

      if (!typedOpts.dryRun) {
        saveDocument(newDoc, format, path);

        if (typedOpts.sync) {
          jsonToMarkdownMultiDoc(newDoc, typedOpts.sync);
          console.log(`Synced to ${typedOpts.sync}`);
        }
      }

      if (typedOpts.json) {
        console.log(JSON.stringify(node, null, 2));
      } else {
        console.log(`${typedOpts.dryRun ? "[dry-run] Would add" : "Added"} ${type} ${id} — ${typedOpts.name}`);
      }
    } catch (err: unknown) {
      console.error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  },
};
