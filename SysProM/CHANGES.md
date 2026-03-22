---
title: "CHANGES"
doc_type: "changes"
---

# CHANGES

## Changes

### CH1 — Initial Model

Establishes the core domain model with layered abstraction, decisions, changes, and invariants.

- Affects:
  - D1
  - D2
  - D7

Scope:
- I1
- CN1
- CN2
- CN3
- CN4
- CP1
- CP2
- CP3
- CP4
- CP5
- EL1
- EL4
- INV1
- INV2
- INV3
- INV4
- INV5
- INV6
- INV7
- PR1
- PR2
- PR3
- PR4
- PR5

Operations:
- add I1
- add EL1
- add EL4
- add EL6

#### Lifecycle

- [x] complete
- [x] defined
- [x] introduced

### CH2 — Add Process Modelling

Extends the model with process, artefact, and projection node families.

- Affects:
  - D3
  - D4

Scope:
- CN5
- CP6
- EL2
- EL3
- EL5
- INV8
- INV9
- INV10
- INV11

Operations:
- add EL2
- add EL3
- add EL5

#### Lifecycle

- [x] complete
- [x] defined
- [x] introduced

### CH3 — Add File Representation Conventions

Defines how SysProM may be encoded in files, including single-document, multi-document, and recursive folder forms.

- Affects:
  - D5
  - D6

Scope:
- CN6
- CP7
- R1
- R2
- R3
- R4
- R5
- EL8
- POL1
- POL2
- POL3
- POL10
- POL11
- POL12
- POL13
- POL14
- POL15
- POL16
- POL17
- POL18

Operations:
- add EL8
- add R1
- add R2
- add R3
- add R4
- add R5

#### Lifecycle

- [x] complete
- [x] defined
- [x] introduced

### CH4 — Add External Resources Model

Adds the external reference and internalisation mechanism with typed roles.

- Affects:
  - D8
  - D4
  - D2

Scope:
- CN7
- CP8
- EL7
- INV19
- INV20
- POL6

Operations:
- add CN7
- add CP8
- add EL7

#### Lifecycle

- [x] complete
- [x] defined
- [x] introduced

### CH5 — Add Lifecycle Protocols

Adds the decision, change, and node lifecycle state machines as protocols with stages and ordering.

- Affects: D4

Scope:
- PROT1
- PROT2
- PROT3

Operations:
- add PROT1
- add PROT2
- add PROT3

#### Lifecycle

- [x] complete
- [x] defined
- [x] introduced

### CH6 — Encode Full Normative Specification

Adds conformance requirements, missing invariants, security and extensibility policies, non-linear evolution capabilities, and complete node/relationship type vocabularies to make the JSON self-contained.

- Affects: D2

Scope:
- CONF1
- CONF2
- CONF3
- CONF4
- CONF5
- INV12
- INV13
- INV14
- INV15
- INV16
- INV17
- INV18
- POL4
- POL5
- POL6
- POL7
- POL8
- POL9
- EL9
- EL10
- CP9
- CP10
- CP11
- CN8

Operations:
- add CN8
- add EL9
- add EL10

#### Lifecycle

- [x] complete
- [x] defined
- [x] introduced

### CH7 — Add Text Field Duality

Adds support for text fields (description, context, rationale, internalised) to accept either a string or an array of strings.
Updates the JSON schema, Zod definitions, and specification.

- Affects: D9

Scope:
- INV21
- D8

Operations:
- add INV21
- add D8
- update R5 — JSON schema updated to accept string | string[] for text fields
- update R1 — Specification updated with §6.2 Text Fields

#### Lifecycle

- [x] complete
- [x] defined
- [x] introduced

### CH8 — Switch to Strict Enums with Labelled Definitions

Replaces open z.string() types with z.enum() for node types, statuses, relationship types, and external reference roles.
Introduces labelledEnum() helper that defines values and labels in one place.
Derives SECTION_LABELS, RELATIONSHIP_LABELS, and reverse lookups from the label maps.

- Affects: D10

Scope:
- INV22
- D8
- R5

Operations:
- add INV22
- add D8
- update R5 — JSON schema now uses enum instead of string with examples

#### Lifecycle

- [x] complete
- [x] defined
- [x] introduced

### CH9 — Fix Dead Links in Subsystem READMEs

README generator now only links to files that contain nodes for the given subsystem.

- Affects: D11

