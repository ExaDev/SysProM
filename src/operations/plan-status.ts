import * as z from "zod";
import { defineOperation } from "./define-operation.js";
import { SysProMDocument } from "../schema.js";
import { planStatus } from "../speckit/plan.js";

export const PlanStatusSchema = z.object({
	constitution: z.object({
		defined: z.boolean(),
		principleCount: z.number(),
	}),
	spec: z.object({
		defined: z.boolean(),
		userStoryCount: z.number(),
		storiesNeedingAcceptanceCriteria: z.array(z.string()),
	}),
	plan: z.object({
		defined: z.boolean(),
		phaseCount: z.number(),
	}),
	tasks: z.object({
		total: z.number(),
		done: z.number(),
	}),
	checklist: z.object({
		defined: z.boolean(),
		total: z.number(),
		done: z.number(),
	}),
	nextStep: z.string(),
});

export type PlanStatusResult = z.infer<typeof PlanStatusSchema>;

export const planStatusOp = defineOperation({
	name: "planStatus",
	description: "Get the status of all plan components",
	input: z.object({
		doc: SysProMDocument,
		prefix: z.string().describe("Plan prefix"),
	}),
	output: PlanStatusSchema,
	fn({ doc, prefix }) {
		return planStatus(doc, prefix);
	},
});
