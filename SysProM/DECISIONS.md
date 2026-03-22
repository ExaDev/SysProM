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

- [x] proposed (2026-03-21)
- [x] accepted (2026-03-21)
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

- [x] proposed (2026-03-21)
- [x] accepted (2026-03-21)
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

- [x] proposed (2026-03-21)
- [x] accepted (2026-03-21)
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

### D8 — Support External Resources via Reference and Internalisation

- Affects:
  - EL7
  - R5
  - R1
  - INV3
  - ART1
  - ART2
  - ART3
- Must preserve:
  - INV19
  - INV20
  - INV21
  - INV22
  - INV18
  - POL19
  - INV3
  - POL20

Context: Nodes often relate to resources outside the graph.
The model must handle this without coupling to a specific serialisation format.

Options:
- D8-O1: No external reference support — all content must be internalised
- D8-O2: External references only — all content is by pointer
- D8-O3: Both approaches supported independently or together, with serialisation-specific identifiers and typed roles

Chosen: D8-O3

Rationale: Internalisation enables portability. References enable traceability.
Supporting both gives implementors flexibility without losing either property.

#### Lifecycle

- [x] proposed
- [x] accepted
- [x] implemented
- [ ] superseded

### D9 — Allow Array-of-Lines for Text Fields

- Affects:
  - R5
  - R1
- Must preserve: INV21

Context: JSON does not support multiline strings.
Long descriptions serialised as single strings with embedded \n are hard to read and produce poor diffs.
An array of lines preserves readability in serialised form.

Options:
- D9-O1: Single string only — use \n for newlines
- D9-O2: Array of strings only — always use arrays
- D9-O3: Either form accepted — string for short content, array for multiline

Chosen: D9-O3

Rationale: Short descriptions gain nothing from being wrapped in an array.
Long descriptions gain readability and diff quality from line-per-element arrays.
Accepting both avoids forcing a style while enabling better ergonomics where it matters.

#### Lifecycle

- [x] proposed
- [x] accepted
- [x] implemented
- [ ] superseded

### D10 — Use Strict Enums for Core Types

- Affects: R5
- Must preserve:
  - INV22
  - INV18

Context: SysProM's purpose is provenance and traceability.
If relationship types, node types, and statuses are arbitrary strings, layer constraints cannot be enforced, labels cannot be derived for rendering, and semantic validation is impossible.
The extensibility section says extensions MUST NOT violate core constraints, but an open string type makes that unenforceable.

Options:
- D10-O1: Open strings with examples — any value accepted, core types documented only
- D10-O2: Strict enums — only declared values accepted, extensions must add to the enum

Chosen: D10-O2

Rationale: Strict enums enable schema-level validation, type-safe label derivation, and enforceable layer constraints.
The DRY labelledEnum pattern ensures each type is defined once with its label, eliminating duplication.

#### Lifecycle

- [x] proposed
- [x] accepted
- [x] implemented
- [ ] superseded

### D11 — Only Link to Present Files in README

- Affects: R1
- Must preserve: POL19

Context: The README generator was producing navigation links and document role entries for all possible files (INTENT, INVARIANTS, STATE, DECISIONS, CHANGES) regardless of whether the subsystem had nodes of those types.
This created dead links in subsystem READMEs.

Options:
- D11-O1: Always link to all files — accept dead links as informational
- D11-O2: Only link to files that will be created based on present node types

Chosen: D11-O2

Rationale: Dead links mislead readers and break tooling. Links should reflect reality.

#### Lifecycle

- [x] proposed
- [x] accepted
- [x] implemented
- [ ] superseded

### D12 — Remove Navigation and Document Roles from README

- Affects: R1

Context: The README contained a Navigation section and a Document Roles table that restated what the filenames already communicate.
Anyone looking at a folder with INTENT.md, DECISIONS.md, etc. already knows what they contain.

