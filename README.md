# SysProM — System Provenance Model

A recursive, decision-driven model for recording where every part of a system came from, what decisions shaped it, and how it reached its current form.

## What is SysProM?

SysProM models systems as directed graphs across abstraction layers — intent, concept, capability, structure, and realisation — with explicit decisions, changes, and invariants. It is domain-agnostic, format-agnostic, and recursively composable.

## How SysProM Compares

| System | Readable | Parseable | State | Rationale | History | Constraints | Nesting |
|--------|----------|-----------|-------|-----------|---------|-------------|---------|
| [MBSE (SysML)](https://www.omg.org/spec/SysML/) | 🔶 | ✅ | ✅ | 🔶 | 🔶 | ✅ | ✅ |
| [Knowledge Graphs](https://www.w3.org/TR/rdf12-concepts/) | | ✅ | ✅ | | | 🔶 | ✅ |
| [EA (ArchiMate)](https://pubs.opengroup.org/architecture/archimate-spec/) | ✅ | 🔶 | ✅ | | | 🔶 | 🔶 |
| [Git](https://git-scm.com/) | 🔶 | ✅ | ✅ | | ✅ | | |
| [Event Sourcing](https://martinfowler.com/eaaDev/EventSourcing.html) | | ✅ | 🔶 | | ✅ | 🔶 | |
| [DDD](https://www.domainlanguage.com/ddd/) | ✅ | | ✅ | | | 🔶 | 🔶 |
| [C4](https://c4model.com/) | ✅ | | ✅ | | | | 🔶 |
| [Traceability Matrices](https://en.wikipedia.org/wiki/Traceability_matrix) | ✅ | | ✅ | | | 🔶 | |
| [Spec Kit](https://github.com/github/spec-kit) | ✅ | | ✅ | 🔶 | 🔶 | | 🔶 |
| [ADR](https://adr.github.io/) | ✅ | | | ✅ | 🔶 | | |
| [RFC Processes](https://www.rfc-editor.org/rfc/rfc2026) | ✅ | | | ✅ | 🔶 | | |
| [Ralplan](https://github.com/yeachan-heo/oh-my-claudecode/blob/main/skills/ralplan/SKILL.md) | ✅ | | 🔶 | ✅ | | 🔶 | |
| [GSD](https://github.com/gsd-build/get-shit-done) | ✅ | | | 🔶 | | 🔶 | |
| **SysProM** | **✅** | **✅** | **✅** | **✅** | **✅** | **✅** | **✅** |

✅ = first-class support. 🔶 = partial or implicit.

Each existing system covers one or two columns well. SysProM covers all of them within a single recursive graph. Spec Kit, Ralplan, and GSD compose with SysProM: Ralplan generates plans, Spec Kit stores specs, GSD executes — SysProM tracks provenance across all of it.

## Commands

```sh
pnpm build            # Typecheck + generate schema.json
pnpm test             # Run all tests
pnpm test:coverage    # Run tests with coverage report

pnpm json2md <input.json> <output-dir>    # Convert JSON to Markdown
pnpm md2json <input-dir> <output.json>    # Convert Markdown to JSON
```

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

## Self-Description

`sysprom.spm.json` is SysProM describing itself — 124 nodes, 162 relationships, 15 decisions, 13 changes, 22 invariants, 7 subsystems, and 3 artefacts containing worked examples and system comparisons.
