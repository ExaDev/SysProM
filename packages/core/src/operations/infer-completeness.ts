import * as z from "zod";
import { defineOperation } from "./define-operation.js";
import { SysProMDocument, NodeType } from "../schema.js";

/**
 * Completeness result for a single node.
 */
const CompletenessResult = z.object({
	id: z.string(),
	type: NodeType,
	name: z.string(),
	score: z.number().min(0).max(1),
	issues: z.array(z.string()),
});

/** Completeness result for a single node with score and issues. */
export type CompletenessResult = z.infer<typeof CompletenessResult>;

/**
 * Output schema for inferCompletenessOp.
 */
const CompletenessOutput = z.object({
	nodes: z.array(CompletenessResult),
	averageScore: z.number(),
	completeNodes: z.number(),
	incompleteNodes: z.number(),
});

/** Output of completeness inference operation. */
export type CompletenessOutput = z.infer<typeof CompletenessOutput>;

/**
 * Node types that are expected to have downward refinement relationships.
 */
const REFINEMENT_HIERARCHY: Record<
	string,
	{ expectedChildren: string[]; relType: string }
> = {
	intent: { expectedChildren: ["concept", "capability"], relType: "refines" },
	concept: { expectedChildren: ["capability", "element"], relType: "refines" },
	capability: {
		expectedChildren: ["element", "realisation"],
		relType: "realises",
	},
	element: { expectedChildren: ["realisation"], relType: "implements" },
	decision: { expectedChildren: ["invariant"], relType: "must_preserve" },
	change: { expectedChildren: ["decision"], relType: "implements" },
};

/**
 * Infer completeness of nodes based on expected relationships.
 *
 * Analyses each node to determine if it has expected refinements or
 * relationships, returning a score (0-1) and list of issues for incomplete nodes.
 */
export const inferCompletenessOp = defineOperation({
	name: "infer-completeness",
	description:
		"Infer completeness of nodes based on expected refinement relationships",
	input: z.object({
		doc: SysProMDocument,
	}),
	output: CompletenessOutput,
	fn: (input): CompletenessOutput => {
		const typeMap = new Map(input.doc.nodes.map((n) => [n.id, n.type]));
		const results: CompletenessResult[] = [];

		for (const node of input.doc.nodes) {
			const issues: string[] = [];
			let score = 1.0;

			if (node.type in REFINEMENT_HIERARCHY) {
				const expected = REFINEMENT_HIERARCHY[node.type];
				// For decision: find relationships FROM decision TO invariant (must_preserve)
				// For change: find relationships FROM change TO decision (implements)
				// For others: find relationships TO this node (refines, realises, implements)
				const isOutgoingRel = ["decision", "change"].includes(node.type);

				const children = (input.doc.relationships ?? [])
					.filter((r) => {
						if (isOutgoingRel) {
							return r.from === node.id && r.type === expected.relType;
						}
						return r.to === node.id && r.type === expected.relType;
					})
					.map((r) => ({
						id: isOutgoingRel ? r.to : r.from,
						type: typeMap.get(isOutgoingRel ? r.to : r.from),
					}));

				// Check if any children match expected types
				const validChildren = children.filter((c) =>
					expected.expectedChildren.includes(c.type ?? ""),
				);

				if (validChildren.length === 0) {
					issues.push(
						`No ${expected.relType} relationships ${isOutgoingRel ? "to" : "from"} ${expected.expectedChildren.join("/")} nodes`,
					);
					score -= 0.5;
				}
			}

			// Check for required fields based on node type
			if (node.type === "decision") {
				if (!node.options || node.options.length === 0) {
					issues.push("Decision has no options");
					score -= 0.25;
				}
				if (!node.selected) {
					issues.push("Decision has no selected option");
					score -= 0.25;
				}
				if (!node.rationale) {
					issues.push("Decision has no rationale");
					score -= 0.1;
				}
			}

			if (node.type === "change") {
				if (!node.scope || node.scope.length === 0) {
					issues.push("Change has no scope");
					score -= 0.2;
				}
			}

			if (node.type === "invariant") {
				if (!node.description) {
					issues.push("Invariant has no description");
					score -= 0.3;
				}
			}

			// Clamp score to [0, 1]
			score = Math.max(0, Math.min(1, score));

			results.push({
				id: node.id,
				type: node.type,
				name: node.name,
				score,
				issues,
			});
		}

		const completeNodes = results.filter((r) => r.score === 1).length;
		const incompleteNodes = results.filter((r) => r.score < 1).length;
		const averageScore =
			results.reduce((sum, r) => sum + r.score, 0) / results.length;

		return {
			nodes: results,
			averageScore,
			completeNodes,
			incompleteNodes,
		};
	},
});
