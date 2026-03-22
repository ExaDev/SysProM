import type { CommandDef } from "../define-command.js";
import { checkOp } from "../../operations/index.js";
import { noArgs, readOpts, loadDoc } from "../shared.js";

export const checkCommand: CommandDef<typeof noArgs, typeof readOpts> = {
	name: "check",
	description: checkOp.def.description,
	apiLink: checkOp.def.name,
	opts: readOpts,
	action(_args, opts) {
		const { doc } = loadDoc(opts.path);
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
