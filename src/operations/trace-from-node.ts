import * as z from "zod";
import { defineOperation } from "./define-operation.js";
import { Node, SysProMDocument } from "../schema.js";

const TraceTypeSet = new Set(["refines", "realises", "implements"]);

const TraceNodeSchema = z.object({
	id: z.string(),
	node: Node.optional(),
	get children(): z.ZodArray<typeof TraceNodeSchema> {
		return z.array(TraceNodeSchema);
	},
});

export const TraceNode = TraceNodeSchema;
export type TraceNode = z.infer<typeof TraceNodeSchema>;

export const traceFromNodeOp = defineOperation({
	name: "trace-from-node",
	description:
		"Trace refinement chain from a node (follows refines, realises, implements)",
	input: z.object({
		doc: SysProMDocument,
		startId: z.string(),
	}),
	output: TraceNode,
	fn: (input): TraceNode => {
		const visited = new Set<string>();

		function trace(id: string): TraceNode {
			if (visited.has(id)) {
				return { id, node: undefined, children: [] };
			}
			visited.add(id);

			const node = input.doc.nodes.find((n) => n.id === id);

			const children = (input.doc.relationships ?? [])
				.filter((r) => r.to === id && TraceTypeSet.has(r.type))
				.map((r) => trace(r.from));

			return { id, node, children };
		}

		return trace(input.startId);
	},
});
