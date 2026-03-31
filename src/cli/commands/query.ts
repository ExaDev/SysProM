import pc from "picocolors";
import * as z from "zod";
import type { CommandDef } from "../define-command.js";
import { textToString } from "../../text.js";
import { readOpts, loadDoc } from "../shared.js";
import {
	queryNodesOp,
	queryNodeOp,
	queryRelationshipsOp,
	traceFromNodeOp,
	timelineOp,
	nodeHistoryOp,
	stateAtOp,
} from "../../operations/index.js";
import { NodeType, NodeStatus } from "../../schema.js";
import type { Node } from "../../schema.js";

// ---------------------------------------------------------------------------
// Presentation helpers
// ---------------------------------------------------------------------------

function printNodeCompact(r: Node): void {
	const desc = r.description
		? " — " + textToString(r.description).slice(0, 60)
		: "";
	console.log(
		`${pc.cyan(r.id.padEnd(12))} ${pc.dim(r.type.padEnd(16))} ${pc.bold(r.name)}${desc}`,
	);
}

function printNodeVerbose(r: Node): void {
	console.log(`${pc.cyan(r.id)} — ${pc.bold(r.name)}`);
	console.log(`  ${pc.dim("Type")}: ${r.type}`);
	if (r.status) console.log(`  ${pc.dim("Status")}: ${pc.yellow(r.status)}`);
	if (r.description)
		console.log(`  ${pc.dim("Description")}: ${textToString(r.description)}`);
	if (r.context)
		console.log(`  ${pc.dim("Context")}: ${textToString(r.context)}`);
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
			.map(([k, v]) => `${k}=${String(v)}`)
			.join(", ");
		console.log(`  ${pc.dim("Lifecycle")}: ${states}`);
	}
	if (r.includes)
		console.log(`  ${pc.dim("Includes")}: ${r.includes.join(", ")}`);
	console.log("");
}

/** Matches the recursive trace structure returned by traceFromNodeOp. */
interface TraceTreeNode {
	id: string;
	node?: Node | null;
	children: readonly TraceTreeNode[];
}

function isTraceTreeNode(value: unknown): value is TraceTreeNode {
	if (typeof value !== "object" || value === null) return false;
	return (
		"id" in value &&
		typeof value.id === "string" &&
		"children" in value &&
		Array.isArray(value.children)
	);
}

function printTraceTree(tn: TraceTreeNode, depth: number): void {
	if (!tn.node) return;
	const indent = "  ".repeat(depth);
	console.log(
		`${indent}${pc.cyan(tn.id)} — ${pc.bold(tn.node.name)} (${pc.dim(tn.node.type)})`,
	);
	for (const child of tn.children) {
		printTraceTree(child, depth + 1);
	}
}

// ---------------------------------------------------------------------------
// Arg/opt schemas
// ---------------------------------------------------------------------------

const nodesOpts = readOpts.extend({
	type: NodeType.optional().describe("filter by node type"),
	status: NodeStatus.optional().describe("filter by node status"),
});

const nodeArgs = z.object({
	id: z.string().describe("node ID to retrieve"),
});

const relsOpts = readOpts.extend({
	from: z.string().optional().describe("filter relationships by source node"),
	to: z.string().optional().describe("filter relationships by target node"),
	type: z.string().optional().describe("filter by relationship type"),
});

const traceArgs = z.object({
	id: z.string().describe("node ID to start trace from"),
});

const timelineOpts = readOpts.extend({
	node: z.string().optional().describe("filter events to a specific node"),
});

const stateAtArgs = z.object({
	time: z.string().describe("ISO timestamp to query"),
});

// ---------------------------------------------------------------------------
// Subcommands
// ---------------------------------------------------------------------------

const nodesSubcommand: CommandDef = {
	name: "nodes",
	description: queryNodesOp.def.description,
	apiLink: queryNodesOp.def.name,
	opts: nodesOpts,
	action(_rawArgs: unknown, rawOpts: unknown) {
		const opts = nodesOpts.parse(rawOpts);
		const { doc } = loadDoc(opts.path);
		const nodes = queryNodesOp({ doc, type: opts.type, status: opts.status });
		if (opts.json) {
			console.log(JSON.stringify(nodes, null, 2));
		} else {
			for (const n of nodes) printNodeCompact(n);
			console.log(`\n${String(nodes.length)} node(s)`);
		}
	},
};

