import * as z from "zod";
import type { CommandDef } from "../define-command.js";
import { searchOp } from "../../operations/index.js";
import { readOpts, loadDoc } from "../shared.js";
import { textToString } from "../../text.js";

const argsSchema = z.object({
	term: z.string().describe("Search term"),
});

const optsSchema = readOpts;

export const searchCommand: CommandDef<typeof argsSchema, typeof optsSchema> = {
	name: "search",
	description: searchOp.def.description,
	apiLink: searchOp.def.name,
	args: argsSchema,
	opts: optsSchema,
	action(args, opts) {
		const { doc } = loadDoc(opts.path);
		const matches = searchOp({ doc, term: args.term });

		if (opts.json) {
			console.log(JSON.stringify(matches, null, 2));
		} else {
			if (matches.length === 0) {
				console.log(`No matches for "${args.term}"`);
			} else {
				for (const m of matches) {
					const desc = m.description
						? " — " + textToString(m.description).slice(0, 60)
						: "";
					console.log(
						`${m.id.padEnd(12)} ${m.type.padEnd(16)} ${m.name}${desc}`,
					);
				}
				console.log(`\n${String(matches.length)} match(es)`);
			}
		}
	},
};
