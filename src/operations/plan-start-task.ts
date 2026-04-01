import * as z from "zod";
import { defineOperation } from "./define-operation.js";
import { SysProMDocument } from "../schema.js";
import { setTaskLifecycle } from "../speckit/plan.js";

/** Mark a plan task as started by setting lifecycle introduced/in_progress. */
export const planStartTaskOp = defineOperation({
	name: "planStartTask",
	description: "Mark a plan task as started",
	input: z.object({
		doc: SysProMDocument,
		prefix: z.string().describe("Plan prefix"),
		taskId: z.string().describe("Task change node ID"),
	}),
	output: SysProMDocument,
	fn({ doc, prefix, taskId }) {
		return setTaskLifecycle(doc, prefix, taskId, "start");
	},
});
