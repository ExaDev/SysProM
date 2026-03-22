import * as z from "zod";
import { defineOperation } from "./define-operation.js";
import { SysProMDocument } from "../schema.js";

/**
 * Mark a task as undone (incomplete) within a change node's plan.
 *
 * @throws If the change node is not found or the task index is out of range.
 */
export const markTaskUndoneOp = defineOperation({
	name: "markTaskUndone",
	description: "Mark a task as undone",
	input: z.object({
		doc: SysProMDocument,
		changeId: z.string().describe("ID of the change node"),
		taskIndex: z.number().describe("Zero-based index of the task in the plan"),
	}),
	output: SysProMDocument,
	fn: (input) => {
		const node = input.doc.nodes.find((n) => n.id === input.changeId);
		if (!node) throw new Error(`Node not found: ${input.changeId}`);
		const plan = node.plan ?? [];
		if (input.taskIndex < 0 || input.taskIndex >= plan.length) {
			throw new Error(
				`Task index ${String(input.taskIndex)} out of range (plan has ${String(plan.length)} task(s))`,
			);
		}
		const newPlan = [...plan];
		newPlan[input.taskIndex] = { ...newPlan[input.taskIndex], done: false };
		const newNodes = input.doc.nodes.map((n) =>
			n.id === input.changeId ? { ...n, plan: newPlan } : n,
		);
		return { ...input.doc, nodes: newNodes };
	},
});
