import * as z from "zod";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type { CommandDef } from "../define-command.js";
import { markdownToJson } from "../../md-to-json.js";
import { canonicalise } from "../../canonical-json.js";
import { markdownToJsonOp } from "../../operations/index.js";

const optsSchema = z
	.object({
		input: z.string().describe("Path to SysProM Markdown (file or directory)"),
		output: z.string().describe("Output JSON file path"),
	})
	.strict();

export const md2jsonCommand: CommandDef<
	z.ZodObject<z.ZodRawShape>,
	typeof optsSchema
> = {
	name: "md2json",
	description: markdownToJsonOp.def.description,
	apiLink: markdownToJsonOp.def.name,
	opts: optsSchema,
	action(_args, opts) {
		const inputPath = resolve(opts.input);
		const outputPath = resolve(opts.output);

		const doc = markdownToJson(inputPath);
		writeFileSync(outputPath, canonicalise(doc, { indent: "\t" }) + "\n");
		console.log(`Written to ${outputPath}`);
	},
};
