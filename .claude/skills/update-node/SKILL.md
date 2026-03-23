---
name: update-node
description: Modify node fields, status, lifecycle state, context, or rationale
allowed-tools: Bash(spm *)
disable-model-invocation: true
user-invocable: true
---

# Update Node

Modify an existing node's properties in the SysProM document. Update description, status, context, rationale, or lifecycle fields.

## Arguments

- `[id]` — Node ID to update (required)

## Steps

1. Gather update details:
   - Node ID to modify
   - Which field to update (description, status, context, rationale, lifecycle)
   - New value for the field
   - Optional: lifecycle key-value pairs (e.g., phase=introduced, date=2026-03-22)

2. Update the node field:
   ```bash
   spm update node --id <arg1> --description "<arg2>"
   ```

3. Or update status:
   ```bash
   spm update node --id <arg1> --status <arg2>
   ```

4. Or update lifecycle:
   ```bash
   spm update node --id <arg1> --lifecycle phase=introduced --lifecycle date=2026-03-22
   ```

## Status Values

- proposed — Initial conception
- defined — Specification complete
- introduced — Implemented or deployed
- deprecated — No longer used
- superseded — Replaced by another node

## Notes

- Use `rename-node` to change node IDs (more comprehensive than field update)
- Lifecycle updates use `key=value` format, can be specified multiple times
- All updates preserve node relationships and history

## Example

```
Update: D1 status to introduced

Node: D1
New status: introduced
```

Updates node metadata while preserving graph structure.
