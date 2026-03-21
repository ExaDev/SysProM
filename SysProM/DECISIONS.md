---
title: "DECISIONS"
doc_type: "decisions"
---

# DECISIONS

## Decisions

### D1 — Separate Domain From Process From Evolution

- Affects:
  - EL1
  - EL2
  - EL4
- Must preserve: INV1

Context: The model needs to represent systems, workflows, and history.
Mixing these concerns makes the graph hard to query and reason about.

Options:
- D1-O1: Single flat node type for everything
- D1-O2: Typed nodes without family grouping
- D1-O3: Nodes grouped into domain, process, artefact, and evolution families

Chosen: D1-O3

Rationale: Grouping into families enforces separation of concerns.
Domain structure should not be tangled with process mechanics or evolution history.

#### Lifecycle

- [x] proposed
- [x] accepted
- [x] implemented
- [ ] superseded

### D2 — Make Decisions First-Class Entities

- Affects: EL4
- Must preserve:
  - INV2
  - INV3

Context: Systems evolve through choices, but most models bury decisions in prose or lose them entirely.

Options:
- D2-O1: Embed decisions in prose within documents
- D2-O2: Record decisions as standalone log entries
- D2-O3: Model decisions as typed graph nodes with relationships to affected nodes and preserved invariants

Chosen: D2-O3

Rationale: Decisions are the causal mechanism of system evolution.
Graph nodes with typed relationships make decisions queryable, traceable, and enforceable.

#### Lifecycle

- [x] proposed
- [x] accepted
- [x] implemented
- [ ] superseded

### D3 — Distinguish Invariants From Principles From Policies

- Affects:
  - INV1
  - PR1
  - POL1
- Must preserve: INV3

Context: Systems have rules at different levels of rigidity. Collapsing all rules into one type loses critical information.

Options:
- D3-O1: Single constraint type for all rules
- D3-O2: Two types: hard invariant and soft guideline
- D3-O3: Three types: invariant (must always hold), principle (normative value, may be overridden), policy (operational rule)

Chosen: D3-O3

Rationale: The three-way split matches how real systems distinguish structural guarantees from design values from operational rules.

#### Lifecycle

- [x] proposed
- [x] accepted
- [x] implemented
- [ ] superseded

### D4 — Add Process Modelling

- Affects:
  - EL2
  - EL3
- Must preserve: INV4

Context: Workflow-heavy systems (planning tools, spec-driven workflows, runtime orchestration) cannot be adequately modelled with decisions and changes alone.

Options:
- D4-O1: Model process implicitly through decisions and changes only
- D4-O2: Add roles and stages but not gates, modes, or artefacts
- D4-O3: Add full process modelling: roles, protocols, stages, gates, policies, modes, artefacts, artefact flows

Chosen: D4-O3

Rationale: Without process nodes, roles become invisible, gates become buried in decision prose, and artefact lineage is lost.
Full process modelling makes the model capable of encoding systems like Spec Kit, Ralplan, and get-shit-done.

#### Lifecycle

- [x] proposed
- [x] accepted
- [x] implemented
- [ ] superseded

### D5 — Format-Agnostic With Markdown as Primary Representation

- Affects: R1
- Must preserve: INV4

Context: The model needs a practical encoding but should not be locked to one format.

Options:
- D5-O1: Define a single mandatory format (e.g. JSON schema)
- D5-O2: Define semantics only, with no reference representation
- D5-O3: Define semantics as normative, with Markdown as the primary practical representation

Chosen: D5-O3

Rationale: Markdown is human-readable, Git-friendly, renders on GitHub/GitLab, and supports front matter, headings, links, and checkboxes which map directly to model concepts.
Other formats remain valid.

#### Lifecycle

- [x] proposed
- [x] accepted
- [x] implemented
- [ ] superseded

### D6 — Recursive Composition Using Same Conventions

- Affects: R4
- Must preserve: INV4

Context: Systems contain subsystems. If subsystems use different conventions, the model fractures.

Options:
- D6-O1: Flat structure only (no nesting)
- D6-O2: Nesting with different conventions at each level
- D6-O3: Same document set, naming, and relationship conventions at every level of nesting

