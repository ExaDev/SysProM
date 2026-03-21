import { existsSync } from "node:fs";
import { loadDocument, saveDocument } from "../io.js";
import {
  initDocument,
  addTask,
  planStatus,
  planProgress,
  checkGate,
  type PlanStatus,
  type PhaseProgress,
  type GateResult,
} from "../speckit/plan.js";

// ============================================================================
// Flag parsing helpers
// ============================================================================

function parseFlag(args: string[], flag: string): string | undefined {
  const idx = args.indexOf(flag);
  if (idx >= 0 && idx + 1 < args.length) return args[idx + 1];
  return undefined;
}

function parseFlags(args: string[]): {
  positional: string[];
  prefix: string | null;
  name: string | null;
  phase: string | null;
  json: boolean;
} {
  const positional: string[] = [];
  let prefix: string | null = null;
  let name: string | null = null;
  let phase: string | null = null;
  const json = args.includes("--json");

  prefix = parseFlag(args, "--prefix") ?? null;
  name = parseFlag(args, "--name") ?? null;
  phase = parseFlag(args, "--phase") ?? null;

  for (const arg of args) {
    if (
      !arg.startsWith("--") &&
      arg !== prefix &&
      arg !== name &&
      arg !== phase
    ) {
      positional.push(arg);
    }
  }

  return { positional, prefix, name, phase, json };
}

// ============================================================================
// plan init
// ============================================================================

function runInit(args: string[]): void {
  const flags = parseFlags(args);

  if (flags.positional.length < 1 || !flags.prefix) {
    console.error("Usage: sysprom plan init <output> --prefix PREFIX --name NAME");
    process.exit(1);
  }

  const outputPath = flags.positional[0];
  const prefix = flags.prefix;
  const name = flags.name || prefix;

  if (existsSync(outputPath)) {
    console.error(`Output file already exists: ${outputPath}`);
    process.exit(1);
  }

  try {
    const doc = initDocument(prefix, name);
    saveDocument(doc, "json", outputPath);
    console.log(`Created ${outputPath} with prefix ${prefix}`);
  } catch (err) {
    console.error((err as Error).message);
    process.exit(1);
  }
}

// ============================================================================
// plan add-task
// ============================================================================

function runAddTask(args: string[]): void {
  const flags = parseFlags(args);

  if (flags.positional.length < 1 || !flags.prefix) {
    console.error("Usage: sysprom plan add-task <input> --prefix PREFIX [--name NAME] [--parent PARENT-ID]");
    process.exit(1);
  }

  const inputPath = flags.positional[0];
  const prefix = flags.prefix;
  const name = flags.name ?? undefined;
  const parentId = parseFlag(args, "--parent") ?? undefined;

  try {
    const { doc, format, path } = loadDocument(inputPath);
    const newDoc = addTask(doc, prefix, name, parentId);
    saveDocument(newDoc, format, path);
    const target = parentId ? `to ${parentId}` : `to ${prefix}-PROT-IMPL`;
    console.log(`Added task ${target}`);
  } catch (err) {
    console.error((err as Error).message);
    process.exit(1);
  }
}

// ============================================================================
// plan status
// ============================================================================

function runStatus(args: string[]): void {
  const flags = parseFlags(args);

  if (flags.positional.length < 1 || !flags.prefix) {
    console.error("Usage: sysprom plan status <input> --prefix PREFIX [--json]");
    process.exit(1);
  }

  const inputPath = flags.positional[0];
  const prefix = flags.prefix;
  const asJson = flags.json;

  try {
    const { doc } = loadDocument(inputPath);
    const status = planStatus(doc, prefix);

    if (asJson) {
      console.log(JSON.stringify(status, null, 2));
      return;
    }

    // Format: Constitution, Spec, Plan, Tasks, Checklist status report
    const formatBoolean = (defined: boolean): string =>
      defined ? "✅ defined" : "❌ not defined";

    console.log(
      `Constitution: ${formatBoolean(status.constitution.defined)} (${status.constitution.principleCount} principles)`,
    );
    console.log(
      `Spec:         ${formatBoolean(status.spec.defined)} (${status.spec.userStoryCount} user stories)`,
    );
    console.log(
      `Plan:         ${formatBoolean(status.plan.defined)} (${status.plan.phaseCount} phases)`,
    );
    console.log(
      `Tasks:        ${status.tasks.done}/${status.tasks.total} done`,
    );
    console.log(
      `Checklist:    ${formatBoolean(status.checklist.defined)} (${status.checklist.done}/${status.checklist.total})`,
    );
    console.log();
    console.log(`Next: ${status.nextStep}`);
  } catch (err) {
    console.error((err as Error).message);
    process.exit(1);
  }
}