Options:
- D12-O1: Keep both Navigation and Document Roles
- D12-O2: Keep Document Roles table only
- D12-O3: Remove both — the filenames are self-documenting

Chosen: D12-O3

Rationale: Removing redundant sections reduces noise and maintenance burden. The file naming convention is the documentation.

#### Lifecycle

- [x] proposed
- [x] accepted
- [ ] implemented
- [ ] superseded

### D13 — Layer-Dependent Invariant Preservation

- Affects: INV3
- Must preserve: INV3

Context: INV3 required every decision to identify preserved invariants.
Operational decisions (naming, tooling, presentation) genuinely have no invariants at risk.
Forcing must_preserve on these creates friction that discourages recording decisions, which defeats SysProM's provenance purpose.
SysProM already distinguishes domain nodes (intent, concept, capability, element, invariant) from non-domain nodes (realisation, policy, protocol, etc.).

Options:
- D13-O1: Keep INV3 as MUST for all decisions
- D13-O2: Soften INV3 to SHOULD for all decisions
- D13-O3: Add decision type/level classification
- D13-O4: MUST when affecting domain nodes, SHOULD when affecting only non-domain nodes — determined automatically from affects relationships

Chosen: D13-O4

Rationale: Automatic classification from affects relationships means no user burden.
Domain nodes define what the system IS — decisions affecting them must consider invariants.
Non-domain nodes define how the system works — decisions affecting only these are operational.
Leverages the existing layer model rather than adding new concepts.

#### Lifecycle

- [x] proposed
- [x] accepted
- [x] implemented
- [ ] superseded

### D14 — Internalise Design Archive into SysProM JSON

- Affects:
  - ART1
  - ART2
  - ART3

Context: The distilled/ folder contained four reference documents (Specification, Comparisons, Examples, Naming) produced during SysProM's design.
These were external to the JSON but contained valuable content.
The specification is already captured as the JSON itself.
The comparisons, examples, and naming rationale could be modelled as artefact nodes with subsystems.

Options:
- D14-O1: Keep distilled/ as separate files, reference from JSON
- D14-O2: Internalise key content as artefact nodes with subsystems in the JSON

Chosen: D14-O2

Rationale: Internalising makes the JSON self-contained. Artefact nodes with subsystems naturally model documents that contain structured content.

#### Lifecycle

- [x] proposed
- [x] accepted
- [x] implemented
- [ ] superseded

### D15 — Size-Based Subsystem Splitting

- Affects: R1
- Must preserve: POL20

Context: Small subsystems (e.g. 6 node type definitions) are cleaner as single .spm.md files.
Large subsystems (e.g. 24 relationship type definitions at 107 lines) become unwieldy in a single file.
The file type count heuristic alone doesn't catch single-type subsystems that are too long.

Options:
- D15-O1: Split only by file type count — single type always stays as one file
- D15-O2: Split by file type count AND line count — single type files over 100 lines become folders

Chosen: D15-O2

Rationale: Combining both heuristics keeps small subsystems compact while splitting large ones for readability.

#### Lifecycle

- [x] proposed
- [x] accepted
- [x] implemented
- [ ] superseded

### D16 — Add Bidirectional Spec-Kit Interoperability

- Affects: EL3
- Must preserve:
  - INV4
  - INV5
  - INV6
  - INV21
  - INV22

Context: SysProM can model Spec-Kit workflows as nodes and relationships, but could not read or write actual Spec-Kit files.
Users working with Spec-Kit (spec.md, plan.md, tasks.md, constitution.md, checklist.md) had no way to import their existing work into SysProM or export SysProM graphs to Spec-Kit format.
A parser+generator pair enables lossless round-trips between both ecosystems.

Options:
- D16-O1: Import-only — parse Spec-Kit files into SysProM nodes, no export
- D16-O2: Export-only — generate Spec-Kit files from SysProM nodes, no import
- D16-O3: Full bidirectional with sync — import, export, sync, and diff commands

Chosen: D16-O3

