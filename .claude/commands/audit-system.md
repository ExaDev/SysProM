---
name: audit-system
description: Check whether a live codebase still matches its SysProM document
user-invocable: true
allowed-tools: Bash(spm *), Read, Glob, Grep, Agent
---

You are auditing a codebase against its existing SysProM document to detect drift. Follow the audit-system skill exactly.

## Your task

1. **Load** the existing SysProM document — run `spm validate` and `spm stats` to understand current state
2. **Scan** the codebase by dispatching parallel subagents to check:
   - Ghost nodes (SysProM nodes referencing things that no longer exist)
   - Undocumented code (significant modules with no SysProM coverage)
   - Decision drift (selected options that no longer match reality)
   - Invariant enforcement (claimed invariants not actually enforced)
   - Relationship accuracy (edges that no longer reflect real dependencies)
   - Staleness (outdated descriptions, names, or statuses)
3. **Compare** findings and deduplicate across audit dimensions
4. **Present** a structured audit report grouped by severity (critical / warning / info)
5. **Wait for user approval** before making any changes
6. **Fix** approved issues using appropriate `spm` commands
7. **Validate and sync** with `spm validate` and `spm json2md`

Use the audit-system skill for detailed guidance on severity classification and fix strategies.
