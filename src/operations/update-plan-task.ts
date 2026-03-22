import * as z from "zod";
import { defineOperation } from "./define-operation.js";
import { SysProMDocument } from "../schema.js";

/**
 * Set the done status of a task in a change node's plan array. Returns a new document.
 * @throws {Error} If the change node is not found or the task index is out of range.
 */
export const updatePlanTaskOp = defineOperation({
	name: "updatePlanTask",
	description:
		"Set the done status of a task in a change node's plan array. Returns a new document.",
	input: z.object({
		doc: SysProMDocument,
		changeId: z.string(),
		taskIndex: z.number(),
		done: z.boolean(),
	}),
	output: SysProMDocument,
	fn({ doc, changeId, taskIndex, done }) {
		const node = doc.nodes.find((n) => n.id === changeId);
		if (!node) {
			throw new Error(`Node not found: ${changeId}`);
		}
		const plan = node.plan ?? [];
		if (taskIndex < 0 || taskIndex >= plan.length) {
			throw new Error(
				`Task index ${String(taskIndex)} out of range (plan has ${String(plan.length)} task(s))`,
			);
		}
		const newPlan = [...plan];
		newPlan[taskIndex] = { ...newPlan[taskIndex], done };
		const updatedNode = { ...node, plan: newPlan };
		const newNodes = [...doc.nodes];
		const idx = newNodes.findIndex((n) => n.id === changeId);
		newNodes[idx] = updatedNode;
		return { ...doc, nodes: newNodes };
	},
});
