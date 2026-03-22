# SysProM — System Provenance Model

/sɪs.prɒm/

A recursive, decision-driven model for recording where every part of a system came from, what decisions shaped it, and how it reached its current form.

## Install

```sh
# From npm (when published)
npm install -g sysprom

# From GitHub
npm install -g github:ExaDev/SysProM

# Or use without installing
npx sysprom --help
```

Both `sysprom` and `spm` are available as commands.

## CLI

```sh
# Convert between formats
spm json2md .spm.json ./.spm
spm md2json ./.spm output.spm.json

# Validate and summarise (auto-detects .spm.json in current directory)
spm validate
spm stats

# Query nodes and relationships
spm query nodes --type decision
spm query node D1
spm query rels --from D1
spm query trace I1
spm query timeline
spm query state-at 2026-03-22

# Add nodes (ID auto-generated from type prefix if --id omitted)
spm add invariant --name "New Rule" --description "Must hold"
spm add decision --name "Choose X" \
  --option "OPT-A:Use framework X" --option "OPT-B:Use framework Y" \
  --selected OPT-A --rationale "Lower migration effort"

# Remove nodes
spm remove INV23

# Update nodes, relationships, and metadata
spm update node D1 --status deprecated
spm update add-rel D1 affects EL5
spm update remove-rel D1 affects EL5
spm update meta --fields version=2
```

All commands auto-detect the document — they search the current directory for `.spm.json`, `.spm.md`, or `.spm/` (in that priority order), then fall back to `*.spm.json`, `*.spm.md`, or `*.spm/`. Use `--path` to specify an explicit path.

## Programmatic API

```ts
import {
  // Schema and types
  sysproMDocument,
  node,
  nodeType,
  relationshipType,
  type SysProMDocument,
  type Node,
  type Relationship,

  // Conversion
  jsonToMarkdown,
  jsonToMarkdownSingle,
  jsonToMarkdownMultiDoc,
  markdownToJson,

  // Validation and query
  validate,
  stats,
  queryNodes,
  queryNode,
  queryRelationships,
  traceFromNode,

  // Mutation
  addNode,
  removeNode,
  updateNode,
  addRelationship,
  removeRelationship,
  updateMetadata,

  // File I/O
  loadDocument,
  saveDocument,

  // Utilities
  canonicalise,
  toJSONSchema,
} from "sysprom";

// Validate
const doc = JSON.parse(fs.readFileSync(".spm.json", "utf8"));
const result = validate(doc);
console.log(result.valid, result.issues);

// Query
const decisions = queryNodes(doc, { type: "decision" });
const trace = traceFromNode(doc, "I1");

// Mutate
const updated = addNode(doc, { id: "INV23", type: "invariant", name: "New Rule" });
const withRel = addRelationship(updated, { from: "D1", to: "INV23", type: "must_preserve" });

// Type guards
if (sysproMDocument.is(data)) { /* data is SysProMDocument */ }
if (node.is(thing)) { /* thing is Node */ }
```

## What is SysProM?

SysProM models systems as directed graphs across abstraction layers — intent, concept, capability, structure, and realisation — with explicit decisions, changes, and invariants. It is domain-agnostic, format-agnostic, and recursively composable.

## How SysProM Compares

