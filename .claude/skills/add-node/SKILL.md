---
name: add-node
description: Generic node creation for any SysProM node type (intent, concept, capability, element, realisation, etc.)
allowed-tools: Bash(spm *)
user-invocable: true
---

# Add Node

Create a new node of any type in the SysProM document. Use this when you need to add intent, concept, capability, element, realisation, principle, policy, protocol, stage, role, gate, mode, artefact, view, or other domain nodes.

## Arguments

- `[type]` — Node type (intent, concept, capability, element, realisation, principle, policy, protocol, stage, role, gate, mode, artefact, view, etc.)
- `[id]` — Node ID (e.g., EL1, C5). If omitted, auto-generated from type prefix.

## Steps

1. Gather node details:
   - Type of node (what does it represent in the system?)
   - ID (optional — will auto-generate if omitted)
   - Name of the node
   - Description of what it is and why it matters

2. Create the node:

   ```bash
   spm add node --type <arg1> --id <arg2> --name "<arg3>" --description "<arg4>"
   ```

3. Link relationships:
   - Use `add-relationship` to connect this node to other nodes
   - Common relationships: refines, realises, implements, depends_on, affects

## Example

```
Type: capability
Name: User authentication
Description: System must securely authenticate user identity before granting access
```

Creates a capability node representing a system feature or quality.
