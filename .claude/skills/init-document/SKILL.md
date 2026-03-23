---
name: init-document
description: Create a new SysProM document with metadata, initial nodes, and directory structure
allowed-tools: Bash(spm *)
user-invocable: true
---

# Initialize Document

Create a new SysProM document with metadata and directory structure. This sets up a blank document ready for building provenance records.

## Arguments

- `[path]` — Output path for the document (optional, defaults to `.spm`)

## Steps

1. Gather document metadata:
   - Document title
   - Description
   - Author name
   - Project or organisation
   - Initial version

2. Create a new document in Markdown format:
   ```bash
   spm init --path .spm --title "<arg1>" --author "<arg2>" --description "<arg3>"
   ```

3. Or create in JSON format:
   ```bash
   spm init --path .spm.json --format json --title "<arg1>"
   ```

4. Review the generated structure:
   - `.spm/` directory with typed markdown files, or
   - `.spm.json` file with JSON structure

## Output Formats

- **Markdown** (`.spm/`) — Human-readable single file or multi-file folder structure
- **JSON** (`.spm.json`) — Machine-parseable structured format

## Example

```
Initialize: New SysProM document for authentication system

Title: Authentication System Provenance
Author: Security Team
Description: Record decisions, changes, and invariants for user authentication
```

Creates a new empty SysProM document ready for adding nodes and relationships.
