import { loadDocument } from "../io.js";
import { textToString } from "../text.js";
import type { Node } from "../schema.js";

function parseFlag(args: string[], flag: string): string | undefined {
  const idx = args.indexOf(flag);
  if (idx >= 0 && idx + 1 < args.length) return args[idx + 1];
  return undefined;
}

export function run(args: string[]): void {
  if (args.length < 2) {
    console.error("Usage: sysprom search <input> <term> [--json]");
    process.exit(1);
  }

  const { doc } = loadDocument(args[0]);
  const term = args[1].toLowerCase();
  const asJson = args.includes("--json");

  const matches: Node[] = [];

  function searchNode(node: Node): void {
    const fields = [
      node.id,
      node.name,
      node.description ? textToString(node.description) : "",
      node.context ? textToString(node.context) : "",
      node.rationale ? textToString(node.rationale) : "",
    ];

    if (fields.some((f) => f.toLowerCase().includes(term))) {
      matches.push(node);
    }

    // Search subsystems recursively
    if (node.subsystem) {
      for (const sub of node.subsystem.nodes) {
        searchNode(sub);
      }
    }
  }

  for (const node of doc.nodes) {
    searchNode(node);
  }

  if (asJson) {
    console.log(JSON.stringify(matches, null, 2));
  } else {
    if (matches.length === 0) {
      console.log(`No matches for "${args[1]}"`);
    } else {
      for (const m of matches) {
        const desc = m.description
          ? " — " + textToString(m.description).slice(0, 60)
          : "";
        console.log(`${m.id.padEnd(12)} ${m.type.padEnd(16)} ${m.name}${desc}`);
      }
      console.log(`\n${matches.length} match(es)`);
    }
  }
}
