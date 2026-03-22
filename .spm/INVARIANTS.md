---
title: "INVARIANTS"
doc_type: "invariants"
---

# INVARIANTS

## Invariants

### INV1 — Concept Independence

Concept nodes MUST NOT depend on realisation nodes. The conceptual layer must be valid even if no realisation exists.

### INV2 — Decision-Change Linkage

Every change MUST reference at least one decision. No change occurs without an explicit choice.

### INV3 — Invariant Preservation

A decision that affects domain nodes (intent, concept, capability, element, invariant) MUST identify the invariants it preserves via must_preserve relationships.
A decision that affects only non-domain nodes (realisation, policy, protocol, stage, role, gate, mode, artefact) SHOULD identify preserved invariants but is not required to.
Domain nodes define what the system IS. Non-domain nodes define how it works or how it is implemented.

### INV4 — Recursive Consistency

The same model MUST apply at all levels of recursion.
A subsystem uses the same node types, relationship types, and conventions as the root system.

### INV5 — Append-Only History

Superseded decisions and deprecated nodes MUST remain part of the system. History is never deleted.

### INV6 — Node Identity

Every node MUST have a unique identifier and a defined type. No anonymous entities.

### INV7 — Relationship Validity

Every relationship MUST be directional, typed, and reference valid nodes.

### INV8 — Gate Justification

Every gate MUST reference the invariant or policy it enforces.

### INV9 — Layer Direction

Refinement flows downward through abstraction layers. Nodes MUST NOT refine nodes in a lower layer.

### INV10 — Realisation Implements Element

Realisation nodes MUST implement element nodes. A realisation without a parent element is invalid.

### INV11 — Stage Ordering

Stages within a protocol MUST have defined ordering via precedes or must_follow relationships.

### INV12 — Decision Affects Reference

Every decision MUST reference the nodes it affects via an affects relationship.

### INV13 — Decision Selection

Every decision MUST define the selected option and list alternatives considered.

### INV14 — Change Scope

Every change MUST define its scope (the nodes it affects).

### INV15 — Change Operations

Every change MUST define its operations (add, update, remove, link).

### INV16 — Change Lifecycle State

Every change MUST define its lifecycle state.

### INV17 — Node Addressability

Every node MUST be addressable — reachable by its identifier from any point in the graph.

### INV18 — Extension Constraint Preservation

Extensions (additional node types, relationship types, lifecycle states) MUST NOT violate core constraints.

### INV19 — External Reference Role Required

Every external reference MUST include a role describing the relationship to the node.

### INV20 — External Reference Directionality

External references are always from a node in the graph to a resource outside it.
External resources do not point back into the graph.

### CONF1 — Conformance — Typed Nodes

A conformant system MUST define nodes with types.

- Constrained by: CN8

### CONF2 — Conformance — Relationships

A conformant system MUST define relationships between nodes.

- Constrained by: CN8

### CONF3 — Conformance — Lifecycle States

A conformant system MUST define lifecycle states for decisions and changes.

- Constrained by: CN8

### CONF4 — Conformance — At Least One Invariant

A conformant system MUST define at least one invariant.

- Constrained by: CN8

### CONF5 — Conformance — Traceability

A conformant system MUST support traceability across abstraction layers.

- Constrained by: CN8

### INV21 — Text Field Duality

Fields that carry human-readable content (description, context, rationale, internalised) MAY be either a string or an array of strings.
Both forms are semantically equivalent.
Implementations MUST accept either form wherever a text field appears.

### INV22 — Strict Type Enums

Node types, node statuses, relationship types, and external reference roles MUST be members of their defined enums.
Unknown values MUST be rejected at validation time.
Extensions MUST add new values to the enum rather than bypassing it.

### INV23 — Retired Node Relationship Guard

Relationships to or from retired nodes are only permitted for semantically appropriate types (supersedes, derived_from, references). Operational relationship types (depends_on, implements, constrained_by, must_follow, governed_by, affects, etc.) are refused. Enforced in addRelationship and checked by validate.

### INV24 — No Duplicate Relationships

A document must not contain two relationships with identical from, type, and to. Enforced in addRelationship (refuse) and validate (report).

### INV25 — Relationship Endpoint Type Validity

Each relationship type has a set of valid source and target node types. For example, implements must go from a change to a decision; governed_by must point at a protocol. Enforced in addRelationship (refuse) and validate (report).

### INV26 — Retirement Impact Awareness

Setting a node to status: retired via updateNode must report all active nodes that hold operational relationships (depends_on, implements, constrained_by, must_follow, governed_by, affects) to/from it. The caller sees the impact before the change is applied.

