import * as z from "zod";
import { defineOperation } from "./define-operation.js";
import { SysProMDocument } from "../schema.js";
import { planProgress } from "../speckit/plan.js";

export const PhaseProgressSchema = z.object({
	phase: z.number(),
	name: z.string(),
	done: z.number(),
	total: z.number(),
	percent: z.number(),
});

export type PhaseProgressResult = z.infer<typeof PhaseProgressSchema>;

export const planProgressOp = defineOperation({
	name: "planProgress",
	description: "Get per-phase progress breakdown",
	input: z.object({
		doc: SysProMDocument,
		prefix: z.string().describe("Plan prefix"),
	}),
	output: z.array(PhaseProgressSchema),
	fn({ doc, prefix }) {
		return planProgress(doc, prefix);
	},
});
