---
name: speckit-sync
description: Bidirectional synchronisation between SysProM provenance and Spec-Kit specifications
allowed-tools: Bash(spm *)
user-invocable: true
---

# Spec-Kit Synchronisation

Synchronise SysProM provenance records bidirectionally with Spec-Kit specification framework. Keep provenance and specifications in sync automatically.

## Options

- `--input <value>` — Path to SysProM document
- `--speckit-dir <value>` — Path to Spec-Kit directory
- `--prefix <value>` — ID prefix (optional, defaults to directory name)

## Steps

1. Identify files to sync:
   - SysProM document: `.spm.json` or `.spm/`
   - Spec-Kit directory: `./spec-kit/`

2. Sync SysProM and Spec-Kit:
   ```bash
   spm speckit sync --input .spm.json --speckit-dir ./spec-kit/
   ```

3. Or sync with custom prefix:
   ```bash
   spm speckit sync --input .spm.json --speckit-dir ./spec-kit/ --prefix AUTH
   ```

## Resolution Strategies

| Strategy | Behaviour |
|----------|-----------|
| `--prefer-sysprom` | SysProM decisions are authoritative |
| `--prefer-speckit` | Spec-Kit specifications are authoritative |
| `--report` | Report differences without resolving |

## Output

Returns sync result:
- Nodes synced
- Specifications updated
- Changes made

## Example

```
Sync: SysProM provenance with Spec-Kit specs

SysProM: .spm.json (new decisions)
Spec-Kit: ./spec-kit/ (updated features)

Strategy: --prefer-sysprom

Result: Spec-Kit features updated to reflect SysProM decisions
```

Synchronises SysProM provenance with Spec-Kit bidirectionally.
