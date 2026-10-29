import * as z from "zod";
import { defineSchema } from "./utils/define-schema.js";

// ---------------------------------------------------------------------------
// Text type — allows a string or an array of lines
// ---------------------------------------------------------------------------

/**
 * Zod schema for flexible text content — accepts either a single string or an
 * array of lines. Includes a `.is()` type guard for runtime checks.
 */
export const Text = defineSchema(z.union([z.string(), z.array(z.string())]));

/** A text value: either a single string or an array of lines. */
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
	decision: "Decisions",
	change: "Changes",
	view: "Views",
	milestone: "Milestones",
});

/** Zod schema for the set of valid node types (e.g. `"intent"`, `"decision"`, `"change"`). */
export const NodeType = nodeTypeDef.schema;

/** A valid node type string. */
export type NodeType = z.infer<typeof NodeType>;

/** Map from node type key to its human-readable label (e.g. `intent` → `"Intent"`). */
export const NODE_TYPE_LABELS = nodeTypeDef.labels;

/** Reverse map from human-readable label to node type key (e.g. `"Intent"` → `"intent"`). */
export const NODE_LABEL_TO_TYPE = nodeTypeDef.reverse;

// ---------------------------------------------------------------------------
// Node statuses
// ---------------------------------------------------------------------------

/** All valid node status values, ordered by typical lifecycle progression. */
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

/** Zod schema for the set of valid node statuses (e.g. `"proposed"`, `"active"`, `"deprecated"`). */
export const NodeStatus = defineSchema(z.enum(NODE_STATUSES));

/** A valid node status string. */
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
	part_of: "Part of",
	precedes: "Precedes",
	must_follow: "Must follow",
	governed_by: "Governed by",
	modifies: "Modifies",
	produces: "Produces",
});

/** Zod schema for the set of valid relationship types (e.g. `"refines"`, `"depends_on"`, `"affects"`). */
export const RelationshipType = relationshipTypeDef.schema;

/** A valid relationship type string. */
export type RelationshipType = z.infer<typeof RelationshipType>;

/** Map from relationship type key to its human-readable label (e.g. `refines` → `"Refines"`). */
export const RELATIONSHIP_TYPE_LABELS = relationshipTypeDef.labels;

/** Reverse map from human-readable label to relationship type key (e.g. `"Refines"` → `"refines"`). */
export const RELATIONSHIP_LABEL_TO_TYPE = relationshipTypeDef.reverse;

// ---------------------------------------------------------------------------
// Impact polarity — annotation on relationships for ArchiMate/SysML compatibility
// ---------------------------------------------------------------------------

const impactPolarityDef = labelledEnum({
	positive: "Positive",
	negative: "Negative",
	neutral: "Neutral",
	uncertain: "Uncertain",
});

/** Zod schema for impact polarity (e.g. `"positive"`, `"negative"`, `"neutral"`, `"uncertain"`). */
export const ImpactPolarity = impactPolarityDef.schema;

/** Impact polarity annotation on relationships — indicates the valence of the impact. */
export type ImpactPolarity = z.infer<typeof ImpactPolarity>;

/** Map from impact polarity key to human-readable label. */
export const IMPACT_POLARITY_LABELS = impactPolarityDef.labels;

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

/** Zod schema for external reference roles (e.g. `"input"`, `"output"`, `"evidence"`). */
export const ExternalReferenceRole = externalReferenceRoleDef.schema;

/** A valid external reference role string. */
export type ExternalReferenceRole = z.infer<typeof ExternalReferenceRole>;

/** Map from external reference role key to its human-readable label. */
export const EXTERNAL_REFERENCE_ROLE_LABELS = externalReferenceRoleDef.labels;

/** Reverse map from human-readable label to external reference role key. */
export const EXTERNAL_REFERENCE_LABEL_TO_ROLE =
	externalReferenceRoleDef.reverse;

// ---------------------------------------------------------------------------
// Leaf schemas
// ---------------------------------------------------------------------------

/** Zod schema for a decision option — an alternative considered during a decision. */
export const Option = defineSchema(
	z
		.looseObject({
			id: z.string(),
			description: Text,
		})
		.describe("An alternative considered as part of a decision."),
);
/** An alternative considered as part of a decision, with an ID and description. */
export type Option = z.infer<typeof Option>;

