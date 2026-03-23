---
name: remove-node
description: Delete a node from the SysProM document with safety options for relationships
allowed-tools: Bash(spm *)
disable-model-invocation: true
user-invocable: true
---

# Remove Node

Delete a node from the SysProM document. This is a destructive operation that removes the node and optionally its relationships.

## Arguments

- `[id]` — Node ID to remove (required)

## Steps

1. Identify the node to remove:
   - Node ID (e.g., D5, EL23)
   - Verify you are removing the intended node
   - Consider impact on related nodes

2. Remove the node with default settings:
   ```bash
   spm remove <id>
   ```

3. Or remove with options:
   - `--hard` — Physical removal (cannot be recovered)
   - `--recursive` — Allow subsystem removal (removes all nested nodes)
   - `--repair` — Repair must_follow chains after removal
   - `--dry-run` — Preview what would be removed without writing

## Flags

| Flag | Purpose |
|------|---------|
| `--hard` | Hard delete (physical removal from document) |
| `--recursive` | Allow removal of subsystems with nested nodes |
| `--repair` | Repair must_follow relationship chains automatically |
| `--dry-run` | Preview removal without modifying document |

## Warnings

- Removal is destructive — relationships to/from the node are also removed
- Use `--dry-run` first to see impact
- Use `--repair` if other nodes depend on this one via must_follow chains

## Example

```
Remove: D5 with relationship cleanup

Node: D5
Flags: --hard --repair
```

Removes a node and its relationships from the document.
