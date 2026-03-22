import * as z from "zod";
import type { CommandDef } from "../define-command.js";
import { loadDocument, saveDocument } from "../../io.js";
import {
	addPlanTaskOp,
	updatePlanTaskOp,
	taskListOp,
} from "../../operations/index.js";

// ============================================================================
// Subcommands
// ============================================================================

const listArgs = z.object({
	input: z.string().describe("Path to SysProM document"),
});

const listOpts = z.object({
	change: z.string().optional().describe("Filter by change ID"),
	pending: z.boolean().optional().describe("Show only pending tasks"),
	json: z.boolean().optional().describe("Output as JSON"),
});

const listSubcommand: CommandDef<typeof listArgs, typeof listOpts> = {
	name: "list",
	description: "List tasks from change nodes",
	args: listArgs,
	opts: listOpts,
	action(args, opts) {
		const { doc } = loadDocument(args.input);

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

			console.log(`\n${rows.length} task(s)`);
		} catch (err: unknown) {
			console.error(err instanceof Error ? err.message : String(err));
			process.exit(1);
		}
	},
};

const addArgs = z.object({
	input: z.string().describe("Path to SysProM document"),
	changeId: z.string().describe("Change node ID"),
	description: z.string().describe("Task description"),
});

const addOpts = z.object({});

const addSubcommand: CommandDef<typeof addArgs, typeof addOpts> = {
	name: "add",
	description: "Add a task to a change node",
	args: addArgs,
	opts: addOpts,
	action(args) {
		const { doc, format, path } = loadDocument(args.input);

		try {
			const newDoc = addPlanTaskOp({
				doc,
				changeId: args.changeId,
				description: args.description,
			});
			saveDocument(newDoc, format, path);
			const node = newDoc.nodes.find((n) => n.id === args.changeId)!;
			const newIndex = (node.plan?.length ?? 1) - 1;
			console.log(`Added task ${newIndex} to ${args.changeId}`);
		} catch (err: unknown) {
			console.error(err instanceof Error ? err.message : String(err));
			process.exit(1);
		}
	},
};

const doneArgs = z.object({
	input: z.string().describe("Path to SysProM document"),
	changeId: z.string().describe("Change node ID"),
	taskIndex: z.string().describe("Task index"),
});

const doneOpts = z.object({});

const doneSubcommand: CommandDef<typeof doneArgs, typeof doneOpts> = {
	name: "done",
	description: "Mark a task as done",
	args: doneArgs,
	opts: doneOpts,
	action(args) {
		const { doc, format, path } = loadDocument(args.input);
		const taskIndex = parseInt(args.taskIndex, 10);

		if (isNaN(taskIndex) || taskIndex < 0) {
			console.error(`Invalid task index: ${args.taskIndex}`);
			process.exit(1);
		}

		try {
			const newDoc = updatePlanTaskOp({
				doc,
				changeId: args.changeId,
				taskIndex,
				done: true,
			});
			saveDocument(newDoc, format, path);
			console.log(`Marked task ${taskIndex} done on ${args.changeId}`);
		} catch (err: unknown) {
			console.error(err instanceof Error ? err.message : String(err));
			process.exit(1);
		}
	},
};

const undoneArgs = z.object({
	input: z.string().describe("Path to SysProM document"),
	changeId: z.string().describe("Change node ID"),
	taskIndex: z.string().describe("Task index"),
});

const undoneOpts = z.object({});

const undoneSubcommand: CommandDef<typeof undoneArgs, typeof undoneOpts> = {
	name: "undone",
	description: "Mark a task as undone",
	args: undoneArgs,
	opts: undoneOpts,
	action(args) {
		const { doc, format, path } = loadDocument(args.input);
		const taskIndex = parseInt(args.taskIndex, 10);

		if (isNaN(taskIndex) || taskIndex < 0) {
			console.error(`Invalid task index: ${args.taskIndex}`);
			process.exit(1);
		}

		try {
			const newDoc = updatePlanTaskOp({
				doc,
				changeId: args.changeId,
				taskIndex,
				done: false,
			});
			saveDocument(newDoc, format, path);
			console.log(`Marked task ${taskIndex} undone on ${args.changeId}`);
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
