---
title: "INTENT"
doc_type: "intent"
---

# INTENT

## Intent

### INT1 — System Provenance

Enable any system — regardless of domain — to record where every part came from, what decisions shaped it, and how it reached its current form.

## Concepts

### CON1 — Layered Abstraction

A system is understood through distinct layers of abstraction: intent, concept, capability, structure, and realisation.
Each layer is valid independently of the layers below it.

- Refines: [INT1](#int1--system-provenance)

### CON2 — Decision-Driven Evolution

Systems evolve through explicit decisions.
Decisions select between alternatives, affect nodes, and must preserve invariants.
Decisions are never deleted — they are superseded.

- Refines: [INT1](#int1--system-provenance)

### CON3 — Append-Only History

The history of a system is additive. Nodes are deprecated or retired, not erased.
Changes record what happened; they do not overwrite prior state.

- Refines: [INT1](#int1--system-provenance)

### CON4 — Recursive Composition

Any node may be treated as a subsystem with its own internal structure.
The same model applies at every level of nesting.

- Refines: [INT1](#int1--system-provenance)

### CON5 — Process as Structure

Workflows, roles, stages, gates, and artefacts are modelled with the same rigour as domain concepts.
Process is not a second-class concern.

- Refines: [INT1](#int1--system-provenance)

### CON6 — Format Agnosticism

The model defines semantics, not storage.
It may be represented in Markdown, JSON, a database, or any other structured format.

- Refines: [INT1](#int1--system-provenance)

### CON7 — External Resource Handling

Nodes may relate to resources outside the graph.
Content may be internalised for portability or referenced for traceability, or both.

- Refines: [INT1](#int1--system-provenance)

### CON8 — Conformance

A system conforms to SysProM if it meets a defined set of minimum requirements, ensuring interoperability and consistency.

- Refines: [INT1](#int1--system-provenance)

## Capabilities

### CAP1 — Cross-Layer Traceability

Trace any node from intent through concept, capability, and structure to realisation.

- Refines: [CON1](#con1--layered-abstraction)

### CAP2 — Decision Recording

Record choices with alternatives considered, rationale, affected nodes, and preserved invariants.

- Refines: [CON2](#con2--decision-driven-evolution)

### CAP3 — Invariant Enforcement

Define rules that must hold across all valid system states.
Decisions and changes must explicitly identify which invariants they preserve.

- Refines: [CON2](#con2--decision-driven-evolution)

### CAP4 — Change Tracking

Record every addition, modification, removal, and transition with scope, decision, and lifecycle state.

- Refines: [CON3](#con3--append-only-history)

### CAP5 — Recursive Modelling

Represent any node as a subsystem with its own nodes, relationships, decisions, and changes, using the same conventions at every depth.

- Refines: [CON4](#con4--recursive-composition)

### CAP6 — Process Modelling

Define protocols, stages, roles, gates, modes, artefacts, and artefact flows as first-class graph nodes.

- Refines: [CON5](#con5--process-as-structure)

### CAP7 — Flexible Representation

Encode the model in a single file, a multi-document folder, nested folders, or a non-file format, with the same underlying semantics.

- Refines: [CON6](#con6--format-agnosticism)

### CAP8 — External Resource Referencing

Reference or internalise resources outside the graph with typed roles (input, output, context, evidence, source, standard, prior_art).

- Refines: [CON7](#con7--external-resource-handling)

### CAP9 — Branching

The model MUST support multiple concurrent evolution paths (e.g. experimental branches).

- Refines: [CON4](#con4--recursive-composition)

### CAP10 — Merging

Branches MAY be merged.

- Refines: [CON4](#con4--recursive-composition)

### CAP11 — Revival

Previously deprecated or retired nodes MAY be reintroduced.

- Refines: [CON3](#con3--append-only-history)

