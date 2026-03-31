/// <reference types="node" />
import * as z from "zod";
import type { CommandDef } from "../define-command.js";
import { graphOp } from "../../operations/index.js";
import { noArgs, readOpts, loadDoc } from "../shared.js";

const optsSchema = readOpts.extend({
	format: z.enum(["mermaid", "dot"]).optional().describe("Output format"),
	type: z
		.string()
		.optional()
		.describe("Filter by relationship type (backward compatible)"),
	nodeTypes: z
		.string()
		.optional()
		.describe("Filter by node types (comma-separated)"),
	nodeIds: z
		.string()
		.optional()
		.describe("Filter by node IDs (comma-separated)"),
	relTypes: z
		.string()
		.optional()
		.describe("Filter by relationship types (comma-separated)"),
	layout: z
		.enum(["LR", "TD", "RL", "BT"])
		.optional()
		.describe("Graph layout direction"),
	labelMode: z
		.enum(["friendly", "compact"])
		.optional()
		.describe(
			'Node label mode: "friendly" shows `id: name`, "compact" shows `id`',
		),
	cluster: z
		.boolean()
		.optional()
		.describe("Group nodes by category in subgraphs"),
	connectedOnly: z
		.boolean()
		.optional()
		.describe("Only show nodes that have relationships"),
});

export const graphCommand: CommandDef<typeof noArgs, typeof optsSchema> = {
	name: "graph",
	description: graphOp.def.description,
	apiLink: graphOp.def.name,
	opts: optsSchema,
	action(_args, opts) {
		try {
			const { doc } = loadDoc(opts.path);
			const nodeTypes = opts.nodeTypes
				? opts.nodeTypes.split(",").map((s) => s.trim())
				: undefined;
			const nodeIds = opts.nodeIds
				? opts.nodeIds.split(",").map((s) => s.trim())
				: undefined;
			const relTypes = opts.relTypes
				? opts.relTypes.split(",").map((s) => s.trim())
				: undefined;

			const output = graphOp({
				doc,
				format: opts.format ?? "mermaid",
				typeFilter: opts.type,
				nodeTypes,
				nodeIds,
				relTypes,
				layout: opts.layout ?? "TD",
				cluster: opts.cluster ?? true,
				labelMode: opts.labelMode ?? "friendly",
				connectedOnly: opts.connectedOnly ?? false,
			});
			console.log(output);
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : String(err);
			console.error(message);
			process.exit(1);
		}
	},
};
