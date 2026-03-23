---
name: speckit-diff
description: Show differences between SysProM provenance and Spec-Kit specifications
allowed-tools: Bash(spm *)
user-invocable: true
---

# Spec-Kit Difference Report

Compare SysProM provenance records with Spec-Kit specifications to identify misalignments, missing features, or outdated provenance.

## Options

- `--input <value>` — Path to SysProM document
- `--speckit-dir <value>` — Path to Spec-Kit directory
- `--prefix <value>` — ID prefix (optional, defaults to directory name)

## Steps

1. Identify files to compare:
   - SysProM document: `.spm.json` or `.spm/`
   - Spec-Kit directory: `./spec-kit/`

2. Show differences:
   ```bash
   spm speckit diff --input .spm.json --speckit-dir ./spec-kit/
   ```

3. Or with custom prefix:
   ```bash
   spm speckit diff --input .spm.json --speckit-dir ./spec-kit/ --prefix AUTH
   ```

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
