---
name: query-nodes
description: Search and list nodes by ID, type, name, or other criteria
allowed-tools: Bash(spm *)
user-invocable: true
---

# Query Nodes

Search and list nodes in the SysProM document using various filters and criteria.

## Arguments

- `[criteria]` — Search filter (type, name, status, text, etc.)

## Steps

1. Determine what you want to find:
   - All nodes of a specific type?
   - Nodes by name or text search?
   - Nodes with a specific status?

2. Query nodes by type:
   ```bash
   spm query nodes --type decision
   ```

3. Or query a specific node by ID:
   ```bash
   spm query node <arg1>
   ```

4. Or search by status:
   ```bash
   spm query nodes --status proposed
   ```

5. Or search by text:
   ```bash
   spm query nodes --text "authentication"
   ```

## Query Examples

| Query | Purpose |
|-------|---------|
| `spm query nodes --type decision` | All decisions |
| `spm query nodes --type invariant` | All invariants |
| `spm query node D1` | Specific node D1 |
| `spm query nodes --status introduced` | Nodes in introduced state |
| `spm query nodes --text "auth"` | Nodes containing "auth" |

## Output

Returns matching nodes with their metadata:
- Node ID and type
- Name and description
- Status and lifecycle
- Related relationships

## Example

```
Query: All decisions in the document

Query: spm query nodes --type decision
```

Lists all nodes matching the specified criteria.
