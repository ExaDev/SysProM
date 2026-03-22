---
name: remove-relationship
description: Delete a relationship between two nodes
allowed-tools: Bash(spm *)
disable-model-invocation: true
user-invocable: true
---

# Remove Relationship

Delete a directed relationship between two nodes in the SysProM document. This is a destructive operation that breaks the connection without affecting the nodes themselves.

## Arguments

- `[from]` — Source node ID
- `[type]` — Relationship type to remove
- `[to]` — Target node ID

## Steps

1. Identify the relationship to remove:
   - Source node (from)
   - Target node (to)
   - Relationship type

2. Remove the relationship:
   !`spm remove-relationship $0 $1 $2`

## Warnings

- Removal only affects the relationship, not the nodes
- If this relationship is critical (e.g., `must_preserve` for invariants), removal may leave the system in an inconsistent state
- Use `spm validate` after removal to check for graph consistency

## Example

```
Remove: D1 affects EL5

From: D1
Type: affects
To: EL5
```

Removes the specified relationship from the provenance graph.
