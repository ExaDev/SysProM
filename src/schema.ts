import * as z from "zod";

// ---------------------------------------------------------------------------
// defineSchema — attaches a .is() type guard to any Zod schema
// ---------------------------------------------------------------------------

function defineSchema<T extends z.ZodType>(schema: T) {
	return Object.assign(schema, {
		is(value: unknown): value is z.infer<T> {
			return schema.safeParse(value).success;
		},
	});
}

// ---------------------------------------------------------------------------
// Text type — allows a string or an array of lines
// ---------------------------------------------------------------------------

export const Text = defineSchema(z.union([z.string(), z.array(z.string())]));

export type Text = z.infer<typeof Text>;

// ---------------------------------------------------------------------------
// Extensible string types
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Labelled enum helper — define labels once, derive everything else
// ---------------------------------------------------------------------------

function typedKeys<const T extends Record<string, string>>(
	obj: T,
): [keyof T & string, ...(keyof T & string)[]] {
	const keys: (keyof T & string)[] = [];
	for (const key in obj) {
		if (Object.prototype.hasOwnProperty.call(obj, key)) {
			keys.push(key);
		}
	}
	if (keys.length === 0)
		throw new Error("labelledEnum requires at least one entry");
	return [keys[0], ...keys.slice(1)];
}

function invertRecord<const T extends Record<string, string>>(
	record: T,
): Record<string, keyof T & string> {
	const result: Record<string, keyof T & string> = {};
	for (const key in record) {
		if (Object.prototype.hasOwnProperty.call(record, key)) {
			result[record[key]] = key;
		}
	}
	return result;
}

function labelledEnum<const T extends Record<string, string>>(labels: T) {
	const keys = typedKeys(labels);
	const schema = defineSchema(z.enum(keys));
	const reverse = invertRecord(labels);
	return { schema, labels, reverse, keys };
}

// ---------------------------------------------------------------------------
// Node types
// ---------------------------------------------------------------------------

const nodeTypeDef = labelledEnum({
	intent: "Intent",
	concept: "Concepts",
	capability: "Capabilities",
	element: "Elements",
	realisation: "Realisations",
	invariant: "Invariants",
	principle: "Principles",
	policy: "Policies",
	protocol: "Protocols",
	stage: "Stages",
	role: "Roles",
	gate: "Gates",
	mode: "Modes",
	artefact: "Artefacts",
	artefact_flow: "Artefact Flows",
	decision: "Decisions",
	change: "Changes",
	view: "Views",
	milestone: "Milestones",
	version: "Versions",
});

export const NodeType = nodeTypeDef.schema;
export type NodeType = z.infer<typeof NodeType>;
export const NODE_TYPE_LABELS = nodeTypeDef.labels;
export const NODE_LABEL_TO_TYPE = nodeTypeDef.reverse;

// ---------------------------------------------------------------------------
// Node statuses
// ---------------------------------------------------------------------------

export const NODE_STATUSES = [
	"proposed",
	"accepted",
	"active",
	"implemented",
	"adopted",
	"defined",
	"introduced",
	"in_progress",
	"complete",
	"consolidated",
	"experimental",
	"deprecated",
	"retired",
	"superseded",
	"abandoned",
	"deferred",
] as const;

export const NodeStatus = defineSchema(z.enum(NODE_STATUSES));
export type NodeStatus = z.infer<typeof NodeStatus>;

// ---------------------------------------------------------------------------
// Relationship types
// ---------------------------------------------------------------------------

const relationshipTypeDef = labelledEnum({
	refines: "Refines",
	realises: "Realises",
	implements: "Implements",
	depends_on: "Depends on",
	constrained_by: "Constrained by",
	affects: "Affects",
	supersedes: "Supersedes",
	must_preserve: "Must preserve",
	performs: "Performs",
	part_of: "Part of",
	precedes: "Precedes",
	must_follow: "Must follow",
	blocks: "Blocks",
	routes_to: "Routes to",
	governed_by: "Governed by",
	modifies: "Modifies",
	triggered_by: "Triggered by",
	applies_to: "Applies to",
	produces: "Produces",
	consumes: "Consumes",
	transforms_into: "Transforms into",
	selects: "Selects",
	requires: "Requires",
	disables: "Disables",
});

