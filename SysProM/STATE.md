---
title: "STATE"
doc_type: "state"
---

# STATE

## Elements

### EL1 — Domain Node Family

The set of node types that model what the system is.

- Realises: CP1

- Status: active

#### Subsystem

##### NT-INTENT — intent

System purpose or goal. Stable, independent of implementation.

##### NT-CONCEPT — concept

Abstract model or idea. Defines what the system is, independent of structure and realisation.

##### NT-CAPABILITY — capability

Enabled behaviour. Derived from concepts, independent of implementation.

##### NT-ELEMENT — element

Structural unit (logical part of system). Defines organisation, may depend on other elements.

##### NT-REALISATION — realisation

Concrete implementation of an element. Multiple realisations may coexist (alternative, concurrent, or experimental).

##### NT-INVARIANT — invariant

Constraint that must always hold. Independent of decisions and changes. Constrains allowable system states.

### EL2 — Process Node Family

The set of node types that model how work flows through the system.

- Realises: CP6

- Status: active

#### Subsystem

##### NT-PRINCIPLE — principle

Normative design value. May be overridden with justification, unlike invariants.

##### NT-POLICY — policy

Operational routing, gating, or selection rule. Implements principles and invariants.

##### NT-PROTOCOL — protocol

Defined sequence of stages performed by roles. Protocols MAY depend on other protocols.

##### NT-STAGE — stage

A step within a protocol. MUST have defined ordering. MAY produce or consume artefacts.

##### NT-ROLE — role

A participant that performs stages. MAY be human, automated, or agent-based.

##### NT-GATE — gate

Conditional blocker or redirector. MUST reference the invariant or policy it enforces.
MAY block a stage or route to an alternative.

##### NT-MODE — mode

Named behavioural configuration that modifies a protocol or stage without redefining the system.
MAY be triggered by gates, selected by policies, or chosen explicitly.

### EL3 — Artefact Node Family

The set of node types that model what is produced and consumed.

- Realises: CP6

- Status: active

#### Subsystem

##### NT-ARTEFACT — artefact

A document, record, or output produced or consumed during system evolution.

##### NT-ARTEFACT_FLOW — artefact_flow

A transformation of one artefact into another within a stage.
Provides traceability of how documents and records evolve through a process.

### EL4 — Evolution Node Family

The set of node types that model how the system changes over time.

- Realises:
  - CP2
  - CP4

- Status: active

#### Subsystem

##### NT-DECISION — decision

Selection between alternatives that influences system structure or behaviour.
MUST define selected option, list alternatives, identify affected nodes, and identify preserved invariants.
MAY supersede prior decisions. Superseded decisions remain in history.

##### NT-CHANGE — change

System modification over time.
MUST define scope, reference decisions, define operations (add/update/remove/link), and define lifecycle state.
MAY include execution plan. MAY overlap, depend on other changes, and be partially completed.

### EL5 — Projection Node Family

Optional node types for views and snapshots.

- Status: active

#### Subsystem

##### NT-VIEW — view

A named projection of a subset of the graph.

##### NT-MILESTONE — milestone

A named point in evolution.

##### NT-VERSION — version

A frozen snapshot of the system.

### EL6 — Relationship Type Registry

The set of typed, directed connections available between nodes.

- Realises: CP1

- Status: active

#### Subsystem

##### RT-REFINES — refines

Abstraction refinement (e.g. capability refines concept).

##### RT-REALISES — realises

Fulfils a capability.

##### RT-IMPLEMENTS — implements

Fulfils an element.

##### RT-DEPENDS_ON — depends_on

Dependency between nodes.

##### RT-CONSTRAINED_BY — constrained_by

Governed by an invariant.

##### RT-AFFECTS — affects

Impact of a decision or change on a node.

##### RT-SUPERSEDES — supersedes

Replacement of one node by another.

##### RT-MUST_PRESERVE — must_preserve

Preservation of an invariant by a decision or change.

##### RT-PERFORMS — performs

A role performs a stage.

##### RT-PART_OF — part_of

A stage belongs to a protocol.

##### RT-PRECEDES — precedes

Ordering between stages.

##### RT-MUST_FOLLOW — must_follow

