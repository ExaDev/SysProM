import * as z from "zod";
import { defineOperation } from "./define-operation.js";
import { SysProMDocument } from "../schema.js";
import {
	isValidEndpointPair,
	isViewReadModelDependsOnRelationship,
	RELATIONSHIP_ENDPOINT_TYPES,
} from "../endpoint-types.js";
import { hasLifecycleState } from "../lifecycle-state.js";

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
			"affects",
			"must_preserve",
			"must_follow",
			"part_of",
			"governed_by",
			"modifies",
			"produces",
		]);
		for (const r of input.doc.relationships ?? []) {
			const fromNode = nodeMap.get(r.from);
			const toNode = nodeMap.get(r.to);
			if (
				fromNode &&
				toNode &&
				hasLifecycleState(toNode, "retired") &&
				OPERATIONAL_REL_TYPES.has(r.type) &&
				!isViewReadModelDependsOnRelationship(
					r.type,
					fromNode.type,
					toNode.type,
				)
			) {
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

		// INV13: Decisions must have options and selected (if decided)
		for (const n of input.doc.nodes.filter((n) => n.type === "decision")) {
			if (!n.options || n.options.length === 0) {
				issues.push(`${n.id} (${n.name}): decision has no options`);
			}
			// Only require selected option if the decision is in a "decided" state
			// Decided states: accepted, implemented, adopted
			// Undecided states allowed: proposed, experimental, deferred
			const isDecided =
				hasLifecycleState(n, "accepted") ||
				hasLifecycleState(n, "implemented") ||
				hasLifecycleState(n, "adopted");
			if (isDecided && !n.selected) {
				issues.push(`${n.id} (${n.name}): decision has no selected option`);
			}
		}

		const isLifecycleReached = (value: boolean | string | undefined): boolean =>
			value === true || typeof value === "string";
		const isGateReady = (
			node: z.infer<typeof SysProMDocument>["nodes"][number],
		): boolean => {
			if (node.type !== "gate") return false;
			const lifecycle = node.lifecycle ?? {};
			const values = Object.values(lifecycle);
			if (values.length === 0) return false;
			return values.every((value) => isLifecycleReached(value));
		};

		const globalNodeMap = new Map(
			input.doc.nodes.map((node) => [node.id, node]),
		);

		const validatePlanSubsystem = (
			subsystem: z.infer<typeof SysProMDocument> | undefined,
			protocolId: string,
		) => {
			if (!subsystem) return;

			const localNodeMap = new Map(
				subsystem.nodes.map((node) => [node.id, node]),
			);
			for (const node of subsystem.nodes) {
				if (node.type !== "change") {
					issues.push(
						`${protocolId}: implementation plan contains non-change node ${node.id} (${node.type})`,
					);
					continue;
				}

				if (hasLifecycleState(node, "complete")) {
					const blockers: string[] = [];
					for (const rel of subsystem.relationships ?? []) {
						if (rel.from !== node.id || rel.type !== "depends_on") continue;
						const dependency =
							localNodeMap.get(rel.to) ?? globalNodeMap.get(rel.to);
						if (dependency?.type !== "change") {
							blockers.push(`dependency ${rel.to} is not a change task`);
							continue;
						}
						if (!hasLifecycleState(dependency, "complete")) {
							blockers.push(`dependency ${rel.to} is not complete`);
						}
					}

					for (const rel of subsystem.relationships ?? []) {
						if (rel.from !== node.id || rel.type !== "constrained_by") continue;
						const gate = localNodeMap.get(rel.to) ?? globalNodeMap.get(rel.to);
						if (!gate || !isGateReady(gate)) {
							blockers.push(`gate ${rel.to} is not ready`);
						}
					}

					if (blockers.length > 0) {
						issues.push(
							`${node.id} (${node.name}): complete task has unresolved blockers (${blockers.join(", ")})`,
						);
					}
				}

				if (node.subsystem) {
					validatePlanSubsystem(node.subsystem, protocolId);
				}
			}

			for (const rel of subsystem.relationships ?? []) {
				if (rel.type !== "depends_on") continue;
				const fromNode = localNodeMap.get(rel.from);
				const toNode = localNodeMap.get(rel.to);
				if (!fromNode || !toNode) {
					issues.push(
						`${protocolId}: depends_on relationship ${rel.from} -> ${rel.to} must stay within the same plan scope`,
					);
					continue;
				}
				if (fromNode.type !== "change" || toNode.type !== "change") {
					issues.push(
						`${protocolId}: depends_on scheduling relationship must connect change task nodes (${rel.from} -> ${rel.to})`,
					);
				}
			}
		};

		for (const node of input.doc.nodes) {
			if (node.type !== "protocol") continue;
			if (!node.id.endsWith("-PROT-IMPL")) continue;
			validatePlanSubsystem(node.subsystem, node.id);
		}

		return {
			valid: issues.length === 0,
			issues,
			nodeCount: input.doc.nodes.length,
			relationshipCount: (input.doc.relationships ?? []).length,
		};
	},
});
