---
name: rename-node
description: Rename a node ID and update all references across the document
allowed-tools: Bash(spm *)
disable-model-invocation: true
user-invocable: true
---

# Rename Node

Change a node's ID and automatically update all references to it throughout the SysProM document. This is a destructive operation that affects all relationships.

## Arguments

- `[oldId]` — Current node ID
- `[newId]` — New node ID

## Steps

1. Verify the rename:
   - Current ID (what is being renamed)
   - New ID (what it will be called)
   - Check that new ID is not already in use
   - Consider impact on dependent nodes

2. Rename the node:
   !`spm rename $0 $1`

3. Verify the change:
   !`spm query node $1`

## Constraints

- New ID must be unique (not already used in document)
- ID format should follow SysProM conventions (type prefix + number)
- Renaming updates all references automatically

## Warnings

- Renaming is document-wide — affects all relationships
- Use `--dry-run` to preview changes before committing
- ID changes may affect external references (scripts, links, documentation)

## Example

```
Rename: D23 to D1

Old ID: D23
New ID: D1
```

Changes node ID and updates all references throughout the document.
