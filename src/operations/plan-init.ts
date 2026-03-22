import * as z from "zod";
import { defineOperation } from "./define-operation.js";
import { SysProMDocument } from "../schema.js";
import { initDocument } from "../speckit/plan.js";

export const planInitOp = defineOperation({
	name: "planInit",
	description: "Initialise a new SysProM plan document with standard structure",
	input: z.object({
		prefix: z.string().describe("Plan prefix (e.g. PLAN)"),
		name: z.string().optional().describe("Plan name (defaults to prefix)"),
	}),
	output: SysProMDocument,
	fn({ prefix, name }) {
		const planName = name || prefix;
		return initDocument(prefix, planName);
	},
});