Strict ordering constraint between stages.

##### RT-BLOCKS — blocks

A gate blocks a stage.

##### RT-ROUTES_TO — routes_to

A gate redirects to a stage.

##### RT-GOVERNED_BY — governed_by

A gate or policy is governed by a principle or invariant.

##### RT-MODIFIES — modifies

A mode modifies a protocol or stage.

##### RT-TRIGGERED_BY — triggered_by

A mode is triggered by a gate.

##### RT-APPLIES_TO — applies_to

A mode applies to a protocol.

##### RT-PRODUCES — produces

A stage produces an artefact.

##### RT-CONSUMES — consumes

A stage consumes an artefact.

##### RT-TRANSFORMS_INTO — transforms_into

An artefact flow transforms input to output.

##### RT-SELECTS — selects

A decision selects a realisation.

##### RT-REQUIRES — requires

A gate or mode requires a condition.

##### RT-DISABLES — disables

A mode disables a capability.

### EL7 — External Reference Model

The mechanism for relating nodes to resources outside the graph.

- Realises: CP8

- Status: active

#### Subsystem

##### ER-INTERNALISE — Internalisation

Content from an external resource captured directly within a node.
The node becomes self-contained and does not depend on the external source.

##### ER-REFERENCE — External Reference

A declared relationship to a resource outside the graph, identified by a serialisation-specific identifier with a typed role.

##### ER-ROLE-INPUT — input

Resource that informed the creation of this node.

##### ER-ROLE-OUTPUT — output

Resource produced as a result of this node.

##### ER-ROLE-CONTEXT — context

Background material relevant to understanding this node.

##### ER-ROLE-EVIDENCE — evidence

Material that supports or justifies this node.

##### ER-ROLE-SOURCE — source

Original material from which this node was derived.

##### ER-ROLE-STANDARD — standard

External standard or specification that this node conforms to or enforces.

##### ER-ROLE-PRIOR_ART — prior_art

Existing work that this node relates to or was influenced by.

### EL8 — File Representation

Conventions for encoding SysProM in file-based formats.

- Realises: CP7

- Status: active

### EL9 — Non-Linear Evolution

The model supports branching, merging, and revival of nodes.

- Realises:
  - CP9
  - CP10
  - CP11

- Status: active

### EL10 — Extensibility

The mechanism for extending SysProM beyond its core types.

- Realises: CP7
- Constrained by: INV18

- Status: active

## Realisations

### R1 — Markdown Representation

Primary representation using headings as nodes, lists as relationships, checkboxes as lifecycle, front matter as document metadata.

- Implements:
  - EL1
  - EL2
  - EL3
  - EL4

- Status: active

### R2 — Single-File Form

All sections in one file (SysProM.md, SYSPROM.md, SPM.md, or README.spm.md).

- Implements: EL8

- Status: active

### R3 — Multi-Document Form

Separate files per concern (README, INTENT, INVARIANTS, STATE, DECISIONS, CHANGES).

- Implements: EL8

- Status: active

### R4 — Recursive Folder Form

Node folders with their own document sets. Nodes may also be single files using .spm.md extension.

- Implements: EL8

- Status: active

### R5 — JSON Serialisation

JSON representation validated against schema.json. Supports recursive composition via the subsystem property.

- Implements:
  - EL1
  - EL2
  - EL3
  - EL4

- Status: active

## Protocols

### PROT1 — Decision Lifecycle

The lifecycle state machine for decision nodes.

### PROT2 — Change Lifecycle

The lifecycle state machine for change nodes.

### PROT3 — Node Lifecycle

The general lifecycle state machine for nodes.

## Stages

### ST-DEC-PROPOSED — proposed

Decision has been proposed but not yet evaluated.

- Part of: PROT1

### ST-DEC-ACCEPTED — accepted

Decision has been accepted as the chosen path.

- Part of: PROT1
- Must follow: ST-DEC-PROPOSED

### ST-DEC-IMPLEMENTED — implemented

Decision has been implemented in the system.

- Part of: PROT1
- Must follow: ST-DEC-ACCEPTED

### ST-DEC-ADOPTED — adopted

Decision has been fully adopted across the system.

