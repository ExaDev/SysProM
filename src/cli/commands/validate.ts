import pc from "picocolors";
import type { CommandDef } from "../define-command.js";
import { validateOp } from "../../operations/index.js";
import { noArgs, readOpts, loadDoc } from "../shared.js";

export const validateCommand: CommandDef<typeof noArgs, typeof readOpts> = {
	name: "validate",
	description: validateOp.def.description,
	apiLink: validateOp.def.name,
	opts: readOpts,
	action(_args, opts) {
		const { doc } = loadDoc(opts.path);
		const result = validateOp({ doc });

		if (result.valid) {
			console.log(pc.green("Valid SysProM document."));
			console.log(
				`  ${pc.cyan(String(result.nodeCount))} nodes, ${pc.cyan(String(result.relationshipCount))} relationships`,
			);
		} else {
			console.error(pc.red(`Found ${String(result.issues.length)} issue(s):`));
			for (const issue of result.issues) {
				console.error(`  - ${pc.red(issue)}`);
			}
			process.exit(1);
		}
	},
};
