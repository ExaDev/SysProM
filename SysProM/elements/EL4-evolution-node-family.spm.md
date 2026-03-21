---
title: "EL4 — Evolution Node Family"
doc_type: "element"
scope: "element"
status: "active"
---

# EL4 — Evolution Node Family

## Concepts

### NT-DECISION — decision

Selection between alternatives that influences system structure or behaviour.
MUST define selected option, list alternatives, identify affected nodes, and identify preserved invariants.
MAY supersede prior decisions. Superseded decisions remain in history.

### NT-CHANGE — change

System modification over time.
MUST define scope, reference decisions, define operations (add/update/remove/link), and define lifecycle state.
MAY include execution plan. MAY overlap, depend on other changes, and be partially completed.