Scope:
- POL19
- D8
- R1

Operations:
- add POL19
- add D8
- update R1 — json-to-md updated to check present node types before generating links

#### Lifecycle

- [x] complete
- [x] defined
- [x] introduced

### CH10 — Remove Navigation and Document Roles from README

Removes the Navigation section and Document Roles table from generated READMEs. The file naming convention is self-documenting.

- Affects: D12

Scope:
- D8
- R1

Operations:
- update R1 — README generation simplified to omit navigation and document roles

#### Lifecycle

- [ ] complete
- [x] defined
- [ ] introduced

### CH11 — Make Invariant Preservation Layer-Dependent

Updates INV3 to require must_preserve only when a decision affects domain nodes.
Decisions affecting only non-domain nodes (realisations, policies, process nodes) should but are not required to identify preserved invariants.

- Affects: D13

Scope:
- INV3
- D8

Operations:
- update INV3 — Reworded to distinguish domain and non-domain affects

#### Lifecycle

- [x] complete
- [x] defined
- [x] introduced

### CH12 — Internalise Design Archive

Internalises content from distilled/ into the SysProM JSON.
Comparisons become an artefact node (ART1) with comparison summaries as subsystem concepts.
Worked examples become artefact nodes (ART2, ART3) with example SysProM graphs as subsystems.
Naming rationale is already captured in D8.
Specification is already captured as the JSON itself — distilled/Specification.md is redundant.

- Affects: D14

Scope:
- ART1
- ART2
- ART3

Operations:
- add ART1
- add ART2
- add ART3

#### Lifecycle

- [x] complete
- [x] defined
- [x] introduced

### CH13 — Add Size-Based Subsystem Splitting and Auto-Grouping

Subsystems that would produce a single file over 100 lines are now split into multi-document folders.
Subsystems of the same node type are automatically grouped into type-named directories (e.g. elements/, artefacts/).
Both heuristics are automatic — no user configuration needed.

- Affects: D15

Scope:
- POL20
- D8
- R1

Operations:
- add POL20
- add D8
- update R1 — json-to-md updated with line count threshold and auto-grouping

#### Lifecycle

- [x] complete
- [x] defined
- [x] introduced

### CH14 — Implement Spec-Kit File Support

New speckit/ module provides bidirectional conversion between Spec-Kit project files and SysProM nodes.
Parser maps constitution.md → invariant/protocol nodes, spec.md → artefact/capability/invariant nodes, plan.md → artefact/element/gate nodes, tasks.md → stage/change nodes, checklist.md → gate nodes.
Generator reverses the mapping to produce valid Spec-Kit markdown from SysProM graph data.
CLI adds import, export, sync, and diff subcommands under sysprom speckit.
Tests cover all 5 parser functions (40 cases) and all 5 generator functions (28 cases), plus round-trip fidelity.

- Affects: D16

Scope:
- D16
- EL3
- CMP-SPECKIT

Operations:
- add src/speckit/parse.ts
- add src/speckit/generate.ts
- add src/speckit/project.ts
- add src/speckit/index.ts
- add src/cli/speckit.ts
- add tests/speckit-parse.unit.test.ts
- add tests/speckit-generate.unit.test.ts
- update src/cli/index.ts — Register speckit command
- update src/index.ts — Export speckit modules
- update CMP-SPECKIT — Expand description to reflect interoperability

#### Lifecycle

- [x] complete
- [x] defined
- [x] introduced

### CH15 — Implement task CLI Command for Subagent Plan Tracking

New task command provides list, add, done, and undone subcommands for manipulating the plan array on change nodes.
Two new mutate helpers (addPlanTask, updatePlanTask) follow the immutable doc-in/doc-out pattern of the existing mutate module.
task list supports --pending and --json flags enabling agent scripting via jq.
AGENTS.md documents the complete subagent workflow: discover, claim, progress, complete.

- Affects: D17

Scope:
- D17
- CH14

Operations:
- add src/cli/task.ts
- add tests/task-cli.unit.test.ts
- add AGENTS.md
- update src/mutate.ts — Add addPlanTask() and updatePlanTask()
- update src/cli/index.ts — Register task command

#### Lifecycle

- [x] complete
- [x] defined
- [x] introduced

### CH16 — Implement Plan Command with Recursive Task Model

