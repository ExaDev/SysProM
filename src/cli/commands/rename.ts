import * as z from "zod";
import type { CommandDef } from "../define-command.js";
import { renameOp } from "../../operations/index.js";
import { mutationOpts, loadDoc, persistDoc } from "../shared.js";

const argsSchema = z.object({
	oldId: z.string().describe("Current node ID"),
	newId: z.string().describe("New node ID"),
});

export const renameCommand: CommandDef<typeof argsSchema, typeof mutationOpts> =
	{
		name: "rename",
		description: renameOp.def.description,
		apiLink: renameOp.def.name,
		args: argsSchema,
		opts: mutationOpts,
		action(args, opts) {
			try {
				const loaded = loadDoc(opts.path);
				const { doc } = loaded;
				const updated = renameOp({ doc, oldId: args.oldId, newId: args.newId });
				persistDoc(updated, loaded, opts);

				if (opts.json) {
					console.log(
						JSON.stringify({ oldId: args.oldId, newId: args.newId }, null, 2),
					);
				} else {
					console.log(
						`${opts.dryRun ? "[dry-run] Would rename" : "Renamed"} ${args.oldId} → ${args.newId}`,
					);
				}
			} catch (err: unknown) {
				console.error(err instanceof Error ? err.message : String(err));
				process.exit(1);
			}
		},
	};
