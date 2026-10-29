import * as z from "zod";
import { defineOperation } from "./define-operation.js";
import { SysProMDocument } from "../schema.js";
import { setTaskLifecycle } from "../speckit/plan.js";

/** Reopen a completed plan task by clearing lifecycle complete and marking in_progress. */
export const planReopenTaskOp = defineOperation({
	name: "planReopenTask",
	description: "Reopen a plan task",
	input: z.object({
		doc: SysProMDocument,
		prefix: z.string().describe("Plan prefix"),
		taskId: z.string().describe("Task change node ID"),
	}),
	output: SysProMDocument,
	fn({ doc, prefix, taskId }) {
		return setTaskLifecycle(doc, prefix, taskId, "reopen");
	},
});