Chosen: D6-O3

Rationale: Recursive consistency means any node can be understood in isolation using the same patterns, and tools can process any level without special cases.

#### Lifecycle

- [x] proposed
- [x] accepted
- [x] implemented
- [ ] superseded

### D7 — Append-Only History

- Must preserve: INV5

Context: Deleting history destroys traceability. If a decision is removed, it becomes impossible to answer why a node exists.

Options:
- D7-O1: Allow deletion of nodes and decisions
- D7-O2: Allow overwriting of decisions with new versions
- D7-O3: Append-only: superseded decisions and deprecated nodes remain; nothing is deleted

Chosen: D7-O3

Rationale: Append-only preserves the full provenance chain.

#### Lifecycle

- [x] proposed
- [x] accepted
- [x] implemented
- [ ] superseded

### D8 — Name the Model SysProM

Context: The working title 'Recursive, Decision-Driven System Model' is descriptive but clunky.
A better name should describe what the model provides.

Options:
- D8-O1: RDSM (Recursive, Decision-Driven System Model)
- D8-O2: RADAR (Recursive Abstractions, Decisions, Artefacts, and Relationships)
- D8-O3: CLADE (Composable Layers of Abstraction, Decisions, and Evolution)
- D8-O4: SysProM (System Provenance Model)

Chosen: D8-O4

Rationale: System Provenance Model describes what the model provides in three words.
SysProM is pronounceable, follows naming conventions of similar specs (SysML, SysOps), and does not require a backronym.

#### Lifecycle

- [x] proposed
- [x] accepted
- [x] implemented
- [ ] superseded

### D9 — Support External Resources via Reference and Internalisation

- Affects: EL7
- Must preserve:
  - INV19
  - INV20

Context: Nodes often relate to resources outside the graph.
The model must handle this without coupling to a specific serialisation format.

Options:
- D9-O1: No external reference support — all content must be internalised
- D9-O2: External references only — all content is by pointer
- D9-O3: Both approaches supported independently or together, with serialisation-specific identifiers and typed roles

Chosen: D9-O3

Rationale: Internalisation enables portability. References enable traceability.
Supporting both gives implementors flexibility without losing either property.

#### Lifecycle

- [x] proposed
- [x] accepted
- [x] implemented
- [ ] superseded

### D10 — Allow Array-of-Lines for Text Fields

- Affects:
  - R5
  - R1
- Must preserve: INV21

Context: JSON does not support multiline strings.
Long descriptions serialised as single strings with embedded \n are hard to read and produce poor diffs.
An array of lines preserves readability in serialised form.

Options:
- D10-O1: Single string only — use \n for newlines
- D10-O2: Array of strings only — always use arrays
- D10-O3: Either form accepted — string for short content, array for multiline

Chosen: D10-O3

Rationale: Short descriptions gain nothing from being wrapped in an array.
Long descriptions gain readability and diff quality from line-per-element arrays.
Accepting both avoids forcing a style while enabling better ergonomics where it matters.

#### Lifecycle

- [x] proposed
- [x] accepted
- [x] implemented
- [ ] superseded

### D11 — Use Strict Enums for Core Types

- Affects: R5
- Must preserve:
  - INV22
  - INV18

Context: SysProM's purpose is provenance and traceability.
If relationship types, node types, and statuses are arbitrary strings, layer constraints cannot be enforced, labels cannot be derived for rendering, and semantic validation is impossible.
The extensibility section says extensions MUST NOT violate core constraints, but an open string type makes that unenforceable.

Options:
- D11-O1: Open strings with examples — any value accepted, core types documented only
- D11-O2: Strict enums — only declared values accepted, extensions must add to the enum

Chosen: D11-O2

Rationale: Strict enums enable schema-level validation, type-safe label derivation, and enforceable layer constraints.
The DRY labelledEnum pattern ensures each type is defined once with its label, eliminating duplication.

#### Lifecycle

- [x] proposed
- [x] accepted
- [x] implemented
- [ ] superseded

### D12 — Only Link to Present Files in README

- Affects: R1
- Must preserve: POL19

