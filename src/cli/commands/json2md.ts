/// <reference types="node" />
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
		embedDiagrams: z
			.boolean()
			.optional()
			.describe("Embed Mermaid diagrams in the output"),
		labelMode: z
			.enum(["friendly", "compact"])
			.optional()
			.describe("Node label mode for embedded diagrams"),
		relationshipLayout: z
			.enum(["LR", "TD", "RL", "BT"])
			.optional()
			.describe("Override layout for relationship diagrams"),
		refinementLayout: z
			.enum(["LR", "TD", "RL", "BT"])
			.optional()
			.describe("Override layout for refinement diagrams"),
		decisionLayout: z
			.enum(["LR", "TD", "RL", "BT"])
			.optional()
			.describe("Override layout for decision diagrams"),
		dependencyLayout: z
			.enum(["LR", "TD", "RL", "BT"])
			.optional()
			.describe("Override layout for dependency diagrams"),
		diagramLinks: z
			.boolean()
			.optional()
			.describe("Add click hyperlinks to Mermaid diagram nodes"),
	})
	.strict();

export const json2mdCommand: CommandDef<z.ZodObject, typeof optsSchema> = {
	name: "json2md",
	description: jsonToMarkdownOp.def.description,
	apiLink: jsonToMarkdownOp.def.name,
	opts: optsSchema,
	action(_args, opts) {
		const inputPath = resolve(opts.input);
		const outputPath = resolve(opts.output);

		const raw: unknown = JSON.parse(readFileSync(inputPath, "utf8"));

		// Use the attached type guard for clearer intent and narrower runtime checks
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

		// Forward per-diagram layout overrides via environment-like flags.
		// We accept flags on the command line for common diagram layouts but also
		// preserve sensible per-diagram defaults in jsonToMarkdown when not set.
		// For now we expose a single --label-mode flag and keep per-diagram layout
		// defaults internal; a future enhancement could expose per-diagram
		// flags such as --relationship-layout, --dependency-layout, etc.

		jsonToMarkdown(raw, outputPath, {
			form,
			embedDiagrams: opts.embedDiagrams,
			diagramLinks: opts.diagramLinks,
			// forward labelMode for embedded diagrams (default friendly)
			labelMode: opts.labelMode ?? "friendly",
			relationshipLayout: opts.relationshipLayout,
			refinementLayout: opts.refinementLayout,
			decisionLayout: opts.decisionLayout,
			dependencyLayout: opts.dependencyLayout,
		});

		if (form === "single-file") {
			console.log(`Written to ${outputPath}`);
		} else {
			console.log(`Written to ${outputPath}/`);
		}
	},
};
