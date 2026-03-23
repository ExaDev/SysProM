---
name: graph
description: Generate visual graph (Mermaid or DOT) of the SysProM document with filtering options
allowed-tools: Bash(spm *)
user-invocable: true
---

# Graph Visualization

Generate a visual graph of the SysProM document in Mermaid or DOT format, with optional filtering by node type, relationship type, or specific nodes.

## Arguments

- `[format]` — Graph format (mermaid or dot)

## Steps

1. Generate full graph in Mermaid format:
   ```bash
   spm graph --format mermaid
   ```

2. Or generate in DOT format:
   ```bash
   spm graph --format dot
   ```

3. Or filter by node type:
   ```bash
   spm graph --format mermaid --type decision,invariant
   ```

4. Or filter by specific nodes:
   ```bash
   spm graph --format mermaid --nodes D1,D2,INV5
   ```

## Output Formats

| Format | Purpose | Best For |
|--------|---------|----------|
| mermaid | Markdown-compatible graph syntax | Documentation, README, GitHub |
| dot | GraphViz format | Complex visualisations, neato layout |

## Examples

```
Visualise: All decisions and invariants

Command: spm graph --format mermaid --type decision,invariant

Shows: Decision nodes connected to invariants via must_preserve relationships
```

```
Visualise: Specific refinement chain

Command: spm graph --format dot --nodes I1,C5,CAP3,EL2

Shows: How intent I1 elaborates through C5 → CAP3 → EL2
```

Generates visual representation of the document's provenance graph.