export const RelationshipType = relationshipTypeDef.schema;
export type RelationshipType = z.infer<typeof RelationshipType>;
export const RELATIONSHIP_TYPE_LABELS = relationshipTypeDef.labels;
export const RELATIONSHIP_LABEL_TO_TYPE = relationshipTypeDef.reverse;

// ---------------------------------------------------------------------------
// External reference roles
// ---------------------------------------------------------------------------

const externalReferenceRoleDef = labelledEnum({
	input: "Input",
	output: "Output",
	context: "Context",
	evidence: "Evidence",
	source: "Source",
	standard: "Standard",
	prior_art: "Prior art",
});

export const ExternalReferenceRole = externalReferenceRoleDef.schema;
export type ExternalReferenceRole = z.infer<typeof ExternalReferenceRole>;
export const EXTERNAL_REFERENCE_ROLE_LABELS = externalReferenceRoleDef.labels;
export const EXTERNAL_REFERENCE_LABEL_TO_ROLE =
	externalReferenceRoleDef.reverse;

// ---------------------------------------------------------------------------
// Leaf schemas
// ---------------------------------------------------------------------------

export const Option = defineSchema(
	z
		.looseObject({
			id: z.string(),
			description: Text,
		})
		.describe("An alternative considered as part of a decision."),
);
export type Option = z.infer<typeof Option>;

export const Operation = defineSchema(
	z
		.looseObject({
			type: z.enum(["add", "update", "remove", "link"]),
			target: z.string().describe("ID of the affected node.").optional(),
			description: Text.optional(),
		})
		.describe("An atomic operation within a change."),
);
export type Operation = z.infer<typeof Operation>;

export const Task = defineSchema(
	z
		.looseObject({
			description: Text,
			done: z.boolean().default(false).optional(),
		})
		.describe("A single task within a change's execution plan."),
);
export type Task = z.infer<typeof Task>;

export const ExternalReference = defineSchema(
	z
		.object({
			role: ExternalReferenceRole,
			identifier: z
				.string()
				.describe(
					"Serialisation-specific identifier (URI, file path, DOI, etc.).",
				),
			description: Text.optional(),
			node_id: z
				.string()
				.describe(
					"ID of the node this reference belongs to. Used when the reference is declared at graph level rather than inline on the node.",
				)
				.optional(),
			internalised: Text.describe(
				"Inline content captured from the external resource. When present, the node is self-contained and does not depend on the external identifier being resolvable.",
			).optional(),
		})
		.describe("A reference to a resource outside the SysProM graph."),
);
export type ExternalReference = z.infer<typeof ExternalReference>;

export const Metadata = defineSchema(
	z
		.looseObject({
			title: z.string().optional(),
			doc_type: z
				.string()
				.describe(
					"Document type. Use 'sysprom' for the root entry point. Subsystems and features may use other values.",
				)
				.optional(),
			scope: z
				.string()
				.describe(
					"The scope of this document (e.g. system, feature, component).",
				)
				.optional(),
			status: z.string().optional(),
			version: z.union([z.string(), z.int()]).optional(),
		})
		.describe(
			"Document-level metadata. Analogous to front matter in Markdown.",
		),
);
export type Metadata = z.infer<typeof Metadata>;

export const Relationship = defineSchema(
	z
		.looseObject({
			from: z.string().describe("Source node ID."),
			to: z.string().describe("Target node ID."),
			type: RelationshipType,
			description: Text.optional(),
		})
		.describe("A typed, directed connection between two nodes."),
);
export type Relationship = z.infer<typeof Relationship>;

// ---------------------------------------------------------------------------
// Recursive schemas — defined raw, then wrapped with defineSchema after both
// exist so TypeScript can resolve the circular type inference.
// ---------------------------------------------------------------------------

const SysProMDocumentSchema = z
	.object({
		$schema: z
			.string()
			.describe("Schema URI for self-identification.")
			.optional(),
		metadata: Metadata.optional(),
		get nodes(): z.ZodArray<typeof NodeSchema> {
			return z.array(NodeSchema).describe("All nodes in the graph.");
		},
		relationships: z
			.array(Relationship)
			.describe("Typed, directed connections between nodes.")
			.optional(),
		external_references: z
			.array(ExternalReference)
			.describe(
				"References to resources outside the graph, declared at system level.",
			)
			.optional(),
	})
	.meta({
		id: "SysProM",
		title: "SysProM: System Provenance Model",
		description:
			"JSON Schema for SysProM — a recursive, decision-driven model for recording system provenance.",
	});

