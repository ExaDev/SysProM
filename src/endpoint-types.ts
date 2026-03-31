import { NodeType, RelationshipType } from "./schema.js";

/**
 * Defines which node types are valid for the source and target endpoints
 * of each relationship type. Used for semantic validation of graph mutations.
 *
 * Note: Permissive by design to allow diverse relationship patterns while
 * catching obvious semantic errors. The model is flexible across abstraction layers.
 */
export const RELATIONSHIP_ENDPOINT_TYPES: Record<
	RelationshipType,
	{ from: NodeType[]; to: NodeType[] }
> = {
	// Refines — used across all node types, represents specification refinement
	refines: {
		from: [
			"intent",
			"concept",
			"capability",
			"element",
			"realisation",
			"principle",
			"policy",
		],
		to: [
			"intent",
			"concept",
			"capability",
			"element",
			"realisation",
			"principle",
			"policy",
		],
	},

	// Realises — implementation hierarchy
	realises: {
		from: ["capability", "element", "realisation"],
		to: ["capability", "element", "realisation"],
	},

	// Implements — operationalisation
	implements: {
		from: ["element", "realisation", "change", "stage"],
		to: ["capability", "element", "realisation", "decision", "change"],
	},

	// Depends on — broad dependency across all node types
	depends_on: {
		from: [
			"intent",
			"concept",
			"capability",
			"element",
			"realisation",
			"invariant",
			"principle",
			"policy",
			"protocol",
			"stage",
			"role",
			"gate",
			"mode",
			"artefact",
			"artefact_flow",
			"decision",
			"change",
		],
		to: [
			"intent",
			"concept",
			"capability",
			"element",
			"realisation",
			"invariant",
			"principle",
			"policy",
			"protocol",
			"stage",
			"role",
			"gate",
			"mode",
			"artefact",
			"artefact_flow",
			"decision",
			"change",
		],
	},

	// Constrained by — constraints and governance
	constrained_by: {
		from: [
			"intent",
			"concept",
			"capability",
			"element",
			"realisation",
			"decision",
			"change",
			"invariant",
		],
		to: ["invariant", "principle", "policy", "protocol", "concept"],
	},

	// Requires — explicit requirements
	requires: {
		from: [
			"intent",
			"concept",
			"capability",
			"element",
			"realisation",
			"stage",
			"change",
		],
		to: [
			"intent",
			"concept",
			"capability",
			"element",
			"realisation",
			"artefact",
		],
	},

	// Affects — broad impact relationships
	affects: {
		from: ["decision", "change", "artefact", "stage"],
		to: [
			"intent",
			"concept",
			"capability",
			"element",
			"realisation",
			"invariant",
			"principle",
			"policy",
			"protocol",
			"decision",
			"change",
			"artefact",
		],
	},

	// Must preserve — invariant protection
	must_preserve: {
		from: ["decision"],
		to: ["invariant", "principle", "policy", "concept"],
	},

	// Supersedes — replacement and obsolescence
	supersedes: {
		from: [
			"intent",
			"concept",
			"capability",
			"element",
			"realisation",
			"decision",
			"change",
			"version",
		],
		to: [
			"intent",
			"concept",
			"capability",
			"element",
			"realisation",
			"decision",
			"change",
			"version",
		],
	},

	// Performs — process enactment
	performs: {
		from: ["stage", "role"],
		to: ["capability", "artefact", "artefact_flow"],
	},

	// Precedes — temporal ordering
	precedes: {
		from: ["stage", "gate", "milestone"],
		to: ["stage", "gate", "milestone"],
	},

	// Must follow — strong sequential ordering
	must_follow: {
		from: ["stage", "gate"],
		to: ["stage", "gate"],
	},

	// Part of — structural decomposition
	part_of: {
		from: [
			"intent",
			"concept",
			"capability",
			"element",
			"realisation",
			"artefact",
			"stage",
			"policy",
			"principle",
			"role",
			"gate",
			"mode",
		],
		to: [
			"intent",
			"concept",
			"capability",
			"element",
			"realisation",
			"artefact",
			"stage",
			"policy",
			"principle",
			"protocol",
			"role",
			"gate",
			"mode",
		],
	},

	// Blocks — impediments and constraints
	blocks: {
		from: ["invariant", "policy", "decision", "principle"],
		to: ["decision", "change", "stage"],
	},

	// Routes to — data/process flow
	routes_to: {
		from: ["artefact_flow"],
		to: ["artefact_flow", "stage", "artefact"],
	},

	// Governed by — governance relationships
	governed_by: {
		from: [
			"intent",
			"concept",
			"capability",
			"element",
			"realisation",
			"stage",
			"gate",
			"change",
			"policy",
		],
		to: ["policy", "protocol", "role", "principle", "invariant", "concept"],
	},

	// Modifies — mutation and change
	modifies: {
		from: ["change", "artefact_flow", "stage"],
		to: [
			"intent",
			"concept",
			"capability",
			"element",
			"realisation",
			"artefact",
		],
	},

	// Transforms into — metamorphosis
	transforms_into: {
		from: ["artefact"],
		to: ["artefact"],
	},

	// Triggered by — causation
	triggered_by: {
		from: ["stage", "gate", "artefact_flow", "change"],
		to: ["decision", "artefact", "gate", "stage"],
	},

	// Disables — negation/reversal
	disables: {
		from: ["decision", "change"],
		to: ["capability", "realisation"],
	},

	// Applies to — applicability and scope
	applies_to: {
		from: ["policy", "principle", "mode", "protocol"],
		to: [
			"intent",
			"concept",
			"capability",
			"element",
			"realisation",
			"stage",
			"decision",
			"change",
		],
	},

	// Produces — generation
	produces: {
		from: ["stage", "artefact_flow", "realisation"],
		to: ["artefact"],
	},

	// Consumes — usage
	consumes: {
		from: ["stage", "artefact_flow", "realisation"],
		to: ["artefact"],
	},

	// Selects — choice and instantiation
	selects: {
		from: ["decision", "mode"],
		to: ["capability", "stage"],
	},

	// Influence — soft dependency between decisions and across nodes (CHG40)
	influence: {
		from: [
			"intent",
			"concept",
			"capability",
			"element",
			"realisation",
			"decision",
			"change",
			"stage",
		],
		to: [
			"intent",
			"concept",
			"capability",
			"element",
			"realisation",
			"decision",
			"change",
			"stage",
		],
	},

	// Justifies — design rationale grounding (principle/decision → invariant/decision/concept)
	justifies: {
		from: ["principle", "decision"],
		to: ["invariant", "decision", "principle", "concept"],
	},
};

/**
 * Check if a relationship type is valid for the given endpoint node types.
 * @param relType - The relationship type
 * @param fromType - The source node type
 * @param toType - The target node type
 * @returns true if the endpoint types are valid for this relationship
 * @example
 * ```ts
 * isValidEndpointPair("refines", "intent", "concept") // true
 * ```
 */
export function isValidEndpointPair(
	relType: RelationshipType,
	fromType: NodeType,
	toType: NodeType,
): boolean {
	const endpoints = RELATIONSHIP_ENDPOINT_TYPES[relType];
	return endpoints.from.includes(fromType) && endpoints.to.includes(toType);
}
