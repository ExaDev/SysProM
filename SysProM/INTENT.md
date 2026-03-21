---
title: "INTENT"
doc_type: "intent"
---

# INTENT

## Intent

### I1 — System Provenance

Enable any system — regardless of domain — to record where every part came from, what decisions shaped it, and how it reached its current form.

## Concepts

### CN1 — Layered Abstraction

A system is understood through distinct layers of abstraction: intent, concept, capability, structure, and realisation.
Each layer is valid independently of the layers below it.

- Refines: I1

### CN2 — Decision-Driven Evolution

Systems evolve through explicit decisions.
Decisions select between alternatives, affect nodes, and must preserve invariants.
Decisions are never deleted — they are superseded.

- Refines: I1

### CN3 — Append-Only History

The history of a system is additive. Nodes are deprecated or retired, not erased.
Changes record what happened; they do not overwrite prior state.

- Refines: I1

### CN4 — Recursive Composition

Any node may be treated as a subsystem with its own internal structure.
The same model applies at every level of nesting.

- Refines: I1

### CN5 — Process as Structure

Workflows, roles, stages, gates, and artefacts are modelled with the same rigour as domain concepts.
Process is not a second-class concern.

- Refines: I1

### CN6 — Format Agnosticism

The model defines semantics, not storage.
It may be represented in Markdown, JSON, a database, or any other structured format.

- Refines: I1

### CN7 — External Resource Handling

Nodes may relate to resources outside the graph.
Content may be internalised for portability or referenced for traceability, or both.

- Refines: I1

### CN8 — Conformance

A system conforms to SysProM if it meets a defined set of minimum requirements, ensuring interoperability and consistency.

- Refines: I1

## Capabilities

### CP1 — Cross-Layer Traceability

Trace any node from intent through concept, capability, and structure to realisation.

- Refines: CN1

### CP2 — Decision Recording

Record choices with alternatives considered, rationale, affected nodes, and preserved invariants.

- Refines: CN2

### CP3 — Invariant Enforcement

Define rules that must hold across all valid system states.
Decisions and changes must explicitly identify which invariants they preserve.

- Refines: CN2

### CP4 — Change Tracking

Record every addition, modification, removal, and transition with scope, decision, and lifecycle state.

- Refines: CN3

### CP5 — Recursive Modelling

Represent any node as a subsystem with its own nodes, relationships, decisions, and changes, using the same conventions at every depth.

- Refines: CN4

### CP6 — Process Modelling

Define protocols, stages, roles, gates, modes, artefacts, and artefact flows as first-class graph nodes.

- Refines: CN5

### CP7 — Flexible Representation

Encode the model in a single file, a multi-document folder, nested folders, or a non-file format, with the same underlying semantics.

- Refines: CN6

### CP8 — External Resource Referencing

Reference or internalise resources outside the graph with typed roles (input, output, context, evidence, source, standard, prior_art).

- Refines: CN7

### CP9 — Branching

The model MUST support multiple concurrent evolution paths (e.g. experimental branches).

- Refines: CN4

### CP10 — Merging

Branches MAY be merged.

- Refines: CN4

### CP11 — Revival

Previously deprecated or retired nodes MAY be reintroduced.

- Refines: CN3

