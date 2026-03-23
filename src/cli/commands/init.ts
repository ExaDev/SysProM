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
	json: ".SysProM.json",
	md: ".SysProM.md",
	dir: ".SysProM",
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
	const suffix = suffixMap[fmt];

	// If path already ends with the correct suffix, use it as-is
	if (resolved.endsWith(suffix)) {
		return {
			outputPath: resolved,
			ioFormat: formatToIoFormat(fmt),
		};
	}

	return {
		outputPath: `${resolved}${suffix}`,
		ioFormat: formatToIoFormat(fmt),
	};
}

const optsSchema = z
	.object({
		path: z
			.string()
			.optional()
			.default(".")
			.describe("Target path (default: current directory)"),
		title: z.string().optional().describe("Document title"),
		scope: z.string().optional().describe("Document scope"),
		format: z
			.enum(formatChoices)
			.optional()
			.describe("Output format: json, md, or dir"),
	})
	.strict();

export const initCommand: CommandDef<
	z.ZodObject<z.ZodRawShape>,
	typeof optsSchema
> = {
	name: "init",
	description: initDocumentOp.def.description,
	apiLink: initDocumentOp.def.name,
	opts: optsSchema,
	action(_args, opts) {
		const { outputPath, ioFormat } = resolveInitTarget(opts.path, opts.format);

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
