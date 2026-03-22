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
		const typedArgs = args as Args;
		const typedOpts = opts as Opts;
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
