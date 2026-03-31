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
 * Populate optional node fields from CLI options.
 * @param node - The node to populate
 * @param description - Optional description
 * @param status - Optional (pre-validated) status
 * @param context - Optional decision context
 * @param rationale - Optional decision rationale
 * @param scope - Optional change scope
 * @param selected - Optional selected option ID
 * @param options - Optional array of option descriptions
 * @example
 * ```ts
 * const node: Node = { id: "D1", type: "decision", name: "My Decision" };
 * populateNodeFromOpts(node, desc, status, ctx, rat, scope, sel, opts);
 * ```
 */
function populateNodeFromOpts(
	node: Node,
	description?: string,
	status?: NodeStatus,
	context?: string,
	rationale?: string,
	scope?: string[],
	selected?: string,
	options?: string[],
): void {
	if (description) node.description = description;
	if (status) node.status = status;
	if (context) node.context = context;
	if (rationale) node.rationale = rationale;
	if (scope?.length) node.scope = scope;
	if (selected) node.selected = selected;

	if (options?.length) {
		node.options = options.map((arg, i) => {
			const colonIdx = arg.indexOf(":");
			if (colonIdx >= 0) {
				return {
					id: arg.slice(0, colonIdx),
					description: arg.slice(colonIdx + 1),
				};
			}
			const letter = String.fromCharCode(65 + i);
			return { id: `${node.id}-OPT-${letter}`, description: arg };
		});
	}
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
		const node: Node = { id, type, name: opts.name };

		// Use type guard to narrow status type after validation
		let status: NodeStatus | undefined;
		if (opts.status && NodeStatus.is(opts.status)) {
			status = opts.status;
		}

		populateNodeFromOpts(
			node,
			opts.description,
			status,
			opts.context,
			opts.rationale,
			opts.scope,
			opts.selected,
			opts.option,
		);

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
