import * as z from "zod";
import type { CommandDef } from "../define-command.js";
import { removeNodeOp } from "../../operations/index.js";
import { mutationOpts, loadDoc, persistDoc } from "../shared.js";

const argsSchema = z.object({
	nodeId: z.string().describe("ID of the node to remove"),
});

const optsSchema = mutationOpts;

export const removeCommand: CommandDef<typeof argsSchema, typeof optsSchema> = {
	name: "remove",
	description: removeNodeOp.def.description,
	apiLink: removeNodeOp.def.name,
	args: argsSchema,
	opts: optsSchema,
	action(args, opts) {
		const loaded = loadDoc(opts.path);
		const { doc } = loaded;
		const targetId = args.nodeId;
		const removedNode = doc.nodes.find((n) => n.id === targetId);

		try {
			const result = removeNodeOp({ doc, id: targetId });

			// Count removed relationships
			const before = (doc.relationships ?? []).length;
			const after = (result.doc.relationships ?? []).length;
			const removedRels = before - after;

			persistDoc(result.doc, loaded, opts);

			if (opts.json) {
				console.log(
					JSON.stringify(
						{
							removed: removedNode,
							removedRelationships: removedRels,
							warnings: result.warnings,
						},
						null,
						2,
					),
				);
			} else {
				if (removedRels > 0) {
					console.log(
						`Removed ${String(removedRels)} relationship(s) involving ${targetId}`,
					);
				}

				// Print warnings
				for (const warning of result.warnings) {
					console.warn(`Warning: ${warning}`);
				}

				console.log(
					`${opts.dryRun ? "[dry-run] Would remove" : "Removed"} ${String(removedNode?.type)} ${targetId} — ${String(removedNode?.name)}`,
				);
			}
		} catch (err: unknown) {
			console.error(err instanceof Error ? err.message : String(err));
			process.exit(1);
		}
	},
};
