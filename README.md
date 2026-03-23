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
spm json2md --input .spm.json --output ./.spm
spm md2json --input ./.spm --output output.spm.json

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

<table>
<thead>
<tr>
  <th rowspan="2">System</th>
  <th colspan="2">Format</th>
  <th colspan="3">Structure</th>
  <th colspan="2">Decisions</th>
  <th colspan="2">Time</th>
  <th colspan="2">Analysis</th>
  <th colspan="3">Workflow</th>
</tr>
<tr>
  <th>Readable</th><th>Parseable</th>
  <th>State</th><th>Nesting</th><th>Diagrams</th>
  <th>Rationale</th><th>Constraints</th>
  <th>History</th><th>Temporal</th>
  <th>Inference</th><th>Impact</th>
  <th>Scaffolding</th><th>Planning</th><th>Tracking</th>
</tr>
</thead>
<tbody>
<tr><td><a href="https://www.omg.org/spec/SysML/">MBSE (SysML)</a></td><td>🔶</td><td>✅</td><td>✅</td><td>✅</td><td>✅</td><td>🔶</td><td>✅</td><td>🔶</td><td></td><td></td><td>✅</td><td></td><td></td><td></td></tr>
<tr><td><a href="https://www.w3.org/TR/rdf12-concepts/">Knowledge Graphs</a></td><td></td><td>✅</td><td>✅</td><td>✅</td><td>🔶</td><td></td><td>🔶</td><td></td><td></td><td>✅</td><td></td><td></td><td></td><td></td></tr>
<tr><td><a href="https://pubs.opengroup.org/architecture/archimate-spec/">EA (ArchiMate)</a></td><td>✅</td><td>🔶</td><td>✅</td><td>🔶</td><td>✅</td><td></td><td>🔶</td><td></td><td></td><td></td><td>✅</td><td></td><td></td><td></td></tr>
<tr><td><a href="https://git-scm.com/">Git</a></td><td>🔶</td><td>✅</td><td>✅</td><td></td><td></td><td></td><td></td><td>✅</td><td>✅</td><td></td><td></td><td></td><td></td><td>🔶</td></tr>
<tr><td><a href="https://martinfowler.com/eaaDev/EventSourcing.html">Event Sourcing</a></td><td></td><td>✅</td><td>🔶</td><td></td><td></td><td></td><td>🔶</td><td>✅</td><td>✅</td><td></td><td></td><td></td><td></td><td></td></tr>
<tr><td><a href="https://www.domainlanguage.com/ddd/">DDD</a></td><td>✅</td><td></td><td>✅</td><td>🔶</td><td></td><td></td><td>🔶</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>
<tr><td><a href="https://c4model.com/">C4</a></td><td>✅</td><td></td><td>✅</td><td>🔶</td><td>✅</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>
<tr><td><a href="https://en.wikipedia.org/wiki/Traceability_matrix">Traceability Matrices</a></td><td>✅</td><td></td><td>✅</td><td></td><td></td><td></td><td>🔶</td><td></td><td></td><td></td><td>🔶</td><td></td><td></td><td>🔶</td></tr>
<tr><td><a href="https://en.wikipedia.org/wiki/Product_requirements_document">PRD</a></td><td>✅</td><td></td><td>🔶</td><td>🔶</td><td>🔶</td><td>✅</td><td>🔶</td><td>🔶</td><td></td><td></td><td>🔶</td><td></td><td>✅</td><td>🔶</td></tr>
<tr><td><a href="https://adr.github.io/">ADR</a></td><td>✅</td><td></td><td></td><td></td><td></td><td>✅</td><td></td><td>🔶</td><td></td><td></td><td></td><td></td><td></td><td></td></tr>
<tr><td><a href="https://www.rfc-editor.org/rfc/rfc2026">RFC Processes</a></td><td>✅</td><td></td><td></td><td></td><td></td><td>✅</td><td></td><td>🔶</td><td></td><td></td><td></td><td></td><td>🔶</td><td>🔶</td></tr>
<tr><td><a href="https://cucumber.io/docs/gherkin/">BDD (Gherkin)</a></td><td>✅</td><td>✅</td><td>🔶</td><td>🔶</td><td></td><td></td><td>✅</td><td></td><td></td><td></td><td></td><td>🔶</td><td>🔶</td><td>✅</td></tr>
<tr><td><a href="https://github.com/github/spec-kit">Spec Kit</a></td><td>✅</td><td></td><td>✅</td><td>🔶</td><td></td><td>🔶</td><td></td><td>🔶</td><td></td><td></td><td></td><td>✅</td><td>✅</td><td>✅</td></tr>
<tr><td><a href="https://github.com/yeachan-heo/oh-my-claudecode/blob/main/skills/ralplan/SKILL.md">Ralplan</a></td><td>✅</td><td></td><td>🔶</td><td></td><td></td><td>✅</td><td>🔶</td><td></td><td></td><td></td><td></td><td></td><td>✅</td><td>🔶</td></tr>
<tr><td><a href="https://github.com/gsd-build/get-shit-done">GSD</a></td><td>✅</td><td></td><td></td><td></td><td></td><td>🔶</td><td>🔶</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>
<tr><td><a href="https://github.com/gsd-build/gsd-2">GSD-2</a></td><td>✅</td><td>🔶</td><td>✅</td><td>✅</td><td></td><td>🔶</td><td>🔶</td><td>✅</td><td></td><td></td><td>🔶</td><td>✅</td><td>✅</td><td>✅</td></tr>
<tr><td><a href="https://github.com/eyaltoledano/claude-task-master">Taskmaster</a></td><td>✅</td><td>✅</td><td>✅</td><td>✅</td><td></td><td>🔶</td><td></td><td>🔶</td><td></td><td>🔶</td><td>🔶</td><td>🔶</td><td>✅</td><td>✅</td></tr>
<tr><td><a href="https://github.com/Fission-AI/OpenSpec">OpenSpec</a></td><td>✅</td><td>🔶</td><td>✅</td><td>🔶</td><td></td><td>✅</td><td></td><td>✅</td><td></td><td></td><td></td><td>✅</td><td>✅</td><td>✅</td></tr>
<tr><td><a href="https://github.com/kirodotdev/Kiro">Kiro</a></td><td>✅</td><td>🔶</td><td>✅</td><td>🔶</td><td></td><td>🔶</td><td>🔶</td><td>🔶</td><td></td><td></td><td>🔶</td><td>✅</td><td>✅</td><td>✅</td></tr>
<tr><td><a href="https://github.com/gotalab/cc-sdd">cc-sdd</a></td><td>✅</td><td>🔶</td><td>✅</td><td>🔶</td><td></td><td>🔶</td><td>🔶</td><td>🔶</td><td></td><td></td><td>🔶</td><td>✅</td><td>✅</td><td>✅</td></tr>
<tr><td><a href="https://github.com/Q00/ouroboros">Ouroboros</a></td><td>✅</td><td>🔶</td><td>✅</td><td></td><td></td><td>✅</td><td>✅</td><td>🔶</td><td></td><td>✅</td><td>🔶</td><td>🔶</td><td>✅</td><td>🔶</td></tr>
<tr><td><a href="https://github.com/Priivacy-ai/spec-kitty">Spec Kitty</a></td><td>✅</td><td>🔶</td><td>✅</td><td>🔶</td><td></td><td>🔶</td><td>🔶</td><td>🔶</td><td></td><td></td><td>🔶</td><td>✅</td><td>✅</td><td>✅</td></tr>
<tr><td><a href="https://github.com/shotgun-sh/shotgun">Shotgun</a></td><td>✅</td><td>🔶</td><td>🔶</td><td></td><td></td><td>🔶</td><td></td><td>🔶</td><td></td><td></td><td>🔶</td><td>🔶</td><td>✅</td><td>🔶</td></tr>
<tr><td><a href="https://github.com/obra/superpowers">Superpowers</a></td><td>✅</td><td>🔶</td><td>🔶</td><td>🔶</td><td></td><td>🔶</td><td>✅</td><td>🔶</td><td></td><td>✅</td><td>🔶</td><td>✅</td><td>✅</td><td>✅</td></tr>
<tr><td><strong>SysProM</strong></td><td>✅</td><td>✅</td><td>✅</td><td>✅</td><td>🔶</td><td>✅</td><td>✅</td><td>✅</td><td>✅</td><td></td><td>🔶</td><td>✅</td><td>✅</td><td>✅</td></tr>
</tbody>
</table>

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
spm md2json --input ./.spm --output .spm.json
```

Keep both representations in sync after any change:

```sh
# JSON → Markdown
spm json2md --input .spm.json --output ./.spm

