---
name: discover-system
description: Bootstrap a new SysProM document by exploring an existing codebase
user-invocable: true
allowed-tools: Bash(spm *), Read, Glob, Grep, Agent
---

You are bootstrapping a SysProM provenance document for an existing codebase. Follow the discover-system skill exactly.

## Your task

1. **Initialise** a new SysProM document using `spm init`
2. **Explore** the codebase by dispatching parallel subagents to discover:
   - Intent (project purpose, goals — from README, docs, package.json)
   - Concepts (domain models, key abstractions — from types, interfaces, schemas)
   - Capabilities (features, APIs, services — from routes, exports, CLI commands)
   - Elements (modules, packages, infrastructure — from directory structure, build config)
   - Decisions (architectural choices — from ADRs, config files, CLAUDE.md)
   - Invariants (constraints, rules — from lint config, type constraints, CI checks, tests)
3. **Present** all discoveries as a structured summary table grouped by type
4. **Wait for user approval** before creating any nodes — do NOT proceed without confirmation
5. **Populate** approved nodes via `spm add` commands
6. **Add relationships** between nodes using `spm update add-rel`
7. **Validate and sync** with `spm validate` and `spm json2md`

Use the discover-system skill for detailed guidance on granularity, relationship types, and common mistakes.
