import * as z from "zod";
import pc from "picocolors";
import type { CommandDef } from "../define-command.js";
import { validateOp } from "../../operations/index.js";
import { inputArg, readOpts, loadDoc } from "../shared.js";

const argsSchema = z.object({
	input: inputArg,
});

const optsSchema = readOpts;

export const validateCommand: CommandDef<typeof argsSchema, typeof optsSchema> =
	{
		name: "validate",
		description: validateOp.def.description,
		apiLink: validateOp.def.name,
		args: argsSchema,
		opts: optsSchema,
		action(args) {
			const { doc } = loadDoc(args.input);
			const result = validateOp({ doc });

			if (result.valid) {
				console.log(pc.green("Valid SysProM document."));
				console.log(
					`  ${pc.cyan(String(result.nodeCount))} nodes, ${pc.cyan(String(result.relationshipCount))} relationships`,
				);
			} else {
				console.error(
					pc.red(`Found ${String(result.issues.length)} issue(s):`),
				);
				for (const issue of result.issues) {
					console.error(`  - ${pc.red(issue)}`);
				}
				process.exit(1);
			}
		},
	};
