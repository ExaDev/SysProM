---
name: speckit-export
description: Export SysProM nodes to Spec-Kit format for integration with specification frameworks
allowed-tools: Bash(spm *)
user-invocable: true
---

# Spec-Kit Export

Export SysProM capability or concept nodes to Spec-Kit format for use with GitHub Spec-Kit workflows. Transforms provenance records into specification documents.

## Options

- `--input <value>` — Path to SysProM document
- `--speckit-dir <value>` — Path to Spec-Kit output directory
- `--prefix <value>` — ID prefix identifying nodes to export

## Steps

1. Identify nodes to export:
   - SysProM document path
   - Output Spec-Kit directory

2. Export to Spec-Kit format:
   ```bash
   spm speckit export --input doc.spm.json --speckit-dir spec-kit/ --prefix AUTH
   ```

3. Or export from auto-detected document:
   ```bash
   spm speckit export --input .spm.json --speckit-dir spec-kit/features/ --prefix FEAT
   ```

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
