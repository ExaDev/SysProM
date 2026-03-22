---
name: add-relationship
description: Create a relationship between two nodes with a specific type
allowed-tools: Bash(spm *)
user-invocable: true
---

# Add Relationship

Create a directed relationship between two nodes in the SysProM document. Relationships define how nodes depend on, affect, or relate to each other.

## Arguments

- `[from]` — Source node ID
- `[type]` — Relationship type
- `[to]` — Target node ID

## Steps

1. Identify the relationship:
   - Source node (from)
   - Target node (to)
   - Relationship type (what is the connection?)

2. Create the relationship:
   !`spm add-relationship $0 $1 $2`

## Common Relationship Types

| Type | Meaning |
|------|---------|
| `refines` | A concept refines (elaborates) another |
| `realises` | Implementation realises an abstraction |
| `implements` | A change implements a decision |
| `depends_on` | A depends on B (functional dependency) |
| `affects` | A modification affects B |
| `supersedes` | A replaces/obsoletes B |
| `must_preserve` | A decision must preserve invariant B |
| `requires` | A requires B to function |
| `conflicts_with` | A conflicts with B |

## Example

```
Relationship: D1 implements C5

Source: D1 (decision to use TypeScript)
Type: implements
Target: C5 (capability for type safety)
```

Creates a directed relationship connecting two nodes in the provenance graph.
