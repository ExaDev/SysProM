---
title: "CHANGES"
doc_type: "changes"
---

# CHANGES

## Changes

### CH1 — Initial Model

Establishes the core domain model with layered abstraction, decisions, changes, and invariants.

- Affects:
  - D1
  - D2
  - D7

Scope:
- I1
- CN1
- CN2
- CN3
- CN4
- CP1
- CP2
- CP3
- CP4
- CP5
- EL1
- EL4
- INV1
- INV2
- INV3
- INV4
- INV5
- INV6
- INV7
- PR1
- PR2
- PR3
- PR4
- PR5

Operations:
- add I1
- add EL1
- add EL4
- add EL6

#### Lifecycle

- [x] defined
- [x] introduced
- [x] complete

### CH2 — Add Process Modelling

Extends the model with process, artefact, and projection node families.

- Affects:
  - D3
  - D4

Scope:
- CN5
- CP6
- EL2
- EL3
- EL5
- INV8
- INV9
- INV10
- INV11

Operations:
- add EL2
- add EL3
- add EL5

#### Lifecycle

- [x] defined
- [x] introduced
- [x] complete

### CH3 — Add File Representation Conventions

Defines how SysProM may be encoded in files, including single-document, multi-document, and recursive folder forms.

- Affects:
  - D5
  - D6

Scope:
- CN6
- CP7
- R1
- R2
- R3
- R4
- R5
- EL8
- POL1
- POL2
- POL3
- POL10
- POL11
- POL12
- POL13
- POL14
- POL15
- POL16
- POL17
- POL18

Operations:
- add EL8
- add R1
- add R2
- add R3
- add R4
- add R5

#### Lifecycle

- [x] defined
- [x] introduced
- [x] complete

### CH4 — Rename to SysProM

Adopts SysProM (System Provenance Model) as the name, replacing the working title RDSM.

- Affects: D8

Scope:
- D8

Operations:
- update — All documents renamed to use SysProM

#### Lifecycle

- [x] defined
- [x] introduced
- [x] complete

### CH5 — Add External Resources Model

Adds the external reference and internalisation mechanism with typed roles.

- Affects: D9

Scope:
- CN7
- CP8
- EL7
- INV19
- INV20
- POL6

Operations:
- add CN7
- add CP8
- add EL7

#### Lifecycle

- [x] defined
- [x] introduced
- [x] complete

### CH6 — Add Lifecycle Protocols

Adds the decision, change, and node lifecycle state machines as protocols with stages and ordering.

- Affects: D4

Scope:
- PROT1
- PROT2
- PROT3

Operations:
- add PROT1
- add PROT2
- add PROT3

#### Lifecycle

- [x] defined
- [x] introduced
- [x] complete

### CH7 — Encode Full Normative Specification

Adds conformance requirements, missing invariants, security and extensibility policies, non-linear evolution capabilities, and complete node/relationship type vocabularies to make the JSON self-contained.

- Affects: D2

Scope:
- CONF1
- CONF2
- CONF3
- CONF4
- CONF5
- INV12
- INV13
- INV14
- INV15
- INV16
- INV17
- INV18
- POL4
- POL5
- POL6
- POL7
- POL8
- POL9
- EL9
- EL10
- CP9
- CP10
- CP11
- CN8

Operations:
- add CN8
- add EL9
- add EL10

#### Lifecycle

- [x] defined
- [x] introduced
- [x] complete

### CH8 — Add Text Field Duality

Adds support for text fields (description, context, rationale, internalised) to accept either a string or an array of strings.
Updates the JSON schema, Zod definitions, and specification.

- Affects: D10

Scope:
- INV21
- D10

Operations:
- add INV21
- add D10
- update R5 — JSON schema updated to accept string | string[] for text fields
- update R1 — Specification updated with §6.2 Text Fields

#### Lifecycle

- [x] defined
- [x] introduced
- [x] complete

### CH9 — Switch to Strict Enums with Labelled Definitions

Replaces open z.string() types with z.enum() for node types, statuses, relationship types, and external reference roles.
Introduces labelledEnum() helper that defines values and labels in one place.
Derives SECTION_LABELS, RELATIONSHIP_LABELS, and reverse lookups from the label maps.

- Affects: D11

Scope:
- INV22
- D11
- R5

Operations:
- add INV22
- add D11
- update R5 — JSON schema now uses enum instead of string with examples

#### Lifecycle

- [x] defined
- [x] introduced
- [x] complete

### CH10 — Fix Dead Links in Subsystem READMEs

README generator now only links to files that contain nodes for the given subsystem.

- Affects: D12

Scope:
- POL19
- D12
- R1

Operations:
- add POL19
- add D12
- update R1 — json-to-md updated to check present node types before generating links

#### Lifecycle

- [x] defined
- [x] introduced
- [x] complete

### CH11 — Remove Navigation and Document Roles from README

Removes the Navigation section and Document Roles table from generated READMEs. The file naming convention is self-documenting.

- Affects: D13

Scope:
- D13
- R1

Operations:
- update R1 — README generation simplified to omit navigation and document roles

#### Lifecycle

- [x] defined
- [ ] introduced
- [ ] complete

### CH12 — Make Invariant Preservation Layer-Dependent

Updates INV3 to require must_preserve only when a decision affects domain nodes.
Decisions affecting only non-domain nodes (realisations, policies, process nodes) should but are not required to identify preserved invariants.

- Affects: D14

Scope:
- INV3
- D14

Operations:
- update INV3 — Reworded to distinguish domain and non-domain affects

#### Lifecycle

- [x] defined
- [x] introduced
- [x] complete

### CH13 — Internalise Design Archive

Internalises content from distilled/ into the SysProM JSON.
Comparisons become an artefact node (ART1) with comparison summaries as subsystem concepts.
Worked examples become artefact nodes (ART2, ART3) with example SysProM graphs as subsystems.
Naming rationale is already captured in D8.
Specification is already captured as the JSON itself — distilled/Specification.md is redundant.

- Affects: D15

Scope:
- ART1
- ART2
- ART3

Operations:
- add ART1
- add ART2
- add ART3

#### Lifecycle

- [x] defined
- [x] introduced
- [x] complete

### CH14 — Implement Spec-Kit File Support

Scope:
- EL3

Operations:
- add src/speckit/parse.ts — Parse Spec-Kit markdown files into SysProM nodes
- add src/speckit/generate.ts — Generate Spec-Kit markdown files from SysProM nodes
- add src/speckit/project.ts — Spec-Kit project structure detection
- add src/speckit/index.ts — Barrel export
- add src/cli/speckit.ts — CLI import/export/sync/diff commands
- update src/cli/index.ts — Register speckit CLI command
- update src/index.ts — Export speckit module
- add tests/speckit-parse.unit.test.ts — Parser tests (38 tests)
- add tests/speckit-generate.unit.test.ts — Generator tests (28 tests)

#### Plan

- [x] Create speckit project structure detection module
- [x] Implement Spec-Kit file parsers (constitution, spec, plan, tasks, checklist)
- [x] Implement Spec-Kit file generators (reverse of parsers)
- [x] Create CLI commands (import, export, sync, diff)
- [x] Integrate into main index and CLI
- [x] Write and pass all tests

#### Lifecycle

- [x] defined
- [x] introduced
- [x] complete

