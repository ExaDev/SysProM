import * as z from "zod";
import { defineOperation } from "./define-operation.js";
import { SysProMDocument } from "../schema.js";

/**
 * A derived relationship inferred from transitive closure or composition.
 */
const DerivedRelationship = z.object({
	from: z.string(),
	to: z.string(),
	type: z.string(),
	derivedFrom: z.array(
		z.object({
			from: z.string(),
			to: z.string(),
			type: z.string(),
		}),
	),
	derivationType: z.enum(["transitive", "composite", "inverse"]),
});

/** A derived relationship inferred from the graph. */
export type DerivedRelationship = z.infer<typeof DerivedRelationship>;

/**
 * Output schema for inferDerivedOp.
 */
const DerivedOutput = z.object({
	derivedRelationships: z.array(DerivedRelationship),
	summary: z.object({
		transitive: z.number(),
		composite: z.number(),
		inverse: z.number(),
		total: z.number(),
	}),
});

/** Output of derived relationships inference operation. */
export type DerivedOutput = z.infer<typeof DerivedOutput>;

/**
 * Relationship types that support transitive derivation.
 */
const TRANSITIVE_RELATIONSHIPS: Record<string, string> = {
	depends_on: "depends_on",
	refines: "refines",
	part_of: "part_of",
	precedes: "precedes",
};

/**
 * Relationship types that have inverse relationships.
 */
const INVERSE_RELATIONSHIPS: Record<string, string> = {
	depends_on: "enables",
	precedes: "follows",
	refines: "refined_by",
	realises: "realised_by",
	implements: "implemented_by",
};

/**
 * Infer derived relationships from the graph structure.
 *
 * Computes transitive closure for hierarchical relationships, derives
 * inverse relationships, and identifies composite patterns.
 */
export const inferDerivedOp = defineOperation({
	name: "infer-derived",
	description:
		"Infer derived relationships from transitive closure, inverses, and composites",
	input: z.object({
		doc: SysProMDocument,
	}),
	output: DerivedOutput,
	fn: (input): DerivedOutput => {
		const derived: DerivedRelationship[] = [];
		const existingKeys = new Set(
			(input.doc.relationships ?? []).map((r) => `${r.from}:${r.type}:${r.to}`),
		);
		const derivedKeys = new Set<string>();

		// Helper to add derived relationship if not already existing
		const addDerived = (
			from: string,
			to: string,
			type: string,
			derivedFrom: DerivedRelationship["derivedFrom"],
			derivationType: DerivedRelationship["derivationType"],
		) => {
			const key = `${from}:${type}:${to}`;
			if (existingKeys.has(key) || derivedKeys.has(key)) return;
			derivedKeys.add(key);
			derived.push({ from, to, type, derivedFrom, derivationType });
		};

		// 1. Transitive relationships - compute full transitive closure with path tracking
		for (const [relType, derivedType] of Object.entries(
			TRANSITIVE_RELATIONSHIPS,
		)) {
			const rels = (input.doc.relationships ?? []).filter(
				(r) => r.type === relType,
			);

			// Build adjacency list
			const adj = new Map<string, string[]>();
			for (const r of rels) {
				const targets = adj.get(r.from) ?? [];
				targets.push(r.to);
				adj.set(r.from, targets);
			}

			// For each source, find all transitively reachable targets with paths
			for (const source of adj.keys()) {
				// BFS to find all reachable nodes and their paths
				const visited = new Map<
					string,
					{ from: string; to: string; type: string }[]
				>();
				const queue: {
					node: string;
					path: { from: string; to: string; type: string }[];
				}[] = (adj.get(source) ?? []).map((target) => ({
					node: target,
					path: [{ from: source, to: target, type: relType }],
				}));

				while (queue.length > 0) {
					const item = queue.shift();
					if (!item) break;
					const { node: current, path } = item;

					// Skip if already visited (keep first/shortest path)
					if (visited.has(current)) continue;
					visited.set(current, path);

					// Explore neighbours
					const neighbours = adj.get(current) ?? [];
					for (const neighbour of neighbours) {
						if (!visited.has(neighbour)) {
							queue.push({
								node: neighbour,
								path: [
									...path,
									{ from: current, to: neighbour, type: relType },
								],
							});
						}
					}
				}

				// Add derived relationships from transitive closure
				for (const [target, path] of visited) {
					// Only add if there's no direct relationship (path length > 1 means transitive)
					if (path.length > 1) {
						addDerived(source, target, derivedType, path, "transitive");
					}
				}
			}
		}

		// 2. Inverse relationships
		for (const [relType, inverseType] of Object.entries(
			INVERSE_RELATIONSHIPS,
		)) {
			const rels = (input.doc.relationships ?? []).filter(
				(r) => r.type === relType,
			);

			for (const r of rels) {
				addDerived(
					r.to,
					r.from,
					inverseType,
					[{ from: r.from, to: r.to, type: r.type }],
					"inverse",
				);
			}
		}

		// 3. Composite patterns (A affects B, B depends_on C => A potentially_affects C)
		const affectsRels = (input.doc.relationships ?? []).filter(
			(r) => r.type === "affects",
		);
		const dependsRels = (input.doc.relationships ?? []).filter(
			(r) => r.type === "depends_on",
		);

		const dependsMap = new Map<string, string[]>();
		for (const r of dependsRels) {
			const deps = dependsMap.get(r.from) ?? [];
			deps.push(r.to);
			dependsMap.set(r.from, deps);
		}

		for (const affect of affectsRels) {
			const deps = dependsMap.get(affect.to) ?? [];
			for (const dep of deps) {
				addDerived(
					affect.from,
					dep,
					"potentially_affects",
					[
						{ from: affect.from, to: affect.to, type: "affects" },
						{ from: affect.to, to: dep, type: "depends_on" },
					],
					"composite",
				);
			}
		}

		const summary = {
			transitive: derived.filter((d) => d.derivationType === "transitive")
				.length,
			composite: derived.filter((d) => d.derivationType === "composite").length,
			inverse: derived.filter((d) => d.derivationType === "inverse").length,
			total: derived.length,
		};

		return { derivedRelationships: derived, summary };
	},
});
