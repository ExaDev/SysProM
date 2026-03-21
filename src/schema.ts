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

export const text = defineSchema(z.union([z.string(), z.array(z.string())]));

/** A string or an array of lines. */
export type Text = string | string[];

// ---------------------------------------------------------------------------
// Extensible string types
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Labelled enum helper — define labels once, derive everything else
// ---------------------------------------------------------------------------

function labelledEnum<const T extends Record<string, string>>(labels: T) {
  type Key = keyof T & string;
  const keys = Object.keys(labels) as [Key, ...Key[]];
  const schema = defineSchema(z.enum(keys));
  const reverse = Object.fromEntries(
    Object.entries(labels).map(([k, v]) => [v, k]),
  ) as Record<string, Key>;
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

export const nodeType = nodeTypeDef.schema;
/** A node type identifier. */
export type NodeType =
  | "intent" | "concept" | "capability" | "element" | "realisation"
  | "invariant" | "principle" | "policy" | "protocol"
  | "stage" | "role" | "gate" | "mode"
  | "artefact" | "artefact_flow"
  | "decision" | "change" | "view"
  | "milestone" | "version";
export const NODE_TYPE_LABELS = nodeTypeDef.labels;
export const NODE_LABEL_TO_TYPE: Record<string, NodeType> = nodeTypeDef.reverse;

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

export const nodeStatus = defineSchema(z.enum(NODE_STATUSES));
/** A node lifecycle status. */
export type NodeStatus = (typeof NODE_STATUSES)[number];

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

export const relationshipType = relationshipTypeDef.schema;
/** A relationship type identifier. */
export type RelationshipType =
  | "refines" | "realises" | "implements" | "depends_on"
  | "constrained_by" | "affects" | "supersedes" | "must_preserve"
  | "performs" | "part_of" | "precedes" | "must_follow"
  | "blocks" | "routes_to" | "governed_by" | "modifies"
  | "triggered_by" | "applies_to" | "produces" | "consumes"
  | "transforms_into" | "selects" | "requires" | "disables";
export const RELATIONSHIP_TYPE_LABELS = relationshipTypeDef.labels;
export const RELATIONSHIP_LABEL_TO_TYPE: Record<string, RelationshipType> = relationshipTypeDef.reverse;

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

export const externalReferenceRole = externalReferenceRoleDef.schema;
/** An external reference role. */
export type ExternalReferenceRole =
  | "input" | "output" | "context" | "evidence"
  | "source" | "standard" | "prior_art";
export const EXTERNAL_REFERENCE_ROLE_LABELS = externalReferenceRoleDef.labels;
export const EXTERNAL_REFERENCE_LABEL_TO_ROLE: Record<string, ExternalReferenceRole> = externalReferenceRoleDef.reverse;

// ---------------------------------------------------------------------------
// Leaf schemas
// ---------------------------------------------------------------------------

export const option = defineSchema(
  z
    .looseObject({
      id: z.string(),
      description: text,
    })
    .describe("An alternative considered as part of a decision."),
);
/** An alternative considered as part of a decision. */
export interface Option {
  [key: string]: unknown;
  id: string;
  description: Text;
}

export const operation = defineSchema(
  z
    .looseObject({
      type: z.enum(["add", "update", "remove", "link"]),
      target: z.string().describe("ID of the affected node.").optional(),
      description: text.optional(),
    })
    .describe("An atomic operation within a change."),
);
/** An atomic operation within a change. */
export interface Operation {
  [key: string]: unknown;
  type: "add" | "update" | "remove" | "link";
  target?: string;
  description?: Text;
}

export const task = defineSchema(
  z
    .looseObject({
      description: text,
      done: z.boolean().default(false).optional(),
    })
    .describe("A single task within a change's execution plan."),
);
/** A single task within a change's execution plan. */
export interface Task {
  [key: string]: unknown;
  description: Text;
  done?: boolean;
}

export const externalReference = defineSchema(
  z
    .object({
      role: externalReferenceRole,
      identifier: z
        .string()
        .describe(
          "Serialisation-specific identifier (URI, file path, DOI, etc.).",
        ),
      description: text.optional(),
      node_id: z
        .string()
        .describe(
          "ID of the node this reference belongs to. Used when the reference is declared at graph level rather than inline on the node.",
        )
        .optional(),
      internalised: text
        .describe(
          "Inline content captured from the external resource. When present, the node is self-contained and does not depend on the external identifier being resolvable.",
        )
        .optional(),
    })
    .describe("A reference to a resource outside the SysProM graph."),
);
/** A reference to a resource outside the SysProM graph. */
export interface ExternalReference {
  role: ExternalReferenceRole;
  identifier: string;
  description?: Text;
  node_id?: string;
  internalised?: Text;
}

export const metadata = defineSchema(
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
/** Document-level metadata. Analogous to front matter in Markdown. */
export interface Metadata {
  [key: string]: unknown;
  title?: string;
  doc_type?: string;
  scope?: string;
  status?: string;
  version?: string | number;
}

export const relationship = defineSchema(
  z
    .looseObject({
      from: z.string().describe("Source node ID."),
      to: z.string().describe("Target node ID."),
      type: relationshipType,
      description: text.optional(),
    })
    .describe("A typed, directed connection between two nodes."),
);
/** A typed, directed connection between two nodes. */
export interface Relationship {
  [key: string]: unknown;
  from: string;
  to: string;
  type: RelationshipType;
  description?: Text;
}

// ---------------------------------------------------------------------------
// Root document (declared first so node's getter can reference it)
// ---------------------------------------------------------------------------

export const sysproMDocument = defineSchema(
  z
    .object({
      $schema: z
        .string()
        .describe("Schema URI for self-identification.")
        .optional(),
      metadata: metadata.optional(),
      get nodes(): z.ZodArray<typeof node> {
        return z.array(node).describe("All nodes in the graph.");
      },
      relationships: z
        .array(relationship)
        .describe("Typed, directed connections between nodes.")
        .optional(),
      external_references: z
        .array(externalReference)
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
    }),
);
/** The root SysProM document. */
export interface SysProMDocument {
  $schema?: string;
  metadata?: Metadata;
  nodes: Node[];
  relationships?: Relationship[];
  external_references?: ExternalReference[];
}

// ---------------------------------------------------------------------------
// Node (with recursive subsystem via getter)
// ---------------------------------------------------------------------------

export const node = defineSchema(
  z
    .looseObject({
      id: z.string().describe("Unique identifier for this node."),
      type: nodeType,
      name: z.string().describe("Human-readable name."),
      description: text.optional(),
      status: nodeStatus.optional(),
      lifecycle: z
        .record(z.string(), z.union([z.boolean(), z.string()]))
        .describe("Map of lifecycle state names to completion status. Values may be boolean or an ISO date string indicating when the state was reached.")
        .optional(),
      context: text
        .describe(
          "Background context explaining why this node exists or why a decision was needed.",
        )
        .optional(),
      options: z
        .array(option)
        .describe("Alternatives considered. Applicable to decision nodes.")
        .optional(),
      selected: z
        .string()
        .describe("ID of the chosen option. Applicable to decision nodes.")
        .optional(),
      rationale: text
        .describe("Reasoning for the choice. Applicable to decision nodes.")
        .optional(),
      scope: z
        .array(z.string())
        .describe(
          "IDs of nodes affected by this change. Applicable to change nodes.",
        )
        .optional(),
      operations: z
        .array(operation)
        .describe("Operations performed. Applicable to change nodes.")
        .optional(),
      plan: z
        .array(task)
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
        .describe(
          "ID of the input artefact. Applicable to artefact_flow nodes.",
        )
        .optional(),
      output: z
        .string()
        .describe(
          "ID of the output artefact. Applicable to artefact_flow nodes.",
        )
        .optional(),
      external_references: z
        .array(externalReference)
        .describe("External resources related to this node.")
        .optional(),
      get subsystem(): z.ZodOptional<typeof sysproMDocument> {
        return sysproMDocument.optional();
      },
    })
    .describe("A uniquely identifiable entity within the system."),
);
/** A uniquely identifiable entity within the system. */
export interface Node {
  [key: string]: unknown;
  id: string;
  type: NodeType;
  name: string;
  description?: Text;
  status?: NodeStatus;
  lifecycle?: Record<string, string | boolean>;
  context?: Text;
  options?: Option[];
  selected?: string;
  rationale?: Text;
  scope?: string[];
  operations?: Operation[];
  plan?: Task[];
  propagation?: Record<string, boolean>;
  includes?: string[];
  input?: string;
  output?: string;
  external_references?: ExternalReference[];
  subsystem?: SysProMDocument;
}

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


// ---------------------------------------------------------------------------
// Generate JSON Schema
// ---------------------------------------------------------------------------

/** Generate the JSON Schema representation of the SysProM document schema. */
export function toJSONSchema(): Record<string, unknown> {
  const generated = z.toJSONSchema(sysproMDocument, {
    target: "draft-2020-12",
  }) as Record<string, unknown>;

  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: "https://sysprom.org/schema.json",
    ...generated,
  };
}

// ---------------------------------------------------------------------------
// Compile-time checks: explicit interfaces match Zod-inferred shapes
// ---------------------------------------------------------------------------

type _Assert<A, B> = A extends B ? true : never;
type _Inferred<T extends z.ZodType> = z.infer<T>;

// Bidirectional assignability for all object types
type _CkOpt1 = _Assert<_Inferred<typeof option>, Option>;
type _CkOpt2 = _Assert<Option, _Inferred<typeof option>>;
type _CkOp1 = _Assert<_Inferred<typeof operation>, Operation>;
type _CkOp2 = _Assert<Operation, _Inferred<typeof operation>>;
type _CkTask1 = _Assert<_Inferred<typeof task>, Task>;
type _CkTask2 = _Assert<Task, _Inferred<typeof task>>;
type _CkExtRef1 = _Assert<_Inferred<typeof externalReference>, ExternalReference>;
type _CkExtRef2 = _Assert<ExternalReference, _Inferred<typeof externalReference>>;
type _CkMeta1 = _Assert<_Inferred<typeof metadata>, Metadata>;
type _CkMeta2 = _Assert<Metadata, _Inferred<typeof metadata>>;
type _CkRel1 = _Assert<_Inferred<typeof relationship>, Relationship>;
type _CkRel2 = _Assert<Relationship, _Inferred<typeof relationship>>;
type _CkDoc1 = _Assert<_Inferred<typeof sysproMDocument>, SysProMDocument>;
type _CkDoc2 = _Assert<SysProMDocument, _Inferred<typeof sysproMDocument>>;
type _CkNode1 = _Assert<_Inferred<typeof node>, Node>;
type _CkNode2 = _Assert<Node, _Inferred<typeof node>>;
