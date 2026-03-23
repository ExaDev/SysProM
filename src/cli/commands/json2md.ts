import * as z from "zod";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { CommandDef } from "../define-command.js";
import { SysProMDocument } from "../../schema.js";
import { jsonToMarkdown } from "../../json-to-md.js";
import { jsonToMarkdownOp } from "../../operations/index.js";

const optsSchema = z
	.object({
		input: z.string().describe("Path to SysProM JSON file"),
		output: z.string().describe("Output path (file or directory)"),
		singleFile: z
			.boolean()
			.optional()
			.describe("Force single-file output format"),
	})
	.strict();

export const json2mdCommand: CommandDef<
	z.ZodObject<z.ZodRawShape>,
	typeof optsSchema
> = {
	name: "json2md",
	description: jsonToMarkdownOp.def.description,
	apiLink: jsonToMarkdownOp.def.name,
	opts: optsSchema,
	action(_args, opts) {
		const inputPath = resolve(opts.input);
		const outputPath = resolve(opts.output);

		const raw: unknown = JSON.parse(readFileSync(inputPath, "utf8"));

		if (!SysProMDocument.is(raw)) {
			const result = SysProMDocument.safeParse(raw);
			if (!result.success) {
				console.error("Input is not a valid SysProM document:");
				for (const issue of result.error.issues) {
					console.error(`  ${issue.path.join(".")}: ${issue.message}`);
				}
			}
			process.exit(1);
		}

		const form =
			opts.singleFile || outputPath.endsWith(".md")
				? "single-file"
				: "multi-doc";

		jsonToMarkdown(raw, outputPath, { form });

		if (form === "single-file") {
			console.log(`Written to ${outputPath}`);
		} else {
			console.log(`Written to ${outputPath}/`);
		}
	},
};