Rationale: Full bidirectional support allows users to start in either ecosystem and keep both in sync. Import-only or export-only would force a one-way migration rather than enabling collaborative workflows.

#### Lifecycle

- [x] proposed
- [x] accepted
- [x] implemented
- [ ] superseded

### D17 — Add Task Subcommand for Change Plan Tracking

- Affects: CH14

Context: Change nodes have a plan field (array of {description, done} tasks) defined in the schema, but no CLI command existed to manipulate it.
Subagents working in a Claude Code session had no way to discover, claim, or progress through tasks purely via CLI.
A dedicated task command enables fully CLI-driven subagent workflows against sysprom.spm.json files.

Options:
- D17-O1: Extend the update command with --plan-add and --plan-done flags
- D17-O2: Add a dedicated top-level task command with list/add/done/undone subcommands

Chosen: D17-O2

Rationale: A dedicated command keeps the update command focused on node fields and provides a cleaner interface for agents scripting task workflows. The speckit command established this subcommand pattern.

#### Lifecycle

- [x] proposed
- [x] accepted
- [x] implemented
- [ ] superseded

### D18 — Recursive Change Nodes for Planning

Phases and tasks are structurally identical — a unit of work that can contain smaller units. Rather than maintaining separate stage nodes for phases and change nodes for tasks, use a single recursive model: change nodes with subsystems containing more change nodes. This eliminates the artificial three-layer model (protocol, stage, change, task) in favour of uniform recursive composition via SysProM's native subsystem mechanism.

- Must preserve: INV2

- Status: accepted

Context: The spec-kit planning integration initially used stage nodes for phases and change nodes for tasks, with flat plan:Task[] arrays for leaf items. This created three separate mechanisms for what is conceptually the same thing.

Options:
- D18-OPT-A: Keep separate stage nodes for phases and change nodes for tasks (three-layer model)
- D18-OPT-B: Use recursive change nodes with subsystems for unlimited nesting depth (single mechanism)

Chosen: D18-OPT-B

Rationale: A phase is just a task with children. Using change nodes with recursive subsystems provides unlimited nesting depth, eliminates the stage node type from planning, and reuses SysProM's existing subsystem recursion rather than inventing a parallel mechanism.

#### Lifecycle

- [ ] options

### D19 — Extend Lifecycle with Temporal Timestamps

Extend lifecycle values from boolean to boolean | string, where string values are ISO dates indicating when a state was reached. Date strings are truthy, so existing code using truthiness checks works unchanged. This single schema change enables timestamped lifecycle, temporal snapshots, and event ordering.

- Must preserve: INV2

- Status: accepted

Context: SysProM had no temporal support. The lifecycle field tracked state completion but not when states were reached.

Options:
- D19-OPT-A: Add separate timestamp fields (created_at, updated_at) to nodes
- D19-OPT-B: Extend lifecycle values from boolean to boolean | string (ISO date)

Chosen: D19-OPT-B

Rationale: One schema change enables all three temporal capabilities: timestamped lifecycle, temporal snapshots via stateAt queries, and event ordering via timeline queries. Date strings are truthy, ensuring backwards compatibility.

### D20 — Adopt Commander.js for CLI

Choose a CLI framework to replace manual argument parsing, enabling automatic documentation generation from command definitions.

- Must preserve: INV2

- Status: accepted

Context: The CLI uses manual process.argv parsing with parseFlag() helpers duplicated across 11 command files. Usage text is embedded in console.error() strings, making automatic documentation generation impossible. A structured CLI framework is needed to enable programmatic access to command metadata for doc generation.

Options:
- D20-OPT-A: Zero dependencies, lowest migration effort, programmatic command tree access. No built-in markdown export but command metadata is accessible via public API.
- D20-OPT-B: Built-in doc generation via oclif readme. Higher dependency count (~28), slower startup (~100ms), requires class-per-command refactor, uses colon-delimited subcommands.
- D20-OPT-C: Modern TypeScript-first alternatives (Citty, Clipanion, Stricli). Zero dependencies but none have built-in markdown doc generation.
- D20-OPT-D: Keep manual process.argv parsing. No migration effort but no automatic doc generation possible.