- Part of: PROT1
- Must follow: ST-DEC-IMPLEMENTED

### ST-DEC-SUPERSEDED — superseded

Decision has been replaced by a newer decision.

- Part of: PROT1
- Precedes: ST-DEC-ADOPTED

### ST-DEC-ABANDONED — abandoned

Decision was accepted but later abandoned without implementation.

- Part of: PROT1
- Precedes: ST-DEC-ACCEPTED

### ST-DEC-DEFERRED — deferred

Decision was accepted but deferred for later implementation.

- Part of: PROT1
- Precedes: ST-DEC-ACCEPTED

### ST-CHG-DEFINED — defined

Change has been defined with scope and operations.

- Part of: PROT2

### ST-CHG-INTRODUCED — introduced

Change has been introduced into the system.

- Part of: PROT2
- Must follow: ST-CHG-DEFINED

### ST-CHG-IN_PROGRESS — in_progress

Change is being actively worked on.

- Part of: PROT2
- Must follow: ST-CHG-INTRODUCED

### ST-CHG-COMPLETE — complete

Change has been fully applied.

- Part of: PROT2
- Must follow: ST-CHG-IN_PROGRESS

### ST-CHG-CONSOLIDATED — consolidated

Change has been consolidated and cleaned up.

- Part of: PROT2
- Must follow: ST-CHG-COMPLETE

### ST-NODE-PROPOSED — proposed

Node has been proposed but is not yet active.

- Part of: PROT3

### ST-NODE-ACTIVE — active

Node is currently active in the system.

- Part of: PROT3
- Must follow: ST-NODE-PROPOSED

### ST-NODE-DEPRECATED — deprecated

Node is deprecated but still present in the system.

- Part of: PROT3
- Must follow: ST-NODE-ACTIVE

### ST-NODE-RETIRED — retired

Node has been retired from active use.

- Part of: PROT3
- Must follow: ST-NODE-DEPRECATED

## Artefacts

### ART1 — System Comparisons

Comparison of SysProM against existing systems and tools, demonstrating what each covers and where SysProM fills gaps.

- Affects: D4

#### Subsystem

##### CMP-ADR — ADR Comparison

Architecture Decision Records cover decision history only.
SysProM subsumes ADR and adds structure, evolution, invariants, and graph-native traceability.

##### CMP-C4 — C4 Comparison

C4 covers multi-level structure (Context, Container, Component, Code).
It is static — no decisions, changes, or time. SysProM adds all three.

##### CMP-DDD — DDD Comparison

Domain-Driven Design covers intent and concept layers via ubiquitous language and bounded contexts.
Weak on decisions and evolution. SysProM adds both.

##### CMP-ES — Event Sourcing Comparison

Event sourcing tracks changes as first-class events.
No abstraction layers, no decisions (why), no semantic structure. SysProM adds all three.

##### CMP-KG — Knowledge Graph Comparison

Knowledge graphs provide the underlying data model (nodes + typed edges).
Lack lifecycle, decision semantics, and temporal workflow. SysProM adds these.

##### CMP-TRACE — Traceability Matrix Comparison

Traceability matrices link requirements to design to implementation.
Very linear, no decisions, no non-linearity. SysProM is graph-native.

##### CMP-EA — Enterprise Architecture Comparison

ArchiMate/TOGAF cover capability and structure layers with standardised elements.
Heavyweight, static, weak on iteration. SysProM is lightweight and decision-driven.

##### CMP-RFC — RFC Process Comparison

RFC processes cover decision lifecycle (proposal, discussion, acceptance).
Not connected to a system model. SysProM integrates decisions with the system graph.

##### CMP-GIT — Git Comparison

Git provides temporal mechanics (append-only history, branching, merging).
No semantic structure — just file diffs. SysProM adds typed nodes and relationships.

##### CMP-MBSE — MBSE/SysML Comparison

MBSE is the closest formal equivalent — requirements, structure, behaviour, constraints.
SysProM can be understood as a lightweight, human-readable, decision-centric MBSE.

##### CMP-SPECKIT — Spec Kit Comparison

Spec Kit is a spec-driven development toolkit where specifications become executable.
Can be fully modelled within SysProM as a protocol with stages, artefacts, and artefact flows.
SysProM adds invariants, decision supersession, and graph-native traceability.

