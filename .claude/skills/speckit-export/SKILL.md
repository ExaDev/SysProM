---
name: speckit-export
description: Export SysProM nodes to Spec-Kit format for integration with specification frameworks
allowed-tools: Bash(spm *)
user-invocable: true
---

# Spec-Kit Export

Export SysProM capability or concept nodes to Spec-Kit format for use with GitHub Spec-Kit workflows. Transforms provenance records into specification documents.

## Arguments

- `[nodeIds]` — Node IDs to export (comma-separated)
- `[outputPath]` — Output Spec-Kit directory (optional)

## Steps

1. Identify nodes to export:
   - Capability or concept node IDs
   - All related nodes will be included

2. Export to Spec-Kit format:
   !`spm speckit-export $0 --output spec-kit/`

3. Or export single node:
   !`spm speckit-export C1 --output spec-kit/features/`

## Mapping

SysProM nodes are mapped to Spec-Kit elements:
- SysProM capabilities → Spec-Kit features
- SysProM invariants → Spec-Kit acceptance criteria
- Relationships → Feature dependencies

## Output

Generates Spec-Kit structure:
```
spec-kit/
├── features/
│   ├── feature1.md
│   └── feature2.md
└── metadata.json
```

## Example

```
Export: Authentication capability to Spec-Kit

Node: C1 (Authentication)
Output: spec-kit/features/

Result: Feature files with criteria and dependencies
```

Exports SysProM nodes to Spec-Kit format for specification workflows.
