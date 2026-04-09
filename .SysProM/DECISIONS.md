---
title: "DECISIONS"
doc_type: "decisions"
---

# DECISIONS

## Decisions

### DEC1 — Separate Domain From Process From Evolution

- Affects:
  - [ELEM1](./STATE.md#elem1--domain-node-family)
  - [ELEM2](./STATE.md#elem2--process-node-family)
  - [ELEM4](./STATE.md#elem4--evolution-node-family)
- Must preserve: [INV1](./INVARIANTS.md#inv1--concept-independence)

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

### DEC2 — Make Decisions First-Class Entities

- Affects: [ELEM4](./STATE.md#elem4--evolution-node-family)
- Must preserve:
  - [INV2](./INVARIANTS.md#inv2--decision-change-linkage)
  - [INV3](./INVARIANTS.md#inv3--invariant-preservation)

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

### DEC3 — Distinguish Invariants From Principles From Policies

- Affects:
  - [INV1](./INVARIANTS.md#inv1--concept-independence)
  - [PRIN1](./INVARIANTS.md#prin1--separate-what-from-why-from-how)
  - [POL1](./INVARIANTS.md#pol1--prefer-deprecation-over-deletion)
- Must preserve: [INV3](./INVARIANTS.md#inv3--invariant-preservation)

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

### DEC4 — Add Process Modelling

- Affects:
  - [ELEM2](./STATE.md#elem2--process-node-family)
  - [ELEM3](./STATE.md#elem3--artefact-node-family)
- Must preserve: [INV4](./INVARIANTS.md#inv4--recursive-consistency)

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

### DEC5 — Format-Agnostic With Markdown as Primary Representation

- Affects: [REAL1](./STATE.md#real1--markdown-representation)
- Must preserve: [INV4](./INVARIANTS.md#inv4--recursive-consistency)

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

### DEC6 — Recursive Composition Using Same Conventions

- Affects: [REAL4](./STATE.md#real4--recursive-folder-form)
- Must preserve: [INV4](./INVARIANTS.md#inv4--recursive-consistency)

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

### DEC7 — Append-Only History

- Must preserve: [INV5](./INVARIANTS.md#inv5--append-only-history)

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

### DEC8 — Support External Resources via Reference and Internalisation

- Affects:
  - [ELEM7](./STATE.md#elem7--external-reference-model)
  - [REAL5](./STATE.md#real5--json-serialisation)
  - [REAL1](./STATE.md#real1--markdown-representation)
  - [INV3](./INVARIANTS.md#inv3--invariant-preservation)
  - [ART1](./STATE.md#art1--system-comparisons)
  - [ART2](./STATE.md#art2--document-workspace-example)
  - [ART3](./STATE.md#art3--planning-workflow-example)
- Must preserve:
  - [INV19](./INVARIANTS.md#inv19--external-reference-role-required)
  - [INV20](./INVARIANTS.md#inv20--external-reference-directionality)
  - [INV21](./INVARIANTS.md#inv21--text-field-duality)
  - [INV22](./INVARIANTS.md#inv22--strict-type-enums)
  - [INV18](./INVARIANTS.md#inv18--extension-constraint-preservation)
  - [POL19](./INVARIANTS.md#pol19--readme-links-only-to-present-files)
  - [INV3](./INVARIANTS.md#inv3--invariant-preservation)
  - [POL20](./INVARIANTS.md#pol20--subsystem-representation-heuristic)

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

### DEC9 — Allow Array-of-Lines for Text Fields

- Affects:
  - [REAL5](./STATE.md#real5--json-serialisation)
  - [REAL1](./STATE.md#real1--markdown-representation)
- Must preserve: [INV21](./INVARIANTS.md#inv21--text-field-duality)

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

### DEC10 — Use Strict Enums for Core Types

- Affects: [REAL5](./STATE.md#real5--json-serialisation)
- Must preserve:
  - [INV22](./INVARIANTS.md#inv22--strict-type-enums)
  - [INV18](./INVARIANTS.md#inv18--extension-constraint-preservation)

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

### DEC11 — Only Link to Present Files in README

- Affects: [REAL1](./STATE.md#real1--markdown-representation)
- Must preserve: [POL19](./INVARIANTS.md#pol19--readme-links-only-to-present-files)

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

### DEC12 — Remove Navigation and Document Roles from README

- Affects: [REAL1](./STATE.md#real1--markdown-representation)

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

### DEC13 — Layer-Dependent Invariant Preservation

- Affects: [INV3](./INVARIANTS.md#inv3--invariant-preservation)
- Must preserve: [INV3](./INVARIANTS.md#inv3--invariant-preservation)

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

### DEC14 — Internalise Design Archive into SysProM JSON

- Affects:
  - [ART1](./STATE.md#art1--system-comparisons)
  - [ART2](./STATE.md#art2--document-workspace-example)
  - [ART3](./STATE.md#art3--planning-workflow-example)

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

### DEC15 — Size-Based Subsystem Splitting

- Affects: [REAL1](./STATE.md#real1--markdown-representation)
- Must preserve: [POL20](./INVARIANTS.md#pol20--subsystem-representation-heuristic)

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

### DEC16 — Add Bidirectional Spec-Kit Interoperability

- Affects: [ELEM3](./STATE.md#elem3--artefact-node-family)
- Must preserve:
  - [INV4](./INVARIANTS.md#inv4--recursive-consistency)
  - [INV5](./INVARIANTS.md#inv5--append-only-history)
  - [INV6](./INVARIANTS.md#inv6--node-identity)
  - [INV21](./INVARIANTS.md#inv21--text-field-duality)
  - [INV22](./INVARIANTS.md#inv22--strict-type-enums)

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

### DEC17 — Add Task Subcommand for Change Plan Tracking

- Affects: [CHG14](./CHANGES.md#chg14--implement-spec-kit-file-support)

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

### DEC18 — Recursive Change Nodes for Planning

Phases and tasks are structurally identical — a unit of work that can contain smaller units. Rather than maintaining separate stage nodes for phases and change nodes for tasks, use a single recursive model: change nodes with subsystems containing more change nodes. This eliminates the artificial three-layer model (protocol, stage, change, task) in favour of uniform recursive composition via SysProM's native subsystem mechanism.

- Must preserve: [INV2](./INVARIANTS.md#inv2--decision-change-linkage)

Context: The spec-kit planning integration initially used stage nodes for phases and change nodes for tasks, with flat plan:Task[] arrays for leaf items. This created three separate mechanisms for what is conceptually the same thing.

Options:
- D18-OPT-A: Keep separate stage nodes for phases and change nodes for tasks (three-layer model)
- D18-OPT-B: Use recursive change nodes with subsystems for unlimited nesting depth (single mechanism)

Chosen: D18-OPT-B

Rationale: A phase is just a task with children. Using change nodes with recursive subsystems provides unlimited nesting depth, eliminates the stage node type from planning, and reuses SysProM's existing subsystem recursion rather than inventing a parallel mechanism.

#### Lifecycle

- [x] accepted
- [ ] options

### DEC19 — Extend Lifecycle with Temporal Timestamps

Extend lifecycle values from boolean to boolean | string, where string values are ISO dates indicating when a state was reached. Date strings are truthy, so existing code using truthiness checks works unchanged. This single schema change enables timestamped lifecycle, temporal snapshots, and event ordering.

- Must preserve: [INV2](./INVARIANTS.md#inv2--decision-change-linkage)

Context: SysProM had no temporal support. The lifecycle field tracked state completion but not when states were reached.

Options:
- D19-OPT-A: Add separate timestamp fields (created_at, updated_at) to nodes
- D19-OPT-B: Extend lifecycle values from boolean to boolean | string (ISO date)

Chosen: D19-OPT-B

Rationale: One schema change enables all three temporal capabilities: timestamped lifecycle, temporal snapshots via stateAt queries, and event ordering via timeline queries. Date strings are truthy, ensuring backwards compatibility.

#### Lifecycle

- [x] accepted

### DEC20 — Adopt Commander.js for CLI

Choose a CLI framework to replace manual argument parsing, enabling automatic documentation generation from command definitions.

- Must preserve: [INV2](./INVARIANTS.md#inv2--decision-change-linkage)

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

### DEC21 — Adopt TypeDoc for Documentation

Choose TypeDoc with typedoc-plugin-zod for API documentation generation, producing both markdown (committed) and HTML (for GitHub Pages) output.

- Must preserve: [INV2](./INVARIANTS.md#inv2--decision-change-linkage)

Context: The library has a rich public API (~70 exports) but no automated documentation generation. TypeDoc generates browsable docs from TypeScript source and JSDoc comments. The typedoc-plugin-zod plugin resolves rendering issues with Zod-inferred types.

Options:
- D21-OPT-A: TypeDoc with typedoc-plugin-markdown for markdown output and typedoc-plugin-zod for clean Zod type rendering. Supports projectDocuments for including CLI docs in the HTML site.
- D21-OPT-B: Docusaurus, Starlight, or VitePress for a full documentation site framework. More features but heavier dependencies and over-engineered for a small project.

Chosen: D21-OPT-A

Rationale: TypeDoc directly generates docs from TypeScript source with minimal configuration. The typedoc-plugin-zod plugin resolves the z.infer rendering issue without requiring explicit interfaces. The projectDocuments feature allows CLI docs to be included in the same HTML site.

#### Lifecycle

- [x] proposed (2026-03-21)
- [x] accepted (2026-03-21)

### DEC22 — Adopt Turborepo for Build Orchestration

Choose Turborepo for build task orchestration with dependency management and output caching.

- Must preserve: [INV2](./INVARIANTS.md#inv2--decision-change-linkage)

Context: The build pipeline has multiple tasks with dependencies (typecheck, compile, schema generation, doc generation) managed via chained pnpm scripts. Turborepo provides task dependency graphs, parallel execution, and output caching.

Options:
- D22-OPT-A: Turborepo with task dependency graph, input/output declarations, and automatic caching. Handles output directory cleaning on cache hits.
- D22-OPT-B: Keep chained pnpm scripts with && operators. Simpler but no caching, no parallelism, no dependency graph.

Chosen: D22-OPT-A

Rationale: Turborepo provides automatic caching (FULL TURBO on repeat builds), parallel task execution, and explicit dependency declarations in turbo.json. It manages output directory cleaning automatically.

#### Lifecycle

- [x] proposed (2026-03-21)
- [x] accepted (2026-03-21)

### DEC23 — Enforce Conventional Commits and Automated Releases

Adopt commitlint for commit message enforcement, semantic-release for automated publishing, and husky for git hook management.

- Must preserve: [INV2](./INVARIANTS.md#inv2--decision-change-linkage)

Context: The project uses conventional commit messages informally. Enforcing them with tooling enables automated releases, changelogs, and consistent commit history.

Options:
- D23-OPT-A: commitlint with conventional commits preset, semantic-release with all commit types triggering releases, and husky for pre-commit and commit-msg hooks.
- D23-OPT-B: Manual release process with no commit message enforcement.

Chosen: D23-OPT-A

Rationale: Automated enforcement ensures every commit follows conventional format, enabling semantic-release to determine version bumps and generate changelogs. All commit types trigger patch releases so no work is excluded.

#### Lifecycle

- [x] proposed (2026-03-22)
- [x] accepted (2026-03-22)

### DEC24 — Eliminate Type Assertions

Remove all as type coercions and replace them with Zod schema validation, type guard functions, and properly typed parameters.

- Must preserve: [INV2](./INVARIANTS.md#inv2--decision-change-linkage)

Context: The codebase contained numerous as type assertions that bypass the type checker, telling the compiler to trust the developer rather than proving correctness at runtime.

Options:
- D24-OPT-A: Replace all as assertions with runtime validation using Zod .is() type guards, instanceof checks, and properly typed function parameters.
- D24-OPT-B: Keep type assertions where TypeScript cannot express the constraint. Accept the risk of runtime type mismatches.

Chosen: D24-OPT-A

Rationale: Runtime validation catches type errors that assertions silently mask. The Zod schema provides .is() type guards via defineSchema — using them is both safer and consistent with the single-source-of-truth pattern.

#### Lifecycle

- [x] proposed (2026-03-22)
- [x] accepted (2026-03-22)

### DEC25 — Ship Compiled JavaScript

Switch package entry points (main, exports, bin) from TypeScript source to compiled JavaScript in dist/, removing the tsx runtime dependency for consumers.

- Must preserve: [INV2](./INVARIANTS.md#inv2--decision-change-linkage)

Context: The package previously shipped TypeScript source and required tsx at runtime. Consumers needed tsx as a dependency to use the CLI or import the library.

Options:
- D25-OPT-A: Point main, exports, and bin to compiled dist/ output. Move tsx to devDependencies. Consumers only need Node.js.
- D25-OPT-B: Keep shipping TypeScript source with tsx as a runtime dependency.

Chosen: D25-OPT-A

Rationale: Shipping compiled JavaScript removes the tsx runtime dependency, reduces install size, and follows standard npm package conventions.

#### Lifecycle

- [x] proposed (2026-03-22)
- [x] accepted (2026-03-22)

### DEC26 — Auto-Generate Node IDs

Auto-generate node IDs from a type-prefix convention when --id is omitted from the add command.

- Must preserve: [INV2](./INVARIANTS.md#inv2--decision-change-linkage)

Context: Adding nodes via the CLI required manually specifying IDs like D26 or CH24. This is tedious and error-prone, especially when the user must check existing IDs to avoid collisions.

Options:
- D26-OPT-A: Auto-generate IDs from NODE_ID_PREFIX map + highest existing number. Make --id optional.
- D26-OPT-B: Keep --id required. Users must manually track IDs.

Chosen: D26-OPT-A

Rationale: The existing ID convention (D for decisions, CH for changes, INV for invariants, etc.) is consistent enough to derive automatically. The nextId function scans existing nodes for the highest number with that prefix and increments.

#### Lifecycle

- [x] proposed (2026-03-22)
- [x] accepted (2026-03-22)

### DEC27 — CLI UX Improvements

Add auto-generated option IDs, init command, auto-sync, coloured output, JSON output on mutations, full-text search, graph export, rename, stricter validation, shell completions, and dry-run mode.

- Must preserve: [INV2](./INVARIANTS.md#inv2--decision-change-linkage)

Context: The CLI covers core CRUD operations but lacks quality-of-life features that reduce friction for frequent use.

Options:
- D27-OPT-A: Implement all suggested UX improvements as a single cohesive change.
- D27-OPT-B: Implement incrementally, prioritising the most impactful features.

Chosen: D27-OPT-A

Rationale: Each improvement targets a specific friction point: auto-IDs reduce manual bookkeeping, colour improves scanability, search/graph/rename add power-user workflows, and dry-run/completions improve developer experience.

#### Lifecycle

- [x] proposed (2026-03-22)
- [x] accepted (2026-03-22)

### DEC28 — Unify CLI with Zod-Driven Command Definitions

Replace separate Commander definitions, run() functions, and doc generator metadata with a single defineCommand pattern using Zod schemas.

- Must preserve: [INV2](./INVARIANTS.md#inv2--decision-change-linkage)

Context: The CLI had three layers describing the same information independently: Zod schemas, Commander definitions, and run() functions with manual parseFlag helpers.

Options:
- D28-OPT-A: defineCommand pattern with Zod schemas as single source of truth
- D28-OPT-B: Keep separate layers

Chosen: D28-OPT-A

Rationale: A single defineCommand pattern eliminates duplication. Commander program, documentation, and validation are all derived from the Zod schema.

#### Lifecycle

- [x] proposed (2026-03-22)
- [x] accepted (2026-03-22)

### DEC29 — Unify Library API and CLI with defineOperation

Each domain operation defined once with Zod input/output schemas. Programmatic API, CLI, and docs derived from the single definition.

- Must preserve: [INV2](./INVARIANTS.md#inv2--decision-change-linkage)

Context: Library functions have no metadata. CLI commands redeclare descriptions, types, and validation. Adding a feature requires updating 3 places.

Options:
- D29-OPT-A: defineOperation pattern — operations carry Zod schemas, CLI is a thin adapter
- D29-OPT-B: Keep separate layers — library functions, CLI commands, and doc generator remain independent

Chosen: D29-OPT-A

Rationale: Single source of truth eliminates duplication and drift. Operations are callable functions with introspectable schemas.

#### Lifecycle

- [x] proposed (2026-03-22)
- [x] accepted (2026-03-22)

### DEC30 — Distribute SysProM as a Claude Code Plugin

Context: SysProM is a CLI tool and library for tracking system provenance. Claude Code supports plugins that extend its capabilities with skills, commands, hooks, and agents. A plugin would give Claude native awareness of SysProM workflows — recording decisions, tracking changes, checking invariants — directly within coding sessions. The plugin is pure markdown (no compiled code) and delegates to the spm CLI at runtime.

Options:
- D30-OPT-A: Pure-markdown plugin with skills, commands, hooks, and agents that call spm via Bash. Use spm if globally installed, otherwise npx -y sysprom after npm publication.
- D30-OPT-B: Bundle compiled CLI into the plugin as a single-file JavaScript bundle. Fully self-contained but requires committing compiled code to git.
- D30-OPT-C: MCP server wrapping the programmatic API. Provides structured tool access but adds complexity and a Node.js runtime dependency within the plugin.
- D30-OPT-D: No plugin. Users rely on CLAUDE.md instructions and manual spm invocation.

Chosen: D30-OPT-A

Rationale: A pure-markdown plugin requires no compiled code in git and no build step. Skills teach Claude how to use SysProM; the CLI is resolved at runtime via spm or npx. This follows the pattern of other CLI-wrapping plugins (wayback, devops tools) that treat the CLI as a prerequisite. Distribution via GitHub marketplace requires only a marketplace.json in the repo.

### DEC31 — Bidirectional Sync by Default

Context: Currently json2md and md2json are separate one-directional commands. Users must remember which direction to convert, and there is no conflict detection or resolution when both sides have diverged. A single sync command that is bidirectional by default would reduce friction and prevent data loss.

Options:
- OPT-A: Add a unified 'spm sync' command that is bidirectional by default, with sub-commands or flags for conflict handling (--prefer-json, --prefer-md, --interactive, --dry-run). Deprecate separate json2md/md2json as the primary workflow.
- OPT-B: Keep json2md and md2json as primary commands but add conflict detection warnings when the target has unsaved changes.

Chosen: OPT-A

Rationale: A single sync command aligns with the principle of least surprise and reduces cognitive load. Explicit conflict-handling flags give users precise control when needed, while the default bidirectional behaviour covers the common case.

### DEC32 — Add MCP Server for Programmatic API Access

Context: The Claude Code plugin (D30) uses CLI skills that shell out to spm. An MCP server wrapping SysProM's programmatic API would provide structured tool access with typed inputs/outputs via Zod schemas, eliminating CLI text parsing. The server uses stdio transport, ships as an extra bin entry in the same npm package, and is referenced from the plugin's .mcp.json. Same npm-publication prerequisite as the CLI.

Options:
- OPT-A: Add MCP server as extra bin entry (sysprom-mcp) in the existing sysprom package. Single source file at src/mcp/index.ts wrapping the programmatic API. Plugin .mcp.json references it via npx.
- OPT-B: Separate npm package (sysprom-mcp) in a packages/ monorepo workspace. Independent versioning but more infrastructure.
- OPT-C: No MCP server. Plugin relies entirely on CLI skills shelling out to spm.

Chosen: OPT-A

Rationale: Same package avoids monorepo overhead. The MCP server is a thin wrapper around the existing programmatic API — one source file, one new dependency (@modelcontextprotocol/sdk), one extra bin entry. SysProM already has zod which satisfies the SDK peer dependency.

### DEC33 — Abstract External Format Interop into Keyed Provider Registry

- Supersedes: [CHG14](./CHANGES.md#chg14--implement-spec-kit-file-support)
- Must preserve: [CON6](./INTENT.md#con6--format-agnosticism)

Context: SysProM has speckit interop (import/export/sync/diff) hardcoded to one external format. Superpowers (obra/superpowers) uses a similar directory-of-markdown pattern for specs and plans. Other workflow tools may emerge. The speckit code has a clear detect/parse/generate structure that can be generalised.

Options:
- OPT-A: Keyed provider registry — define an ExternalFormatProvider interface, register providers in a const object keyed by string literal, derive ProviderKey union from the registry. Auto-detect provider from directory structure, allow explicit --format flag.
- OPT-B: Kind-string provider — each provider carries a kind: string field, registry is an array scanned at runtime. Simpler but loses type-safe lookup.
- OPT-C: No abstraction — duplicate speckit code for superpowers with format-specific operations. Quick but violates DRY.

Chosen: OPT-A

Rationale: Keyed registry gives type-safe lookup, avoids stringly-typed dispatch, and the ProviderKey union auto-updates when new providers are added. satisfies Record<string, ExternalFormatProvider> enforces the interface while preserving concrete types per key. Consistent with the codebase defineOperation pattern.

### DEC34 — Safe Graph Removal with Soft Delete Default

- Must preserve: [INV23](./INVARIANTS.md#inv23--retired-node-relationship-guard)

Context: Current removeNode and removeRelationship operations silently break must_follow chains, leave dangling scope/operation references, and can lose nested subsystems without warning. Need safe removal that preserves graph integrity by default.

Options:
- OPT-A: Soft delete default with hard mode — default removal sets status: retired (preserves all edges), --hard does physical removal with automatic must_follow chain repair, scope cleanup, and structured impact summary. --hard on nodes with subsystems requires --recursive.
- OPT-B: Always physical removal with impact report — show what will break before removing, let the caller abort. No soft delete.
- OPT-C: Refuse if referenced — only allow removal when nothing references the node. Safe but overly restrictive.

Chosen: OPT-A

Rationale: Soft delete via existing status: retired is zero-cost (no schema change) and never breaks the graph. Hard mode with chain repair handles the common must_follow case deterministically. Requiring --recursive for subsystem loss prevents accidental data destruction.

### DEC35 — Graph Mutation Safety Guards

- Must preserve:
  - [INV24](./INVARIANTS.md#inv24--no-duplicate-relationships)
  - [INV25](./INVARIANTS.md#inv25--relationship-endpoint-type-validity)
  - [INV26](./INVARIANTS.md#inv26--retirement-impact-awareness)

Context: Several mutation operations (updateNode, addRelationship) lack safety checks. Status transitions to retired have no impact awareness. Duplicate relationships can be added. Type changes can invalidate existing relationships. addRelationship has no semantic validation of endpoint types.

Options:
- OPT-A: Comprehensive guards — add retirement impact check to updateNode, duplicate prevention to addRelationship, type-change guard with relationship validity map, and relationship semantic validation for endpoint node types. Enforce in mutation operations and validate.
- OPT-B: Validation only — add checks to validate but do not guard mutation operations. Catch-after-the-fact approach.
- OPT-C: Guards only for high-severity — retirement impact and duplicate prevention only. Defer type and semantic validation.

Chosen: OPT-A

Rationale: All four gaps are real and independently discoverable. Validation-only misses the opportunity to prevent bad state. Deferring type/semantic checks leaves a class of silent corruption. A relationship-type-to-endpoint-type map serves both the type-change guard and the semantic validation, so they share implementation cost.

### DEC36 — Default input resolution and init command

Context: CLI commands require explicit file paths. Users want sensible defaults (.spm.json, .spm.md, .spm/) and an init command that creates documents with context-dependent format.

Options:
- OPT-A: Priority-based auto-detection with init --format flag

Chosen: OPT-A

Rationale: Priority order matches user expectations; --format flag gives explicit control when defaults are wrong

### DEC37 — Add YAML and multi-file JSON serialisation formats

Context: SysProM supports JSON and Markdown serialisation but users request YAML for human-readable, diff-friendly documents and multi-file JSON for large projects. Adding these formats broadens adoption without changing the core model.

Options:
- OPT-A: YAML single-file and multi-document plus multi-file JSON with new CLI commands

Chosen: OPT-A

Rationale: YAML is widely expected for configuration-style documents; multi-file JSON mirrors the existing multi-file Markdown pattern for consistency

### DEC38 — Convert file-path positional args to flags

Context: CLI commands for file I/O (init, json2md, md2json, sync, speckit, plan init) use positional arguments for paths. Flags are more consistent with other commands that already use --path, and allow auto-detection when omitted.

Options:
- OPT-A: Convert all positional args to flags
- OPT-B: Keep positional args as-is

Chosen: OPT-A

Rationale: Entity IDs and search terms remain positional (natural operands). File paths become flags for consistency with --path used elsewhere, and to enable auto-detection when omitted.

### DEC39 — Fix MCP write operations not persisting

Context: MCP tools returned success but did not write to disk

Options:
- fix: Add saveDocument calls

Chosen: fix

Rationale: Each write operation was missing the saveDocument call after modifying the document

### DEC40 — Fix init path suffix doubling

Context: Running spm init .spm.json creates .spm.json.spm.json

Options:
- fix: Check if path ends with suffix before appending

Chosen: fix

Rationale: Simple suffix check prevents doubling

### DEC41 — Add deterministic graph inference

- Must preserve:
  - [INV1](./INVARIANTS.md#inv1--concept-independence)
  - [INV2](./INVARIANTS.md#inv2--decision-change-linkage)

Context: SysProM has typed directed graphs but no facility to derive new knowledge from graph structure. Ouroboros provides inference via LLM-scored ambiguity and convergence metrics. We want equivalent capability without LLM dependency — pure graph traversal and structural analysis.

Options:
- OPT-A: Single inferOp with type discriminator — one operation with a type parameter selecting the analysis category
- OPT-B: Separate operations per category — four independent operations (impact, completeness, lifecycle, derived) with distinct input/output schemas
- OPT-C: Extend validate with inference rules — add inference findings to the existing validate operation

Chosen: OPT-B

Rationale: Each inference category has fundamentally different inputs (impact needs a startId; others do not) and output shapes. A union return type forces consumers to narrow on every call. Separate operations follow the existing pattern where validate, stats, trace, and query are all independent. Option C would bloat validate with unrelated concerns.

### DEC42 — Enhance impact analysis for SysML/ArchiMate parity

Context: inferImpactOp only follows outgoing edges and ignores 14 of 24 relationship types. SysML models bidirectional typed traceability; ArchiMate adds polarity annotations on influence relationships. Both are needed to move Impact from partial to first-class support.

Options:
- OPT-A: Add influence relationship type only — no directional change
- OPT-B: Bidirectional traversal only — no polarity annotations
- OPT-C: Both — bidirectional traversal plus optional polarity and strength on Relationship plus influence type plus full relationship classification

Chosen: OPT-C

Rationale: OPT-A alone cannot answer what depends on X — the key SysML gap. OPT-B alone cannot annotate polarity — the key ArchiMate gap. OPT-C delivers both with minimal schema additions (two optional fields, one new relationship type).

### DEC43 — Expand endpoint type matrix for governance modelling

- Affects:
  - [INV25](./INVARIANTS.md#inv25--relationship-endpoint-type-validity)
  - [CAP12](./INTENT.md#cap12--product-repository-modelling-guidance)
- Must preserve: [INV18](./INVARIANTS.md#inv18--extension-constraint-preservation)

Context: Product-system modelling revealed endpoint restrictions blocking valid specification, design, and implementation provenance patterns.

Options:
- OPT-A: Expand endpoints and add workflow-safe relationship types such as orchestrates — all additive, semantically valid
- OPT-B: Keep strict matrix — no changes

Chosen: OPT-A

Rationale: The endpoint expansions are additive, preserve existing semantics, and make SysProM more effective for modelling real product systems without changing its core ontology. Abstract workflow machines can now connect cleanly to executable flow nodes without overloading part_of semantics.

#### Lifecycle

- [x] implemented

### DEC44 — Adopt Graph-Native Task Lifecycle Model

Context: Project tracking had two parallel task mechanisms: change.plan[] checklists and recursive change-node planning. This created duplicated semantics, unclear completion logic, and weak blockage derivation.

Options:
- OPT-A: Remove change.plan[] and use lifecycle-bearing change nodes as the only task model
- OPT-B: Keep both models
- OPT-C: Keep plan[] only

Chosen: OPT-A

Rationale: A single graph-native model keeps task semantics structurally consistent, enables deterministic blockage derivation from relationships and gates, and removes redundant command/API surfaces.

#### Lifecycle

- [x] implemented

### DEC45 — CLI field coverage for update/add commands

Context: Several update and add commands had undocumented or missing CLI flags that users expected to be available, forcing them to edit JSON directly.

Options:
- OPT-A: Systematically add all missing fields to CLI commands as they become needed

Chosen: OPT-A

Rationale: Improves UX by closing gaps between schema capabilities and CLI exposure; reduces need for manual JSON editing

### DEC46 — CLI: expose relationship endpoint type discovery

Context: Issue #19 reported that users have no way to discover valid relationship endpoint types from help text. They only learn what is valid after attempting to add a relationship and getting an error.

Options:
- OPT-A: Create a new query subcommand to list valid endpoint types for all relationship types
- OPT-B: Add endpoint type documentation directly to the add-rel help output

Chosen: OPT-A

Rationale: A new query subcommand is more discoverable via help text, provides structured data output, and follows the CLI's existing pattern of query subcommands for different node and relationship types.

### DEC47 — Validator: allow intentionally undecided decisions

Context: Issue #24 reported that the validator requires all decisions to have a selected option, but some decisions are intentionally undecided (proposed, experimental, deferred states).

Options:
- OPT-A: Make selected option requirement lifecycle-aware — only require it for decided states (accepted, implemented, adopted)
- OPT-B: Add a new field to mark decisions as intentionally undecided

Chosen: OPT-A

Rationale: Lifecycle-aware validation is simpler, requires no schema changes, and aligns with the semantic meaning of undecided lifecycle states.

### DEC48 — CLI: manage external references

Context: Issue #22 reported that users must edit JSON directly to manage external references. These references are critical for linking nodes to source documents, ADRs, standards, and code files.

Options:
- OPT-A: Add update add-ref and update remove-ref subcommands
- OPT-B: Create a new manage-refs command

Chosen: OPT-A

Rationale: Adding subcommands follows the existing update command pattern, is simpler, and maintains consistency with other mutation operations.

### DEC49 — Expand relationship endpoint type support

Context: Issues #23 and #25 reported missing node type support in relationship definitions. Milestones couldn't use depends_on, and roles couldn't use constrained_by or governed_by.

Options:
- OPT-A: Add milestone to depends_on sources, and role to constrained_by and governed_by sources
- OPT-B: Create a mapping configuration for endpoint types

Chosen: OPT-A

Rationale: Direct schema updates are simple, maintainable, and follow the existing pattern of endpoint type validation.

