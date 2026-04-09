---
title: "CHANGES"
doc_type: "changes"
---

# CHANGES

## Changes

### CHG1 — Initial Model

Establishes the core domain model with layered abstraction, decisions, changes, and invariants.

- Affects:
  - [DEC1](./DECISIONS.md#dec1--separate-domain-from-process-from-evolution)
  - [DEC2](./DECISIONS.md#dec2--make-decisions-first-class-entities)
  - [DEC7](./DECISIONS.md#dec7--append-only-history)

Scope:
- INT1
- CON1
- CON2
- CON3
- CON4
- CAP1
- CAP2
- CAP3
- CAP4
- CAP5
- ELEM1
- ELEM4
- INV1
- INV2
- INV3
- INV4
- INV5
- INV6
- INV7
- PRIN1
- PRIN2
- PRIN3
- PRIN4
- PRIN5

Operations:
- add INT1
- add ELEM1
- add ELEM4
- add ELEM6

#### Lifecycle

- [x] defined
- [x] introduced
- [x] complete

### CHG2 — Add Process Modelling

Extends the model with process, artefact, and projection node families.

- Affects:
  - [DEC3](./DECISIONS.md#dec3--distinguish-invariants-from-principles-from-policies)
  - [DEC4](./DECISIONS.md#dec4--add-process-modelling)

Scope:
- CON5
- CAP6
- ELEM2
- ELEM3
- ELEM5
- INV8
- INV9
- INV10
- INV11

Operations:
- add ELEM2
- add ELEM3
- add ELEM5

#### Lifecycle

- [x] defined
- [x] introduced
- [x] complete

### CHG3 — Add File Representation Conventions

Defines how SysProM may be encoded in files, including single-document, multi-document, and recursive folder forms.

- Affects:
  - [DEC5](./DECISIONS.md#dec5--format-agnostic-with-markdown-as-primary-representation)
  - [DEC6](./DECISIONS.md#dec6--recursive-composition-using-same-conventions)

Scope:
- CON6
- CAP7
- REAL1
- REAL2
- REAL3
- REAL4
- REAL5
- ELEM8
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
- add ELEM8
- add REAL1
- add REAL2
- add REAL3
- add REAL4
- add REAL5

#### Lifecycle

- [x] defined
- [x] introduced
- [x] complete

### CHG4 — Add External Resources Model

Adds the external reference and internalisation mechanism with typed roles.

- Affects:
  - [DEC8](./DECISIONS.md#dec8--support-external-resources-via-reference-and-internalisation)
  - [DEC4](./DECISIONS.md#dec4--add-process-modelling)
  - [DEC2](./DECISIONS.md#dec2--make-decisions-first-class-entities)

Scope:
- CON7
- CAP8
- ELEM7
- INV19
- INV20
- POL6

Operations:
- add CON7
- add CAP8
- add ELEM7

#### Lifecycle

- [x] defined
- [x] introduced
- [x] complete

### CHG5 — Add Lifecycle Protocols

Adds the decision, change, and node lifecycle state machines as protocols with stages and ordering.

- Affects: [DEC4](./DECISIONS.md#dec4--add-process-modelling)

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

### CHG6 — Encode Full Normative Specification

Adds conformance requirements, missing invariants, security and extensibility policies, non-linear evolution capabilities, and complete node/relationship type vocabularies to make the JSON self-contained.

- Affects: [DEC2](./DECISIONS.md#dec2--make-decisions-first-class-entities)

Scope:
- INV28
- INV29
- INV30
- INV31
- INV32
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
- ELEM9
- ELEM10
- CAP9
- CAP10
- CAP11
- CON8

Operations:
- add CON8
- add ELEM9
- add ELEM10

#### Lifecycle

- [x] defined
- [x] introduced
- [x] complete

### CHG7 — Add Text Field Duality

Adds support for text fields (description, context, rationale, internalised) to accept either a string or an array of strings.
Updates the JSON schema, Zod definitions, and specification.

- Affects: [DEC9](./DECISIONS.md#dec9--allow-array-of-lines-for-text-fields)

Scope:
- INV21
- DEC8

Operations:
- add INV21
- add DEC8
- update REAL5 — JSON schema updated to accept string | string[] for text fields
- update REAL1 — Specification updated with §6.2 Text Fields

#### Lifecycle

- [x] defined
- [x] introduced
- [x] complete

### CHG8 — Switch to Strict Enums with Labelled Definitions

Replaces open z.string() types with z.enum() for node types, statuses, relationship types, and external reference roles.
Introduces labelledEnum() helper that defines values and labels in one place.
Derives SECTION_LABELS, RELATIONSHIP_LABELS, and reverse lookups from the label maps.

- Affects: [DEC10](./DECISIONS.md#dec10--use-strict-enums-for-core-types)

Scope:
- INV22
- DEC8
- REAL5

Operations:
- add INV22
- add DEC8
- update REAL5 — JSON schema now uses enum instead of string with examples

#### Lifecycle

- [x] defined
- [x] introduced
- [x] complete

### CHG9 — Fix Dead Links in Subsystem READMEs

README generator now only links to files that contain nodes for the given subsystem.

- Affects: [DEC11](./DECISIONS.md#dec11--only-link-to-present-files-in-readme)

Scope:
- POL19
- DEC8
- REAL1

Operations:
- add POL19
- add DEC8
- update REAL1 — json-to-md updated to check present node types before generating links

#### Lifecycle

- [x] defined
- [x] introduced
- [x] complete

### CHG10 — Remove Navigation and Document Roles from README

Removes the Navigation section and Document Roles table from generated READMEs. The file naming convention is self-documenting.

- Affects: [DEC12](./DECISIONS.md#dec12--remove-navigation-and-document-roles-from-readme)

Scope:
- DEC8
- REAL1

Operations:
- update REAL1 — README generation simplified to omit navigation and document roles

#### Lifecycle

- [x] defined
- [ ] introduced
- [ ] complete

### CHG11 — Make Invariant Preservation Layer-Dependent

Updates INV3 to require must_preserve only when a decision affects domain nodes.
Decisions affecting only non-domain nodes (realisations, policies, process nodes) should but are not required to identify preserved invariants.

- Affects: [DEC13](./DECISIONS.md#dec13--layer-dependent-invariant-preservation)

Scope:
- INV3
- DEC8

Operations:
- update INV3 — Reworded to distinguish domain and non-domain affects

#### Lifecycle

- [x] defined
- [x] introduced
- [x] complete

### CHG12 — Internalise Design Archive

Internalises content from distilled/ into the SysProM JSON.
Comparisons become an artefact node (ART1) with comparison summaries as subsystem concepts.
Worked examples become artefact nodes (ART2, ART3) with example SysProM graphs as subsystems.
Naming rationale is already captured in D8.
Specification is already captured as the JSON itself — distilled/Specification.md is redundant.

- Affects: [DEC14](./DECISIONS.md#dec14--internalise-design-archive-into-sysprom-json)

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

### CHG13 — Add Size-Based Subsystem Splitting and Auto-Grouping

Subsystems that would produce a single file over 100 lines are now split into multi-document folders.
Subsystems of the same node type are automatically grouped into type-named directories (e.g. elements/, artefacts/).
Both heuristics are automatic — no user configuration needed.

- Affects: [DEC15](./DECISIONS.md#dec15--size-based-subsystem-splitting)

Scope:
- POL20
- DEC8
- REAL1

Operations:
- add POL20
- add DEC8
- update REAL1 — json-to-md updated with line count threshold and auto-grouping

#### Lifecycle

- [x] defined
- [x] introduced
- [x] complete

### CHG14 — Implement Spec-Kit File Support

New speckit/ module provides bidirectional conversion between Spec-Kit project files and SysProM nodes.
Parser maps constitution.md → invariant/protocol nodes, spec.md → artefact/capability/invariant nodes, plan.md → artefact/element/gate nodes, tasks.md → stage/change nodes, checklist.md → gate nodes.
Generator reverses the mapping to produce valid Spec-Kit markdown from SysProM graph data.
CLI adds import, export, sync, and diff subcommands under sysprom speckit.
Tests cover all 5 parser functions (40 cases) and all 5 generator functions (28 cases), plus round-trip fidelity.

- Affects: [DEC16](./DECISIONS.md#dec16--add-bidirectional-spec-kit-interoperability)

Scope:
- DEC16
- ELEM3
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

### CHG15 — Implement task CLI Command for Subagent Plan Tracking

New task command provides list, add, done, and undone subcommands for manipulating the plan array on change nodes.
Two new mutate helpers (addPlanTask, updatePlanTask) follow the immutable doc-in/doc-out pattern of the existing mutate module.
task list supports --pending and --json flags enabling agent scripting via jq.
AGENTS.md documents the complete subagent workflow: discover, claim, progress, complete.

- Affects: [DEC17](./DECISIONS.md#dec17--add-task-subcommand-for-change-plan-tracking)

Scope:
- DEC17
- CHG14

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

### CHG16 — Implement Plan Command with Recursive Task Model

New spm plan command with five subcommands: init (scaffold feature skeleton), add-task (add tasks with optional --parent for nesting), status (workflow completeness report), progress (per-task ASCII progress bars), and gate (phase readiness validation). Phases are change nodes in PROT-IMPL.subsystem; subtasks nest recursively via child subsystems. Includes isTaskDone and countTasks helpers for recursive completion tracking. Updated generateTasks and parseTasks to use change-only model.

- Implements: [DEC18](./DECISIONS.md#dec18--recursive-change-nodes-for-planning)

Scope:
- ["EL-CLI","EL-SPECKIT"]

#### Lifecycle

- [x] complete

### CHG17 — Implement Temporal Support

Extended lifecycle schema to accept ISO date strings alongside booleans. Added temporal query functions: timeline (chronological events), nodeHistory (single node history), stateAt (system state at a point in time). Updated markdown rendering and parsing for date lifecycle values. Added timeline and state-at subcommands to spm query.

- Implements: [DEC19](./DECISIONS.md#dec19--extend-lifecycle-with-temporal-timestamps)

#### Lifecycle

- [x] complete

### CHG18 — Migrate CLI to Commander.js

Replace manual process.argv parsing across all CLI command files with Commander.js declarative command definitions. Add a doc generation script that walks Commander's command tree to produce markdown files for TypeDoc's projectDocuments feature.

- Implements: [DEC20](./DECISIONS.md#dec20--adopt-commanderjs-for-cli)

#### Lifecycle

- [x] proposed (2026-03-21)
- [x] implemented (2026-03-21)
- [x] complete

### CHG19 — Add TypeDoc Documentation Pipeline

Configure TypeDoc for markdown API docs (docs/api/), HTML site generation (site/), and auto-generated CLI reference (docs/cli/) from Commander.js metadata. Add @param/@returns JSDoc tags to all public functions. Use typedoc-plugin-zod to render Zod-inferred types cleanly.

- Implements: [DEC21](./DECISIONS.md#dec21--adopt-typedoc-for-documentation)

Scope:
- ELEM3

Operations:
- add — Create typedoc.json and typedoc.html.json configuration files
- add — Create scripts/generate-cli-docs.ts for auto-generating CLI docs from Commander metadata
- update — Add @param and @returns JSDoc tags to all public functions

#### Lifecycle

- [x] proposed (2026-03-21)
- [x] implemented (2026-03-21)
- [x] complete

### CHG20 — Add Turborepo Build Orchestration

Add turbo.json with task dependency graph for typecheck, compile, schema, test, and doc generation tasks. Restructure package.json scripts into atomic _-prefixed tasks orchestrated by turbo. Turbo manages output caching and directory cleaning.

- Implements: [DEC22](./DECISIONS.md#dec22--adopt-turborepo-for-build-orchestration)

Scope:
- ELEM3

Operations:
- add — Create turbo.json with task dependency graph and input/output declarations
- update — Restructure package.json scripts into atomic tasks with turbo entry points

#### Lifecycle

- [x] proposed (2026-03-21)
- [x] implemented (2026-03-21)
- [x] complete

### CHG21 — Add CI/CD Pipeline

Set up GitHub Actions CI workflow with quality checks, docs generation, GitHub Pages deployment, and npm publishing via OIDC trusted publishers. Add commitlint with husky hooks, semantic-release with all commit types triggering releases, and Dependabot for dependency updates.

- Implements: [DEC23](./DECISIONS.md#dec23--enforce-conventional-commits-and-automated-releases)

#### Lifecycle

- [x] proposed (2026-03-22)
- [x] implemented (2026-03-22)
- [x] complete

### CHG22 — Remove Type Assertions

Replace all as type coercions across library and CLI code with runtime validation. Use Zod .is() and .safeParse() for domain type narrowing, isRecord() for object checks, instanceof for error handling, and properly typed Commander action handlers.

- Implements: [DEC24](./DECISIONS.md#dec24--eliminate-type-assertions)

#### Lifecycle

- [x] proposed (2026-03-22)
- [x] implemented (2026-03-22)
- [x] complete

### CHG23 — Switch to Compiled Distribution

Update package.json entry points to reference compiled JavaScript in dist/. Move tsx from dependencies to devDependencies. Change CLI shebang to #!/usr/bin/env node.

- Implements: [DEC25](./DECISIONS.md#dec25--ship-compiled-javascript)

#### Lifecycle

- [x] proposed (2026-03-22)
- [x] implemented (2026-03-22)
- [x] complete

### CHG24 — Add Auto-ID Generation to CLI

Add nextId() function and NODE_ID_PREFIX map. Make --id optional on the add command — auto-generates from type prefix + next available number.

- Implements: [DEC26](./DECISIONS.md#dec26--auto-generate-node-ids)

#### Lifecycle

- [x] proposed (2026-03-22)
- [x] implemented (2026-03-22)
- [x] complete

### CHG25 — CLI UX Improvements

Add auto-option IDs, spm init, --sync, coloured output, --json on mutations, spm search, spm graph, spm rename, spm check, shell completions, and --dry-run.

- Implements: [DEC27](./DECISIONS.md#dec27--cli-ux-improvements)

#### Lifecycle

- [x] proposed (2026-03-22)
- [x] implemented (2026-03-22)
- [x] complete

### CHG26 — Implement defineCommand Pattern

Create defineCommand() with Zod schema introspection for Commander generation and doc extraction. Migrate all 16 CLI commands to single-file definitions in src/cli/commands/. Delete old run() files.

- Implements: [DEC28](./DECISIONS.md#dec28--unify-cli-with-zod-driven-command-definitions)

Scope:
- ELEM3

#### Lifecycle

- [x] proposed (2026-03-22)
- [x] implemented (2026-03-22)
- [x] complete

### CHG27 — Implement defineOperation Pattern

Create defineOperation infrastructure, define operations for all domain functions, refactor CLI commands to thin adapters, update exports.

- Implements: [DEC29](./DECISIONS.md#dec29--unify-library-api-and-cli-with-defineoperation)

Scope:
- ELEM3

#### Lifecycle

- [x] proposed (2026-03-22)
- [x] implemented (2026-03-22)
- [x] complete

### CHG28 — Implement Claude Code Plugin

Add a Claude Code plugin to the SysProM repository with skills, commands, hooks, and agents for provenance-aware development workflows. The plugin is pure markdown — no compiled code. Commands call spm if available, falling back to npx -y sysprom after npm publication. Distribution via GitHub marketplace (marketplace.json in .claude-plugin/).

- Implements: [DEC30](./DECISIONS.md#dec30--distribute-sysprom-as-a-claude-code-plugin)

#### Lifecycle

- [x] introduced

### CHG29 — Implement Bidirectional Sync Command

Add a unified 'spm sync' command that performs bidirectional synchronisation between JSON and Markdown representations by default, with flags for precise conflict handling.

- Implements: [DEC31](./DECISIONS.md#dec31--bidirectional-sync-by-default)

Scope:
- DEC31

#### Lifecycle

- [x] complete

### CHG30 — Implement MCP Server

Add an MCP server at src/mcp/index.ts that wraps SysProM's programmatic API as MCP tools over stdio transport. Add sysprom-mcp bin entry to package.json. Add @modelcontextprotocol/sdk dependency. Add .mcp.json to the plugin referencing npx -y sysprom-mcp. Tools: validate, stats, query-nodes, query-node, query-relationships, trace, add-node, remove-node, update-node, add-relationship, remove-relationship, timeline, state-at.

- Implements: [DEC32](./DECISIONS.md#dec32--add-mcp-server-for-programmatic-api-access)

#### Lifecycle

- [x] complete

### CHG31 — Implement Keyed Provider Registry for External Formats

- Implements: [DEC33](./DECISIONS.md#dec33--abstract-external-format-interop-into-keyed-provider-registry)

#### Lifecycle

- [x] proposed

### CHG32 — Implement Safe Graph Removal

- Implements: [DEC34](./DECISIONS.md#dec34--safe-graph-removal-with-soft-delete-default)

#### Lifecycle

- [x] complete

### CHG33 — Implement Graph Mutation Safety Guards

- Implements: [DEC35](./DECISIONS.md#dec35--graph-mutation-safety-guards)
- Depends on: [CHG32](#chg32--implement-safe-graph-removal)

#### Lifecycle

- [x] complete

### CHG34 — Add default input resolution and init command

Make input arg optional with priority-based auto-detection (.spm.json > .spm.md > .spm/ > glob). Rework init command to support optional path with context-dependent format and --format flag.

- Implements: [DEC36](./DECISIONS.md#dec36--default-input-resolution-and-init-command)

Scope:
- src/cli/shared.ts
- src/cli/commands/init.ts

#### Lifecycle

- [x] complete

### CHG35 — Add YAML Support and Multi-File JSON Formats

Implement YAML serialisation (single-file and multi-document) and multi-file JSON support with 8 new CLI commands.

- Implements: [DEC37](./DECISIONS.md#dec37--add-yaml-and-multi-file-json-serialisation-formats)

### CHG36 — Convert file-path positional args to flags

Move path/input/output positional arguments to --flags in init, json2md, md2json, sync, speckit (import/export/sync/diff), and plan init commands.

- Implements: [DEC38](./DECISIONS.md#dec38--convert-file-path-positional-args-to-flags)

### CHG37 — Fix MCP persistence bug

Add saveDocument calls to all MCP write operations

- Implements: [DEC39](./DECISIONS.md#dec39--fix-mcp-write-operations-not-persisting)

Scope:
- src/mcp/server.ts

### CHG38 — Fix init path suffix doubling

Check if path ends with correct suffix before appending

- Implements: [DEC40](./DECISIONS.md#dec40--fix-init-path-suffix-doubling)

Scope:
- src/cli/commands/init.ts

### CHG39 — Implement deterministic graph inference

Add four inference operations (impact, completeness, lifecycle, derived) exposed via CLI subcommands, MCP tools, and programmatic API. Pure graph traversal — no LLM dependency.

- Implements: [DEC41](./DECISIONS.md#dec41--add-deterministic-graph-inference)

Scope:
- src/operations/infer-impact.ts
- src/operations/infer-completeness.ts
- src/operations/infer-lifecycle.ts
- src/operations/infer-derived.ts
- src/cli/commands/infer.ts
- src/mcp/server.ts

#### Lifecycle

- [x] introduced

### CHG40 — Enhance impact analysis for bidirectional traversal and polarity

Add bidirectional BFS, polarity/strength on relationships, influence relationship type, full relationship classification, impactSummaryOp for hotspot analysis, and CLI/MCP surface changes.

- Implements: [DEC42](./DECISIONS.md#dec42--enhance-impact-analysis-for-sysmlarchimate-parity)

Scope:
- src/schema.ts
- src/operations/infer-impact.ts
- src/cli/commands/infer.ts
- src/mcp/server.ts
- src/index.ts
- tests/infer-impact.unit.test.ts

#### Lifecycle

- [x] introduced

### CHG41 — Implement system provenance profile and broaden endpoint modelling

Update endpoint validation rules, tests, and README guidance so SysProM better supports modelling product-system specification, design, and implementation provenance.

- Implements: [DEC43](./DECISIONS.md#dec43--expand-endpoint-type-matrix-for-governance-modelling)
- Modifies:
  - [CAP12](./INTENT.md#cap12--product-repository-modelling-guidance)
  - [ART4](./STATE.md#art4--system-provenance-profile-guidance)

Scope:
- src/endpoint-types.ts
- tests/validate.unit.test.ts
- tests/safety-guards.unit.test.ts
- README.md

#### Lifecycle

- [x] proposed (2026-03-31)
- [x] implemented (2026-03-31)

### CHG42 — Implement Graph-Native Task Lifecycle and Blockage Tracking

Removed the legacy plan-array task model and top-level task command, introduced lifecycle task transitions under plan commands, and derived blockage from depends_on and constrained_by gate readiness.

- Implements: [DEC44](./DECISIONS.md#dec44--adopt-graph-native-task-lifecycle-model)

Scope:
- CON2-CHANGE
- CAP4
- PROT2

#### Lifecycle

- [x] complete

### CHG43 — Add missing CLI flags for update/add commands

- Implements: [DEC45](./DECISIONS.md#dec45--cli-field-coverage-for-updateadd-commands)

Context: Incrementally resolving open GitHub issues by adding missing CLI flags.

Scope:
- CLI commands: update node, add realisation, add change

### CHG44 — Implement query relationship-types command

- Implements: [DEC46](./DECISIONS.md#dec46--cli-expose-relationship-endpoint-type-discovery)

Scope:
- src/operations/query-relationship-types.ts,src/cli/commands/query.ts

### CHG45 — Make decision validation lifecycle-aware

- Implements: [DEC47](./DECISIONS.md#dec47--validator-allow-intentionally-undecided-decisions)

Scope:
- src/operations/validate.ts,tests/validate.unit.test.ts

### CHG46 — Add external reference management commands

- Implements: [DEC48](./DECISIONS.md#dec48--cli-manage-external-references)

Scope:
- src/operations/add-external-reference.ts,src/operations/remove-external-reference.ts,src/cli/commands/update.ts

### CHG47 — Extend endpoint type support for relationships

- Implements: [DEC49](./DECISIONS.md#dec49--expand-relationship-endpoint-type-support)

Scope:
- src/endpoint-types.ts

### CHG48 — Integrate milestones into full relationship type ecosystem

- Implements: [DEC50](./DECISIONS.md#dec50--milestone-relationship-type-integration)

Scope:
- src/endpoint-types.ts

