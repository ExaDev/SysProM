import * as z from "zod";
import type { CommandDef } from "../define-command.js";
import { renameOp } from "../../operations/index.js";
import { inputArg, mutationOpts, loadDoc, persistDoc } from "../shared.js";

const argsSchema = z.object({
	input: inputArg,
	oldId: z.string().describe("Current node ID"),
	newId: z.string().describe("New node ID"),
});

const optsSchema = mutationOpts;

export const renameCommand: CommandDef<typeof argsSchema, typeof optsSchema> = {
	name: "rename",
	description: renameOp.def.description,
	apiLink: renameOp.def.name,
	args: argsSchema,
	opts: optsSchema,
	action(args, opts) {
		try {
			const loaded = loadDoc(args.input);
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
