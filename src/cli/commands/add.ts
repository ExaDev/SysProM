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
	element: z
		.string()
		.optional()
		.describe(
			"Element ID this realisation implements (required for realisation nodes)",
		),
	governedBy: z
		.string()
		.optional()
		.describe(
			"Invariant or policy ID this gate enforces (required for gate nodes)",
		),
	option: z
		.array(z.string())
		.optional()
		.describe(
			"Option in format 'ID:description' or just 'description' (repeatable)",
		),
});

/**
 * Build a node object from CLI options.
 * @param id - The unique identifier for the node
 * @param type - The kind of node (decision, change, invariant, etc.)
 * @param name - The human-readable name of the node
 * @param opts - CLI options to apply to the node
 * @returns The constructed node with fields populated from opts
 * @example
 * ```ts
 * const node = buildNodeFromOpts("D1", "decision", "My Decision", opts);
 * ```
 */
function buildNodeFromOpts(
	id: string,
	type: string,
	name: string,
	opts: z.infer<typeof optsSchema>,
): Node {
	const node: Node = { id, type, name };

	if (opts.description) node.description = opts.description;
	if (opts.status) node.status = opts.status;
	if (opts.context) node.context = opts.context;
	if (opts.rationale) node.rationale = opts.rationale;
	if (opts.scope?.length) node.scope = opts.scope;
	if (opts.selected) node.selected = opts.selected;

	if (opts.option?.length) {
		node.options = opts.option.map((arg, i) => {
			const colonIdx = arg.indexOf(":");
			if (colonIdx >= 0) {
				return {
					id: arg.slice(0, colonIdx),
					description: arg.slice(colonIdx + 1),
				};
			}
			const letter = String.fromCharCode(65 + i);
			return { id: `${id}-OPT-${letter}`, description: arg };
		});
	}

	return node;
}

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
			console.error(
				`Unknown node type: "${type}". Valid types: ${NodeType.options.join(", ")}`,
			);
			process.exit(1);
		}

		if (opts.status && !NodeStatus.is(opts.status)) {
			console.error(
				`Unknown status: "${opts.status}". Valid statuses: ${NodeStatus.options.join(", ")}`,
			);
			process.exit(1);
		}

		const id = opts.id ?? nextIdOp({ doc, type });
		const node = buildNodeFromOpts(id, type, opts.name, opts);

		try {
			const newDoc = addNodeOp({
				doc,
				node,
				decisionId: opts.decision,
				elementId: opts.element,
				governedById: opts.governedBy,
			});

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