Context: The README generator was producing navigation links and document role entries for all possible files (INTENT, INVARIANTS, STATE, DECISIONS, CHANGES) regardless of whether the subsystem had nodes of those types.
This created dead links in subsystem READMEs.

Options:
- D12-O1: Always link to all files — accept dead links as informational
- D12-O2: Only link to files that will be created based on present node types

Chosen: D12-O2

Rationale: Dead links mislead readers and break tooling. Links should reflect reality.

#### Lifecycle

- [x] proposed
- [x] accepted
- [x] implemented
- [ ] superseded

### D13 — Remove Navigation and Document Roles from README

- Affects: R1

Context: The README contained a Navigation section and a Document Roles table that restated what the filenames already communicate.
Anyone looking at a folder with INTENT.md, DECISIONS.md, etc. already knows what they contain.

Options:
- D13-O1: Keep both Navigation and Document Roles
- D13-O2: Keep Document Roles table only
- D13-O3: Remove both — the filenames are self-documenting

Chosen: D13-O3

Rationale: Removing redundant sections reduces noise and maintenance burden. The file naming convention is the documentation.

#### Lifecycle

- [x] proposed
- [x] accepted
- [ ] implemented
- [ ] superseded

### D14 — Layer-Dependent Invariant Preservation

- Affects: INV3
- Must preserve: INV3

Context: INV3 required every decision to identify preserved invariants.
Operational decisions (naming, tooling, presentation) genuinely have no invariants at risk.
Forcing must_preserve on these creates friction that discourages recording decisions, which defeats SysProM's provenance purpose.
SysProM already distinguishes domain nodes (intent, concept, capability, element, invariant) from non-domain nodes (realisation, policy, protocol, etc.).

Options:
- D14-O1: Keep INV3 as MUST for all decisions
- D14-O2: Soften INV3 to SHOULD for all decisions
- D14-O3: Add decision type/level classification
- D14-O4: MUST when affecting domain nodes, SHOULD when affecting only non-domain nodes — determined automatically from affects relationships

Chosen: D14-O4

Rationale: Automatic classification from affects relationships means no user burden.
Domain nodes define what the system IS — decisions affecting them must consider invariants.
Non-domain nodes define how the system works — decisions affecting only these are operational.
Leverages the existing layer model rather than adding new concepts.

#### Lifecycle

- [x] proposed
- [x] accepted
- [x] implemented
- [ ] superseded

### D15 — Internalise Design Archive into SysProM JSON

- Affects:
  - ART1
  - ART2
  - ART3

Context: The distilled/ folder contained four reference documents (Specification, Comparisons, Examples, Naming) produced during SysProM's design.
These were external to the JSON but contained valuable content.
The specification is already captured as the JSON itself.
The comparisons, examples, and naming rationale could be modelled as artefact nodes with subsystems.

Options:
- D15-O1: Keep distilled/ as separate files, reference from JSON
- D15-O2: Internalise key content as artefact nodes with subsystems in the JSON

Chosen: D15-O2

Rationale: Internalising makes the JSON self-contained. Artefact nodes with subsystems naturally model documents that contain structured content.

#### Lifecycle

- [x] proposed
- [x] accepted
- [x] implemented
- [ ] superseded

### D16 — Add Bidirectional Spec-Kit File Interoperability

SysProM can model Spec-Kit workflows as nodes and relationships but cannot read or write actual Spec-Kit files (spec.md, plan.md, tasks.md, constitution.md, checklist.md). Users working with both systems need bidirectional conversion.

Options:
- D16-O1: Import-only — parse Spec-Kit files into SysProM nodes
- D16-O2: Export-only — generate Spec-Kit files from SysProM nodes
- D16-O3: Full bidirectional with import, export, sync, and diff

Chosen: D16-O3

Rationale: Full bidirectional support enables true interoperability. Users can start with Spec-Kit workflows, import into SysProM for provenance tracking, make changes in either system, and keep them synchronized. This preserves SysProM's role as the provenance substrate while respecting Spec-Kit as a workflow tool.

- Affects: EL3
- Must preserve: INV4, INV5, INV6, INV21, INV22

#### Lifecycle

- [x] proposed
- [x] accepted
- [x] implemented

