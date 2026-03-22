import * as z from "zod";
import { existsSync, statSync } from "node:fs";
import { resolve, join } from "node:path";
import type { CommandDef } from "../define-command.js";
import { initDocumentOp } from "../../operations/index.js";
import { saveDocument, type Format } from "../../io.js";

const formatChoices = ["json", "md", "dir"] as const;
type InitFormat = (typeof formatChoices)[number];

function formatToIoFormat(fmt: InitFormat): Format {
	switch (fmt) {
		case "json":
			return "json";
		case "md":
			return "single-md";
		case "dir":
			return "multi-md";
	}
}

const suffixMap = {
	json: ".spm.json",
	md: ".spm.md",
	dir: ".spm",
} as const;

function resolveInitTarget(
	pathArg: string,
	format?: InitFormat,
): { outputPath: string; ioFormat: Format } {
	const resolved = resolve(pathArg);
	const isExistingDir =
		existsSync(resolved) && statSync(resolved).isDirectory();

	if (isExistingDir) {
		const fmt = format ?? "json";
		return {
			outputPath: join(resolved, suffixMap[fmt]),
			ioFormat: formatToIoFormat(fmt),
		};
	}

	const fmt = format ?? "dir";
	return {
		outputPath: `${resolved}${suffixMap[fmt]}`,
		ioFormat: formatToIoFormat(fmt),
	};
}

const argsSchema = z.object({
	path: z
		.string()
		.optional()
		.default(".")
		.describe("Target path (default: current directory)"),
});

const optsSchema = z
	.object({
		title: z.string().optional().describe("Document title"),
		scope: z.string().optional().describe("Document scope"),
		format: z
			.enum(formatChoices)
			.optional()
			.describe("Output format: json, md, or dir"),
	})
	.strict();

export const initCommand: CommandDef<typeof argsSchema, typeof optsSchema> = {
	name: "init",
	description: initDocumentOp.def.description,
	apiLink: initDocumentOp.def.name,
	args: argsSchema,
	opts: optsSchema,
	action(args, opts) {
		const { outputPath, ioFormat } = resolveInitTarget(args.path, opts.format);

		if (existsSync(outputPath)) {
			console.error(`Already exists: ${outputPath}`);
			process.exit(1);
		}

		const doc = initDocumentOp({
			title: opts.title ?? "Untitled",
			scope: opts.scope ?? "system",
		});

		saveDocument(doc, ioFormat, outputPath);
		console.log(`Created ${outputPath}`);
	},
};
