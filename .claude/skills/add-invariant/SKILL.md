---
name: add-invariant
description: Create an invariant node representing rules that must hold across all valid system states
allowed-tools: Bash(spm *)
user-invocable: true
---

# Add Invariant Node

Create a new invariant in the SysProM document. Invariants define rules and constraints that must hold across all valid system states.

## Arguments

- `[id]` — Node ID (e.g., I1, I56). If omitted, auto-generated from invariant prefix.

## Steps

1. Gather invariant details:
   - ID (optional — will auto-generate if omitted)
   - Name of the invariant
   - Description of the rule
   - Conditions under which the invariant must hold
   - Consequence if violated

2. Create the invariant node:
   ```bash
   spm add invariant --id <arg1> --name "<arg2>" --description "<arg3>" --conditions "<arg4>" --consequence "<arg5>"
   ```

3. Link to decisions (use `add-relationship`):
   - Decisions that preserve this invariant should link via `must_preserve` relationship
   - Changes that impact this invariant should be explicitly related

## Example

```
Invariant: API versioning immutability

Description: Once an API version is released, its contract cannot change
Conditions: For all released versions v1, v2, ... vN
Consequence: Breaking changes require new major version; backward compatibility must be maintained
```

Creates an invariant node capturing system rules and constraints.
