import * as z from "zod";
import type { CommandDef } from "../define-command.js";
import { NodeType, NodeStatus, type Node } from "../../schema.js";
import { addNodeOp, nextIdOp } from "../../operations/index.js";
import { mutationOpts, loadDoc, persistDoc } from "../shared.js";

const argsSchema = z.object({
	nodeType: z.string().describe("Node type to add"),
});

const optsSchema = mutationOpts.extend({
	id: z.string().optional().describe("Node ID (auto-generated if omitted)"),
	name: z.string().describe("Human-readable node name"),
	description: z.string().optional().describe("Node description"),
	status: z.string().optional().describe("Lifecycle status"),
	context: z.string().optional().describe("Decision context"),
	rationale: z.string().optional().describe("Decision rationale"),
	scope: z.array(z.string()).optional().describe("Change scope (repeatable)"),
	selected: z.string().optional().describe("Selected option ID"),
	decision: z
		.string()
		.optional()
		.describe("Decision ID this change implements (required for change nodes)"),
	option: z
		.array(z.string())
		.optional()
		.describe(
			"Option in format 'ID:description' or just 'description' (repeatable)",
		),
});

export const addCommand: CommandDef<typeof argsSchema, typeof optsSchema> = {
	name: "add",
	description: addNodeOp.def.description,
	apiLink: addNodeOp.def.name,
	args: argsSchema,
	opts: optsSchema,

	action(args, opts) {
		if (!opts.name) {
			console.error("--name is required.");
			process.exit(1);
		}

		const loaded = loadDoc(opts.path);
		const { doc } = loaded;
		const type = args.nodeType;

		if (!NodeType.is(type)) {
			console.error(`Unknown node type: ${type}`);
			process.exit(1);
		}

		const id = opts.id ?? nextIdOp({ doc, type });

		// Build the node from CLI options
		const node: Node = { id, type, name: opts.name };

		if (opts.description) {
			node.description = opts.description;
		}

		if (opts.status) {
			if (!NodeStatus.is(opts.status)) {
				console.error(`Unknown status: ${opts.status}`);
				process.exit(1);
			}
			node.status = opts.status;
		}

		if (opts.context) {
			node.context = opts.context;
		}

		if (opts.rationale) {
			node.rationale = opts.rationale;
		}

		if (opts.scope && opts.scope.length > 0) {
			node.scope = opts.scope;
		}

		if (opts.selected) {
			node.selected = opts.selected;
		}

		if (opts.option && opts.option.length > 0) {
			node.options = opts.option.map((arg, i) => {
				const colonIdx = arg.indexOf(":");
				if (colonIdx >= 0) {
					return {
						id: arg.slice(0, colonIdx),
						description: arg.slice(colonIdx + 1),
					};
				}
				// Auto-generate ID: D26-OPT-A, D26-OPT-B, etc.
				const letter = String.fromCharCode(65 + i); // A, B, C, ...
				return { id: `${id}-OPT-${letter}`, description: arg };
			});
		}

		try {
			const newDoc = addNodeOp({ doc, node, decisionId: opts.decision });

			persistDoc(newDoc, loaded, opts);

			if (opts.json) {
				console.log(JSON.stringify(node, null, 2));
			} else {
				console.log(
					`${opts.dryRun ? "[dry-run] Would add" : "Added"} ${type} ${id} — ${opts.name}`,
				);
			}
		} catch (err: unknown) {
			console.error(err instanceof Error ? err.message : String(err));
			process.exit(1);
		}
	},
};
