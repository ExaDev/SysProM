---
name: trace-node
description: Trace refinement chains from a node to show how it elaborates through abstraction layers
allowed-tools: Bash(spm *)
user-invocable: true
---

# Trace Node

Trace the refinement chain from a node through abstraction layers, showing how an intent elaborates through concepts, capabilities, elements, and realisations.

## Arguments

- `[id]` — Node ID to trace

## Steps

1. Identify the node to trace:
   - Node ID (e.g., I1, C5, EL3)
   - Understand the layer it belongs to

2. Trace the refinement chain:
   !`spm query trace $0`

3. Trace in reverse (what refines this node):
   !`spm query trace $0 --reverse`

## Output

Shows the chain:
- Starting node (intent, concept, capability, element, realisation, etc.)
- Each refinement relationship
- Destination nodes at lower abstraction layers
- Node names, descriptions, and IDs

## Example

```
Trace: I1 (intent) through to realisations

Path: I1 → C1, C2 (concepts)
      C1 → CAP3, CAP4 (capabilities)
      CAP3 → EL5, EL6 (elements)
      EL5 → R12 (realisation)
```

Shows the complete elaboration chain from abstraction to implementation.
