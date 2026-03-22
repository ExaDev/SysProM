---
name: plan-status
description: Show plan progress across phases, gates, and completion milestones
allowed-tools: Bash(spm *)
user-invocable: true
---

# Plan Status

Show the status and progress of a plan within a change node. Displays current phase, completed gates, and overall timeline progress.

## Arguments

- `[changeNodeId]` — Change node ID containing the plan

## Steps

1. Identify the change node with a plan:
   - Change node ID (e.g., C1, C42)

2. Show plan status:
   !`spm plan status $0`

3. Or show detailed progress:
   !`spm plan status $0 --detailed`

## Output

Returns plan status:
- Current phase
- Completed phases
- Gates status (blocked/open/passed)
- Overall completion percentage
- Milestones and timeline

## Example

```
Status: Authentication rollout plan for change C5

Plan: Authentication Rollout

Current phase: Implementation (50% complete)

Completed:
  ✅ Design (Architecture review passed)

In Progress:
  🔄 Implementation (8/12 tasks done)
    - Gate: Test coverage > 80% [BLOCKED]

Pending:
  ⏳ Testing
  ⏳ Deployment

Overall: 35% complete (5 weeks of 14 weeks elapsed)
```

Shows plan progress and phase gate status.