const nodeSubcommand: CommandDef = {
	name: "node",
	description: queryNodeOp.def.description,
	apiLink: queryNodeOp.def.name,
	args: nodeArgs,
	opts: readOpts,
	action(rawArgs: unknown, rawOpts: unknown) {
		const args = nodeArgs.parse(rawArgs);
		const opts = readOpts.parse(rawOpts);
		const { doc } = loadDoc(opts.path);
		const result = queryNodeOp({ doc, id: args.id });
		if (!result) {
			console.error(`Node not found: ${args.id}`);
			process.exit(1);
		}
		if (opts.json) {
			console.log(JSON.stringify(result.node, null, 2));
		} else {
			printNodeVerbose(result.node);
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
	description: queryRelationshipsOp.def.description,
	apiLink: queryRelationshipsOp.def.name,
	opts: relsOpts,
	action(_rawArgs: unknown, rawOpts: unknown) {
		const opts = relsOpts.parse(rawOpts);
		const { doc } = loadDoc(opts.path);
		const rels = queryRelationshipsOp({
			doc,
			from: opts.from,
			to: opts.to,
			type: opts.type,
		});
		if (opts.json) {
			console.log(JSON.stringify(rels, null, 2));
		} else {
			for (const r of rels) {
				console.log(
					`${pc.cyan(r.from.padEnd(12))} ${pc.dim(r.type.padEnd(20))} ${pc.cyan(r.to)}`,
				);
			}
			console.log(`\n${String(rels.length)} relationship(s)`);
		}
	},
};

const traceSubcommand: CommandDef = {
	name: "trace",
	description: traceFromNodeOp.def.description,
	apiLink: traceFromNodeOp.def.name,
	args: traceArgs,
	opts: readOpts,
	action(rawArgs: unknown, rawOpts: unknown) {
		const args = traceArgs.parse(rawArgs);
		const opts = readOpts.parse(rawOpts);
		const { doc } = loadDoc(opts.path);
		const trace = traceFromNodeOp({ doc, startId: args.id });
		if (opts.json) {
			console.log(JSON.stringify(trace, null, 2));
		} else if (isTraceTreeNode(trace)) {
			printTraceTree(trace, 0);
		}
	},
};

const timelineSubcommand: CommandDef = {
	name: "timeline",
	description: timelineOp.def.description,
	apiLink: timelineOp.def.name,
	opts: timelineOpts,
	action(_rawArgs: unknown, rawOpts: unknown) {
		const opts = timelineOpts.parse(rawOpts);
		const { doc } = loadDoc(opts.path);
		const events = opts.node
			? nodeHistoryOp({ doc, nodeId: opts.node })
			: timelineOp({ doc });
		if (opts.json) {
			console.log(JSON.stringify(events, null, 2));
		} else {
			if (events.length === 0) {
				console.log("(no timestamped events)");
			} else {
				for (const event of events) {
					console.log(
						`${event.timestamp}  ${event.nodeId} (${event.nodeType})  ${event.state}`,
					);
				}
			}
		}
	},
};

const stateAtSubcommand: CommandDef = {
	name: "state-at",
	description: stateAtOp.def.description,
	apiLink: stateAtOp.def.name,
	args: stateAtArgs,
	opts: readOpts,
	action(rawArgs: unknown, rawOpts: unknown) {
		const args = stateAtArgs.parse(rawArgs);
		const opts = readOpts.parse(rawOpts);
		const { doc } = loadDoc(opts.path);
		const result = stateAtOp({ doc, timestamp: args.time });
		if (opts.json) {
			console.log(JSON.stringify(result, null, 2));
		} else {
			if (result.length === 0) {
				console.log(`(no active states at ${args.time})`);
			} else {
				for (const nodeState of result) {
					console.log(
						`${nodeState.nodeId} (${nodeState.nodeName}): ${nodeState.activeStates.join(", ")}`,
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