/** Zod schema for an atomic operation within a change (add, update, remove, or link). */
export const Operation = defineSchema(
	z
		.looseObject({
			type: z.enum(["add", "update", "remove", "link"]),
			target: z.string().describe("ID of the affected node.").optional(),
			description: Text.optional(),
		})
		.describe("An atomic operation within a change."),
);
/** An atomic operation within a change, targeting a specific node. */
export type Operation = z.infer<typeof Operation>;

/** Zod schema for an external reference — a link to a resource outside the SysProM graph. */
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
/** A reference to a resource outside the SysProM graph (URI, file path, DOI, etc.). */
export type ExternalReference = z.infer<typeof ExternalReference>;

/** Zod schema for document-level metadata (title, scope, status, version). */
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
/** Document-level metadata — title, scope, status, and version. */
export type Metadata = z.infer<typeof Metadata>;

/** Zod schema for a typed, directed relationship between two nodes. */
export const Relationship = defineSchema(
	z
		.looseObject({
			from: z.string().describe("Source node ID."),
			to: z.string().describe("Target node ID."),
			type: RelationshipType,
			description: Text.optional(),
			polarity: ImpactPolarity.optional().describe(
				"Impact polarity — positive, negative, neutral, or uncertain.",
			),
			strength: z
				.number()
				.min(0)
				.max(1)
				.optional()
				.describe("Relationship strength as a number between 0 and 1."),
		})
		.describe("A typed, directed connection between two nodes."),
);
/** A typed, directed connection between two nodes, with from/to IDs and a relationship type. */
export type Relationship = z.infer<typeof Relationship>;

// ---------------------------------------------------------------------------
// Recursive schemas — defined raw, then wrapped with defineSchema after both
// exist so TypeScript can resolve the circular type inference.
//
// `tsc` cannot serialise Zod's anonymous inferred recursive types into `.d.ts`
// (it emits `/*elided*/ any` for the recursive fields), so the public types
// `SysProMDocument` and `Node` are declared below as explicit named recursive
// `interface`s. The raw schema expressions (`_rawSysProMDocumentSchema`,
// `NodeBase`) are left UNANNOTATED so their true inferred output can be
// captured for a compile-time drift check against the interfaces; the
// recursive consts actually consumed (`SysProMDocumentSchema`, `NodeSchema`)
// are then annotated as `z.ZodType<NamedType>` so every downstream use (the
// `.is()` guard, `z.array(...)`, `.optional()`, `defineSchema(...)`) names the
// clean interface instead of the unserialisable anonymous recursive type.
// ---------------------------------------------------------------------------

/**
 * A complete SysProM document with metadata, nodes, relationships, and
 * external references.
 *
 * Strict object (from `z.object`): no string index signature.
 */
export interface SysProMDocument {
	$schema?: string;
	metadata?: Metadata;
	nodes: Node[];
	relationships?: Relationship[];
	external_references?: ExternalReference[];
}

/**
 * A uniquely identifiable entity within the SysProM graph.
 *
 * Loose object (from `z.looseObject`): carries a string index signature
 * `[x: string]: unknown`, mirroring Zod's inferred output for loose objects.
 */
export interface Node {
	[x: string]: unknown;
	id: string;
	type: NodeType;
	name: string;
	description?: Text;
	// `status?: never` mirrors `z.never().optional()`: the field may be absent
	// or `undefined`, never any other value. Using `never` (rather than the
	// redundant `?: undefined`, which the linter rejects) is bidirectionally
	// assignable to the schema's inferred output and keeps the drift check green.
	status?: never;
	lifecycle?: Record<string, boolean | string>;
	context?: Text;
	options?: Option[];
	selected?: string;
	rationale?: Text;
	scope?: string[];
	operations?: Operation[];
	propagation?: Record<string, boolean>;
	includes?: string[];
	external_references?: ExternalReference[];
	subsystem?: SysProMDocument;
}

// Raw, unannotated schema expressions. Their inferred types are the ground
// truth for the drift checks below — do NOT annotate these or the check
// becomes tautological. `NodeBase` is exported because `update-node.ts` calls
// `.partial()` on it; it remains the unannotated raw loose object so the drift
// check sees the schema's true inferred output.
const _rawSysProMDocumentSchema = z.object({
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
});

