import * as z from "zod";
import { defineOperation } from "./define-operation.js";
import { SysProMDocument } from "../schema.js";
import { setTaskLifecycle } from "../speckit/plan.js";

/** Mark a plan task as complete by setting lifecycle complete and clearing in_progress. */
export const planCompleteTaskOp = defineOperation({
	name: "planCompleteTask",
	description: "Mark a plan task as complete",
	input: z.object({
		doc: SysProMDocument,
		prefix: z.string().describe("Plan prefix"),
		taskId: z.string().describe("Task change node ID"),
	}),
	output: SysProMDocument,
	fn({ doc, prefix, taskId }) {
		return setTaskLifecycle(doc, prefix, taskId, "complete");
	},
});
