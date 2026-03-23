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
- INT1
- CON1
- CON2
- CON3
- CON4
- CON5
- CON6
- CON7
- CON8
- CAP1
- CAP2
- CAP3
- CAP4
- CAP5
- CAP6
- CAP7
- CAP8
- CAP9
- CAP10
- CAP11
- PRIN1
- PRIN2
- PRIN3
- PRIN4
- PRIN5
- INV1
- INV2
- INV3
- INV4
- INV5
- INV6
- INV7
- INV8
- INV9
- INV10
- INV11
- INV12
- INV13
- INV14
- INV15
- INV16
- INV17
- INV18
- INV19
- INV20
- INV21
- INV22
- INV28
- INV29
- INV30
- INV31
- INV32
- POL1
- POL2
- POL3
- POL4
- POL5
- POL6
- POL7
- POL8
- POL9
- POL10
- POL11
- POL12
- POL13
- POL14
- POL15
- POL16
- POL17
- POL18
- POL19
- POL20
- ELEM1
- ELEM2
- ELEM3
- ELEM4
- ELEM5
- ELEM6
- ELEM7
- ELEM8
- ELEM9
- ELEM10
- REAL1
- REAL2
- REAL3
- REAL4
- REAL5
- ART1
- ART2
- ART3

### VIEW2 — Process View

Includes:
- PROT1
- PROT2
- PROT3
- STG1-DEC-PROPOSED
- STG2-DEC-ACCEPTED
- STG3-DEC-IMPLEMENTED
- STG4-DEC-ADOPTED
- STG5-DEC-SUPERSEDED
- STG6-DEC-ABANDONED
- STG7-DEC-DEFERRED
- STG8-CHG-DEFINED
- STG9-CHG-INTRODUCED
- STG10-CHG-IN_PROGRESS
- STG11-CHG-COMPLETE
- STG12-CHG-CONSOLIDATED
- STG13-NODE-PROPOSED
- STG14-NODE-ACTIVE
- STG15-NODE-DEPRECATED
- STG16-NODE-RETIRED

### VIEW3 — Evolution View

Includes:
- DEC1
- DEC2
- DEC3
- DEC4
- DEC5
- DEC6
- DEC7
- DEC8
- DEC9
- DEC10
- DEC11
- DEC12
- DEC13
- DEC14
- DEC15
- CHG1
- CHG2
- CHG3
- CHG4
- CHG5
- CHG6
- CHG7
- CHG8
- CHG9
- CHG10
- CHG11
- CHG12
- CHG13

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