const NodeSchema = z
	.looseObject({
		id: z.string().describe("Unique identifier for this node."),
		type: NodeType,
		name: z.string().describe("Human-readable name."),
		description: Text.optional(),
		status: NodeStatus.optional(),
		lifecycle: z
			.record(z.string(), z.union([z.boolean(), z.string()]))
			.describe(
				"Map of lifecycle state names to completion status. Values may be boolean or an ISO date string indicating when the state was reached.",
			)
			.optional(),
		context: Text.describe(
			"Background context explaining why this node exists or why a decision was needed.",
		).optional(),
		options: z
			.array(Option)
			.describe("Alternatives considered. Applicable to decision nodes.")
			.optional(),
		selected: z
			.string()
			.describe("ID of the chosen option. Applicable to decision nodes.")
			.optional(),
		rationale: Text.describe(
			"Reasoning for the choice. Applicable to decision nodes.",
		).optional(),
		scope: z
			.array(z.string())
			.describe(
				"IDs of nodes affected by this change. Applicable to change nodes.",
			)
			.optional(),
		operations: z
			.array(Operation)
			.describe("Operations performed. Applicable to change nodes.")
			.optional(),
		plan: z
			.array(Task)
			.describe(
				"Execution plan as a sequence of tasks. Applicable to change nodes.",
			)
			.optional(),
		propagation: z
			.record(z.string(), z.boolean())
			.describe("Layer propagation status. Applicable to change nodes.")
			.optional(),
		includes: z
			.array(z.string())
			.describe(
				"IDs of nodes included in this projection. Applicable to view nodes.",
			)
			.optional(),
		input: z
			.string()
			.describe("ID of the input artefact. Applicable to artefact_flow nodes.")
			.optional(),
		output: z
			.string()
			.describe("ID of the output artefact. Applicable to artefact_flow nodes.")
			.optional(),
		external_references: z
			.array(ExternalReference)
			.describe("External resources related to this node.")
			.optional(),
		get subsystem(): z.ZodOptional<typeof SysProMDocumentSchema> {
			return SysProMDocumentSchema.optional();
		},
	})
	.describe("A uniquely identifiable entity within the system.");

// Attach .is() type guards after both schemas are declared
export const SysProMDocument = defineSchema(SysProMDocumentSchema);
export type SysProMDocument = z.infer<typeof SysProMDocument>;

export const Node = defineSchema(NodeSchema);
export type Node = z.infer<typeof Node>;

// ---------------------------------------------------------------------------
// Domain constants
// ---------------------------------------------------------------------------

/** Which node types belong in which document file. */
export const NODE_FILE_MAP: Record<string, string[]> = {
	INTENT: ["intent", "concept", "capability"],
	INVARIANTS: ["invariant", "principle", "policy"],
	STATE: [
		"element",
		"realisation",
		"protocol",
		"stage",
		"role",
		"gate",
		"mode",
		"artefact",
		"artefact_flow",
	],
	DECISIONS: ["decision"],
	CHANGES: ["change"],
};

/** Conventional ID prefix for each node type. */
export const NODE_ID_PREFIX: Record<string, string> = {
	intent: "I",
	concept: "CN",
	capability: "CP",
	element: "EL",
	realisation: "R",
	invariant: "INV",
	principle: "PR",
	policy: "POL",
	protocol: "PROT",
	stage: "STG",
	role: "ROLE",
	gate: "GATE",
	mode: "MODE",
	artefact: "ART",
	artefact_flow: "AF",
	decision: "D",
	change: "CH",
	view: "V",
	milestone: "MS",
	version: "VER",
};

// ---------------------------------------------------------------------------
// Generate JSON Schema
// ---------------------------------------------------------------------------

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Generate the JSON Schema representation of the SysProM document schema. */
export function toJSONSchema(): Record<string, unknown> {
	const generated = z.toJSONSchema(SysProMDocument, {
		target: "draft-2020-12",
	});

	if (!isRecord(generated)) {
		throw new Error("toJSONSchema did not return an object");
	}

	return {
		$schema: "https://json-schema.org/draft/2020-12/schema",
		$id: "https://sysprom.org/schema.json",
		...generated,
	};
}
