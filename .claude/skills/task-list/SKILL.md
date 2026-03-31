---
name: task-list
description: List tasks in a change node, showing progress and completion status
allowed-tools: Bash(spm *)
user-invocable: true
---

# List Tasks

Show all tasks in a change node, including their status, description, and completion progress.

## Arguments

- `[changeNodeId]` — Change node ID containing tasks

## Steps

1. Identify the change node:
   - Change node ID (e.g., C1, C42)
   - This change must have tasks defined

2. List tasks in the change:

   ```bash
   spm task list <arg1>
   ```

3. Or show with progress:
   ```bash
   spm task list <arg1> --progress
   ```

## Output

Returns task list:

- Task ID and description
- Status (pending, in-progress, completed)
- Percentage complete
- Assignee (if specified)

## Example

```
List: Tasks in change C5

Change: C5 (Add session management)

Tasks:
  1. T1 - Create Session model [pending]
  2. T2 - Add AuthMiddleware [completed]
  3. T3 - Update User routes [in-progress]

Progress: 66% complete (2/3 tasks done)
```

Lists all tasks with their status and progress.
