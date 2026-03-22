import * as z from "zod";
import { defineOperation } from "./define-operation.js";
import { SysProMDocument } from "../schema.js";
import { textToString } from "../text.js";

const TaskRow = z.object({
	changeId: z.string(),
	index: z.number(),
	description: z.string(),
	done: z.boolean(),
});

/**
 * List tasks across change nodes, optionally filtered by change ID and/or
 * pending status. Returns a flat array of task rows tagged with their parent change node.
 *
 * @throws If a specific changeId is provided but not found.
 */
export const taskListOp = defineOperation({
	name: "taskList",
	description:
		"List tasks across change nodes. Optionally filter by change ID and/or pending status.",
	input: z.object({
		doc: SysProMDocument,
		changeId: z.string().optional(),
		pendingOnly: z.boolean().optional(),
	}),
	output: z.array(TaskRow),
	fn({ doc, changeId, pendingOnly }) {
		let changeNodes = doc.nodes.filter((n) => n.type === "change");

		if (changeId) {
			changeNodes = changeNodes.filter((n) => n.id === changeId);
			if (changeNodes.length === 0) {
				throw new Error(`Change node not found: ${changeId}`);
			}
		}

		type Row = z.infer<typeof TaskRow>;
		const rows: Row[] = [];

		for (const node of changeNodes) {
			for (const [i, task] of (node.plan ?? []).entries()) {
				const done = task.done === true;
				if (pendingOnly && done) continue;
				rows.push({
					changeId: node.id,
					index: i,
					description: textToString(task.description),
					done,
				});
			}
		}

		return rows;
	},
});