New spm plan command with five subcommands: init (scaffold feature skeleton), add-task (add tasks with optional --parent for nesting), status (workflow completeness report), progress (per-task ASCII progress bars), and gate (phase readiness validation). Phases are change nodes in PROT-IMPL.subsystem; subtasks nest recursively via child subsystems. Includes isTaskDone and countTasks helpers for recursive completion tracking. Updated generateTasks and parseTasks to use change-only model.

- Implements: D18

- Status: complete

Scope:
- ["EL-CLI","EL-SPECKIT"]

### CH17 — Implement Temporal Support

Extended lifecycle schema to accept ISO date strings alongside booleans. Added temporal query functions: timeline (chronological events), nodeHistory (single node history), stateAt (system state at a point in time). Updated markdown rendering and parsing for date lifecycle values. Added timeline and state-at subcommands to spm query.

- Implements: D19

- Status: complete

### CH18 — Migrate CLI to Commander.js

Replace manual process.argv parsing across all CLI command files with Commander.js declarative command definitions. Add a doc generation script that walks Commander's command tree to produce markdown files for TypeDoc's projectDocuments feature.

- Implements: D20

- Status: complete

#### Lifecycle

- [ ] implemented (2026-03-21)
- [ ] proposed (2026-03-21)

### CH19 — Add TypeDoc Documentation Pipeline

Configure TypeDoc for markdown API docs (docs/api/), HTML site generation (site/), and auto-generated CLI reference (docs/cli/) from Commander.js metadata. Add @param/@returns JSDoc tags to all public functions. Use typedoc-plugin-zod to render Zod-inferred types cleanly.

- Implements: D21

- Status: complete

Scope:
- EL3

Operations:
- add — Create typedoc.json and typedoc.html.json configuration files
- add — Create scripts/generate-cli-docs.ts for auto-generating CLI docs from Commander metadata
- update — Add @param and @returns JSDoc tags to all public functions

#### Lifecycle

- [ ] implemented (2026-03-21)
- [ ] proposed (2026-03-21)

### CH20 — Add Turborepo Build Orchestration

Add turbo.json with task dependency graph for typecheck, compile, schema, test, and doc generation tasks. Restructure package.json scripts into atomic _-prefixed tasks orchestrated by turbo. Turbo manages output caching and directory cleaning.

- Implements: D22

- Status: complete

Scope:
- EL3

Operations:
- add — Create turbo.json with task dependency graph and input/output declarations
- update — Restructure package.json scripts into atomic tasks with turbo entry points

#### Lifecycle

- [ ] implemented (2026-03-21)
- [ ] proposed (2026-03-21)

### CH21 — Add CI/CD Pipeline

Set up GitHub Actions CI workflow with quality checks, docs generation, GitHub Pages deployment, and npm publishing via OIDC trusted publishers. Add commitlint with husky hooks, semantic-release with all commit types triggering releases, and Dependabot for dependency updates.

- Implements: D23

- Status: complete

#### Lifecycle

- [ ] implemented (2026-03-22)
- [ ] proposed (2026-03-22)

### CH22 — Remove Type Assertions

Replace all as type coercions across library and CLI code with runtime validation. Use Zod .is() and .safeParse() for domain type narrowing, isRecord() for object checks, instanceof for error handling, and properly typed Commander action handlers.

- Implements: D24

- Status: complete

#### Lifecycle

- [ ] implemented (2026-03-22)
- [ ] proposed (2026-03-22)

### CH23 — Switch to Compiled Distribution

Update package.json entry points to reference compiled JavaScript in dist/. Move tsx from dependencies to devDependencies. Change CLI shebang to #!/usr/bin/env node.

- Implements: D25

- Status: complete

#### Lifecycle

- [ ] implemented (2026-03-22)
- [ ] proposed (2026-03-22)

### CH24 — Add Auto-ID Generation to CLI

Add nextId() function and NODE_ID_PREFIX map. Make --id optional on the add command — auto-generates from type prefix + next available number.

- Implements: D26

- Status: complete

#### Lifecycle

- [ ] implemented (2026-03-22)
- [ ] proposed (2026-03-22)

### CH25 — CLI UX Improvements

Add auto-option IDs, spm init, --sync, coloured output, --json on mutations, spm search, spm graph, spm rename, spm check, shell completions, and --dry-run.

- Implements: D27

- Status: complete

#### Lifecycle

- [ ] implemented (2026-03-22)
- [ ] proposed (2026-03-22)

