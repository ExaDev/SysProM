import * as z from "zod";
import { writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import type { CommandDef } from "../define-command.js";
import { canonicalise } from "../../canonical-json.js";
import { initDocumentOp } from "../../operations/index.js";

interface Args {
	output: string;
}
interface Opts {
	title?: string;
	scope?: string;
}

function isArgs(arg: unknown): arg is Args {
	return typeof arg === "object" && arg !== null && "output" in arg;
}

function isOpts(opt: unknown): opt is Opts {
	return typeof opt === "object" && opt !== null;
}

export const initCommand: CommandDef = {
	name: "init",
	description: initDocumentOp.def.description,
	apiLink: initDocumentOp.def.name,
	args: z.object({
		output: z.string().describe("Output file path"),
	}),
	opts: z
		.object({
			title: z.string().optional().describe("Document title"),
			scope: z.string().optional().describe("Document scope"),
		})
		.strict(),
	action(args: unknown, opts: unknown) {
		if (!isArgs(args)) throw new Error("Invalid args");
		if (!isOpts(opts)) throw new Error("Invalid opts");
		const typedArgs = args;
		const typedOpts = opts;
		const outputPath = resolve(typedArgs.output);
		if (existsSync(outputPath)) {
			console.error(`File already exists: ${outputPath}`);
			process.exit(1);
		}

		const doc = initDocumentOp({
			title: typedOpts.title ?? "Untitled",
			scope: typedOpts.scope ?? "system",
		});

		writeFileSync(outputPath, canonicalise(doc, { indent: "\t" }) + "\n");
		console.log(`Created ${outputPath}`);
	},
};
