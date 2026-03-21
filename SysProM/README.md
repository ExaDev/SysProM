---
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

### V1 — Domain View

Includes:
- I1
- CN1
- CN2
- CN3
- CN4
- CN5
- CN6
- CN7
- CN8
- CP1
- CP2
- CP3
- CP4
- CP5
- CP6
- CP7
- CP8
- CP9
- CP10
- CP11
- PR1
- PR2
- PR3
- PR4
- PR5
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
- CONF1
- CONF2
- CONF3
- CONF4
- CONF5
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
- EL1
- EL2
- EL3
- EL4
- EL5
- EL6
- EL7
- EL8
- EL9
- EL10
- R1
- R2
- R3
- R4
- R5
- ART1
- ART2
- ART3

### V2 — Process View

Includes:
- PROT1
- PROT2
- PROT3
- ST-DEC-PROPOSED
- ST-DEC-ACCEPTED
- ST-DEC-IMPLEMENTED
- ST-DEC-ADOPTED
- ST-DEC-SUPERSEDED
- ST-DEC-ABANDONED
- ST-DEC-DEFERRED
- ST-CHG-DEFINED
- ST-CHG-INTRODUCED
- ST-CHG-IN_PROGRESS
- ST-CHG-COMPLETE
- ST-CHG-CONSOLIDATED
- ST-NODE-PROPOSED
- ST-NODE-ACTIVE
- ST-NODE-DEPRECATED
- ST-NODE-RETIRED

### V3 — Evolution View

Includes:
- D1
- D2
- D3
- D4
- D5
- D6
- D7
- D8
- D9
- D10
- D11
- D12
- D13
- D14
- D15
- CH1
- CH2
- CH3
- CH4
- CH5
- CH6
- CH7
- CH8
- CH9
- CH10
- CH11
- CH12
- CH13

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

