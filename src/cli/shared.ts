import * as z from "zod";
import { loadDocument, saveDocument, type Format } from "../io.js";
import { jsonToMarkdownMultiDoc } from "../json-to-md.js";
import type { SysProMDocument } from "../schema.js";

// ---------------------------------------------------------------------------
// Reusable CLI schemas — shared across all commands
// ---------------------------------------------------------------------------

/** Positional argument for a SysProM document path. */
export const inputArg = z
	.string()
	.describe("SysProM document path (JSON, .md, or directory)");

/** Common output/persistence options for read-only commands. */
export const readOpts = z.object({
	json: z.boolean().optional().default(false).describe("output as JSON"),
});

/** Common output/persistence options for mutation commands. */
export const mutationOpts = z.object({
	json: z.boolean().optional().default(false).describe("output as JSON"),
	dryRun: z
		.boolean()
		.optional()
		.default(false)
		.describe("preview changes without saving"),
	sync: z
		.string()
		.optional()
		.describe("sync to markdown directory after saving"),
});

export type ReadOpts = z.infer<typeof readOpts>;
export type MutationOpts = z.infer<typeof mutationOpts>;

// ---------------------------------------------------------------------------
// Shared helpers for CLI commands
// ---------------------------------------------------------------------------

export interface LoadedDoc {
	doc: SysProMDocument;
	format: Format;
	path: string;
}

/** Load a document from a CLI input path. */
export function loadDoc(input: string): LoadedDoc {
	return loadDocument(input);
}

/** Persist a document and optionally sync to markdown. */
export function persistDoc(
	doc: SysProMDocument,
	loaded: LoadedDoc,
	opts: MutationOpts,
): void {
	if (!opts.dryRun) {
		saveDocument(doc, loaded.format, loaded.path);
		if (opts.sync) {
			jsonToMarkdownMultiDoc(doc, opts.sync);
			console.log(`Synced to ${opts.sync}`);
		}
	}
}
