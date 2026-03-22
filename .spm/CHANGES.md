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

- [x] defined
- [x] introduced
- [x] complete

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

- [x] defined
- [x] introduced
- [x] complete

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

- [x] defined
- [x] introduced
- [x] complete

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

- [x] defined
- [x] introduced
- [x] complete

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

- [x] defined
- [x] introduced
- [x] complete

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

- [x] defined
- [x] introduced
- [x] complete

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

- [x] defined
- [x] introduced
- [x] complete

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

- [x] defined
- [x] introduced
- [x] complete

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

- [x] defined
- [x] introduced
- [x] complete

### CH10 — Remove Navigation and Document Roles from README

Removes the Navigation section and Document Roles table from generated READMEs. The file naming convention is self-documenting.

- Affects: D12

Scope:
- D8
- R1

Operations:
- update R1 — README generation simplified to omit navigation and document roles

#### Lifecycle

- [x] defined
- [ ] introduced
- [ ] complete

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

- [x] defined
- [x] introduced
- [x] complete

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

- [x] defined
- [x] introduced
- [x] complete

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

- [x] defined
- [x] introduced
- [x] complete

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

- [x] defined
- [x] introduced
- [x] complete

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

- [x] defined
- [x] introduced
- [x] complete

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

- [x] proposed (2026-03-21)
- [x] implemented (2026-03-21)

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

- [x] proposed (2026-03-21)
- [x] implemented (2026-03-21)

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

- [x] proposed (2026-03-21)
- [x] implemented (2026-03-21)

### CH21 — Add CI/CD Pipeline

Set up GitHub Actions CI workflow with quality checks, docs generation, GitHub Pages deployment, and npm publishing via OIDC trusted publishers. Add commitlint with husky hooks, semantic-release with all commit types triggering releases, and Dependabot for dependency updates.

- Implements: D23

- Status: complete

#### Lifecycle

- [x] proposed (2026-03-22)
- [x] implemented (2026-03-22)

### CH22 — Remove Type Assertions

Replace all as type coercions across library and CLI code with runtime validation. Use Zod .is() and .safeParse() for domain type narrowing, isRecord() for object checks, instanceof for error handling, and properly typed Commander action handlers.

- Implements: D24

- Status: complete

#### Lifecycle

- [x] proposed (2026-03-22)
- [x] implemented (2026-03-22)

### CH23 — Switch to Compiled Distribution

Update package.json entry points to reference compiled JavaScript in dist/. Move tsx from dependencies to devDependencies. Change CLI shebang to #!/usr/bin/env node.

- Implements: D25

- Status: complete

#### Lifecycle

- [x] proposed (2026-03-22)
- [x] implemented (2026-03-22)

### CH24 — Add Auto-ID Generation to CLI

Add nextId() function and NODE_ID_PREFIX map. Make --id optional on the add command — auto-generates from type prefix + next available number.

- Implements: D26

- Status: complete

#### Lifecycle

- [x] proposed (2026-03-22)
- [x] implemented (2026-03-22)

### CH25 — CLI UX Improvements

Add auto-option IDs, spm init, --sync, coloured output, --json on mutations, spm search, spm graph, spm rename, spm check, shell completions, and --dry-run.

- Implements: D27

- Status: complete

#### Lifecycle

- [x] proposed (2026-03-22)
- [x] implemented (2026-03-22)

### CH26 — Implement defineCommand Pattern

Create defineCommand() with Zod schema introspection for Commander generation and doc extraction. Migrate all 16 CLI commands to single-file definitions in src/cli/commands/. Delete old run() files.

- Implements: D28

- Status: complete

Scope:
- EL3

#### Lifecycle

- [x] proposed (2026-03-22)
- [x] implemented (2026-03-22)

### CH27 — Implement defineOperation Pattern

Create defineOperation infrastructure, define operations for all domain functions, refactor CLI commands to thin adapters, update exports.

- Implements: D29

- Status: complete

Scope:
- EL3

#### Plan

- [x] Create src/operations/define-operation.ts
- [x] Create mutation operations
- [x] Create query and temporal operations
- [x] Create new API operations (search, check, graph, rename)
- [x] Refactor CLI commands to thin adapters
- [x] Update src/index.ts exports
- [x] Verify and test
- [x] Create operations for remaining CLI-only commands (init, json2md, md2json, plan, task, speckit)
- [x] Extract shared CLI concerns (--json, --dry-run, --sync, <input>) into reusable schemas and adapter factories
- [x] Deduplicate CLI argument descriptions that repeat operation input descriptions

#### Lifecycle

- [x] proposed (2026-03-22)
- [x] implemented (2026-03-22)

