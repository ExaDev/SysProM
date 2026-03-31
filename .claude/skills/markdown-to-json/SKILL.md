---
name: markdown-to-json
description: Convert SysProM from Markdown format to machine-parseable JSON
allowed-tools: Bash(spm *)
user-invocable: true
---

# Markdown to JSON

Convert a SysProM document from Markdown format (`.spm/` folder or `.spm.md` file) to machine-parseable JSON format (`.spm.json`).

## Options

- `--input <value>` — Path to `.spm/` folder or `.spm.md` file
- `--output <value>` — Output JSON file path

## Steps

1. Identify the Markdown to convert:
   - Source: `.spm/` folder or `.spm.md` file
   - Destination: `.spm.json`

2. Convert multi-file Markdown to JSON:

   ```bash
   spm md2json --input .spm --output .spm.json
   ```

3. Or convert single-file Markdown to JSON:
   ```bash
   spm md2json --input .spm.md --output .spm.json
   ```

## Output Structure

Produces `.spm.json` with validated schema:

- Nodes array (decisions, invariants, capabilities, elements, etc.)
- Relationships array (typed directed edges)
- Metadata (title, author, version)

## Validation

Conversion includes validation:

- Schema conformance
- ID uniqueness
- Relationship integrity
- No information loss

## Example

```
Convert: .spm/ (Markdown folder) to JSON

Source: .spm/
Output: .spm.json

Result: Validated JSON with same structure as input
```

Converts Markdown to JSON format for programmatic access.
