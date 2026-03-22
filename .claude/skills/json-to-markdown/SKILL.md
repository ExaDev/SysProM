---
name: json-to-markdown
description: Convert SysProM from JSON format to human-readable Markdown
allowed-tools: Bash(spm *)
user-invocable: true
---

# JSON to Markdown

Convert a SysProM document from JSON format (`.spm.json`) to human-readable Markdown format (`.spm/` folder or `.spm.md` single file).

## Arguments

- `[jsonPath]` — Path to `.spm.json` file
- `[outputPath]` — Output directory or file path (optional)

## Steps

1. Identify the JSON file to convert:
   - Source: `.spm.json` or similar
   - Destination: `.spm/` folder or `.spm.md` file

2. Convert to multi-file Markdown (in folder):
   !`spm json2md $0 .spm`

3. Or convert to single-file Markdown:
   !`spm json2md $0 .spm.md --single-file`

## Output Structure

**Multi-file** (folder):
```
.spm/
├── DECISIONS.md
├── INVARIANTS.md
├── CHANGES.md
├── CAPABILITIES.md
├── ELEMENTS.md
└── index.md
```

**Single-file** (`.spm.md`):
```
# SysProM Document

## Decisions
...

## Invariants
...
```

## Example

```
Convert: .spm.json to human-readable format

Source: .spm.json
Output: .spm/ (multi-file)

Result: All nodes organised by type in markdown files
```

Converts JSON to human-editable Markdown format with zero information loss.