### CH28 — Implement Claude Code Plugin

Add a Claude Code plugin to the SysProM repository with skills, commands, hooks, and agents for provenance-aware development workflows. The plugin is pure markdown — no compiled code. Commands call spm if available, falling back to npx -y sysprom after npm publication. Distribution via GitHub marketplace (marketplace.json in .claude-plugin/).

- Implements: D30

#### Plan

- [ ] Create .claude-plugin/plugin.json manifest
- [ ] Create .claude-plugin/marketplace.json for GitHub distribution
- [ ] Create sysprom-workflow skill — core workflow guidance for using SysProM during development
- [ ] Create decision-recording skill — how to structure decisions with context, options, rationale
- [ ] Create change-tracking skill — lifecycle management for changes (proposed to complete)
- [ ] Create /spm-decide command — interactive decision recording
- [ ] Create /spm-change command — record a change with scope and operations
- [ ] Create /spm-status command — show project state and timeline
- [ ] Create /spm-trace command — trace dependencies from a node
- [ ] Create /spm-sync command — sync JSON and Markdown representations
- [ ] Create provenance-tracker agent — auto-tracks decisions during dev work
- [ ] Create Stop hook — remind to record decisions at session end
- [ ] Add CLI fallback pattern — try spm, then npx -y sysprom, then instruct user to install
- [ ] Add README.md for plugin with installation and usage instructions
- [ ] Sync JSON to Markdown

### CH29 — Implement Bidirectional Sync Command

Add a unified 'spm sync' command that performs bidirectional synchronisation between JSON and Markdown representations by default, with flags for precise conflict handling.

- Implements: D31

- Status: proposed

Scope:
- D31

#### Plan

- [ ] Design conflict detection: compare timestamps and content hashes of JSON and Markdown representations to determine which side has changed
- [ ] Implement 'spm sync <json> <md-dir>' command that is bidirectional by default — detect which side changed and update the other
- [ ] Add --prefer-json flag: resolve conflicts by treating JSON as the source of truth
- [ ] Add --prefer-md flag: resolve conflicts by treating Markdown as the source of truth
- [ ] Add --interactive flag: prompt the user to choose per-conflict when both sides have diverged
- [ ] Add --dry-run flag: preview sync actions without writing any files
- [ ] Handle the 'both sides changed' case: detect mutual divergence and abort with a clear error unless a conflict strategy is specified
- [ ] Write tests for all sync directions and conflict scenarios (no changes, JSON-only, MD-only, both changed, each --prefer-* flag)
- [ ] Update CLI help text and CLAUDE.md documentation to reflect the new sync command
- [ ] Support per-node conflict resolution: when multiple nodes have diverged on both sides, --interactive should prompt for each conflict individually, and --prefer-* flags should apply as a batch strategy across all conflicts. Add a --report flag that lists all conflicts without resolving any.

### CH30 — Implement MCP Server

Add an MCP server at src/mcp/index.ts that wraps SysProM's programmatic API as MCP tools over stdio transport. Add sysprom-mcp bin entry to package.json. Add @modelcontextprotocol/sdk dependency. Add .mcp.json to the plugin referencing npx -y sysprom-mcp. Tools: validate, stats, query-nodes, query-node, query-relationships, trace, add-node, remove-node, update-node, add-relationship, remove-relationship, timeline, state-at.

- Implements: D32

#### Plan

- [ ] Add @modelcontextprotocol/sdk as dependency
- [ ] Create src/mcp/index.ts — MCP server wrapping programmatic API
- [ ] Register MCP tools: validate, stats, query-nodes, query-node, query-relationships, trace
- [ ] Register MCP tools: add-node, remove-node, update-node, add-relationship, remove-relationship
- [ ] Register MCP tools: timeline, state-at, search
- [ ] Add sysprom-mcp bin entry to package.json
- [ ] Add .mcp.json to plugin referencing npx -y sysprom-mcp
- [ ] Add tests for MCP server tool handlers
- [ ] Update plugin README with MCP server documentation
- [ ] Sync JSON to Markdown

### CH31 — Implement Keyed Provider Registry for External Formats

- Implements: D33

- Status: proposed

#### Plan

