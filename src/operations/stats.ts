import * as z from "zod";
import { defineOperation } from "./define-operation.js";
import { SysProMDocument } from "../schema.js";

/** Zod schema for document statistics — node/relationship counts, subsystem depth, lifecycle breakdown. */
export const DocumentStats = z.object({
	title: z.string(),
	nodesByType: z.record(z.string(), z.number()),
	relationshipsByType: z.record(z.string(), z.number()),
	totalNodes: z.number(),
	totalRelationships: z.number(),
	subsystemCount: z.number(),
	maxSubsystemDepth: z.number(),
	viewCount: z.number(),
	externalReferenceCount: z.number(),
	decisionLifecycle: z.record(z.string(), z.number()),
	changeLifecycle: z.record(z.string(), z.number()),
});

/** Computed statistics about a SysProM document. */
export type DocumentStats = z.infer<typeof DocumentStats>;

/** Compute statistics about a SysProM document — node and relationship counts by type, subsystem depth, lifecycle breakdowns, and more. */
export const statsOp = defineOperation({
	name: "stats",
	description: "Compute statistics about a SysProM document",
	input: z.object({
		doc: SysProMDocument,
	}),
	output: DocumentStats,
	fn: (input) => {
		// Node counts by type
		const nodesByType: Record<string, number> = {};
		for (const n of input.doc.nodes) {
			nodesByType[n.type] = (nodesByType[n.type] ?? 0) + 1;
		}

		// Relationship counts by type
		const relationshipsByType: Record<string, number> = {};
		for (const r of input.doc.relationships ?? []) {
			relationshipsByType[r.type] = (relationshipsByType[r.type] ?? 0) + 1;
		}

		// Subsystem stats
		let subsystemCount = 0;
		let maxDepth = 0;
		function countSubsystems(
			nodes: typeof input.doc.nodes,
			depth: number,
		): void {
			for (const n of nodes) {
				if (n.subsystem) {
					subsystemCount++;
					if (depth + 1 > maxDepth) maxDepth = depth + 1;
					countSubsystems(n.subsystem.nodes, depth + 1);
				}
			}
		}
		countSubsystems(input.doc.nodes, 0);

		// Lifecycle status for decisions and changes
		const decisionLifecycle: Record<string, number> = {};
		const changeLifecycle: Record<string, number> = {};
		for (const n of input.doc.nodes) {
			if (n.lifecycle) {
				const statusMap =
					n.type === "decision"
						? decisionLifecycle
						: n.type === "change"
							? changeLifecycle
							: null;
				if (statusMap) {
					for (const [state, done] of Object.entries(n.lifecycle)) {
						if (done) {
							statusMap[state] = (statusMap[state] ?? 0) + 1;
						}
					}
				}
			}
		}

		// View count
		const viewCount = input.doc.nodes.filter((n) => n.type === "view").length;
		const externalReferenceCount = (input.doc.external_references ?? []).length;

		return {
			title: input.doc.metadata?.title ?? "(untitled)",
			nodesByType,
			relationshipsByType,
			totalNodes: input.doc.nodes.length,
			totalRelationships: (input.doc.relationships ?? []).length,
			subsystemCount,
			maxSubsystemDepth: maxDepth,
			viewCount,
			externalReferenceCount,
			decisionLifecycle,
			changeLifecycle,
		};
	},
});
