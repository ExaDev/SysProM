---
name: add-change
description: Create a change node with scope, operations, lifecycle tracking, and task plan
allowed-tools: Bash(spm *)
user-invocable: true
---

# Add Change Node

Create a new change in the SysProM document. Changes represent modifications to the system with explicit scope, operations, and task tracking.

## Arguments

- `[id]` — Node ID (e.g., C1, C42). If omitted, auto-generated from change prefix.

## Steps

1. Gather change details:
   - ID (optional — will auto-generate if omitted)
   - Name of the change
   - Description of what is being modified
   - Scope (which nodes are affected)
   - Operations (what modifications occur)
   - Status (proposed, defined, introduced, complete)

2. Create the change node:

   ```bash
   spm add change --id <id> --name "<name>" --description "<description>" --scope "<scope>" --operations "<operations>" --status "<status>"
   ```

3. Optionally add task tracking:
   - Use `spm task add` to add tasks to the change
   - Track progress with `spm task mark-done` as each task completes

4. Link to decisions (use `add-relationship`):
   - Use `implements` relationship to link to the decision this change implements

## Example

```
Change: Add session management

Description: Implement user session handling and authentication
Scope: API middleware, session store, user routes
Operations: Create Session model, add AuthMiddleware, update User routes
Status: proposed
```

Creates a change node tracking system modifications.