- [ ] Define ExternalFormatProvider interface, ExternalProject, and ExternalFeature types in src/providers/provider.ts
- [ ] Define providerRegistry const object, ProviderKey type, getProvider() and detectProvider() functions in src/providers/provider.ts
- [ ] Move src/speckit/ to src/providers/speckit/, implement ExternalFormatProvider interface, update all imports across codebase
- [ ] Implement src/providers/superpowers/project.ts — detect docs/superpowers/{specs,plans}/ directories, list/get features by date-prefixed directory names
- [ ] Implement src/providers/superpowers/parse.ts — parse design docs into decision nodes with options, parse plan docs into change nodes with checkbox tasks
- [ ] Implement src/providers/superpowers/generate.ts — generate superpowers-format spec and plan markdown from SysProMDocument
- [ ] Register superpowers provider in providerRegistry
- [ ] Refactor speckit-import/export/sync/diff operations to dispatch through the provider registry with auto-detection and optional --format flag
- [ ] Update Zod input schemas for operations to accept format?: z.enum(providerKeys) derived from registry
- [ ] Add unit tests for superpowers parse (design doc round-trip) and generate (plan doc round-trip)
- [ ] Add unit tests for provider registry auto-detection and explicit format dispatch
- [ ] Update CLI commands to expose --format flag, update help text
- [ ] Run full test suite, validate sysprom.spm.json, sync SysProM/ markdown

### CH32 — Implement Safe Graph Removal

- Implements: D34

- Status: in_progress

#### Plan

- [ ] Add RemovalImpact type (orphaned rels, chain breaks, subsystem loss, scope refs, governance loss, traceability loss)
- [ ] Implement impactReport(doc, id) function that computes RemovalImpact without mutating
- [ ] Implement must_follow chain repair: when removing node B from A→B→C, relink to A→C
- [ ] Implement scope and operation reference cleanup (remove ghost IDs from scope[] and operations[].target)
- [ ] Refactor removeNode: default to soft delete (set status: retired), --hard flag for physical removal with chain repair and cleanup
- [ ] Add --recursive guard: --hard on nodes with non-empty subsystems requires --recursive, otherwise refuse
- [ ] Refactor removeRelationship: add --repair flag for must_follow chain relinking
- [ ] Return structured impact summary from both operations (nodes affected, chains repaired, refs cleaned)
- [ ] Add unit tests: soft delete preserves edges, hard delete repairs chains, --recursive guard, impact report accuracy
- [ ] Update CLI commands (spm remove node, spm update remove-rel) to expose --hard, --recursive, --repair flags
- [ ] Run full test suite, validate sysprom.spm.json, sync SysProM/ markdown
- [ ] Implement retired node relationship guard in addRelationship: refuse operational rel types (depends_on, implements, constrained_by, must_follow, governed_by, affects, etc.) when either endpoint has status: retired; allow supersedes, derived_from, references
- [ ] Add retired node relationship check to validate operation (report as issue, not just warning)
- [ ] Add unit tests for retired relationship guard: refused types throw, allowed types succeed, validate flags existing violations

### CH33 — Implement Graph Mutation Safety Guards

- Implements: D35
- Depends on: CH32

- Status: complete

#### Plan

- [ ] Define RELATIONSHIP_ENDPOINT_TYPES map: for each relationship type, list valid source and target node types
- [ ] Add duplicate check to addRelationship: refuse if identical (from, type, to) already exists
- [ ] Add endpoint type validation to addRelationship: refuse if source or target node type is not in the valid set for the relationship type
- [ ] Add type-change guard to updateNode: when changing node type, check all existing relationships still have valid endpoint types, refuse if any would be invalidated
- [ ] Add retirement impact to updateNode: when setting status to retired, compute and return active dependents via operational relationships (reuse impactReport from CH32)
- [ ] Add duplicate relationship check to validate operation
- [ ] Add endpoint type validity check to validate operation
- [ ] Add retirement dependency check to validate operation (flag operational rels to/from retired nodes)
- [ ] Unit tests: duplicate relationship refused by addRelationship, flagged by validate
- [ ] Unit tests: endpoint type validation — valid combos succeed, invalid combos refused, validate flags existing violations
- [ ] Unit tests: type-change guard — refuse when existing rels would be invalidated, allow when all rels remain valid
- [ ] Unit tests: retirement impact — updateNode returns active dependents, validate flags operational rels to retired nodes
- [ ] Run full test suite, validate sysprom.spm.json, sync SysProM/ markdown

### CH34 — Add default input resolution and init command

Make input arg optional with priority-based auto-detection (.spm.json > .spm.md > .spm/ > glob). Rework init command to support optional path with context-dependent format and --format flag.

- Implements: D36

- Status: complete

Scope:
- src/cli/shared.ts
- src/cli/commands/init.ts

#### Plan

- [x] Add resolveInput() function to shared.ts
- [x] Make inputArg optional in shared.ts
- [x] Update all commands to use resolveInput()
- [x] Rework init command with optional path and --format flag
- [x] Write tests for resolveInput
- [x] Write tests for init command

