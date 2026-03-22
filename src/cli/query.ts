import pc from "picocolors";
import { textToString } from "../text.js";
import { loadDocument } from "../io.js";
import {
  queryNodes,
  queryNode,
  queryRelationships,
  traceFromNode,
} from "../query.js";
import { timeline, nodeHistory, stateAt } from "../temporal.js";
import type { Node } from "../schema.js";
import type { TraceNode } from "../query.js";

function printNode(r: Node, verbose: boolean): void {
  if (verbose) {
    console.log(`${pc.cyan(r.id)} — ${pc.bold(r.name)}`);
    console.log(`  ${pc.dim("Type")}: ${r.type}`);
    if (r.status) console.log(`  ${pc.dim("Status")}: ${pc.yellow(r.status)}`);
    if (r.description) console.log(`  ${pc.dim("Description")}: ${textToString(r.description)}`);
    if (r.context) console.log(`  ${pc.dim("Context")}: ${textToString(r.context)}`);
    if (r.rationale) console.log(`  ${pc.dim("Rationale")}: ${textToString(r.rationale)}`);
    if (r.selected) console.log(`  ${pc.dim("Selected")}: ${r.selected}`);
    if (r.options) {
      console.log(`  ${pc.dim("Options")}:`);
      for (const o of r.options) console.log(`    ${o.id}: ${textToString(o.description)}`);
    }
    if (r.scope) console.log(`  ${pc.dim("Scope")}: ${r.scope.join(", ")}`);
    if (r.lifecycle) {
      const states = Object.entries(r.lifecycle)
        .map(([k, v]) => `${k}=${v}`)
        .join(", ");
      console.log(`  ${pc.dim("Lifecycle")}: ${states}`);
    }
    if (r.includes) console.log(`  ${pc.dim("Includes")}: ${r.includes.join(", ")}`);
    console.log("");
  } else {
    const desc = r.description ? " — " + textToString(r.description).slice(0, 60) : "";
    console.log(`${pc.cyan(r.id.padEnd(12))} ${pc.dim(r.type.padEnd(16))} ${pc.bold(r.name)}${desc}`);
  }
}

function printTraceTree(tn: TraceNode, depth: number): void {
  if (!tn.node) return;
  const indent = "  ".repeat(depth);
  console.log(`${indent}${pc.cyan(tn.id)} — ${pc.bold(tn.node.name)} (${pc.dim(tn.node.type)})`);
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
          console.log(`${pc.dim("Outgoing relationships")}:`);
          for (const r of result.outgoing) console.log(`  → ${pc.dim(r.type)} → ${pc.cyan(r.to)}`);
        }
        if (result.incoming.length > 0) {
          console.log(`${pc.dim("Incoming relationships")}:`);
          for (const r of result.incoming) console.log(`  ← ${pc.dim(r.type)} ← ${pc.cyan(r.from)}`);
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
          console.log(`${pc.cyan(r.from.padEnd(12))} ${pc.dim(r.type.padEnd(20))} ${pc.cyan(r.to)}`);
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

    case "timeline": {
      const nodeId = parseFlag(filterArgs, "--node");
      const events = nodeId ? nodeHistory(doc, nodeId) : timeline(doc);
      if (asJson) {
        console.log(JSON.stringify(events, null, 2));
      } else {
        if (events.length === 0) {
          console.log("(no timestamped events)");
        } else {
          for (const event of events) {
            console.log(
              `${event.timestamp}  ${event.nodeId} (${event.nodeType})  ${event.state}`
            );
          }
        }
      }
      break;
    }

    case "state-at": {
      const timestamp = parseFlag(filterArgs, "--time");
      if (!timestamp) {
        console.error("Usage: sysprom query <input> state-at --time TIMESTAMP");
        process.exit(1);
      }
      const result = stateAt(doc, timestamp);
      if (asJson) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        if (result.length === 0) {
          console.log(`(no active states at ${timestamp})`);
        } else {
          for (const nodeState of result) {
            console.log(
              `${nodeState.nodeId} (${nodeState.nodeName}): ${nodeState.activeStates.join(", ")}`
            );
          }
        }
      }
      break;
    }

    default:
      console.error(`Unknown query type: ${queryType}`);
      console.error("Valid types: nodes, node, rels, trace, timeline, state-at");
      process.exit(1);
  }
}
