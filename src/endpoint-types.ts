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
		from: ["capability", "element", "realisation", "artefact", "mode"],
		to: ["capability", "element", "realisation", "concept", "stage"],
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
			"milestone",
			"artefact",
			"decision",
			"change",
			"view",
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
			"role",
		],
		to: ["invariant", "principle", "policy", "protocol", "concept"],
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
		],
		to: [
			"intent",
			"concept",
			"capability",
			"element",
			"realisation",
			"decision",
			"change",
		],
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
			"protocol",
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
			"artefact",
			"role",
		],
		to: ["policy", "protocol", "role", "principle", "invariant", "concept"],
	},

	// Modifies — mutation and change
	modifies: {
		from: ["change", "stage"],
		to: [
			"intent",
			"concept",
			"capability",
			"element",
			"realisation",
			"artefact",
		],
	},

	// Produces — generation
	produces: {
		from: ["stage", "realisation", "concept", "capability"],
		to: ["artefact", "concept"],
	},
};

const VIEW_READ_MODEL_DEPENDENCY_TARGETS: NodeType[] = [
	"concept",
	"capability",
	"element",
	"stage",
	"artefact",
	"role",
];

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
	if (relType === "depends_on" && fromType === "view") {
		return VIEW_READ_MODEL_DEPENDENCY_TARGETS.includes(toType);
	}
	const endpoints = RELATIONSHIP_ENDPOINT_TYPES[relType];
	return endpoints.from.includes(fromType) && endpoints.to.includes(toType);
}

/**
 * True when a relationship is a read-model view dependency.
 */
export function isViewReadModelDependsOnRelationship(
	relType: RelationshipType,
	fromType: NodeType,
	toType: NodeType,
): boolean {
	return (
		relType === "depends_on" &&
		fromType === "view" &&
		VIEW_READ_MODEL_DEPENDENCY_TARGETS.includes(toType)
	);
}
