---
$schema: "./schema.json"
title: "SysProM — System Provenance Model"
doc_type: "sysprom"
scope: "system"
status: "active"
version: 1
---

# SysProM — System Provenance Model

Enable any system — regardless of domain — to record where every part came from, what decisions shaped it, and how it reached its current form.

## Navigation

### Understand why this exists
See: [INTENT.md](./INTENT.md)

### Understand what must always hold
See: [INVARIANTS.md](./INVARIANTS.md)

### Understand what currently exists
See: [STATE.md](./STATE.md)

### Understand why things are the way they are
See: [DECISIONS.md](./DECISIONS.md)

### Understand how it has evolved
See: [CHANGES.md](./CHANGES.md)

## Document Roles

| Document | Role |
|----------|------|
| INTENT.md | Enduring purpose, concepts, capabilities |
| INVARIANTS.md | Rules that must hold across all valid states |
| STATE.md | Current structure and active elements |
| DECISIONS.md | Choices and rationale |
| CHANGES.md | Evolution over time |

## Views

### VIEW1 — Domain View

Includes:
- [INT1](./INTENT.md#int1--system-provenance)
- [CON1](./INTENT.md#con1--layered-abstraction)
- [CON2](./INTENT.md#con2--decision-driven-evolution)
- [CON3](./INTENT.md#con3--append-only-history)
- [CON4](./INTENT.md#con4--recursive-composition)
- [CON5](./INTENT.md#con5--process-as-structure)
- [CON6](./INTENT.md#con6--format-agnosticism)
- [CON7](./INTENT.md#con7--external-resource-handling)
- [CON8](./INTENT.md#con8--conformance)
- [CAP1](./INTENT.md#cap1--cross-layer-traceability)
- [CAP2](./INTENT.md#cap2--decision-recording)
- [CAP3](./INTENT.md#cap3--invariant-enforcement)
- [CAP4](./INTENT.md#cap4--change-tracking)
- [CAP5](./INTENT.md#cap5--recursive-modelling)
- [CAP6](./INTENT.md#cap6--process-modelling)
- [CAP7](./INTENT.md#cap7--flexible-representation)
- [CAP8](./INTENT.md#cap8--external-resource-referencing)
- [CAP9](./INTENT.md#cap9--branching)
- [CAP10](./INTENT.md#cap10--merging)
- [CAP11](./INTENT.md#cap11--revival)
- [PRIN1](./INVARIANTS.md#prin1--separate-what-from-why-from-how)
- [PRIN2](./INVARIANTS.md#prin2--decisions-are-more-important-than-documents)
- [PRIN3](./INVARIANTS.md#prin3--everything-has-identity)
- [PRIN4](./INVARIANTS.md#prin4--think-graph-not-timeline)
- [PRIN5](./INVARIANTS.md#prin5--separate-state-from-history)
- [INV1](./INVARIANTS.md#inv1--concept-independence)
- [INV2](./INVARIANTS.md#inv2--decision-change-linkage)
- [INV3](./INVARIANTS.md#inv3--invariant-preservation)
- [INV4](./INVARIANTS.md#inv4--recursive-consistency)
- [INV5](./INVARIANTS.md#inv5--append-only-history)
- [INV6](./INVARIANTS.md#inv6--node-identity)
- [INV7](./INVARIANTS.md#inv7--relationship-validity)
- [INV8](./INVARIANTS.md#inv8--gate-justification)
- [INV9](./INVARIANTS.md#inv9--layer-direction)
- [INV10](./INVARIANTS.md#inv10--realisation-implements-element)
- [INV11](./INVARIANTS.md#inv11--stage-ordering)
- [INV12](./INVARIANTS.md#inv12--decision-affects-reference)
- [INV13](./INVARIANTS.md#inv13--decision-selection)
- [INV14](./INVARIANTS.md#inv14--change-scope)
- [INV15](./INVARIANTS.md#inv15--change-operations)
- [INV16](./INVARIANTS.md#inv16--change-lifecycle-state)
- [INV17](./INVARIANTS.md#inv17--node-addressability)
- [INV18](./INVARIANTS.md#inv18--extension-constraint-preservation)
- [INV19](./INVARIANTS.md#inv19--external-reference-role-required)
- [INV20](./INVARIANTS.md#inv20--external-reference-directionality)
- [INV21](./INVARIANTS.md#inv21--text-field-duality)
- [INV22](./INVARIANTS.md#inv22--strict-type-enums)
- [INV28](./INVARIANTS.md#inv28--conformance--typed-nodes)
- [INV29](./INVARIANTS.md#inv29--conformance--relationships)
- [INV30](./INVARIANTS.md#inv30--conformance--lifecycle-states)
- [INV31](./INVARIANTS.md#inv31--conformance--at-least-one-invariant)
- [INV32](./INVARIANTS.md#inv32--conformance--traceability)
- [POL1](./INVARIANTS.md#pol1--prefer-deprecation-over-deletion)
- [POL2](./INVARIANTS.md#pol2--decisions-must-record-alternatives)
- [POL3](./INVARIANTS.md#pol3--changes-must-define-scope)
- [POL4](./INVARIANTS.md#pol4--capabilities-should-refine-concepts)
- [POL5](./INVARIANTS.md#pol5--elements-should-realise-capabilities)
- [POL6](./INVARIANTS.md#pol6--prefer-internalisation-for-portability)
- [POL7](./INVARIANTS.md#pol7--security--node-identity-integrity)
- [POL8](./INVARIANTS.md#pol8--security--relationship-consistency)
- [POL9](./INVARIANTS.md#pol9--security--controlled-modification)
- [POL10](./INVARIANTS.md#pol10--root-entry-point-identification)
- [POL11](./INVARIANTS.md#pol11--root-entry-point-location)
- [POL12](./INVARIANTS.md#pol12--multi-document-hub)
- [POL13](./INVARIANTS.md#pol13--single-file-node-extension)
- [POL14](./INVARIANTS.md#pol14--folder-node-naming)
- [POL15](./INVARIANTS.md#pol15--grouping-folders)
- [POL16](./INVARIANTS.md#pol16--parent-linking-implicit)
- [POL17](./INVARIANTS.md#pol17--relationship-notation-flexibility)
- [POL18](./INVARIANTS.md#pol18--frontmatter-is-metadata-only)
- [POL19](./INVARIANTS.md#pol19--readme-links-only-to-present-files)
- [POL20](./INVARIANTS.md#pol20--subsystem-representation-heuristic)
- [ELEM1](./STATE.md#elem1--domain-node-family)
- [ELEM2](./STATE.md#elem2--process-node-family)
- [ELEM3](./STATE.md#elem3--artefact-node-family)
- [ELEM4](./STATE.md#elem4--evolution-node-family)
- [ELEM5](./STATE.md#elem5--projection-node-family)
- [ELEM6](./STATE.md#elem6--relationship-type-registry)
- [ELEM7](./STATE.md#elem7--external-reference-model)
- [ELEM8](./STATE.md#elem8--file-representation)
- [ELEM9](./STATE.md#elem9--non-linear-evolution)
- [ELEM10](./STATE.md#elem10--extensibility)
- [REAL1](./STATE.md#real1--markdown-representation)
- [REAL2](./STATE.md#real2--single-file-form)
- [REAL3](./STATE.md#real3--multi-document-form)
- [REAL4](./STATE.md#real4--recursive-folder-form)
- [REAL5](./STATE.md#real5--json-serialisation)
- [ART1](./STATE.md#art1--system-comparisons)
- [ART2](./STATE.md#art2--document-workspace-example)
- [ART3](./STATE.md#art3--planning-workflow-example)

### VIEW2 — Process View

Includes:
- [PROT1](./STATE.md#prot1--decision-lifecycle)
- [PROT2](./STATE.md#prot2--change-lifecycle)
- [PROT3](./STATE.md#prot3--node-lifecycle)
- [STG1-DEC-PROPOSED](./STATE.md#stg1-dec-proposed--proposed)
- [STG2-DEC-ACCEPTED](./STATE.md#stg2-dec-accepted--accepted)
- [STG3-DEC-IMPLEMENTED](./STATE.md#stg3-dec-implemented--implemented)
- [STG4-DEC-ADOPTED](./STATE.md#stg4-dec-adopted--adopted)
- [STG5-DEC-SUPERSEDED](./STATE.md#stg5-dec-superseded--superseded)
- [STG6-DEC-ABANDONED](./STATE.md#stg6-dec-abandoned--abandoned)
- [STG7-DEC-DEFERRED](./STATE.md#stg7-dec-deferred--deferred)
- [STG8-CHG-DEFINED](./STATE.md#stg8-chg-defined--defined)
- [STG9-CHG-INTRODUCED](./STATE.md#stg9-chg-introduced--introduced)
- [STG10-CHG-IN_PROGRESS](./STATE.md#stg10-chg-in_progress--in_progress)
- [STG11-CHG-COMPLETE](./STATE.md#stg11-chg-complete--complete)
- [STG12-CHG-CONSOLIDATED](./STATE.md#stg12-chg-consolidated--consolidated)
- [STG13-NODE-PROPOSED](./STATE.md#stg13-node-proposed--proposed)
- [STG14-NODE-ACTIVE](./STATE.md#stg14-node-active--active)
- [STG15-NODE-DEPRECATED](./STATE.md#stg15-node-deprecated--deprecated)
- [STG16-NODE-RETIRED](./STATE.md#stg16-node-retired--retired)

### VIEW3 — Evolution View

Includes:
- [DEC1](./DECISIONS.md#dec1--separate-domain-from-process-from-evolution)
- [DEC2](./DECISIONS.md#dec2--make-decisions-first-class-entities)
- [DEC3](./DECISIONS.md#dec3--distinguish-invariants-from-principles-from-policies)
- [DEC4](./DECISIONS.md#dec4--add-process-modelling)
- [DEC5](./DECISIONS.md#dec5--format-agnostic-with-markdown-as-primary-representation)
- [DEC6](./DECISIONS.md#dec6--recursive-composition-using-same-conventions)
- [DEC7](./DECISIONS.md#dec7--append-only-history)
- [DEC8](./DECISIONS.md#dec8--support-external-resources-via-reference-and-internalisation)
- [DEC9](./DECISIONS.md#dec9--allow-array-of-lines-for-text-fields)
- [DEC10](./DECISIONS.md#dec10--use-strict-enums-for-core-types)
- [DEC11](./DECISIONS.md#dec11--only-link-to-present-files-in-readme)
- [DEC12](./DECISIONS.md#dec12--remove-navigation-and-document-roles-from-readme)
- [DEC13](./DECISIONS.md#dec13--layer-dependent-invariant-preservation)
- [DEC14](./DECISIONS.md#dec14--internalise-design-archive-into-sysprom-json)
- [DEC15](./DECISIONS.md#dec15--size-based-subsystem-splitting)
- [CHG1](./CHANGES.md#chg1--initial-model)
- [CHG2](./CHANGES.md#chg2--add-process-modelling)
- [CHG3](./CHANGES.md#chg3--add-file-representation-conventions)
- [CHG4](./CHANGES.md#chg4--add-external-resources-model)
- [CHG5](./CHANGES.md#chg5--add-lifecycle-protocols)
- [CHG6](./CHANGES.md#chg6--encode-full-normative-specification)
- [CHG7](./CHANGES.md#chg7--add-text-field-duality)
- [CHG8](./CHANGES.md#chg8--switch-to-strict-enums-with-labelled-definitions)
- [CHG9](./CHANGES.md#chg9--fix-dead-links-in-subsystem-readmes)
- [CHG10](./CHANGES.md#chg10--remove-navigation-and-document-roles-from-readme)
- [CHG11](./CHANGES.md#chg11--make-invariant-preservation-layer-dependent)
- [CHG12](./CHANGES.md#chg12--internalise-design-archive)
- [CHG13](./CHANGES.md#chg13--add-size-based-subsystem-splitting-and-auto-grouping)

## External References

- source: https://chatgpt.com/c/69bd2439-ad5c-838d-9af1-2e1294a0d331
  - Node: I1
  - Original design conversation that produced the SysProM model.
- prior_art: https://github.com/github/spec-kit
  - Node: D4
  - Spec Kit's workflow limitations motivated the addition of process modelling.
- prior_art: https://github.com/yeachan-heo/oh-my-claudecode/blob/main/skills/ralplan/SKILL.md
  - Node: D4
  - Ralplan's consensus planning protocol demonstrated the need for roles, stages, and gates as first-class nodes.
- prior_art: https://github.com/gsd-build/get-shit-done
  - Node: D4
  - GSD's multi-runtime orchestration demonstrated the need for modes and runtime-adaptive realisations.
- standard: https://datatracker.ietf.org/doc/html/rfc2119
  - Node: CN8
  - RFC 2119 defines the interpretation of MUST, SHOULD, and MAY used throughout the specification.

