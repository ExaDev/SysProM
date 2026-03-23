---
name: plan-init
description: Initialise a plan within a change node with phases, gates, and phase descriptions
allowed-tools: Bash(spm *)
user-invocable: true
---

# Initialise Plan

Create a structured plan within a change node. Plans define phases, gates, and progress tracking for phased implementation.

## Options

- `--output <value>` — Path to output SysProM file
- `--prefix <value>` — Plan prefix (e.g. PLAN)
- `--name <value>` — Plan name (optional, defaults to prefix)

## Steps

1. Identify the plan:
   - What is being planned?
   - What prefix to use?

2. Initialise a new plan:
   ```bash
   spm plan init --output plan.spm.json --prefix PLAN --name "My Plan"
   ```

3. Or initialise with minimal options:
   ```bash
   spm plan init --output plan.spm.json --prefix AUTH
   ```

## Plan Structure

A plan contains:
- Phases (sequential stages)
- Gates (readiness checks between phases)
- Tasks and milestones
- Timeline and completion tracking

## Example

```
Initialise: Plan for authentication system change

Change: C5 (Add session management)
Plan: Authentication Rollout

Phases:
  1. Design — Architecture and API design
  2. Implementation — Code and integration
  3. Testing — QA and security testing
  4. Deployment — Production release

Gates:
  - After Design: Architecture review
  - After Implementation: Test coverage > 80%
  - After Testing: Security audit pass
```

Creates a structured plan for phased change implementation.
