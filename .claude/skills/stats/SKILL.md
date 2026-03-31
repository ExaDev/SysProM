---
name: stats
description: Show statistical summary of the SysProM document
allowed-tools: Bash(spm *)
user-invocable: true
---

# Statistics

Display statistical summary of the SysProM document including node counts, relationship distribution, and composition metrics.

## Arguments

None — operates on the current document.

## Steps

1. Get document statistics:

   ```bash
   spm stats
   ```

2. Review the breakdown:
   - Total nodes and relationships
   - Distribution by node type
   - Distribution by relationship type
   - Lifecycle state counts
   - Depth and breadth metrics

## Output

Returns comprehensive statistics:

- Node counts by type (decisions, invariants, capabilities, elements, etc.)
- Relationship counts by type
- Lifecycle stage distribution
- Document composition overview

## Example

```
Statistics: Current SysProM document

Command: spm stats

Result:
  42 nodes total
    - 5 decisions
    - 3 invariants
    - 8 capabilities
    - 12 elements
    - 14 realisations
  156 relationships total
    - 28 refines
    - 31 implements
    - 42 depends_on
    - 55 other types
```

Provides statistical overview of document structure.
