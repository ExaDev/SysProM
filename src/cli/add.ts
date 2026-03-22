import { nodeType, nodeStatus, type Node } from "../schema.js";
import { addNode, nextId } from "../mutate.js";
import { loadDocument, saveDocument } from "../io.js";
import { jsonToMarkdownMultiDoc } from "../json-to-md.js";

function parseFlag(args: string[], flag: string): string | undefined {
  const idx = args.indexOf(flag);
  if (idx >= 0 && idx + 1 < args.length) return args[idx + 1];
  return undefined;
}

function parseFlagAll(args: string[], flag: string): string[] {
  const results: string[] = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === flag && i + 1 < args.length) {
      results.push(args[i + 1]);
    }
  }
  return results;
}

export function run(args: string[]): void {
  if (args.length < 2) {
    console.error("Usage: sysprom add <input> <node-type> --id <ID> --name <Name> [fields]");
    console.error("");
    console.error("Fields:");
    console.error("  --id <ID>                 Node ID (required)");
    console.error("  --name <Name>             Node name (required)");
    console.error("  --description <text>      Description");
    console.error("  --status <status>         Lifecycle status");
    console.error("  --context <text>          Decision context");
    console.error("  --rationale <text>        Decision rationale");
    console.error("  --scope <id>              Change scope (repeatable)");
    process.exit(1);
  }

  const { doc, format, path } = loadDocument(args[0]);
  const type = args[1];

  if (!nodeType.is(type)) {
    console.error(`Unknown node type: ${type}`);
    process.exit(1);
  }

  const id = parseFlag(args, "--id") ?? nextId(doc, type);
  const name = parseFlag(args, "--name");

  if (!name) {
    console.error("--name is required.");
    process.exit(1);
  }

  const node: Node = { id, type, name };

  const description = parseFlag(args, "--description");
  if (description) node.description = description;

  const status = parseFlag(args, "--status");
  if (status) {
    if (!nodeStatus.is(status)) {
      console.error(`Unknown status: ${status}`);
      process.exit(1);
    }
    node.status = status;
  }

  const context = parseFlag(args, "--context");
  if (context) node.context = context;

  const rationale = parseFlag(args, "--rationale");
  if (rationale) node.rationale = rationale;

  const scope = parseFlagAll(args, "--scope");
  if (scope.length > 0) node.scope = scope;

  const selected = parseFlag(args, "--selected");
  if (selected) node.selected = selected;

  const optionArgs = parseFlagAll(args, "--option");
  if (optionArgs.length > 0) {
    node.options = optionArgs.map((arg, i) => {
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
    const dryRun = args.includes("--dry-run");
    const asJson = args.includes("--json");

    const newDoc = addNode(doc, node);

    if (!dryRun) {
      saveDocument(newDoc, format, path);

      const syncIdx = args.indexOf("--sync");
      const syncDir = syncIdx >= 0 && args[syncIdx + 1] ? args[syncIdx + 1] : undefined;
      if (syncDir) {
        jsonToMarkdownMultiDoc(newDoc, syncDir);
        console.log(`Synced to ${syncDir}`);
      }
    }

    if (asJson) {
      console.log(JSON.stringify(node, null, 2));
    } else {
      console.log(`${dryRun ? "[dry-run] Would add" : "Added"} ${type} ${id} — ${name}`);
    }
  } catch (err: unknown) {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}
