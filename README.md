# SysProM — System Provenance Model

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
spm json2md sysprom.spm.json ./SysProM
spm md2json ./SysProM output.spm.json

# Validate a document
spm validate sysprom.spm.json

# Print summary
spm stats sysprom.spm.json

# Query nodes and relationships
spm query sysprom.spm.json nodes --type decision
spm query sysprom.spm.json node D1
spm query sysprom.spm.json rels --from D1
spm query sysprom.spm.json trace I1

# Add, remove, update nodes
spm add sysprom.spm.json invariant --id INV23 --name "New Rule" --description "Must hold"
spm remove sysprom.spm.json INV23
spm update sysprom.spm.json D1 --status deprecated
spm update sysprom.spm.json --add-rel D1 affects EL5
spm update sysprom.spm.json --meta version=2
```

All commands auto-detect format — they work on `.spm.json` files, `.spm.md` files, and multi-document folders.

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
const doc = JSON.parse(fs.readFileSync("sysprom.spm.json", "utf8"));
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

| System | Readable | Parseable | State | Rationale | History | Constraints | Nesting | Diagrams | Inference | Impact | Temporal | Scaffolding | Planning |
|--------|----------|-----------|-------|-----------|---------|-------------|---------|----------|-----------|--------|----------|-------------|----------|
| [MBSE (SysML)](https://www.omg.org/spec/SysML/) | 🔶 | ✅ | ✅ | 🔶 | 🔶 | ✅ | ✅ | ✅ | | ✅ | | | |
| [Knowledge Graphs](https://www.w3.org/TR/rdf12-concepts/) | | ✅ | ✅ | | | 🔶 | ✅ | 🔶 | ✅ | | | | |
| [EA (ArchiMate)](https://pubs.opengroup.org/architecture/archimate-spec/) | ✅ | 🔶 | ✅ | | | 🔶 | 🔶 | ✅ | | ✅ | | | |
| [Git](https://git-scm.com/) | 🔶 | ✅ | ✅ | | ✅ | | | | | | ✅ | | |
| [Event Sourcing](https://martinfowler.com/eaaDev/EventSourcing.html) | | ✅ | 🔶 | | ✅ | 🔶 | | | | | ✅ | | |
| [DDD](https://www.domainlanguage.com/ddd/) | ✅ | | ✅ | | | 🔶 | 🔶 | | | | | | |
| [C4](https://c4model.com/) | ✅ | | ✅ | | | | 🔶 | ✅ | | | | | |
| [Traceability Matrices](https://en.wikipedia.org/wiki/Traceability_matrix) | ✅ | | ✅ | | | 🔶 | | | | 🔶 | | | |
| [Spec Kit](https://github.com/github/spec-kit) | ✅ | | ✅ | 🔶 | 🔶 | | 🔶 | | | | | ✅ | ✅ |
| [ADR](https://adr.github.io/) | ✅ | | | ✅ | 🔶 | | | | | | | | |
| [RFC Processes](https://www.rfc-editor.org/rfc/rfc2026) | ✅ | | | ✅ | 🔶 | | | | | | | | 🔶 |
| [Ralplan](https://github.com/yeachan-heo/oh-my-claudecode/blob/main/skills/ralplan/SKILL.md) | ✅ | | 🔶 | ✅ | | 🔶 | | | | | | | ✅ |
| [GSD](https://github.com/gsd-build/get-shit-done) | ✅ | | | 🔶 | | 🔶 | | | | | | | |
| **SysProM** | **✅** | **✅** | **✅** | **✅** | **✅** | **✅** | **✅** | 🔶 | | 🔶 | | 🔶 | 🔶 |

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
pnpm build            # Typecheck + compile + generate schema.json
pnpm test             # Run all tests
pnpm test:coverage    # Run tests with coverage report
```

## Self-Description

`sysprom.spm.json` is SysProM describing itself — the specification, its decisions, invariants, changes, and worked examples are all encoded as a SysProM document.
