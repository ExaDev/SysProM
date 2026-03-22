import * as z from "zod";
import { defineOperation } from "./define-operation.js";
import { SysProMDocument } from "../schema.js";
import { addTask } from "../speckit/plan.js";

export const planAddTaskOp = defineOperation({
	name: "planAddTask",
	description: "Add a task (change node) to a plan's implementation protocol",
	input: z.object({
		doc: SysProMDocument,
		prefix: z.string().describe("Plan prefix"),
		name: z.string().optional().describe("Task name"),
		parent: z.string().optional().describe("Parent task ID"),
	}),
	output: SysProMDocument,
	fn({ doc, prefix, name, parent }) {
		return addTask(doc, prefix, name, parent);
	},
});
