---
title: "EL2 — Process Node Family"
doc_type: "element"
scope: "element"
status: "active"
---

# EL2 — Process Node Family

## Concepts

### NT-PRINCIPLE — principle

Normative design value. May be overridden with justification, unlike invariants.

### NT-POLICY — policy

Operational routing, gating, or selection rule. Implements principles and invariants.

### NT-PROTOCOL — protocol

Defined sequence of stages performed by roles. Protocols MAY depend on other protocols.

### NT-STAGE — stage

A step within a protocol. MUST have defined ordering. MAY produce or consume artefacts.

### NT-ROLE — role

A participant that performs stages. MAY be human, automated, or agent-based.

### NT-GATE — gate

Conditional blocker or redirector. MUST reference the invariant or policy it enforces.
MAY block a stage or route to an alternative.

### NT-MODE — mode

Named behavioural configuration that modifies a protocol or stage without redefining the system.
MAY be triggered by gates, selected by policies, or chosen explicitly.

