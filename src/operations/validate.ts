import * as z from "zod";
import { defineOperation } from "./define-operation.js";
import { SysProMDocument } from "../schema.js";
import {
	isValidEndpointPair,
	RELATIONSHIP_ENDPOINT_TYPES,
} from "../endpoint-types.js";

/** Zod schema for the result of validating a SysProM document. */
export const ValidationResult = z.object({
	valid: z.boolean(),
	issues: z.array(z.string()),
	nodeCount: z.number(),
	relationshipCount: z.number(),
});

/** Result of document validation: validity flag, issues list, and counts. */
export type ValidationResult = z.infer<typeof ValidationResult>;

const DOMAIN_TYPES = new Set([
	"intent",
	"concept",
	"capability",
	"element",
	"invariant",
]);

/**
 * Validate a SysProM document for structural and semantic correctness.
 *
 * Checks for duplicate node IDs, dangling relationship endpoints, and
 * invariant violations (INV2: changes must reference decisions, INV3:
 * decisions affecting domain nodes must have must_preserve, INV13:
 * decisions must have options and selected).
 */
export const validateOp = defineOperation({
	name: "validate",
	description:
		"Validate a SysProM document for structural and semantic correctness",
	input: z.object({
		doc: SysProMDocument,
	}),
	output: ValidationResult,
	fn: (input) => {
		const issues: string[] = [];

		// Unique node IDs
		const ids = new Set<string>();
		for (const n of input.doc.nodes) {
			if (ids.has(n.id)) {
				issues.push(`Duplicate node ID: ${n.id}`);
			}
			ids.add(n.id);
		}

		// Relationship endpoint references
		for (const r of input.doc.relationships ?? []) {
			if (!ids.has(r.from)) {
				issues.push(`Relationship references unknown source: ${r.from}`);
			}
			if (!ids.has(r.to)) {
				issues.push(`Relationship references unknown target: ${r.to}`);
			}
		}

		// Duplicate relationships
		const relSet = new Set<string>();
		for (const r of input.doc.relationships ?? []) {
			const key = `${r.from}:${r.type}:${r.to}`;
			if (relSet.has(key)) {
				issues.push(`Duplicate relationship: ${r.from} --${r.type}--> ${r.to}`);
			}
			relSet.add(key);
		}

		// Endpoint type validation
		const nodeMap = new Map(input.doc.nodes.map((n) => [n.id, n]));
		for (const r of input.doc.relationships ?? []) {
			const fromNode = nodeMap.get(r.from);
			const toNode = nodeMap.get(r.to);
			if (
				fromNode &&
				toNode &&
				!isValidEndpointPair(r.type, fromNode.type, toNode.type)
			) {
				const endpoints = RELATIONSHIP_ENDPOINT_TYPES[r.type];
				issues.push(
					`Invalid endpoint types for ${r.type}: ${fromNode.type} → ${toNode.type} (${r.from} → ${r.to}). Valid: [${endpoints.from.join(", ")}] → [${endpoints.to.join(", ")}]`,
				);
			}
		}

		// Operational relationships to retired nodes
		const OPERATIONAL_REL_TYPES = new Set([
			"depends_on",
			"constrained_by",
			"requires",
			"affects",
			"must_preserve",
			"performs",
			"must_follow",
			"part_of",
			"governed_by",
			"modifies",
			"applies_to",
			"produces",
			"consumes",
		]);
		for (const r of input.doc.relationships ?? []) {
			const toNode = nodeMap.get(r.to);
			if (toNode?.status === "retired" && OPERATIONAL_REL_TYPES.has(r.type)) {
				issues.push(
					`Operational relationship ${r.type} targets retired node ${r.to}`,
				);
			}
		}

		// INV2: Changes must reference at least one decision
		const decisionIds = new Set(
			input.doc.nodes.filter((n) => n.type === "decision").map((n) => n.id),
		);
		for (const n of input.doc.nodes.filter((n) => n.type === "change")) {
			const targets = (input.doc.relationships ?? [])
				.filter((r) => r.from === n.id)
				.map((r) => r.to);
			const linksToDecision = targets.some((t) => decisionIds.has(t));
			if (!linksToDecision) {
				issues.push(
					`${n.id} (${n.name}): change does not reference any decision`,
				);
			}
		}

		// INV3: Decisions affecting domain nodes must have must_preserve
		const nodeTypes = new Map(input.doc.nodes.map((n) => [n.id, n.type]));
		for (const n of input.doc.nodes.filter((n) => n.type === "decision")) {
			const affects = (input.doc.relationships ?? []).filter(
				(r) => r.from === n.id && r.type === "affects",
			);
			const affectsDomain = affects.some((r) =>
				DOMAIN_TYPES.has(nodeTypes.get(r.to) ?? ""),
			);
			if (!affectsDomain) continue;

			const preserves = (input.doc.relationships ?? []).filter(
				(r) => r.from === n.id && r.type === "must_preserve",
			);
			if (preserves.length === 0) {
				issues.push(
					`${n.id} (${n.name}): affects domain nodes but has no must_preserve relationship`,
				);
			}
		}

		// INV13: Decisions must have options and selected
		for (const n of input.doc.nodes.filter((n) => n.type === "decision")) {
			if (!n.options || n.options.length === 0) {
				issues.push(`${n.id} (${n.name}): decision has no options`);
			}
			if (!n.selected) {
				issues.push(`${n.id} (${n.name}): decision has no selected option`);
			}
		}

		return {
			valid: issues.length === 0,
			issues,
			nodeCount: input.doc.nodes.length,
			relationshipCount: (input.doc.relationships ?? []).length,
		};
	},
});