/** Base node object schema without ID-prefix refinement. Supports .partial(). */
export const NodeBase = z
	.looseObject({
		id: z.string().describe("Unique identifier for this node."),
		type: NodeType,
		name: z.string().describe("Human-readable name."),
		description: Text.optional(),
		status: z
			.never()
			.optional()
			.describe(
				"Deprecated field. Node-level status is not supported; use lifecycle states instead.",
			),
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
		external_references: z
			.array(ExternalReference)
			.describe("External resources related to this node.")
			.optional(),
		get subsystem(): z.ZodOptional<typeof SysProMDocumentSchema> {
			return SysProMDocumentSchema.optional();
		},
	})
	.describe("A uniquely identifiable entity within the system.");

// Compile-time drift check: the named interfaces must be bidirectionally
// assignable to the schemas' true inferred output. `satisfies` evaluates the
// conditional type: when the assignability holds it resolves to `null` (and
// `null satisfies null` passes); on any divergence it resolves to `never` (and
// `null satisfies never` errors, failing the build). Forward checks
// (interface <: output) catch missing required fields; backward checks
// (output <: interface) catch extra required fields or narrower optionality.
// Not re-exported from index.ts, so it stays out of the public API surface.
type RawDocOutput = z.infer<typeof _rawSysProMDocumentSchema>;
type RawNodeOutput = z.infer<typeof NodeBase>;
export const _schemaDriftChecks = {
	docForward: null satisfies SysProMDocument extends RawDocOutput
		? null
		: never,
	docBackward: null satisfies RawDocOutput extends SysProMDocument
		? null
		: never,
	nodeForward: null satisfies Node extends RawNodeOutput ? null : never,
	nodeBackward: null satisfies RawNodeOutput extends Node ? null : never,
};

// Public recursive schema consts, annotated so `z.infer` and the `.is()` guard
// resolve to the named interfaces. `.meta`/`.describe`/`.superRefine` are all
// available on `z.ZodType`.
const SysProMDocumentSchema: z.ZodType<SysProMDocument> =
	_rawSysProMDocumentSchema.meta({
		id: "SysProM",
		title: "SysProM: System Provenance Model",
		description:
			"JSON Schema for SysProM — a recursive, decision-driven model for recording system provenance.",
	});

const NodeSchema: z.ZodType<Node> = NodeBase.superRefine((node, ctx) => {
	const prefix = NODE_ID_PREFIX[node.type];
	if (!prefix) return; // Unknown type — skip validation
	const pattern = new RegExp(`^${prefix}\\d+(-[A-Z][A-Z0-9_]*)*$`);
	if (!pattern.test(node.id)) {
		ctx.addIssue({
			code: "custom",
			path: ["id"],
			message: `Node ID "${node.id}" does not match required pattern for type "${node.type}": expected ${prefix}<number> with optional -SUFFIX segments (e.g. ${prefix}1, ${prefix}1-MY-LABEL)`,
		});
	}
});

// Attach .is() type guards after both schemas are declared

/**
 * Zod schema for a complete SysProM document — the root container holding
 * nodes, relationships, external references, and metadata. Includes a `.is()`
 * type guard for runtime validation.
 */
export const SysProMDocument = defineSchema(SysProMDocumentSchema);

/**
 * Zod schema for a single node in the SysProM graph. Nodes are typed entities
 * with optional lifecycle, decisions, operations, and recursive subsystems.
 * Includes a `.is()` type guard for runtime validation.
 */
export const Node = defineSchema(NodeSchema);

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
	],
	DECISIONS: ["decision"],
	CHANGES: ["change"],
};

/** Conventional ID prefix for each node type. */
export const NODE_ID_PREFIX: Record<string, string> = {
	intent: "INT",
	concept: "CON",
	capability: "CAP",
	element: "ELEM",
	realisation: "REAL",
	invariant: "INV",
	principle: "PRIN",
	policy: "POL",
	protocol: "PROT",
	stage: "STG",
	role: "ROLE",
	gate: "GATE",
	mode: "MODE",
	artefact: "ART",
	decision: "DEC",
	change: "CHG",
	view: "VIEW",
	milestone: "MILE",
};

// ---------------------------------------------------------------------------
// Generate JSON Schema
// ---------------------------------------------------------------------------

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Generate the JSON Schema representation of the SysProM document schema.
 * @returns The JSON Schema object with Draft 2020-12 metadata.
 * @example
 * ```ts
 * const schema = toJSONSchema();
 * writeFileSync("schema.json", JSON.stringify(schema, null, 2));
 * ```
 */
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
