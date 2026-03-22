import * as z from "zod";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type { CommandDef } from "../define-command.js";
import { markdownToJson } from "../../md-to-json.js";
import { canonicalise } from "../../canonical-json.js";
import { markdownToJsonOp } from "../../operations/index.js";

interface Args {
	input: string;
	output: string;
}

function isArgs(arg: unknown): arg is Args {
	return (
		typeof arg === "object" && arg !== null && "input" in arg && "output" in arg
	);
}

export const md2jsonCommand: CommandDef = {
	name: "md2json",
	description: markdownToJsonOp.def.description,
	apiLink: markdownToJsonOp.def.name,
	args: z.object({
		input: z.string().describe("Path to SysProM Markdown (file or directory)"),
		output: z.string().describe("Output JSON file path"),
	}),
	opts: z.object({}).strict(),
	action(args: unknown) {
		if (!isArgs(args)) throw new Error("Invalid args");
		const typedArgs = args;
		const inputPath = resolve(typedArgs.input);
		const outputPath = resolve(typedArgs.output);

		const doc = markdownToJson(inputPath);
		writeFileSync(outputPath, canonicalise(doc, { indent: "\t" }) + "\n");
		console.log(`Written to ${outputPath}`);
	},
};
