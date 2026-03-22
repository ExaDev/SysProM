import * as z from "zod";
import { existsSync } from "node:fs";
import type { CommandDef } from "../define-command.js";
import { loadDocument, saveDocument } from "../../io.js";
import {
  initDocument,
  addTask,
  planStatus,
  planProgress,
  checkGate,
} from "../../speckit/plan.js";

// ============================================================================
// Subcommands
// ============================================================================

const initArgs = z.object({
  output: z.string().describe("Path to output SysProM file"),
});

const initOpts = z.object({
  prefix: z.string().describe("Plan prefix (e.g. PLAN)"),
  name: z.string().optional().describe("Plan name (defaults to prefix)"),
});

const initSubcommand: CommandDef<typeof initArgs, typeof initOpts> = {
  name: "init",
  description: "Initialise a new SysProM plan document",
  args: initArgs,
  opts: initOpts,
  action(args, opts) {
    const outputPath = args.output;
    const prefix = opts.prefix;
    const name = opts.name || prefix;

    if (existsSync(outputPath)) {
      console.error(`Output file already exists: ${outputPath}`);
      process.exit(1);
    }

    try {
      const doc = initDocument(prefix, name);
      saveDocument(doc, "json", outputPath);
      console.log(`Created ${outputPath} with prefix ${prefix}`);
    } catch (err: unknown) {
      console.error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  },
};

const addTaskArgs = z.object({
  input: z.string().describe("Path to SysProM document"),
});

const addTaskOpts = z.object({
  prefix: z.string().describe("Plan prefix"),
  name: z.string().optional().describe("Task name"),
  parent: z.string().optional().describe("Parent task ID"),
});

const addTaskSubcommand: CommandDef<typeof addTaskArgs, typeof addTaskOpts> = {
  name: "add-task",
  description: "Add a task to a plan",
  args: addTaskArgs,
  opts: addTaskOpts,
  action(args, opts) {
    const inputPath = args.input;
    const prefix = opts.prefix;
    const name = opts.name;
    const parentId = opts.parent;

    try {
      const { doc, format, path } = loadDocument(inputPath);
      const newDoc = addTask(doc, prefix, name, parentId);
      saveDocument(newDoc, format, path);
      const target = parentId ? `to ${parentId}` : `to ${prefix}-PROT-IMPL`;
      console.log(`Added task ${target}`);
    } catch (err: unknown) {
      console.error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  },
};

const statusArgs = z.object({
  input: z.string().describe("Path to SysProM document"),
});

const statusOpts = z.object({
  prefix: z.string().describe("Plan prefix"),
  json: z.boolean().optional().describe("Output as JSON"),
});

const statusSubcommand: CommandDef<typeof statusArgs, typeof statusOpts> = {
  name: "status",
  description: "Show plan status summary",
  args: statusArgs,
  opts: statusOpts,
  action(args, opts) {
    const inputPath = args.input;
    const prefix = opts.prefix;
    const asJson = opts.json === true;

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
    } catch (err: unknown) {
      console.error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  },
};

const progressArgs = z.object({
  input: z.string().describe("Path to SysProM document"),
});

const progressOpts = z.object({
  prefix: z.string().describe("Plan prefix"),
  json: z.boolean().optional().describe("Output as JSON"),
});

const progressSubcommand: CommandDef<typeof progressArgs, typeof progressOpts> = {
  name: "progress",
  description: "Show plan progress with per-phase breakdown",
  args: progressArgs,
  opts: progressOpts,
  action(args, opts) {
    const inputPath = args.input;
    const prefix = opts.prefix;
    const asJson = opts.json === true;

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
    } catch (err: unknown) {
      console.error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  },
};

const gateArgs = z.object({
  input: z.string().describe("Path to SysProM document"),
});

const gateOpts = z.object({
  prefix: z.string().describe("Plan prefix"),
  phase: z.string().describe("Phase number"),
  json: z.boolean().optional().describe("Output as JSON"),
});

const gateSubcommand: CommandDef<typeof gateArgs, typeof gateOpts> = {
  name: "gate",
  description: "Check gate criteria for phase entry",
  args: gateArgs,
  opts: gateOpts,
  action(args, opts) {
    const inputPath = args.input;
    const prefix = opts.prefix;
    const phaseNum = parseInt(opts.phase, 10);
    const asJson = opts.json === true;

    if (isNaN(phaseNum) || phaseNum < 1) {
      console.error(`Invalid phase number: ${opts.phase}`);
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
    } catch (err: unknown) {
      console.error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  },
};

// ============================================================================
// Main command
// ============================================================================

export const planCommand: CommandDef = {
  name: "plan",
  description: "Manage project plans and phase gates",
  subcommands: [
    initSubcommand,
    addTaskSubcommand,
    statusSubcommand,
    progressSubcommand,
    gateSubcommand,
  ],
};
