import { NodeType, RelationshipType } from "./schema.js";

/**
 * Defines which node types are valid for the source and target endpoints
 * of each relationship type. Used for semantic validation of graph mutations.
 */
export const RELATIONSHIP_ENDPOINT_TYPES: Record<
	RelationshipType,
	{ from: NodeType[]; to: NodeType[] }
> = {
	// Abstraction layer relationships — work within and across domain layers
	refines: {
		from: ["intent", "concept", "capability", "element", "realisation"],
		to: ["intent", "concept", "capability", "element", "realisation"],
	},
	realises: {
		from: ["capability", "element", "realisation"],
		to: ["capability", "element", "realisation"],
	},
	implements: {
		from: ["element", "realisation"],
		to: ["capability", "element", "realisation"],
	},

	// Dependency relationships
	depends_on: {
		from: [
			"intent",
			"concept",
			"capability",
			"element",
			"realisation",
			"stage",
			"role",
			"artefact",
			"decision",
			"change",
		],
		to: [
			"intent",
			"concept",
			"capability",
			"element",
			"realisation",
			"stage",
			"role",
			"artefact",
			"decision",
		],
	},
	constrained_by: {
		from: [
			"intent",
			"concept",
			"capability",
			"element",
			"realisation",
			"decision",
			"change",
		],
		to: ["invariant", "principle", "policy", "protocol"],
	},
	requires: {
		from: [
			"intent",
			"concept",
			"capability",
			"element",
			"realisation",
			"stage",
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

	// Impact relationships
	affects: {
		from: ["decision", "change"],
		to: [
			"intent",
			"concept",
			"capability",
			"element",
			"realisation",
			"invariant",
		],
	},
	must_preserve: {
		from: ["decision"],
		to: ["invariant", "principle", "policy"],
	},

	// Evolution relationships
	supersedes: {
		from: [
			"intent",
			"concept",
			"capability",
			"element",
			"realisation",
			"decision",
			"version",
		],
		to: [
			"intent",
			"concept",
			"capability",
			"element",
			"realisation",
			"decision",
			"version",
		],
	},

	// Process relationships
	performs: {
		from: ["stage", "role"],
		to: ["capability", "artefact", "artefact_flow"],
	},
	precedes: {
		from: ["stage", "gate", "milestone"],
		to: ["stage", "gate", "milestone"],
	},
	must_follow: {
		from: ["stage", "gate"],
		to: ["stage", "gate"],
	},

	// Structural relationships
	part_of: {
		from: [
			"intent",
			"concept",
			"capability",
			"element",
			"realisation",
			"artefact",
			"stage",
		],
		to: [
			"intent",
			"concept",
			"capability",
			"element",
			"realisation",
			"artefact",
			"stage",
		],
	},
	blocks: {
		from: ["invariant", "policy", "decision"],
		to: ["decision", "change"],
	},
	routes_to: {
		from: ["artefact_flow"],
		to: ["artefact_flow", "stage"],
	},
	governed_by: {
		from: [
			"intent",
			"concept",
			"capability",
			"element",
			"realisation",
			"stage",
			"change",
		],
		to: ["policy", "protocol", "role"],
	},

	// Transformation relationships
	modifies: {
		from: ["change", "artefact_flow"],
		to: [
			"intent",
			"concept",
			"capability",
			"element",
			"realisation",
			"artefact",
		],
	},
	transforms_into: {
		from: ["artefact"],
		to: ["artefact"],
	},

	// Triggering relationships
	triggered_by: {
		from: ["stage", "gate", "artefact_flow"],
		to: ["decision", "artefact", "gate"],
	},
	disables: {
		from: ["decision", "change"],
		to: ["capability", "realisation"],
	},

	// Applicability relationships
	applies_to: {
		from: ["policy", "principle", "mode"],
		to: [
			"intent",
			"concept",
			"capability",
			"element",
			"realisation",
			"stage",
			"decision",
		],
	},

	// Data flow relationships
	produces: {
		from: ["stage", "artefact_flow", "realisation"],
		to: ["artefact"],
	},
	consumes: {
		from: ["stage", "artefact_flow", "realisation"],
		to: ["artefact"],
	},

	// Selection relationships
	selects: {
		from: ["decision", "mode"],
		to: ["capability", "stage"],
	},
};

/**
 * Check if a relationship type is valid for the given endpoint node types.
 * @param relType The relationship type
 * @param fromType The source node type
 * @param toType The target node type
 * @returns true if the endpoint types are valid for this relationship
 */
export function isValidEndpointPair(
	relType: RelationshipType,
	fromType: NodeType,
	toType: NodeType,
): boolean {
	const endpoints = RELATIONSHIP_ENDPOINT_TYPES[relType];
	if (!endpoints) {
		// Unknown relationship type — should be caught by schema validation
		return false;
	}
	return (
		endpoints.from.includes(fromType) && endpoints.to.includes(toType)
	);
}
