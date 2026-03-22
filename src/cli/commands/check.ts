import * as z from "zod";
import type { CommandDef } from "../define-command.js";
import { checkOp } from "../../operations/index.js";
import { inputArg, readOpts, loadDoc } from "../shared.js";

const argsSchema = z.object({
	input: inputArg,
});

const optsSchema = readOpts;

export const checkCommand: CommandDef<typeof argsSchema, typeof optsSchema> = {
	name: "check",
	description: checkOp.def.description,
	apiLink: checkOp.def.name,
	args: argsSchema,
	opts: optsSchema,
	action(args, opts) {
		const { doc } = loadDoc(args.input);
		const result = checkOp({ doc });

		if (opts.json) {
			console.log(JSON.stringify(result, null, 2));
		} else {
			if (result.warnings.length === 0 && result.info.length === 0) {
				console.log("No issues found.");
			} else {
				for (const w of result.warnings) console.log(`⚠ ${w}`);
				for (const i of result.info) console.log(`ℹ ${i}`);
				console.log(
					`\n${String(result.warnings.length)} warning(s), ${String(result.info.length)} info`,
				);
			}
		}
	},
};
