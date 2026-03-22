---
name: task-add
description: Add a new task to a change node with description and optional assignment
allowed-tools: Bash(spm *)
user-invocable: true
---

# Add Task

Add a new task to a change node. Tasks represent work items that must be completed for a change to be finished.

## Arguments

- `[changeNodeId]` — Change node ID to add task to
- `[taskName]` — Name/description of the task

## Steps

1. Identify the change node:
   - Change node ID (e.g., C1, C42)

2. Add a new task:
   !`spm task add $0 "$1"`

3. Or add with assignment:
   !`spm task add $0 "$1" --assignee john`

## Output

Creates new task:
- Assigned auto-incremented task ID
- Linked to parent change
- Initial status: pending

## Example

```
Add: Task to change C5

Change: C5 (Add session management)
Task: Create Session model
Assignee: alice@example.com

Result: T1 - Create Session model [pending] assigned to alice
```

Adds a new task to a change's work breakdown structure.
