import * as z from "zod";
import { defineOperation } from "./define-operation.js";
import { SysProMDocument } from "../schema.js";

/**
 * Conflict resolution strategy when both documents have diverged.
 * - 'json': prefer the JSON document as source of truth
 * - 'md': prefer the Markdown-parsed document as source of truth
 * - 'interactive': (not yet supported) prompt user per-conflict
 * - 'report': return summary without resolving
 */
export const ConflictStrategy = z.enum(["json", "md", "interactive", "report"]);
/** Type for conflict resolution strategies. */
export type ConflictStrategy = z.infer<typeof ConflictStrategy>;

/**
 * Result of synchronisation between two documents.
 * @property synced The resolved document after applying sync strategy
 * @property jsonChanged True if JSON side was newer/modified
 * @property mdChanged True if MD side was newer/modified
 * @property conflict True if both sides diverged
 * @property strategy The strategy applied to resolve any conflicts
 * @property changedNodes IDs of nodes that differ between JSON and MD
 */
export interface BidirectionalSyncResult {
	synced: SysProMDocument;
	jsonChanged: boolean;
	mdChanged: boolean;
	conflict: boolean;
	strategy: ConflictStrategy;
	changedNodes: string[];
}

const BidirectionalSyncResultSchema = z.object({
	synced: SysProMDocument,
	jsonChanged: z.boolean(),
	mdChanged: z.boolean(),
	conflict: z.boolean(),
	strategy: ConflictStrategy,
	changedNodes: z.array(z.string()),
});

/**
 * Synchronise two SysProM document representations.
 * Implements bidirectional sync with configurable conflict resolution.
 * @throws {Error} If conflict resolution is impossible (both changed with 'report' strategy)
 */
export const syncDocumentsOp = defineOperation({
	name: "syncDocuments",
	description:
		"Synchronise two SysProM document representations (JSON and Markdown-parsed) with conflict resolution strategies.",
	input: z.object({
		jsonDoc: SysProMDocument,
		mdDoc: SysProMDocument,
		jsonChanged: z.boolean(),
		mdChanged: z.boolean(),
		strategy: ConflictStrategy.optional(),
	}),
	output: BidirectionalSyncResultSchema,
	fn(params: {
		jsonDoc: SysProMDocument;
		mdDoc: SysProMDocument;
		jsonChanged: boolean;
		mdChanged: boolean;
		strategy?: ConflictStrategy;
	}): BidirectionalSyncResult {
		const {
			jsonDoc,
			mdDoc,
			jsonChanged,
			mdChanged,
			strategy = "json",
		} = params;

		// Identify which nodes differ
		const jsonNodeMap = new Map(jsonDoc.nodes.map((n) => [n.id, n]));
		const mdNodeMap = new Map(mdDoc.nodes.map((n) => [n.id, n]));

		const changedNodes: string[] = [];

		for (const node of jsonDoc.nodes) {
			const mdNode = mdNodeMap.get(node.id);
			if (!mdNode || JSON.stringify(node) !== JSON.stringify(mdNode)) {
				changedNodes.push(node.id);
			}
		}

		for (const node of mdDoc.nodes) {
			if (!jsonNodeMap.has(node.id)) {
				changedNodes.push(node.id);
			}
		}

		// Determine sync strategy and result
		if (!jsonChanged && !mdChanged) {
			// No changes, return either document
			return {
				synced: jsonDoc,
				jsonChanged: false,
				mdChanged: false,
				conflict: false,
				strategy: strategy,
				changedNodes: [],
			};
		}

		if (jsonChanged && !mdChanged) {
			// JSON is the modified source, return it as-is
			return {
				synced: jsonDoc,
				jsonChanged: true,
				mdChanged: false,
				conflict: false,
				strategy: strategy,
				changedNodes,
			};
		}

		if (!jsonChanged && mdChanged) {
			// MD is the modified source, return it
			return {
				synced: mdDoc,
				jsonChanged: false,
				mdChanged: true,
				conflict: false,
				strategy: strategy,
				changedNodes,
			};
		}

		// Both have changed — apply conflict strategy
		switch (strategy) {
			case "json": {
				return {
					synced: jsonDoc,
					jsonChanged: true,
					mdChanged: true,
					conflict: true,
					strategy: "json" as const,
					changedNodes,
				};
			}

			case "md": {
				return {
					synced: mdDoc,
					jsonChanged: true,
					mdChanged: true,
					conflict: true,
					strategy: "md" as const,
					changedNodes,
				};
			}

			case "report": {
				const nodeCountStr = String(changedNodes.length);
				throw new Error(
					`Conflict detected: both JSON and Markdown have diverged (${nodeCountStr} nodes differ). Use --prefer-json or --prefer-md to resolve.`,
				);
			}

			case "interactive": {
				throw new Error("Interactive conflict resolution not yet implemented");
			}

			default: {
				// TypeScript exhaustiveness check
				const _exhaustive: never = strategy;
				return _exhaustive;
			}
		}
	},
});
