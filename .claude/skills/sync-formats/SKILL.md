---
name: sync-formats
description: Bidirectional synchronisation between JSON and Markdown formats with conflict resolution
allowed-tools: Bash(spm *)
user-invocable: true
---

# Synchronise Formats

Synchronise changes between JSON (`.spm.json`) and Markdown (`.spm/`) representations of a SysProM document. Handles conflicts with configurable resolution strategies.

## Options

- `--input <value>` — Path to `.spm.json` file
- `--output <value>` — Path to `.spm/` folder or `.spm.md` file
- `--prefer-json` — JSON wins on conflicts
- `--prefer-md` — Markdown wins on conflicts
- `--report` — Report conflicts without resolving
- `--dry-run` — Preview changes without writing files

## Steps

1. Identify the files to sync:
   - JSON file: `.spm.json`
   - Markdown folder: `.spm/`

2. Sync with default strategy (JSON is source of truth):

   ```bash
   spm sync --input .spm.json --output .spm
   ```

3. Or sync with explicit strategy:

   ```bash
   spm sync --input .spm.json --output .spm --prefer-md
   ```

4. Or perform dry-run:
   ```bash
   spm sync --input .spm.json --output .spm --prefer-json --dry-run
   ```

## Conflict Resolution Strategies

| Strategy        | Behaviour                                                            |
| --------------- | -------------------------------------------------------------------- |
| `--prefer-json` | JSON is source of truth; conflicts resolved in JSON's favour         |
| `--prefer-md`   | Markdown is source of truth; conflicts resolved in Markdown's favour |
| `--report`      | Report conflicts without modifying files (error exit)                |
| (default)       | Equivalent to `--prefer-json`                                        |

## Output

Returns sync result:

- Files synchronised
- Conflicts detected and resolved
- Changes made

## Example

```
Sync: JSON and Markdown representations

JSON: .spm.json (updated with new decisions)
Markdown: .spm/ (edited manually)

Conflict: D1 changed in both

Strategy: --prefer-json (JSON wins)
Result: Markdown updated to match JSON
```

Synchronises JSON and Markdown representations bidirectionally with conflict handling.
