import * as z from "zod";
import { defineOperation } from "./define-operation.js";
import { SysProMDocument } from "../schema.js";

/**
 * Append a new task to a change node's plan array. Returns a new document with the task added.
 *
 * @throws If the change node is not found.
 */
export const addPlanTaskOp = defineOperation({
	name: "addPlanTask",
	description:
		"Append a new task to a change node's plan array. Returns a new document.",
	input: z.object({
		doc: SysProMDocument,
		changeId: z.string(),
		description: z.string(),
	}),
	output: SysProMDocument,
	fn({ doc, changeId, description }) {
		const node = doc.nodes.find((n) => n.id === changeId);
		if (!node) {
			throw new Error(`Node not found: ${changeId}`);
		}
		const newTask = { description, done: false };
		const updatedNode = { ...node, plan: [...(node.plan ?? []), newTask] };
		const newNodes = [...doc.nodes];
		const idx = newNodes.findIndex((n) => n.id === changeId);
		newNodes[idx] = updatedNode;
		return { ...doc, nodes: newNodes };
	},
});
