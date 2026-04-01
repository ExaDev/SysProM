---
title: "STATE"
doc_type: "state"
---

# STATE

## Protocols

### PROT1 — Consensus Planning

## Stages

### STG1 — Draft Plan

- Part of: [PROT1](#prot1--consensus-planning)

### STG2 — Architectural Review

- Part of: [PROT1](#prot1--consensus-planning)
- Must follow: [STG1](#stg1--draft-plan)

### STG3 — Critical Evaluation

- Part of: [PROT1](#prot1--consensus-planning)
- Must follow: [STG2](#stg2--architectural-review)

## Roles

### ROLE1 — Planner

Produces an initial scoped plan.

### ROLE2 — Architect

Reviews structural and design soundness.

### ROLE3 — Critic

Evaluates quality, completeness, and testability.

## Gates

### GATE1 — Scope Gate

Blocks execution when work is vague or underspecified.

- Governed by: [INV1](./INVARIANTS.md#inv1--traceable-scope)

## Modes

### MODE1 — Standard Mode

### MODE2 — Interactive Mode

Adds explicit user checkpoints.

- Modifies: [PROT1](#prot1--consensus-planning)

### MODE3 — Deliberate Mode

Adds stronger risk analysis and broader verification.

- Modifies: [PROT1](#prot1--consensus-planning)

