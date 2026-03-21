---
title: "ART1 — System Comparisons"
doc_type: "artefact"
scope: "artefact"
---

# ART1 — System Comparisons

## Concepts

### CMP-ADR — ADR Comparison

Architecture Decision Records cover decision history only.
SysProM subsumes ADR and adds structure, evolution, invariants, and graph-native traceability.

### CMP-C4 — C4 Comparison

C4 covers multi-level structure (Context, Container, Component, Code).
It is static — no decisions, changes, or time. SysProM adds all three.

### CMP-DDD — DDD Comparison

Domain-Driven Design covers intent and concept layers via ubiquitous language and bounded contexts.
Weak on decisions and evolution. SysProM adds both.

### CMP-ES — Event Sourcing Comparison

Event sourcing tracks changes as first-class events.
No abstraction layers, no decisions (why), no semantic structure. SysProM adds all three.

### CMP-KG — Knowledge Graph Comparison

Knowledge graphs provide the underlying data model (nodes + typed edges).
Lack lifecycle, decision semantics, and temporal workflow. SysProM adds these.

### CMP-TRACE — Traceability Matrix Comparison

Traceability matrices link requirements to design to implementation.
Very linear, no decisions, no non-linearity. SysProM is graph-native.

### CMP-EA — Enterprise Architecture Comparison

ArchiMate/TOGAF cover capability and structure layers with standardised elements.
Heavyweight, static, weak on iteration. SysProM is lightweight and decision-driven.

### CMP-RFC — RFC Process Comparison

RFC processes cover decision lifecycle (proposal, discussion, acceptance).
Not connected to a system model. SysProM integrates decisions with the system graph.

### CMP-GIT — Git Comparison

Git provides temporal mechanics (append-only history, branching, merging).
No semantic structure — just file diffs. SysProM adds typed nodes and relationships.

### CMP-MBSE — MBSE/SysML Comparison

MBSE is the closest formal equivalent — requirements, structure, behaviour, constraints.
SysProM can be understood as a lightweight, human-readable, decision-centric MBSE.

### CMP-SPECKIT — Spec Kit Comparison

Spec Kit is a spec-driven development toolkit where specifications become executable.
Can be fully modelled within SysProM as a protocol with stages, artefacts, and artefact flows.
SysProM adds invariants, decision supersession, and graph-native traceability.

### CMP-RALPLAN — Ralplan Comparison

Ralplan runs Planner, Architect, and Critic roles sequentially until consensus.
Its process can be modelled as a SysProM protocol with roles, stages, gates, and modes.
SysProM can store Ralplan's outputs but cannot replace the planning intelligence itself.

### CMP-GSD — GSD Comparison

get-shit-done presents a simple command surface while hiding orchestration complexity.
Can be modelled as a system with multiple runtime realisations governed by a user-surface stability principle.
SysProM captures the architectural truth: one stable capability surface, multiple interchangeable realisations.

### CMP-SUMMARY — Summary

ADR=decisions, C4=structure, DDD=concepts, Event sourcing=changes, Knowledge graph=relationships, Traceability=linking, EA=layers, RFC=lifecycle, Git=history, MBSE=formal modelling.
Each optimises one axis. SysProM combines all into a single recursive graph.
Spec Kit, Ralplan, and GSD compose with SysProM: Ralplan generates plans, Spec Kit stores specs, GSD executes, SysProM tracks provenance.