### INV27 — Auto-sync JSON and Markdown representations

When both JSON and Markdown representations of a SysProM document exist, mutations via the CLI must automatically keep them in sync. Users should not need to manually run json2md or md2json after every change.

## Principles

### PR1 — Separate What From Why From How

Intent, decisions, and realisations are distinct concerns and should be recorded separately.

### PR2 — Decisions Are More Important Than Documents

Documents describe state. Decisions explain why state changed.

### PR3 — Everything Has Identity

Every node gets an ID. No anonymous ideas.

### PR4 — Think Graph, Not Timeline

Timelines are one projection of the graph. The graph is the source of truth.

### PR5 — Separate State From History

What exists now and how it got there are recorded separately.

## Policies

### POL1 — Prefer Deprecation Over Deletion

When removing a node from active use, mark it as deprecated rather than deleting it.

- Governed by: INV5

### POL2 — Decisions Must Record Alternatives

A decision SHOULD list the alternatives considered, not only the selected option.

- Governed by: PR2

### POL3 — Changes Must Define Scope

A change SHOULD explicitly state which nodes it affects and which it does not.

- Governed by: INV3

### POL4 — Capabilities Should Refine Concepts

Capability nodes SHOULD refine concept nodes.

- Governed by: INV9

### POL5 — Elements Should Realise Capabilities

Element nodes SHOULD realise capability nodes.

- Governed by: INV9

### POL6 — Prefer Internalisation for Portability

When portability matters, the relevant content from an external resource SHOULD be captured directly within a node so the document set is self-contained.

- Governed by: CN7

### POL7 — Security — Node Identity Integrity

Implementations SHOULD ensure integrity of node identities.

### POL8 — Security — Relationship Consistency

Implementations SHOULD ensure consistency of relationships.

### POL9 — Security — Controlled Modification

Implementations SHOULD ensure controlled modification of decisions and changes.

### POL10 — Root Entry Point Identification

The root entry point MUST be identifiable as a SysProM document.
Valid filenames include SysProM.md, SYSPROM.md, SPM.md, and README.spm.md.
Alternatively, front matter containing doc_type: sysprom is sufficient.

- Part of: EL8

### POL11 — Root Entry Point Location

A SysProM document set MAY live at any location.
Valid locations include: repository root (./SysProM.md), dedicated folder (./SysProM/README.md), docs directory (./docs/SysProM.md), or any other reasonable path.

- Part of: EL8

### POL12 — Multi-Document Hub

When a system is described across multiple files, a hub document (typically README.md) SHOULD serve as the root node.
Separate files per concern: INTENT.md, INVARIANTS.md, STATE.md, DECISIONS.md, CHANGES.md.
No document is mandatory.

- Part of: EL8

### POL13 — Single-File Node Extension

A node represented as a single file SHOULD use the .spm.md extension.
Filename SHOULD include node ID and MAY include name: F1-sync.spm.md (preferred), F1.spm.md, or sync.spm.md.

- Part of: EL8

### POL14 — Folder Node Naming

A node represented as a folder SHOULD be named using the node ID and name: F1-sync/ (preferred), F1/, or sync/.
The folder MUST contain at least a README. md.

- Part of: EL8

### POL15 — Grouping Folders

Node folders MAY be grouped under intermediate directories by type (e. g. features/, components/).
Grouping folders are organisational and do not represent nodes.

- Part of: EL8

### POL16 — Parent Linking Implicit

Parent-child relationships between nodes are implicit from the folder hierarchy.
Explicit parent references in frontmatter are not required.

- Part of: EL8

### POL17 — Relationship Notation Flexibility

Relationships MAY be expressed as labelled lists, arrow chains, tables, nested lists, or mermaid diagrams.
Formats may be mixed. The choice is a presentation concern.

- Part of: EL8

### POL18 — Frontmatter Is Metadata Only

Front matter defines document-level metadata only (title, doc_type, scope, status, version).
Node-level data belongs in the document body.

- Part of: EL8

### POL19 — README Links Only to Present Files

Generated README navigation and document roles MUST only link to files that contain nodes. Dead links to absent files MUST NOT be generated.

### POL20 — Subsystem Representation Heuristic

A subsystem is rendered as a single .spm.md file when it would produce only one document file type AND the result is 100 lines or fewer.
A subsystem is rendered as a multi-document folder when it would produce multiple file types OR the single file would exceed 100 lines.
Subsystems of the same node type are automatically grouped into a type-named directory when 2 or more exist.