| System | Readable | Parseable | State | Rationale | History | Constraints | Nesting | Diagrams | Inference | Impact | Temporal | Scaffolding | Planning | Tracking |
|--------|----------|-----------|-------|-----------|---------|-------------|---------|----------|-----------|--------|----------|-------------|----------|----------|
| [MBSE (SysML)](https://www.omg.org/spec/SysML/) | 🔶 | ✅ | ✅ | 🔶 | 🔶 | ✅ | ✅ | ✅ | | ✅ | | | | |
| [Knowledge Graphs](https://www.w3.org/TR/rdf12-concepts/) | | ✅ | ✅ | | | 🔶 | ✅ | 🔶 | ✅ | | | | | |
| [EA (ArchiMate)](https://pubs.opengroup.org/architecture/archimate-spec/) | ✅ | 🔶 | ✅ | | | 🔶 | 🔶 | ✅ | | ✅ | | | | |
| [Git](https://git-scm.com/) | 🔶 | ✅ | ✅ | | ✅ | | | | | | ✅ | | | 🔶 |
| [Event Sourcing](https://martinfowler.com/eaaDev/EventSourcing.html) | | ✅ | 🔶 | | ✅ | 🔶 | | | | | ✅ | | | |
| [DDD](https://www.domainlanguage.com/ddd/) | ✅ | | ✅ | | | 🔶 | 🔶 | | | | | | | |
| [C4](https://c4model.com/) | ✅ | | ✅ | | | | 🔶 | ✅ | | | | | | |
| [Traceability Matrices](https://en.wikipedia.org/wiki/Traceability_matrix) | ✅ | | ✅ | | | 🔶 | | | | 🔶 | | | | 🔶 |
| [Spec Kit](https://github.com/github/spec-kit) | ✅ | | ✅ | 🔶 | 🔶 | | 🔶 | | | | | ✅ | ✅ | ✅ |
| [PRD](https://en.wikipedia.org/wiki/Product_requirements_document) | ✅ | | 🔶 | ✅ | 🔶 | 🔶 | 🔶 | 🔶 | | 🔶 | | | ✅ | 🔶 |
| [ADR](https://adr.github.io/) | ✅ | | | ✅ | 🔶 | | | | | | | | | |
| [RFC Processes](https://www.rfc-editor.org/rfc/rfc2026) | ✅ | | | ✅ | 🔶 | | | | | | | | 🔶 | 🔶 |
| [Ralplan](https://github.com/yeachan-heo/oh-my-claudecode/blob/main/skills/ralplan/SKILL.md) | ✅ | | 🔶 | ✅ | | 🔶 | | | | | | | ✅ | 🔶 |
| [GSD](https://github.com/gsd-build/get-shit-done) | ✅ | | | 🔶 | | 🔶 | | | | | | | | |
| [GSD-2](https://github.com/gsd-build/gsd-2) | ✅ | 🔶 | ✅ | 🔶 | ✅ | 🔶 | ✅ | | | 🔶 | | ✅ | ✅ | ✅ |
| [OpenSpec](https://github.com/Fission-AI/OpenSpec) | ✅ | 🔶 | ✅ | ✅ | ✅ | | 🔶 | | | | | ✅ | ✅ | ✅ |
| [Kiro](https://github.com/kirodotdev/Kiro) | ✅ | 🔶 | ✅ | 🔶 | 🔶 | 🔶 | 🔶 | | | 🔶 | | ✅ | ✅ | ✅ |
| [cc-sdd](https://github.com/gotalab/cc-sdd) | ✅ | 🔶 | ✅ | 🔶 | 🔶 | 🔶 | 🔶 | | | 🔶 | | ✅ | ✅ | ✅ |
| [Ouroboros](https://github.com/Q00/ouroboros) | ✅ | 🔶 | ✅ | ✅ | 🔶 | ✅ | | | ✅ | 🔶 | | 🔶 | ✅ | 🔶 |
| [Spec Kitty](https://github.com/Priivacy-ai/spec-kitty) | ✅ | 🔶 | ✅ | 🔶 | 🔶 | 🔶 | 🔶 | | | 🔶 | | ✅ | ✅ | ✅ |
| [Shotgun](https://github.com/shotgun-sh/shotgun) | ✅ | 🔶 | 🔶 | 🔶 | 🔶 | | | | | 🔶 | | 🔶 | ✅ | 🔶 |
| [Superpowers](https://github.com/obra/superpowers) | ✅ | 🔶 | 🔶 | 🔶 | 🔶 | ✅ | 🔶 | | ✅ | 🔶 | | ✅ | ✅ | ✅ |
| **SysProM** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 🔶 | | 🔶 | ✅ | ✅ | ✅ | ✅ |

✅ = first-class support. 🔶 = partial or implicit.

## Key Concepts

**Nodes** — typed entities (intent, concept, capability, element, realisation, invariant, principle, policy, protocol, stage, role, gate, mode, artefact, decision, change, view)

**Relationships** — typed directed edges (refines, realises, implements, depends_on, affects, supersedes, must_preserve, and 17 others)

**Invariants** — rules that must hold across all valid system states

**Decisions** — choices between alternatives, with context, options, rationale, and must_preserve links to invariants (required when affecting domain nodes)

**Changes** — modifications to the system, linked to decisions, with scope, operations, and lifecycle tracking

**Subsystems** — any node can contain a nested SysProM graph, using the same structure recursively

## Serialisation

SysProM is format-agnostic. This repository includes:

- **JSON** — validated against `schema.json`, supports recursive subsystems
- **Markdown** — single file (`.spm.md`), multi-document folder, or recursive nested folders with automatic grouping by type

Round-trip conversion between JSON and Markdown is supported with zero information loss.

## Development

```sh
pnpm build            # Typecheck + compile + schema + docs (cached via Turbo)
pnpm typecheck        # Type-check only
pnpm compile          # Compile to dist/
pnpm test             # Typecheck + run all tests
pnpm test:coverage    # Tests with coverage report
pnpm docs             # Generate API + CLI markdown docs
pnpm docs:html        # Generate HTML site for GitHub Pages
pnpm docs:serve       # Live-reload HTML docs during development
pnpm spm <command>    # Run the CLI from source (e.g. pnpm spm validate ...)
```

## Self-Description

`.spm.json` is SysProM describing itself — the specification, its decisions, invariants, changes, and worked examples are all encoded as a SysProM document. The `./.spm/` folder contains the same content as human-readable Markdown.

All significant activity — decisions, changes, new capabilities, and invariants — should be recorded in the self-describing document. Updates can be made either by editing the Markdown files in `./.spm/` directly or by using the CLI:

```sh
# Add a decision via the CLI
spm add decision --id D23 --name "My Decision" --context "Why this was needed"

# Or edit ./.spm/DECISIONS.md directly, then sync
spm md2json ./.spm .spm.json
```

Keep both representations in sync after any change:

```sh
# JSON → Markdown
spm json2md .spm.json ./.spm

# Markdown → JSON
spm md2json ./.spm .spm.json
```

> **Important:** Always keep `.spm.json` and `./.spm/` up to date with current activity and in sync with each other. Record all decisions, changes, and new capabilities as they happen. After any change to either representation, run the appropriate conversion command above. Validate with `spm validate` before committing.