// ============================================================================
// plan progress
// ============================================================================

function runProgress(args: string[]): void {
  const flags = parseFlags(args);

  if (flags.positional.length < 1 || !flags.prefix) {
    console.error("Usage: sysprom plan progress <input> --prefix PREFIX [--json]");
    process.exit(1);
  }

  const inputPath = flags.positional[0];
  const prefix = flags.prefix;
  const asJson = flags.json;

  try {
    const { doc } = loadDocument(inputPath);
    const progress = planProgress(doc, prefix);

    if (asJson) {
      console.log(JSON.stringify(progress, null, 2));
      return;
    }

    // Format: ASCII progress bars
    // Bar width: 10 chars. Filled: █, empty: ░. Name padded to 20 chars. Percent right-aligned to 3 chars.
    for (const phase of progress) {
      const filledCount = Math.round((phase.percent / 100) * 10);
      const emptyCount = 10 - filledCount;
      const bar = "█".repeat(filledCount) + "░".repeat(emptyCount);
      const name = phase.name.padEnd(20);
      const percent = String(phase.percent).padStart(3);
      const ratio = `(${phase.done}/${phase.total})`;

      console.log(`${name} [${bar}] ${percent}% ${ratio}`);
    }
  } catch (err) {
    console.error((err as Error).message);
    process.exit(1);
  }
}

// ============================================================================
// plan gate
// ============================================================================

function runGate(args: string[]): void {
  const flags = parseFlags(args);

  if (flags.positional.length < 1 || !flags.prefix || !flags.phase) {
    console.error(
      "Usage: sysprom plan gate <input> --prefix PREFIX --phase N [--json]",
    );
    process.exit(1);
  }

  const inputPath = flags.positional[0];
  const prefix = flags.prefix;
  const phaseNum = parseInt(flags.phase, 10);
  const asJson = flags.json;

  if (isNaN(phaseNum) || phaseNum < 1) {
    console.error(`Invalid phase number: ${flags.phase}`);
    process.exit(1);
  }

  try {
    const { doc } = loadDocument(inputPath);
    const result = checkGate(doc, prefix, phaseNum);

    if (asJson) {
      console.log(JSON.stringify(result, null, 2));
      return;
    }

    // Format: Gate check result with detailed issues
    if (result.ready) {
      console.log(`Gate check for phase ${phaseNum}: ✅ READY`);
    } else {
      console.log(`Gate check for phase ${phaseNum}: ❌ NOT READY`);
      for (const issue of result.issues) {
        switch (issue.kind) {
          case "previous_tasks_incomplete":
            console.log(
              `  ❌ Phase ${issue.phase} has ${issue.remaining} incomplete tasks`,
            );
            break;
          case "user_story_no_change":
            console.log(`  ❌ ${issue.storyId} has no implementing change`);
            break;
          case "user_story_no_acceptance_criteria":
            console.log(
              `  ❌ ${issue.storyId} has no acceptance criteria`,
            );
            break;
          case "fr_no_change":
            console.log(`  ❌ ${issue.frId} has no implementing change`);
            break;
        }
      }
    }
  } catch (err) {
    console.error((err as Error).message);
    process.exit(1);
  }
}

// ============================================================================
// Dispatcher
// ============================================================================

export function run(args: string[]): void {
  if (args.length < 1) {
    console.error(
      "Usage: sysprom plan <init|add-task|status|progress|gate> [options]",
    );
    process.exit(1);
  }

  const subcommand = args[0];
  const subcommandArgs = args.slice(1);

  switch (subcommand) {
    case "init":
      runInit(subcommandArgs);
      break;
    case "add-task":
      runAddTask(subcommandArgs);
      break;
    case "status":
      runStatus(subcommandArgs);
      break;
    case "progress":
      runProgress(subcommandArgs);
      break;
    case "gate":
      runGate(subcommandArgs);
      break;
    default:
      console.error(
        `Unknown subcommand: ${subcommand}. Expected: init, add-task, status, progress, or gate`,
      );
      process.exit(1);
  }
}