# Markdown → JSON
spm md2json --input ./.spm --output .spm.json
```

> **Important:** Always keep `.spm.json` and `./.spm/` up to date with current activity and in sync with each other. Record all decisions, changes, and new capabilities as they happen. After any change to either representation, run the appropriate conversion command above. Validate with `spm validate` before committing.

## Claude Code Plugin

SysProM is available as a Claude Code plugin with 28 skills for managing provenance documents. The plugin is defined in `.claude-plugin/marketplace.json` with skills in `.claude/skills/`.

### Install from Marketplace

```sh
# Add the SysProM marketplace
/plugin marketplace add ExaDev/SysProM

# Install the plugin
/plugin install sysprom@sysprom
```

Skills are namespaced when installed as a plugin (e.g. `/sysprom:add-decision`, `/sysprom:query-nodes`).

### Local Development

When working on the SysProM repo itself, skills in `.claude/skills/` are auto-discovered without plugin installation. Skills use short names (e.g. `/add-decision`, `/query-nodes`).

### Skills by Category

**Node Creation (4 skills)**
- `add-decision` — Create decision nodes with context, options, rationale, and invariant links
- `add-change` — Create change nodes with scope, operations, and task tracking
- `add-invariant` — Create invariant nodes representing system rules and constraints
- `add-node` — Generic node creation for any SysProM type

**Node Modification (3 skills)**
- `update-node` — Modify node fields, status, lifecycle, context, or rationale
- `remove-node` — Delete nodes with safety flags (hard delete, recursive, repair)
- `rename-node` — Rename node IDs across all references

**Relationships (2 skills)**
- `add-relationship` — Create relationships between nodes with specific types
- `remove-relationship` — Delete relationships

**Query & Analysis (5 skills)**
- `query-nodes` — Search nodes by type, status, text, or ID
- `query-relationships` — Query relationships by source, target, or type
- `trace-node` — Trace refinement chains through abstraction layers
- `check-document` — Validate document structure and report issues
- `stats` — Show document statistics and composition metrics

**Visualisation (1 skill)**
- `graph` — Generate Mermaid or DOT graphs with filtering

**Format Conversion (4 skills)**
- `init-document` — Create new SysProM documents with metadata
- `json-to-markdown` — Convert JSON to Markdown format
- `markdown-to-json` — Convert Markdown to JSON format
- `sync-formats` — Bidirectional sync between JSON and Markdown

**Spec-Kit Integration (4 skills)**
- `speckit-import` — Import Spec-Kit features as SysProM nodes
- `speckit-export` — Export SysProM nodes to Spec-Kit format
- `speckit-sync` — Bidirectional sync with Spec-Kit specifications
- `speckit-diff` — Show differences between SysProM and Spec-Kit

**Task Management (3 skills)**
- `task-list` — List tasks in a change node with progress
- `task-add` — Add tasks to a change
- `task-mark-done` — Mark tasks as complete

**Plan Management (2 skills)**
- `plan-init` — Initialise plans with phases and gates
- `plan-status` — Show plan progress and phase gates

### Fallback to `npx`

If `spm` is not globally installed, skills automatically fall back to `npx -y sysprom` for command execution. All skills work with either global or per-project installation.
