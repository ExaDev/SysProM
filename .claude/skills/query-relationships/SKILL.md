---
name: query-relationships
description: Search relationships between nodes by type, source, target, or criteria
allowed-tools: Bash(spm *)
user-invocable: true
---

# Query Relationships

Search and list relationships in the SysProM document using various filters and criteria.

## Arguments

- `[criteria]` — Search filter (from, to, type, text, etc.)

## Steps

1. Determine what relationships you want to find:
   - Relationships from a specific node?
   - Relationships of a specific type?
   - Relationships affecting a specific target?

2. Query all relationships from a node:
   !`spm query rels --from $0`

3. Or query relationships to a target:
   !`spm query rels --to $0`

4. Or query by relationship type:
   !`spm query rels --type must_preserve`

## Query Examples

| Query | Purpose |
|-------|---------|
| `spm query rels --from D1` | Relationships from D1 |
| `spm query rels --to INV5` | Relationships to INV5 |
| `spm query rels --type implements` | All "implements" relationships |
| `spm query rels --type must_preserve` | Decision-to-invariant must_preserve links |

## Output

Returns matching relationships:
- Source and target nodes
- Relationship type
- Node details (names, descriptions)

## Example

```
Query: All relationships from D5

Query: spm query rels --from D5
```

Lists all relationships matching the specified criteria.
