import * as z from "zod";
import { defineOperation } from "./define-operation.js";
import { SysProMDocument } from "../schema.js";
import { checkGate, type GateResult, type GateIssue } from "../speckit/plan.js";

export const GateIssueSchema = z.union([
	z.object({
		kind: z.literal("previous_tasks_incomplete"),
		phase: z.number(),
		remaining: z.number(),
	}),
	z.object({
		kind: z.literal("user_story_no_change"),
		storyId: z.string(),
	}),
	z.object({
		kind: z.literal("user_story_no_acceptance_criteria"),
		storyId: z.string(),
	}),
	z.object({
		kind: z.literal("fr_no_change"),
		frId: z.string(),
	}),
]);

export type GateIssueResult = z.infer<typeof GateIssueSchema>;

export const GateResultSchema = z.object({
	phase: z.number(),
	ready: z.boolean(),
	issues: z.array(GateIssueSchema),
});

export type GateResultOutput = z.infer<typeof GateResultSchema>;

export const planGateOp = defineOperation({
	name: "planGate",
	description: "Check gate criteria for phase entry",
	input: z.object({
		doc: SysProMDocument,
		prefix: z.string().describe("Plan prefix"),
		phase: z.number().int().positive().describe("Phase number (1-indexed)"),
	}),
	output: GateResultSchema,
	fn({ doc, prefix, phase }) {
		return checkGate(doc, prefix, phase);
	},
});
