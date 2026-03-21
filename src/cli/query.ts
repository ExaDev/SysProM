import { textToString } from "../text.js";
import { loadDocument } from "../io.js";
import {
  queryNodes,
  queryNode,
  queryRelationships,
  traceFromNode,
} from "../query.js";
import type { Node } from "../schema.js";
import type { TraceNode } from "../query.js";

function printNode(r: Node, verbose: boolean): void {
  if (verbose) {
    console.log(`${r.id} — ${r.name}`);
    console.log(`  Type: ${r.type}`);
    if (r.status) console.log(`  Status: ${r.status}`);
    if (r.description) console.log(`  Description: ${textToString(r.description)}`);
    if (r.context) console.log(`  Context: ${textToString(r.context)}`);
    if (r.rationale) console.log(`  Rationale: ${textToString(r.rationale)}`);
    if (r.selected) console.log(`  Selected: ${r.selected}`);
    if (r.options) {
      console.log("  Options:");
      for (const o of r.options) console.log(`    ${o.id}: ${textToString(o.description)}`);
    }
    if (r.scope) console.log(`  Scope: ${r.scope.join(", ")}`);
    if (r.lifecycle) {
      const states = Object.entries(r.lifecycle)
        .map(([k, v]) => `${k}=${v}`)
        .join(", ");
      console.log(`  Lifecycle: ${states}`);
    }
    if (r.includes) console.log(`  Includes: ${r.includes.join(", ")}`);
    console.log("");
  } else {
    const desc = r.description ? " — " + textToString(r.description).slice(0, 60) : "";
    console.log(`${r.id.padEnd(12)} ${r.type.padEnd(16)} ${r.name}${desc}`);
  }
}

function printTraceTree(tn: TraceNode, depth: number): void {
  if (!tn.node) return;
  const indent = "  ".repeat(depth);
  console.log(`${indent}${tn.id} — ${tn.node.name} (${tn.node.type})`);
  for (const child of tn.children) {
    printTraceTree(child, depth + 1);
  }
}

function parseFlag(args: string[], flag: string): string | undefined {
  const idx = args.indexOf(flag);
  if (idx >= 0 && idx + 1 < args.length) return args[idx + 1];
  return undefined;
}

export function run(args: string[]): void {
  if (args.length < 2) {
    console.error("Usage: sysprom query <input> <query-type> [filters]");
    console.error("");
    console.error("Query types:");
    console.error("  nodes                    List all nodes");
    console.error("  node <id>                Show single node detail");
    console.error("  rels                     List all relationships");
    console.error("  trace <id>               Trace refinement chain from a node");
    console.error("");
    console.error("Filters:");
    console.error("  --type <type>            Filter by node or relationship type");
    console.error("  --status <status>        Filter by node status");
    console.error("  --from <id>              Filter relationships by source");
    console.error("  --to <id>                Filter relationships by target");
    console.error("  --json                   Output as JSON");
    process.exit(1);
  }

  const { doc } = loadDocument(args[0]);
  const queryType = args[1];
  const filterArgs = args.slice(2);
  const asJson = filterArgs.includes("--json");
  const typeFilter = parseFlag(filterArgs, "--type");
  const statusFilter = parseFlag(filterArgs, "--status");
  const fromFilter = parseFlag(filterArgs, "--from");
  const toFilter = parseFlag(filterArgs, "--to");

  switch (queryType) {
    case "nodes": {
      const nodes = queryNodes(doc, {
        type: typeFilter,
        status: statusFilter,
      });
      if (asJson) {
        console.log(JSON.stringify(nodes, null, 2));
      } else {
        for (const n of nodes) printNode(n, false);
        console.log(`\n${nodes.length} node(s)`);
      }
      break;
    }

    case "node": {
      const id = filterArgs[0];
      if (!id) {
        console.error("Usage: sysprom query <input> node <id>");
        process.exit(1);
      }
      const result = queryNode(doc, id);
      if (!result) {
        console.error(`Node not found: ${id}`);
        process.exit(1);
      }
      if (asJson) {
        console.log(JSON.stringify(result.node, null, 2));
      } else {
        printNode(result.node, true);
        if (result.outgoing.length > 0) {
          console.log("Outgoing relationships:");
          for (const r of result.outgoing) console.log(`  → ${r.type} → ${r.to}`);
        }
        if (result.incoming.length > 0) {
          console.log("Incoming relationships:");
          for (const r of result.incoming) console.log(`  ← ${r.type} ← ${r.from}`);
        }
      }
      break;
    }

    case "rels": {
      const rels = queryRelationships(doc, {
        from: fromFilter,
        to: toFilter,
        type: typeFilter,
      });
      if (asJson) {
        console.log(JSON.stringify(rels, null, 2));
      } else {
        for (const r of rels) {
          console.log(`${r.from.padEnd(12)} ${r.type.padEnd(20)} ${r.to}`);
        }
        console.log(`\n${rels.length} relationship(s)`);
      }
      break;
    }

    case "trace": {
      const startId = filterArgs[0];
      if (!startId) {
        console.error("Usage: sysprom query <input> trace <id>");
        process.exit(1);
      }
      const trace = traceFromNode(doc, startId);
      if (asJson) {
        console.log(JSON.stringify(trace, null, 2));
      } else {
        printTraceTree(trace, 0);
      }
      break;
    }

    default:
      console.error(`Unknown query type: ${queryType}`);
      console.error("Valid types: nodes, node, rels, trace");
      process.exit(1);
  }
}
