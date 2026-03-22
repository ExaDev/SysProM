---
name: check-document
description: Validate the SysProM document and report structural consistency issues
allowed-tools: Bash(spm *)
user-invocable: true
---

# Check Document

Validate the SysProM document for structural consistency, missing relationships, and constraint violations.

## Arguments

None — operates on the current document.

## Steps

1. Validate the document:
   !`spm validate`

2. Review any issues reported:
   - Missing or broken relationships
   - Invalid node references
   - Constraint violations
   - Orphaned nodes

## Output

Returns validation result:
- ✅ Valid if no issues found (node count, relationship count)
- ❌ Invalid if issues found (list of specific issues)

## Example

```
Validate: Current SysProM document

Command: spm validate

Result: Valid SysProM document.
  42 nodes, 156 relationships
```

Validates document integrity and reports any issues.
