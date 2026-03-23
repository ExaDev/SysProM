---
name: add-decision
description: Create a decision node with context, options, selected option, and rationale
allowed-tools: Bash(spm *)
user-invocable: true
---

# Add Decision Node

Create a new decision in the SysProM document. Decisions capture choices made and their rationale.

## Arguments

- `[id]` — Node ID (e.g., D1, D23). If omitted, auto-generated from decision prefix.

## Steps

1. Gather decision details:
   - ID (optional — will auto-generate if omitted)
   - Name of the decision
   - Context (why this decision was needed)
   - Options and their descriptions (format: `KEY:Description`)
   - Which option was selected
   - Rationale for the selection

2. Create the decision node:
   ```bash
   spm add decision --id <id> --name "<name>" --context "<context>" --option "<option>" --selected "<selected>" --rationale "<rationale>"
   ```

3. Optionally link to invariants (relationships added separately with `add-relationship`):
   - Use `must_preserve` relationship to link critical invariants that must hold

## Example

```
Decision: Use TypeScript for type safety

Context: Need stronger guarantees for the API layer
Options:
  - OPT-A: TypeScript with strict mode
  - OPT-B: Flow (lighter weight)
  - OPT-C: No static typing (minimal overhead)
Selected: OPT-A
Rationale: Strict type checking catches bugs early
```

Creates a decision node capturing the choice and its reasoning.
