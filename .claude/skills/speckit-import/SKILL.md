---
name: speckit-import
description: Import Spec-Kit features into SysProM as concept or capability nodes
allowed-tools: Bash(spm *)
user-invocable: true
---

# Spec-Kit Import

Import features from Spec-Kit format (GitHub Spec-Kit directories) into SysProM as capability or concept nodes. Creates structured provenance records for imported specifications.

## Options

- `--speckit-dir <value>` — Path to Spec-Kit feature directory
- `--output <value>` — Path to output SysProM file
- `--prefix <value>` — ID prefix (optional, defaults to directory name)

## Steps

1. Identify the Spec-Kit directory to import:
   - Path to Spec-Kit folder structure
   - Output SysProM file path

2. Import Spec-Kit features:

   ```bash
   spm speckit import --speckit-dir ./features --output doc.spm.json
   ```

3. Or import with custom prefix:
   ```bash
   spm speckit import --speckit-dir ./features --output doc.spm.json --prefix AUTH
   ```

## Mapping

Spec-Kit features are mapped to SysProM nodes:

- Spec-Kit features → SysProM capabilities or concepts
- Spec-Kit acceptance criteria → Related invariants
- Spec-Kit references → Relationships

## Output

Creates new SysProM nodes:

- One node per Spec-Kit feature
- Links to parent node if specified
- Preservation of feature metadata

## Example

```
Import: Spec-Kit authentication features into SysProM

Source: ./spec-kit/features/
Parent: C1 (Authentication capability)

Result: Each Spec-Kit feature becomes a SysProM node
```

Imports Spec-Kit features into SysProM with full provenance tracking.
