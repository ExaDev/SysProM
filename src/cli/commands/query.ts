import pc from "picocolors";
import * as z from "zod";
import type { CommandDef } from "../define-command.js";
import { textToString } from "../../text.js";
import { loadDocument } from "../../io.js";
import {
  queryNodes,
  queryNode,
  queryRelationships,
  traceFromNode,
} from "../../query.js";
import { timeline, nodeHistory, stateAt } from "../../temporal.js";
import { NodeType, NodeStatus } from "../../schema.js";
import type { Node } from "../../schema.js";
import type { TraceNode } from "../../query.js";

// ---------------------------------------------------------------------------
// Type aliases for action handlers
// ---------------------------------------------------------------------------

type NodesArgs = { input: string };
type NodesOpts = { type?: string; status?: string; json?: boolean };

type NodeArgs = { input: string; id: string };
type NodeOpts = { json?: boolean };

type RelsArgs = { input: string };
type RelsOpts = { from?: string; to?: string; type?: string; json?: boolean };

type TraceArgs = { input: string; id: string };
type TraceOpts = { json?: boolean };

type TimelineArgs = { input: string };
type TimelineOpts = { node?: string; json?: boolean };

type StateAtArgs = { input: string; time: string };
type StateAtOpts = { json?: boolean };

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