Chosen: D20-OPT-A

Rationale: Commander.js has zero dependencies, the lowest migration effort from manual argv parsing, and exposes a public API for walking the command tree programmatically. This enables a simple doc generation script without adopting a heavier framework.

#### Lifecycle

- [x] proposed (2026-03-21)
- [x] accepted (2026-03-21)

### D21 — Adopt TypeDoc for Documentation

Choose TypeDoc with typedoc-plugin-zod for API documentation generation, producing both markdown (committed) and HTML (for GitHub Pages) output.

- Must preserve: INV2

- Status: accepted

Context: The library has a rich public API (~70 exports) but no automated documentation generation. TypeDoc generates browsable docs from TypeScript source and JSDoc comments. The typedoc-plugin-zod plugin resolves rendering issues with Zod-inferred types.

Options:
- D21-OPT-A: TypeDoc with typedoc-plugin-markdown for markdown output and typedoc-plugin-zod for clean Zod type rendering. Supports projectDocuments for including CLI docs in the HTML site.
- D21-OPT-B: Docusaurus, Starlight, or VitePress for a full documentation site framework. More features but heavier dependencies and over-engineered for a small project.

Chosen: D21-OPT-A

Rationale: TypeDoc directly generates docs from TypeScript source with minimal configuration. The typedoc-plugin-zod plugin resolves the z.infer rendering issue without requiring explicit interfaces. The projectDocuments feature allows CLI docs to be included in the same HTML site.

#### Lifecycle

- [x] proposed (2026-03-21)
- [x] accepted (2026-03-21)

### D22 — Adopt Turborepo for Build Orchestration

Choose Turborepo for build task orchestration with dependency management and output caching.

- Must preserve: INV2

- Status: accepted

Context: The build pipeline has multiple tasks with dependencies (typecheck, compile, schema generation, doc generation) managed via chained pnpm scripts. Turborepo provides task dependency graphs, parallel execution, and output caching.

Options:
- D22-OPT-A: Turborepo with task dependency graph, input/output declarations, and automatic caching. Handles output directory cleaning on cache hits.
- D22-OPT-B: Keep chained pnpm scripts with && operators. Simpler but no caching, no parallelism, no dependency graph.

Chosen: D22-OPT-A

Rationale: Turborepo provides automatic caching (FULL TURBO on repeat builds), parallel task execution, and explicit dependency declarations in turbo.json. It manages output directory cleaning automatically.

#### Lifecycle

- [x] proposed (2026-03-21)
- [x] accepted (2026-03-21)

### D23 — Enforce Conventional Commits and Automated Releases

Adopt commitlint for commit message enforcement, semantic-release for automated publishing, and husky for git hook management.

- Must preserve: INV2

- Status: accepted

Context: The project uses conventional commit messages informally. Enforcing them with tooling enables automated releases, changelogs, and consistent commit history.

Options:
- D23-OPT-A: commitlint with conventional commits preset, semantic-release with all commit types triggering releases, and husky for pre-commit and commit-msg hooks.
- D23-OPT-B: Manual release process with no commit message enforcement.

Chosen: D23-OPT-A

Rationale: Automated enforcement ensures every commit follows conventional format, enabling semantic-release to determine version bumps and generate changelogs. All commit types trigger patch releases so no work is excluded.

#### Lifecycle

- [x] proposed (2026-03-22)
- [x] accepted (2026-03-22)

### D24 — Eliminate Type Assertions

Remove all as type coercions and replace them with Zod schema validation, type guard functions, and properly typed parameters.

- Must preserve: INV2

- Status: accepted

Context: The codebase contained numerous as type assertions that bypass the type checker, telling the compiler to trust the developer rather than proving correctness at runtime.

