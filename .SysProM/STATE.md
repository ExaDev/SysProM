---
title: "STATE"
doc_type: "state"
---

# STATE

## Elements

### ELEM1 — Domain Node Family

The set of node types that model what the system is.

- Realises: [CAP1](./INTENT.md#cap1--cross-layer-traceability)

#### Lifecycle

- [x] active

#### Subsystem

##### CON1-INTENT — intent

System purpose or goal. Stable, independent of implementation.

##### CON2-CONCEPT — concept

Abstract model or idea. Defines what the system is, independent of structure and realisation.

##### CON3-CAPABILITY — capability

Enabled behaviour. Derived from concepts, independent of implementation.

##### CON4-ELEMENT — element

Structural unit (logical part of system). Defines organisation, may depend on other elements.

##### CON5-REALISATION — realisation

Concrete implementation of an element. Multiple realisations may coexist (alternative, concurrent, or experimental).

##### CON6-INVARIANT — invariant

Constraint that must always hold. Independent of decisions and changes. Constrains allowable system states.

### ELEM2 — Process Node Family

The set of node types that model how work flows through the system.

- Realises: [CAP6](./INTENT.md#cap6--process-modelling)

#### Lifecycle

- [x] active

#### Subsystem

##### CON1-PRINCIPLE — principle

Normative design value. May be overridden with justification, unlike invariants.

##### CON2-POLICY — policy

Operational routing, gating, or selection rule. Implements principles and invariants.

##### CON3-PROTOCOL — protocol

Defined sequence of stages performed by roles. Protocols MAY depend on other protocols.

##### CON4-STAGE — stage

A step within a protocol. MUST have defined ordering. MAY produce or consume artefacts.

##### CON5-ROLE — role

A participant that performs stages. MAY be human, automated, or agent-based.

##### CON6-GATE — gate

Conditional blocker or redirector. MUST reference the invariant or policy it enforces.
MAY block a stage or route to an alternative.

##### CON7-MODE — mode

Named behavioural configuration that modifies a protocol or stage without redefining the system.
MAY be triggered by gates, selected by policies, or chosen explicitly.

### ELEM3 — Artefact Node Family

The set of node types that model what is produced and consumed.

- Realises: [CAP6](./INTENT.md#cap6--process-modelling)

#### Lifecycle

- [x] active

#### Subsystem

##### CON1-ARTEFACT — artefact

A document, record, or output produced or consumed during system evolution.

##### CON2-ARTEFACT_FLOW — artefact_flow

A transformation of one artefact into another within a stage.
Provides traceability of how documents and records evolve through a process.

### ELEM4 — Evolution Node Family

The set of node types that model how the system changes over time.

- Realises:
  - [CAP2](./INTENT.md#cap2--decision-recording)
  - [CAP4](./INTENT.md#cap4--change-tracking)

#### Lifecycle

- [x] active

#### Subsystem

##### CON1-DECISION — decision

Selection between alternatives that influences system structure or behaviour.
MUST define selected option, list alternatives, identify affected nodes, and identify preserved invariants.
MAY supersede prior decisions. Superseded decisions remain in history.

##### CON2-CHANGE — change

System modification over time.
MUST define scope, reference decisions, define operations (add/update/remove/link), and define lifecycle state.
MAY include execution plan. MAY overlap, depend on other changes, and be partially completed.

### ELEM5 — Projection Node Family

Optional node types for views and snapshots.

#### Lifecycle

- [x] active

#### Subsystem

##### CON1-VIEW — view

A named projection of a subset of the graph.

##### CON2-MILESTONE — milestone

A named point in evolution.

##### CON3-VERSION — version

A frozen snapshot of the system.

### ELEM6 — Relationship Type Registry

The set of typed, directed connections available between nodes.

- Realises: [CAP1](./INTENT.md#cap1--cross-layer-traceability)

#### Lifecycle

- [x] active

#### Subsystem

##### CON1-REFINES — refines

Abstraction refinement (e.g. capability refines concept).

##### CON2-REALISES — realises

Fulfils a capability.

##### CON3-IMPLEMENTS — implements

Fulfils an element.

##### CON4-DEPENDS_ON — depends_on

Dependency between nodes.

##### CON5-CONSTRAINED_BY — constrained_by

Governed by an invariant.

##### CON6-AFFECTS — affects

Impact of a decision or change on a node.

##### CON7-SUPERSEDES — supersedes

Replacement of one node by another.

##### CON8-MUST_PRESERVE — must_preserve

Preservation of an invariant by a decision or change.

##### CON9-PERFORMS — performs

A role performs a stage.

##### CON10-PART_OF — part_of

A stage belongs to a protocol.

##### CON11-PRECEDES — precedes

Ordering between stages.

##### CON12-MUST_FOLLOW — must_follow

Strict ordering constraint between stages.

##### CON13-BLOCKS — blocks

A gate blocks a stage.

##### CON14-ROUTES_TO — routes_to

A gate redirects to a stage.

##### CON25-ORCHESTRATES — orchestrates

An abstract workflow machine directs executable milestones, stages, gates, or artefact flows.

##### CON15-GOVERNED_BY — governed_by

A gate or policy is governed by a principle or invariant.

##### CON16-MODIFIES — modifies

A mode modifies a protocol or stage.

##### CON17-TRIGGERED_BY — triggered_by

A mode is triggered by a gate.

##### CON18-APPLIES_TO — applies_to

A mode applies to a protocol.

##### CON19-PRODUCES — produces

A stage produces an artefact.

##### CON20-CONSUMES — consumes

A stage consumes an artefact.

##### CON21-TRANSFORMS_INTO — transforms_into

An artefact flow transforms input to output.

##### CON22-SELECTS — selects

A decision selects a realisation.

##### CON23-REQUIRES — requires

A gate or mode requires a condition.

##### CON24-DISABLES — disables

A mode disables a capability.

### ELEM7 — External Reference Model

The mechanism for relating nodes to resources outside the graph.

- Realises: [CAP8](./INTENT.md#cap8--external-resource-referencing)

#### Lifecycle

- [x] active

#### Subsystem

##### CON1-INTERNALISE — Internalisation

Content from an external resource captured directly within a node.
The node becomes self-contained and does not depend on the external source.

##### CON2-REFERENCE — External Reference

A declared relationship to a resource outside the graph, identified by a serialisation-specific identifier with a typed role.

##### CON3-ROLE-INPUT — input

Resource that informed the creation of this node.

##### CON4-ROLE-OUTPUT — output

Resource produced as a result of this node.

##### CON5-ROLE-CONTEXT — context

Background material relevant to understanding this node.

##### CON6-ROLE-EVIDENCE — evidence

Material that supports or justifies this node.

##### CON7-ROLE-SOURCE — source

Original material from which this node was derived.

##### CON8-ROLE-STANDARD — standard

External standard or specification that this node conforms to or enforces.

##### CON9-ROLE-PRIOR_ART — prior_art

Existing work that this node relates to or was influenced by.

### ELEM8 — File Representation

Conventions for encoding SysProM in file-based formats.

- Realises: [CAP7](./INTENT.md#cap7--flexible-representation)

#### Lifecycle

- [x] active

### ELEM9 — Non-Linear Evolution

The model supports branching, merging, and revival of nodes.

- Realises:
  - [CAP9](./INTENT.md#cap9--branching)
  - [CAP10](./INTENT.md#cap10--merging)
  - [CAP11](./INTENT.md#cap11--revival)

#### Lifecycle

- [x] active

### ELEM10 — Extensibility

The mechanism for extending SysProM beyond its core types.

- Realises: [CAP7](./INTENT.md#cap7--flexible-representation)
- Constrained by: [INV18](./INVARIANTS.md#inv18--extension-constraint-preservation)

#### Lifecycle

- [x] active

## Realisations

### REAL1 — Markdown Representation

Primary representation using headings as nodes, lists as relationships, checkboxes as lifecycle, front matter as document metadata.

- Implements:
  - [ELEM1](#elem1--domain-node-family)
  - [ELEM2](#elem2--process-node-family)
  - [ELEM3](#elem3--artefact-node-family)
  - [ELEM4](#elem4--evolution-node-family)

#### Lifecycle

- [x] active

### REAL2 — Single-File Form

All sections in one file (SysProM.md, SYSPROM.md, SPM.md, or README.spm.md).

- Implements: [ELEM8](#elem8--file-representation)

#### Lifecycle

- [x] active

### REAL3 — Multi-Document Form

Separate files per concern (README, INTENT, INVARIANTS, STATE, DECISIONS, CHANGES).

- Implements: [ELEM8](#elem8--file-representation)

#### Lifecycle

- [x] active

### REAL4 — Recursive Folder Form

Node folders with their own document sets. Nodes may also be single files using .spm.md extension.

- Implements: [ELEM8](#elem8--file-representation)

#### Lifecycle

- [x] active

### REAL5 — JSON Serialisation

JSON representation validated against schema.json. Supports recursive composition via the subsystem property.

- Implements:
  - [ELEM1](#elem1--domain-node-family)
  - [ELEM2](#elem2--process-node-family)
  - [ELEM3](#elem3--artefact-node-family)
  - [ELEM4](#elem4--evolution-node-family)

#### Lifecycle

- [x] active

## Protocols

### PROT1 — Decision Lifecycle

The lifecycle state machine for decision nodes.

### PROT2 — Change Lifecycle

The lifecycle state machine for change nodes.

### PROT3 — Node Lifecycle

The general lifecycle state machine for nodes.

## Stages

### STG1-DEC-PROPOSED — proposed

Decision has been proposed but not yet evaluated.

- Part of: [PROT1](#prot1--decision-lifecycle)

### STG2-DEC-ACCEPTED — accepted

Decision has been accepted as the chosen path.

- Part of: [PROT1](#prot1--decision-lifecycle)
- Must follow: [STG1-DEC-PROPOSED](#stg1-dec-proposed--proposed)

### STG3-DEC-IMPLEMENTED — implemented

Decision has been implemented in the system.

- Part of: [PROT1](#prot1--decision-lifecycle)
- Must follow: [STG2-DEC-ACCEPTED](#stg2-dec-accepted--accepted)

### STG4-DEC-ADOPTED — adopted

Decision has been fully adopted across the system.

- Part of: [PROT1](#prot1--decision-lifecycle)
- Must follow: [STG3-DEC-IMPLEMENTED](#stg3-dec-implemented--implemented)

### STG5-DEC-SUPERSEDED — superseded

Decision has been replaced by a newer decision.

- Part of: [PROT1](#prot1--decision-lifecycle)
- Precedes: [STG4-DEC-ADOPTED](#stg4-dec-adopted--adopted)

### STG6-DEC-ABANDONED — abandoned

Decision was accepted but later abandoned without implementation.

- Part of: [PROT1](#prot1--decision-lifecycle)
- Precedes: [STG2-DEC-ACCEPTED](#stg2-dec-accepted--accepted)

### STG7-DEC-DEFERRED — deferred

Decision was accepted but deferred for later implementation.

- Part of: [PROT1](#prot1--decision-lifecycle)
- Precedes: [STG2-DEC-ACCEPTED](#stg2-dec-accepted--accepted)

### STG8-CHG-DEFINED — defined

Change has been defined with scope and operations.

- Part of: [PROT2](#prot2--change-lifecycle)

### STG9-CHG-INTRODUCED — introduced

Change has been introduced into the system.

- Part of: [PROT2](#prot2--change-lifecycle)
- Must follow: [STG8-CHG-DEFINED](#stg8-chg-defined--defined)

### STG10-CHG-IN_PROGRESS — in_progress

Change is being actively worked on.

- Part of: [PROT2](#prot2--change-lifecycle)
- Must follow: [STG9-CHG-INTRODUCED](#stg9-chg-introduced--introduced)

### STG11-CHG-COMPLETE — complete

Change has been fully applied.

- Part of: [PROT2](#prot2--change-lifecycle)
- Must follow: [STG10-CHG-IN_PROGRESS](#stg10-chg-in_progress--in_progress)

### STG12-CHG-CONSOLIDATED — consolidated

Change has been consolidated and cleaned up.

- Part of: [PROT2](#prot2--change-lifecycle)
- Must follow: [STG11-CHG-COMPLETE](#stg11-chg-complete--complete)

### STG13-NODE-PROPOSED — proposed

Node has been proposed but is not yet active.

- Part of: [PROT3](#prot3--node-lifecycle)

### STG14-NODE-ACTIVE — active

Node is currently active in the system.

- Part of: [PROT3](#prot3--node-lifecycle)
- Must follow: [STG13-NODE-PROPOSED](#stg13-node-proposed--proposed)

### STG15-NODE-DEPRECATED — deprecated

Node is deprecated but still present in the system.

- Part of: [PROT3](#prot3--node-lifecycle)
- Must follow: [STG14-NODE-ACTIVE](#stg14-node-active--active)

### STG16-NODE-RETIRED — retired

Node has been retired from active use.

- Part of: [PROT3](#prot3--node-lifecycle)
- Must follow: [STG15-NODE-DEPRECATED](#stg15-node-deprecated--deprecated)

## Artefacts

### ART1 — System Comparisons

Comparison of SysProM against existing systems and tools, demonstrating what each covers and where SysProM fills gaps.

- Affects: [DEC4](./DECISIONS.md#dec4--add-process-modelling)

#### Subsystem

##### CON1-ADR — ADR Comparison

Architecture Decision Records cover decision history only.
SysProM subsumes ADR and adds structure, evolution, invariants, and graph-native traceability.

##### CON2 — C4 Comparison

C4 covers multi-level structure (Context, Container, Component, Code).
It is static — no decisions, changes, or time. SysProM adds all three.

##### CON3-DDD — DDD Comparison

Domain-Driven Design covers intent and concept layers via ubiquitous language and bounded contexts.
Weak on decisions and evolution. SysProM adds both.

##### CON4-ES — Event Sourcing Comparison

Event sourcing tracks changes as first-class events.
No abstraction layers, no decisions (why), no semantic structure. SysProM adds all three.

##### CON5-KG — Knowledge Graph Comparison

Knowledge graphs provide the underlying data model (nodes + typed edges).
Lack lifecycle, decision semantics, and temporal workflow. SysProM adds these.

##### CON6-TRACE — Traceability Matrix Comparison

Traceability matrices link requirements to design to implementation.
Very linear, no decisions, no non-linearity. SysProM is graph-native.

##### CON7-EA — Enterprise Architecture Comparison

ArchiMate/TOGAF cover capability and structure layers with standardised elements.
Heavyweight, static, weak on iteration. SysProM is lightweight and decision-driven.

##### CON8-RFC — RFC Process Comparison

RFC processes cover decision lifecycle (proposal, discussion, acceptance).
Not connected to a system model. SysProM integrates decisions with the system graph.

##### CON9-GIT — Git Comparison

Git provides temporal mechanics (append-only history, branching, merging).
No semantic structure — just file diffs. SysProM adds typed nodes and relationships.

##### CON10-MBSE — MBSE/SysML Comparison

MBSE is the closest formal equivalent — requirements, structure, behaviour, constraints.
SysProM can be understood as a lightweight, human-readable, decision-centric MBSE.

##### CON11-SPECKIT — Spec Kit Comparison

Spec Kit is a spec-driven development toolkit where specifications become executable.
Can be fully modelled within SysProM as a protocol with stages, artefacts, and artefact flows.
SysProM adds invariants, decision supersession, and graph-native traceability.
Bidirectional interoperability: SysProM can import Spec-Kit project files (spec.md, plan.md, tasks.md, constitution.md, checklist.md) into typed nodes and export them back, enabling round-trip editing in either format.

##### CON12-RALPLAN — Ralplan Comparison

Ralplan runs Planner, Architect, and Critic roles sequentially until consensus.
Its process can be modelled as a SysProM protocol with roles, stages, gates, and modes.
SysProM can store Ralplan's outputs but cannot replace the planning intelligence itself.

##### CON13-GSD — GSD Comparison

get-shit-done presents a simple command surface while hiding orchestration complexity.
Can be modelled as a system with multiple runtime realisations governed by a user-surface stability principle.
SysProM captures the architectural truth: one stable capability surface, multiple interchangeable realisations.

##### CON14-SUMMARY — Summary

ADR=decisions, C4=structure, DDD=concepts, Event sourcing=changes, Knowledge graph=relationships, Traceability=linking, EA=layers, RFC=lifecycle, Git=history, MBSE=formal modelling.
Each optimises one axis. SysProM combines all into a single recursive graph.
Spec Kit, Ralplan, and GSD compose with SysProM: Ralplan generates plans, Spec Kit stores specs, GSD executes, SysProM tracks provenance.

### ART2 — Document Workspace Example

A worked example demonstrating SysProM applied to a document conversion webapp with placement-agnostic contracts and conditional sync constraints.

#### Subsystem

##### INT1 — Document Workspace

Enable users to ingest, transform, store, and access documents consistently across contexts.

##### CON1 — Document Transformation

Documents can be converted between representations.

- Refines: [INT1](#int1--document-workspace)

##### CON2 — Document Persistence

Documents can be stored and later retrieved.

- Refines: [INT1](#int1--document-workspace)

##### CON3 — Document Synchronisation

Documents can be kept consistent across multiple contexts.

- Refines: [INT1](#int1--document-workspace)

##### INV1 — Stable Document Identity

A document retains identity regardless of storage location.

##### INV2 — Placement-Agnostic Conversion

The conversion contract is identical regardless of execution location.

##### INV3 — Placement-Agnostic Storage

The storage contract is identical regardless of persistence location.

##### INV4 — Sync Requires Shared Persistence

If synchronisation is enabled, persistence must support shared remote state.

##### ELEM1 — Transformation Engine

- Realises: [CON1](#con1--document-transformation)

##### ELEM2 — Document Store

- Realises: [CON2](#con2--document-persistence)

##### REAL1 — Local Conversion

- Implements: [ELEM1](#elem1--transformation-engine)

###### Lifecycle

- [x] active

##### REAL2 — Remote Conversion

- Implements: [ELEM1](#elem1--transformation-engine)

###### Lifecycle

- [x] active

##### REAL3 — Local Storage

- Implements: [ELEM2](#elem2--document-store)

###### Lifecycle

- [x] active

##### REAL4 — Remote Storage

- Implements: [ELEM2](#elem2--document-store)

###### Lifecycle

- [x] active

##### DEC1 — Abstract Conversion Placement

- Affects: [ELEM1](#elem1--transformation-engine)
- Must preserve: [INV2](#inv2--placement-agnostic-conversion)

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

##### INT1 — Reliable Change Delivery

Enable work to move from idea to execution in a controlled, reviewable, and traceable way.

##### INV1 — Traceable Scope

No change may be executed unless its scope can be identified.

##### INV2 — Review Before Approval

Approval cannot occur until review has completed.

##### PROT1 — Consensus Planning

##### STG1 — Draft Plan

- Part of: [PROT1](#prot1--consensus-planning)

##### STG2 — Architectural Review

- Part of: [PROT1](#prot1--consensus-planning)
- Must follow: [STG1](#stg1--draft-plan)

##### STG3 — Critical Evaluation

- Part of: [PROT1](#prot1--consensus-planning)
- Must follow: [STG2](#stg2--architectural-review)

##### ROLE1 — Planner

Produces an initial scoped plan.

##### ROLE2 — Architect

Reviews structural and design soundness.

##### ROLE3 — Critic

Evaluates quality, completeness, and testability.

##### GATE1 — Scope Gate

Blocks execution when work is vague or underspecified.

- Governed by: [INV1](#inv1--traceable-scope)

##### MODE1 — Standard Mode

##### MODE2 — Interactive Mode

Adds explicit user checkpoints.

- Modifies: [PROT1](#prot1--consensus-planning)

##### MODE3 — Deliberate Mode

Adds stronger risk analysis and broader verification.

- Modifies: [PROT1](#prot1--consensus-planning)

### ART4 — System Provenance Profile Guidance

README guidance describing recommended node usage, trace chains, relationship usage, and implementation provenance patterns for product repositories.