function printNode(r: Node, verbose: boolean): void {
  if (verbose) {
    console.log(`${pc.cyan(r.id)} — ${pc.bold(r.name)}`);
    console.log(`  ${pc.dim("Type")}: ${r.type}`);
    if (r.status) console.log(`  ${pc.dim("Status")}: ${pc.yellow(r.status)}`);
    if (r.description)
      console.log(`  ${pc.dim("Description")}: ${textToString(r.description)}`);
    if (r.context) console.log(`  ${pc.dim("Context")}: ${textToString(r.context)}`);
    if (r.rationale)
      console.log(`  ${pc.dim("Rationale")}: ${textToString(r.rationale)}`);
    if (r.selected) console.log(`  ${pc.dim("Selected")}: ${r.selected}`);
    if (r.options) {
      console.log(`  ${pc.dim("Options")}:`);
      for (const o of r.options)
        console.log(`    ${o.id}: ${textToString(o.description)}`);
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
    console.log(
      `${pc.cyan(r.id.padEnd(12))} ${pc.dim(r.type.padEnd(16))} ${pc.bold(r.name)}${desc}`
    );
  }
}

function printTraceTree(tn: TraceNode, depth: number): void {
  if (!tn.node) return;
  const indent = "  ".repeat(depth);
  console.log(
    `${indent}${pc.cyan(tn.id)} — ${pc.bold(tn.node.name)} (${pc.dim(tn.node.type)})`
  );
  for (const child of tn.children) {
    printTraceTree(child, depth + 1);
  }
}

// ---------------------------------------------------------------------------
// Subcommands
// ---------------------------------------------------------------------------

const nodesSubcommand: CommandDef = {
  name: "nodes",
  description: "List nodes, optionally filtered by type or status",
  apiLink: "queryNodes",
  args: z.object({
    input: z.string().describe("SysProM document to query"),
  }),
  opts: z.object({
    type: NodeType.optional().describe("filter by node type"),
    status: NodeStatus.optional().describe("filter by node status"),
    json: z.boolean().optional().default(false).describe("output as JSON"),
  }),
  action(args: unknown, opts: unknown) {
    const typedArgs = args as NodesArgs;
    const typedOpts = opts as NodesOpts;
    const { doc } = loadDocument(typedArgs.input);
    const nodes = queryNodes(doc, {
      type: typedOpts.type,
      status: typedOpts.status,
    });
    if (typedOpts.json) {
      console.log(JSON.stringify(nodes, null, 2));
    } else {
      for (const n of nodes) printNode(n, false);
      console.log(`\n${nodes.length} node(s)`);
    }
  },
};

const nodeSubcommand: CommandDef = {
  name: "node",
  description: "Show single node detail with incoming and outgoing relationships",
  apiLink: "queryNode",
  args: z.object({
    input: z.string().describe("SysProM document to query"),
    id: z.string().describe("node ID to retrieve"),
  }),
  opts: z.object({
    json: z.boolean().optional().default(false).describe("output as JSON"),
  }),
  action(args: unknown, opts: unknown) {
    const typedArgs = args as NodeArgs;
    const typedOpts = opts as NodeOpts;
    const { doc } = loadDocument(typedArgs.input);
    const result = queryNode(doc, typedArgs.id);
    if (!result) {
      console.error(`Node not found: ${typedArgs.id}`);
      process.exit(1);
    }
    if (typedOpts.json) {
      console.log(JSON.stringify(result.node, null, 2));
    } else {
      printNode(result.node, true);
      if (result.outgoing.length > 0) {
        console.log(`${pc.dim("Outgoing relationships")}:`);
        for (const r of result.outgoing)
          console.log(`  → ${pc.dim(r.type)} → ${pc.cyan(r.to)}`);
      }
      if (result.incoming.length > 0) {
        console.log(`${pc.dim("Incoming relationships")}:`);
        for (const r of result.incoming)
          console.log(`  ← ${pc.dim(r.type)} ← ${pc.cyan(r.from)}`);
      }
    }
  },
};

const relsSubcommand: CommandDef = {
  name: "rels",
  description: "List all relationships, optionally filtered by type or endpoints",
  apiLink: "queryRelationships",
  args: z.object({
    input: z.string().describe("SysProM document to query"),
  }),
  opts: z.object({
    from: z.string().optional().describe("filter relationships by source node"),
    to: z.string().optional().describe("filter relationships by target node"),
    type: z.string().optional().describe("filter by relationship type"),
    json: z.boolean().optional().default(false).describe("output as JSON"),
  }),
  action(args: unknown, opts: unknown) {
    const typedArgs = args as RelsArgs;
    const typedOpts = opts as RelsOpts;
    const { doc } = loadDocument(typedArgs.input);
    const rels = queryRelationships(doc, {
      from: typedOpts.from,
      to: typedOpts.to,
      type: typedOpts.type,
    });
    if (typedOpts.json) {
      console.log(JSON.stringify(rels, null, 2));
    } else {
      for (const r of rels) {
        console.log(
          `${pc.cyan(r.from.padEnd(12))} ${pc.dim(r.type.padEnd(20))} ${pc.cyan(r.to)}`
        );
      }
      console.log(`\n${rels.length} relationship(s)`);
    }
  },
};

const traceSubcommand: CommandDef = {
  name: "trace",
  description: "Trace refinement chain from a node through its descendants",
  apiLink: "traceFromNode",
  args: z.object({
    input: z.string().describe("SysProM document to query"),
    id: z.string().describe("node ID to start trace from"),
  }),
  opts: z.object({
    json: z.boolean().optional().default(false).describe("output as JSON"),
  }),
  action(args: unknown, opts: unknown) {
    const typedArgs = args as TraceArgs;
    const typedOpts = opts as TraceOpts;
    const { doc } = loadDocument(typedArgs.input);
    const trace = traceFromNode(doc, typedArgs.id);
    if (typedOpts.json) {
      console.log(JSON.stringify(trace, null, 2));
    } else {
      printTraceTree(trace, 0);
    }
  },
};

const timelineSubcommand: CommandDef = {
  name: "timeline",
  description:
    "Show timestamped events across the system, optionally filtered by node",
  apiLink: "timeline",
  args: z.object({
    input: z.string().describe("SysProM document to query"),
  }),
  opts: z.object({
    node: z.string().optional().describe("filter events to a specific node"),
    json: z.boolean().optional().default(false).describe("output as JSON"),
  }),
  action(args: unknown, opts: unknown) {
    const typedArgs = args as TimelineArgs;
    const typedOpts = opts as TimelineOpts;
    const { doc } = loadDocument(typedArgs.input);
    const events = typedOpts.node ? nodeHistory(doc, typedOpts.node) : timeline(doc);
    if (typedOpts.json) {
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
  },
};

const stateAtSubcommand: CommandDef = {
  name: "state-at",
  description: "Query active node states at a specific timestamp",
  apiLink: "stateAt",
  args: z.object({
    input: z.string().describe("SysProM document to query"),
    time: z.string().describe("ISO timestamp to query"),
  }),
  opts: z.object({
    json: z.boolean().optional().default(false).describe("output as JSON"),
  }),
  action(args: unknown, opts: unknown) {
    const typedArgs = args as StateAtArgs;
    const typedOpts = opts as StateAtOpts;
    const { doc } = loadDocument(typedArgs.input);
    const result = stateAt(doc, typedArgs.time);
    if (typedOpts.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      if (result.length === 0) {
        console.log(`(no active states at ${typedArgs.time})`);
      } else {
        for (const nodeState of result) {
          console.log(
            `${nodeState.nodeId} (${nodeState.nodeName}): ${nodeState.activeStates.join(", ")}`
          );
        }
      }
    }
  },
};

// ---------------------------------------------------------------------------
// Main command
// ---------------------------------------------------------------------------

export const queryCommand: CommandDef = {
  name: "query",
  description: "Query nodes, relationships, traces, and temporal state",
  subcommands: [
    nodesSubcommand,
    nodeSubcommand,
    relsSubcommand,
    traceSubcommand,
    timelineSubcommand,
    stateAtSubcommand,
  ],
};