##### CMP-RALPLAN — Ralplan Comparison

Ralplan runs Planner, Architect, and Critic roles sequentially until consensus.
Its process can be modelled as a SysProM protocol with roles, stages, gates, and modes.
SysProM can store Ralplan's outputs but cannot replace the planning intelligence itself.

##### CMP-GSD — GSD Comparison

get-shit-done presents a simple command surface while hiding orchestration complexity.
Can be modelled as a system with multiple runtime realisations governed by a user-surface stability principle.
SysProM captures the architectural truth: one stable capability surface, multiple interchangeable realisations.

##### CMP-SUMMARY — Summary

ADR=decisions, C4=structure, DDD=concepts, Event sourcing=changes, Knowledge graph=relationships, Traceability=linking, EA=layers, RFC=lifecycle, Git=history, MBSE=formal modelling.
Each optimises one axis. SysProM combines all into a single recursive graph.
Spec Kit, Ralplan, and GSD compose with SysProM: Ralplan generates plans, Spec Kit stores specs, GSD executes, SysProM tracks provenance.

### ART2 — Document Workspace Example

A worked example demonstrating SysProM applied to a document conversion webapp with placement-agnostic contracts and conditional sync constraints.

#### Subsystem

##### I1 — Document Workspace

Enable users to ingest, transform, store, and access documents consistently across contexts.

##### CN1 — Document Transformation

Documents can be converted between representations.

- Refines: I1

##### CN2 — Document Persistence

Documents can be stored and later retrieved.

- Refines: I1

##### CN3 — Document Synchronisation

Documents can be kept consistent across multiple contexts.

- Refines: I1

##### INV1 — Stable Document Identity

A document retains identity regardless of storage location.

##### INV2 — Placement-Agnostic Conversion

The conversion contract is identical regardless of execution location.

##### INV3 — Placement-Agnostic Storage

The storage contract is identical regardless of persistence location.

##### INV4 — Sync Requires Shared Persistence

If synchronisation is enabled, persistence must support shared remote state.

##### EL1 — Transformation Engine

- Realises: CN1

##### EL2 — Document Store

- Realises: CN2

##### R1 — Local Conversion

- Implements: EL1

- Status: active

##### R2 — Remote Conversion

- Implements: EL1

- Status: active

##### R3 — Local Storage

- Implements: EL2

- Status: active

##### R4 — Remote Storage

- Implements: EL2

- Status: active

##### D1 — Abstract Conversion Placement

- Affects: EL1
- Must preserve: INV2

Options:
- O1: UI distinguishes local and remote
- O2: Single contract independent of placement

Chosen: O2

Rationale: Execution location is a realisation concern.

###### Lifecycle

- [x] proposed
- [x] accepted
- [x] implemented

### ART3 — Planning Workflow Example

A worked example demonstrating SysProM process modelling with roles, protocols, stages, gates, modes, and artefact flows.

#### Subsystem

##### I1 — Reliable Change Delivery

Enable work to move from idea to execution in a controlled, reviewable, and traceable way.

##### INV1 — Traceable Scope

No change may be executed unless its scope can be identified.

##### INV2 — Review Before Approval

Approval cannot occur until review has completed.

##### ROLE1 — Planner

Produces an initial scoped plan.

- Performs: ST1

##### ROLE2 — Architect

Reviews structural and design soundness.

- Performs: ST2

##### ROLE3 — Critic

Evaluates quality, completeness, and testability.

- Performs: ST3

##### PROT1 — Consensus Planning

##### ST1 — Draft Plan

- Part of: PROT1

##### ST2 — Architectural Review

- Part of: PROT1
- Must follow: ST1

##### ST3 — Critical Evaluation

- Part of: PROT1
- Must follow: ST2

##### G1 — Scope Gate

Blocks execution when work is vague or underspecified.

- Governed by: INV1

##### M1 — Standard Mode

##### M2 — Interactive Mode

Adds explicit user checkpoints.

- Modifies: PROT1

##### M3 — Deliberate Mode

Adds stronger risk analysis and broader verification.

- Modifies: PROT1

