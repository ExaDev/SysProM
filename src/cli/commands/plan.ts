import * as z from "zod";
import { existsSync } from "node:fs";
import type { CommandDef } from "../define-command.js";
import { saveDocument } from "../../io.js";
import { loadDoc, mutationOpts, persistDoc, noArgs } from "../shared.js";
import {
	planInitOp,
	planAddTaskOp,
	planStatusOp,
	planProgressOp,
	planGateOp,
} from "../../operations/index.js";

// ============================================================================
// Subcommands
// ============================================================================

const initOpts = z.object({
	output: z.string().describe("Path to output SysProM file"),
	prefix: z.string().describe("Plan prefix (e.g. PLAN)"),
	name: z.string().optional().describe("Plan name (defaults to prefix)"),
});

const initSubcommand: CommandDef<z.ZodObject, typeof initOpts> = {
	name: "init",
	description: planInitOp.def.description,
	apiLink: planInitOp.def.name,
	opts: initOpts,
	action(_args, opts) {
		const outputPath = opts.output;
		const prefix = opts.prefix;
		const name = opts.name ?? prefix;

		if (existsSync(outputPath)) {
			console.error(`Output file already exists: ${outputPath}`);
			process.exit(1);
		}

		try {
			const doc = planInitOp({ prefix, name });
			saveDocument(doc, "json", outputPath);
			console.log(`Created ${outputPath} with prefix ${prefix}`);
		} catch (err: unknown) {
			console.error(err instanceof Error ? err.message : String(err));
			process.exit(1);
		}
	},
};

const addTaskOpts = mutationOpts.pick({ path: true }).extend({
	prefix: z.string().describe("Plan prefix"),
	name: z.string().optional().describe("Task name"),
	parent: z.string().optional().describe("Parent task ID"),
});

const addTaskSubcommand: CommandDef<typeof noArgs, typeof addTaskOpts> = {
	name: "add-task",
	description: planAddTaskOp.def.description,
	apiLink: planAddTaskOp.def.name,
	opts: addTaskOpts,
	action(_args, opts) {
		const prefix = opts.prefix;
		const name = opts.name;
		const parentId = opts.parent;

		try {
			const loaded = loadDoc(opts.path);
			const newDoc = planAddTaskOp({
				doc: loaded.doc,
				prefix,
				name,
				parent: parentId,
			});
			persistDoc(newDoc, loaded, { ...opts, json: false, dryRun: false });
			const target = parentId ? `to ${parentId}` : `to ${prefix}-PROT-IMPL`;
			console.log(`Added task ${target}`);
		} catch (err: unknown) {
			console.error(err instanceof Error ? err.message : String(err));
			process.exit(1);
		}
	},
};

const statusOpts = mutationOpts.pick({ path: true }).extend({
	prefix: z.string().describe("Plan prefix"),
	json: z.boolean().optional().describe("Output as JSON"),
});

const statusSubcommand: CommandDef<typeof noArgs, typeof statusOpts> = {
	name: "status",
	description: planStatusOp.def.description,
	apiLink: planStatusOp.def.name,
	opts: statusOpts,
	action(_args, opts) {
		const prefix = opts.prefix;
		const asJson = opts.json === true;

		try {
			const { doc } = loadDoc(opts.path);
			const status = planStatusOp({ doc, prefix });

			if (asJson) {
				console.log(JSON.stringify(status, null, 2));
				return;
			}

			const formatBoolean = (defined: boolean): string =>
				defined ? "✅ defined" : "❌ not defined";

			console.log(
				`Constitution: ${formatBoolean(status.constitution.defined)} (${String(status.constitution.principleCount)} principles)`,
			);
			console.log(
				`Spec:         ${formatBoolean(status.spec.defined)} (${String(status.spec.userStoryCount)} user stories)`,
			);
			console.log(
				`Plan:         ${formatBoolean(status.plan.defined)} (${String(status.plan.phaseCount)} phases)`,
			);
			console.log(
				`Tasks:        ${String(status.tasks.done)}/${String(status.tasks.total)} done`,
			);
			console.log(
				`Checklist:    ${formatBoolean(status.checklist.defined)} (${String(status.checklist.done)}/${String(status.checklist.total)})`,
			);
			console.log();
			console.log(`Next: ${status.nextStep}`);
		} catch (err: unknown) {
			console.error(err instanceof Error ? err.message : String(err));
			process.exit(1);
		}
	},
};

const progressOpts = mutationOpts.pick({ path: true }).extend({
	prefix: z.string().describe("Plan prefix"),
	json: z.boolean().optional().describe("Output as JSON"),
});

const progressSubcommand: CommandDef<typeof noArgs, typeof progressOpts> = {
	name: "progress",
	description: planProgressOp.def.description,
	apiLink: planProgressOp.def.name,
	opts: progressOpts,
	action(_args, opts) {
		const prefix = opts.prefix;
		const asJson = opts.json === true;

		try {
			const { doc } = loadDoc(opts.path);
			const progress = planProgressOp({ doc, prefix });

			if (asJson) {
				console.log(JSON.stringify(progress, null, 2));
				return;
			}

			for (const phase of progress) {
				const filledCount = Math.round((phase.percent / 100) * 10);
				const emptyCount = 10 - filledCount;
				const bar = "█".repeat(filledCount) + "░".repeat(emptyCount);
				const name = phase.name.padEnd(20);
				const percent = String(phase.percent).padStart(3);
				const ratio = `(${String(phase.done)}/${String(phase.total)})`;

				console.log(`${name} [${bar}] ${percent}% ${ratio}`);
			}
		} catch (err: unknown) {
			console.error(err instanceof Error ? err.message : String(err));
			process.exit(1);
		}
	},
};

const gateOpts = mutationOpts.pick({ path: true }).extend({
	prefix: z.string().describe("Plan prefix"),
	phase: z.string().describe("Phase number"),
	json: z.boolean().optional().describe("Output as JSON"),
});

const gateSubcommand: CommandDef<typeof noArgs, typeof gateOpts> = {
	name: "gate",
	description: planGateOp.def.description,
	apiLink: planGateOp.def.name,
	opts: gateOpts,
	action(_args, opts) {
		const prefix = opts.prefix;
		const phaseNum = parseInt(opts.phase, 10);
		const asJson = opts.json === true;

		if (isNaN(phaseNum) || phaseNum < 1) {
			console.error(`Invalid phase number: ${opts.phase}`);
			process.exit(1);
		}

		try {
			const { doc } = loadDoc(opts.path);
			const result = planGateOp({ doc, prefix, phase: phaseNum });

			if (asJson) {
				console.log(JSON.stringify(result, null, 2));
				return;
			}

			if (result.ready) {
				console.log(`Gate check for phase ${String(phaseNum)}: ✅ READY`);
			} else {
				console.log(`Gate check for phase ${String(phaseNum)}: ❌ NOT READY`);
				for (const issue of result.issues) {
					switch (issue.kind) {
						case "previous_tasks_incomplete":
							console.log(
								`  ❌ Phase ${String(issue.phase)} has ${String(issue.remaining)} incomplete tasks`,
							);
							break;
						case "user_story_no_change":
							console.log(`  ❌ ${issue.storyId} has no implementing change`);
							break;
						case "user_story_no_acceptance_criteria":
							console.log(`  ❌ ${issue.storyId} has no acceptance criteria`);
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
