---
name: speckit-diff
description: Show differences between SysProM provenance and Spec-Kit specifications
allowed-tools: Bash(spm *)
user-invocable: true
---

# Spec-Kit Difference Report

Compare SysProM provenance records with Spec-Kit specifications to identify misalignments, missing features, or outdated provenance.

## Arguments

- `[sysPromPath]` — Path to `.spm.json` or `.spm/`
- `[specKitPath]` — Path to Spec-Kit directory

## Steps

1. Identify files to compare:
   - SysProM document: `.spm.json` or `.spm/`
   - Spec-Kit directory: `./spec-kit/`

2. Show differences:
   !`spm speckit-diff $0 $1`

3. Or show detailed diff:
   !`spm speckit-diff $0 $1 --detailed`

## Output

Returns difference report:
- Features in Spec-Kit but missing from SysProM
- Decisions in SysProM not reflected in Spec-Kit
- Metadata mismatches
- Status divergences

## Example

```
Diff: SysProM vs Spec-Kit

SysProM: .spm.json
Spec-Kit: ./spec-kit/

Result:
  Missing from SysProM:
    - feature_authentication_mfa (exists in Spec-Kit)

  Missing from Spec-Kit:
    - D5: Use OAuth 2.0 (exists in SysProM)

  Out of sync:
    - C1: version mismatch (SysProM v2, Spec-Kit v1)
```

Shows differences between provenance and specifications.
