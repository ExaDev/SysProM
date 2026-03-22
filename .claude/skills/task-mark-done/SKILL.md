---
name: task-mark-done
description: Mark a task as completed in a change node
allowed-tools: Bash(spm *)
disable-model-invocation: true
user-invocable: true
---

# Mark Task Done

Mark a task as completed in a change node. This updates the task status and tracks progress toward change completion.

## Arguments

- `[changeNodeId]` — Change node ID containing the task
- `[taskId]` — Task ID to mark complete

## Steps

1. Identify the task to complete:
   - Change node ID
   - Task ID (e.g., T1, T5)

2. Mark task as done:
   !`spm task mark-done $0 $1`

3. Or mark with completion note:
   !`spm task mark-done $0 $1 --note "Implemented and tested"`

## Output

Updates task status:
- Status changed to: completed
- Completion timestamp recorded
- Progress updated (affects parent change)

## Example

```
Mark: Task T2 in change C5 as complete

Change: C5
Task: T2 - Add AuthMiddleware

Result: T2 status changed to completed
Progress: 66% → 100% (3/3 tasks done)
```

Marks a task as completed and updates change progress.