Options:
- D24-OPT-A: Replace all as assertions with runtime validation using Zod .is() type guards, instanceof checks, and properly typed function parameters.
- D24-OPT-B: Keep type assertions where TypeScript cannot express the constraint. Accept the risk of runtime type mismatches.

Chosen: D24-OPT-A

Rationale: Runtime validation catches type errors that assertions silently mask. The Zod schema provides .is() type guards via defineSchema — using them is both safer and consistent with the single-source-of-truth pattern.

#### Lifecycle

- [x] proposed (2026-03-22)
- [x] accepted (2026-03-22)

### D25 — Ship Compiled JavaScript

Switch package entry points (main, exports, bin) from TypeScript source to compiled JavaScript in dist/, removing the tsx runtime dependency for consumers.

- Must preserve: INV2

- Status: accepted

Context: The package previously shipped TypeScript source and required tsx at runtime. Consumers needed tsx as a dependency to use the CLI or import the library.

Options:
- D25-OPT-A: Point main, exports, and bin to compiled dist/ output. Move tsx to devDependencies. Consumers only need Node.js.
- D25-OPT-B: Keep shipping TypeScript source with tsx as a runtime dependency.

Chosen: D25-OPT-A

Rationale: Shipping compiled JavaScript removes the tsx runtime dependency, reduces install size, and follows standard npm package conventions.

#### Lifecycle

- [x] proposed (2026-03-22)
- [x] accepted (2026-03-22)

### D26 — Auto-Generate Node IDs

Auto-generate node IDs from a type-prefix convention when --id is omitted from the add command.

- Must preserve: INV2

- Status: accepted

Context: Adding nodes via the CLI required manually specifying IDs like D26 or CH24. This is tedious and error-prone, especially when the user must check existing IDs to avoid collisions.

Options:
- D26-OPT-A: Auto-generate IDs from NODE_ID_PREFIX map + highest existing number. Make --id optional.
- D26-OPT-B: Keep --id required. Users must manually track IDs.

Chosen: D26-OPT-A

Rationale: The existing ID convention (D for decisions, CH for changes, INV for invariants, etc.) is consistent enough to derive automatically. The nextId function scans existing nodes for the highest number with that prefix and increments.

#### Lifecycle

- [x] proposed (2026-03-22)
- [x] accepted (2026-03-22)

### D27 — CLI UX Improvements

Add auto-generated option IDs, init command, auto-sync, coloured output, JSON output on mutations, full-text search, graph export, rename, stricter validation, shell completions, and dry-run mode.

- Must preserve: INV2

- Status: accepted

Context: The CLI covers core CRUD operations but lacks quality-of-life features that reduce friction for frequent use.

Options:
- D27-OPT-A: Implement all suggested UX improvements as a single cohesive change.
- D27-OPT-B: Implement incrementally, prioritising the most impactful features.

Chosen: D27-OPT-A

Rationale: Each improvement targets a specific friction point: auto-IDs reduce manual bookkeeping, colour improves scanability, search/graph/rename add power-user workflows, and dry-run/completions improve developer experience.

#### Lifecycle

- [x] proposed (2026-03-22)
- [x] accepted (2026-03-22)

### D28 — Unify CLI with Zod-Driven Command Definitions

Replace separate Commander definitions, run() functions, and doc generator metadata with a single defineCommand pattern using Zod schemas.

- Must preserve: INV2

- Status: accepted

Context: The CLI had three layers describing the same information independently: Zod schemas, Commander definitions, and run() functions with manual parseFlag helpers.

Options:
- D28-OPT-A: defineCommand pattern with Zod schemas as single source of truth
- D28-OPT-B: Keep separate layers

Chosen: D28-OPT-A

Rationale: A single defineCommand pattern eliminates duplication. Commander program, documentation, and validation are all derived from the Zod schema.

#### Lifecycle

- [x] proposed (2026-03-22)
- [x] accepted (2026-03-22)

