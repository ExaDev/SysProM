---
title: "STATE"
doc_type: "state"
---

# STATE

## Protocols

### PROT1 — Consensus Planning

## Stages

### ST1 — Draft Plan

- Part of: PROT1

### ST2 — Architectural Review

- Part of: PROT1
- Must follow: ST1

### ST3 — Critical Evaluation

- Part of: PROT1
- Must follow: ST2

## Roles

### ROLE1 — Planner

Produces an initial scoped plan.

- Performs: ST1

### ROLE2 — Architect

Reviews structural and design soundness.

- Performs: ST2

### ROLE3 — Critic

Evaluates quality, completeness, and testability.

- Performs: ST3

## Gates

### G1 — Scope Gate

Blocks execution when work is vague or underspecified.

- Governed by: INV1

## Modes

### M1 — Standard Mode

### M2 — Interactive Mode

Adds explicit user checkpoints.

- Modifies: PROT1

### M3 — Deliberate Mode

Adds stronger risk analysis and broader verification.

- Modifies: PROT1

