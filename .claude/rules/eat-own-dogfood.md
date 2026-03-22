# Eat Our Own Dogfood

SysProM is a self-describing system. Use SysProM's own tools and formats to manage SysProM's development — the way Ralplan or Spec Kit would track their own planning and implementation.

## Tracking Work

- Before starting a feature or fix, add a **decision** node capturing the context, options, and rationale.
- Create a **change** node with scope, operations, and a task plan for the implementation steps.
- Use `spm task` to track progress: `spm task add` for new steps, `spm task done` as each completes.
- Use `spm plan` for larger features: `spm plan init` to scaffold, `spm plan status` to review progress, `spm plan gate` to validate phase readiness.
- Update lifecycle stages as work progresses — proposed, defined, introduced, complete.

## Using the CLI

- Use the CLI (`spm add`, `spm update`, `spm task`, `spm plan`, `spm validate`) rather than editing the JSON by hand where possible.
- Keep `sysprom.spm.json` and `./SysProM/` in sync after every change — run `spm json2md` or `spm md2json` as appropriate.
- Validate with `spm validate sysprom.spm.json` before committing.

## Improving the Tool

- If a workflow feels awkward or a feature is missing, that is a signal to improve the tool — not to work around it.
