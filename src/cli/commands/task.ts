import * as z from "zod";
import type { CommandDef } from "../define-command.js";
import { loadDoc, mutationOpts, persistDoc, noArgs } from "../shared.js";
import {
	addPlanTaskOp,
	markTaskDoneOp,
	markTaskUndoneOp,
	taskListOp,
} from "../../operations/index.js";

// ============================================================================
// Subcommands
// ============================================================================

const listOpts = mutationOpts.pick({ path: true, json: true }).extend({
	change: z.string().optional().describe("Filter by change ID"),
	pending: z.boolean().optional().describe("Show only pending tasks"),
});

const listSubcommand: CommandDef<typeof noArgs, typeof listOpts> = {
	name: "list",
	description: taskListOp.def.description,
	apiLink: taskListOp.def.name,
	opts: listOpts,
	action(_args, opts) {
		const { doc } = loadDoc(opts.path);

		try {
			const rows = taskListOp({
				doc,
				changeId: opts.change,
				pendingOnly: opts.pending,
			});

			if (opts.json) {
				console.log(JSON.stringify(rows, null, 2));
				return;
			}

			const header = `${"Change".padEnd(12)} ${"#".padEnd(4)} ${"Done".padEnd(6)} Description`;
			const divider = `${"-".repeat(12)} ${"-".repeat(4)} ${"-".repeat(6)} ${"-".repeat(30)}`;
			console.log(header);
			console.log(divider);

			for (const row of rows) {
				const doneStr = row.done ? "[x]" : "[ ]";
				console.log(
					`${row.changeId.padEnd(12)} ${String(row.index).padEnd(4)} ${doneStr.padEnd(6)} ${row.description}`,
				);
			}

			console.log(`\n${String(rows.length)} task(s)`);
		} catch (err: unknown) {
			console.error(err instanceof Error ? err.message : String(err));
			process.exit(1);
		}
	},
};

const addArgs = z.object({
	changeId: z.string().describe("Change node ID"),
	description: z.string().describe("Task description"),
});

const addOpts = mutationOpts.pick({ path: true });

const addSubcommand: CommandDef<typeof addArgs, typeof addOpts> = {
	name: "add",
	description: addPlanTaskOp.def.description,
	apiLink: addPlanTaskOp.def.name,
	args: addArgs,
	opts: addOpts,
	action(args, opts) {
		const loaded = loadDoc(opts.path);
		const { doc } = loaded;

		try {
			const newDoc = addPlanTaskOp({
				doc,
				changeId: args.changeId,
				description: args.description,
			});
			persistDoc(newDoc, loaded, { ...opts, json: false, dryRun: false });
			const node = newDoc.nodes.find((n) => n.id === args.changeId);
			if (!node) throw new Error(`Node ${args.changeId} not found`);
			const newIndex = (node.plan?.length ?? 1) - 1;
			console.log(`Added task ${String(newIndex)} to ${args.changeId}`);
		} catch (err: unknown) {
			console.error(err instanceof Error ? err.message : String(err));
			process.exit(1);
		}
	},
};

const doneArgs = z.object({
	changeId: z.string().describe("Change node ID"),
	taskIndex: z.string().describe("Task index"),
});

const doneOpts = mutationOpts.pick({ path: true });

const doneSubcommand: CommandDef<typeof doneArgs, typeof doneOpts> = {
	name: "done",
	description: markTaskDoneOp.def.description,
	apiLink: markTaskDoneOp.def.name,
	args: doneArgs,
	opts: doneOpts,
	action(args, opts) {
		const loaded = loadDoc(opts.path);
		const { doc } = loaded;
		const taskIndex = parseInt(args.taskIndex, 10);

		if (isNaN(taskIndex) || taskIndex < 0) {
			console.error(`Invalid task index: ${args.taskIndex}`);
			process.exit(1);
		}

		try {
			const newDoc = markTaskDoneOp({
				doc,
				changeId: args.changeId,
				taskIndex,
			});
			persistDoc(newDoc, loaded, { ...opts, json: false, dryRun: false });
			console.log(`Marked task ${String(taskIndex)} done on ${args.changeId}`);
		} catch (err: unknown) {
			console.error(err instanceof Error ? err.message : String(err));
			process.exit(1);
		}
	},
};

const undoneArgs = z.object({
	changeId: z.string().describe("Change node ID"),
	taskIndex: z.string().describe("Task index"),
});

const undoneOpts = mutationOpts.pick({ path: true });

const undoneSubcommand: CommandDef<typeof undoneArgs, typeof undoneOpts> = {
	name: "undone",
	description: markTaskUndoneOp.def.description,
	apiLink: markTaskUndoneOp.def.name,
	args: undoneArgs,
	opts: undoneOpts,
	action(args, opts) {
		const loaded = loadDoc(opts.path);
		const { doc } = loaded;
		const taskIndex = parseInt(args.taskIndex, 10);

		if (isNaN(taskIndex) || taskIndex < 0) {
			console.error(`Invalid task index: ${args.taskIndex}`);
			process.exit(1);
		}

		try {
			const newDoc = markTaskUndoneOp({
				doc,
				changeId: args.changeId,
				taskIndex,
			});
			persistDoc(newDoc, loaded, { ...opts, json: false, dryRun: false });
			console.log(
				`Marked task ${String(taskIndex)} undone on ${args.changeId}`,
			);
		} catch (err: unknown) {
			console.error(err instanceof Error ? err.message : String(err));
			process.exit(1);
		}
	},
};

// ============================================================================
// Main command
// ============================================================================

export const taskCommand: CommandDef = {
	name: "task",
	description: "Manage tasks within change nodes",
	subcommands: [
		listSubcommand,
		addSubcommand,
		doneSubcommand,
		undoneSubcommand,
	],
};
