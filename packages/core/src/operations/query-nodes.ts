import * as z from "zod";
import { defineOperation } from "./define-operation.js";
import { Node, SysProMDocument } from "../schema.js";
import { hasLifecycleState } from "../lifecycle-state.js";

/** Query nodes from a SysProM document with optional filters for type and lifecycle state. */
export const queryNodesOp = defineOperation({
	name: "query-nodes",
	description: "Query nodes with optional filters for type and lifecycle state",
	input: z.object({
		doc: SysProMDocument,
		type: z.string().optional(),
		status: z.string().optional(),
	}),
	output: z.array(Node),
	fn: (input) => {
		let nodes = input.doc.nodes;

		if (input.type) {
			nodes = nodes.filter((n) => n.type === input.type);
		}

		const lifecycleState = input.status;
		if (lifecycleState) {
			nodes = nodes.filter((n) => hasLifecycleState(n, lifecycleState));
		}

		return nodes;
	},
});
