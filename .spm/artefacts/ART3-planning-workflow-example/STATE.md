---
title: "STATE"
doc_type: "state"
---

# STATE

## Protocols

### PROT1 — Consensus Planning

## Stages

### STG1 — Draft Plan

- Part of: PROT1

### STG2 — Architectural Review

- Part of: PROT1
- Must follow: STG1

### STG3 — Critical Evaluation

- Part of: PROT1
- Must follow: STG2

## Roles

### ROLE1 — Planner

Produces an initial scoped plan.

- Performs: STG1

### ROLE2 — Architect

Reviews structural and design soundness.

- Performs: STG2

### ROLE3 — Critic

Evaluates quality, completeness, and testability.

- Performs: STG3

## Gates

### GATE1 — Scope Gate

Blocks execution when work is vague or underspecified.

- Governed by: INV1

## Modes

### MODE1 — Standard Mode

### MODE2 — Interactive Mode

Adds explicit user checkpoints.

- Modifies: PROT1

### MODE3 — Deliberate Mode

Adds stronger risk analysis and broader verification.

- Modifies: PROT1

