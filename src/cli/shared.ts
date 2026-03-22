import * as z from "zod";
import { existsSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { loadDocument, saveDocument, type Format } from "../io.js";
import { jsonToMarkdownMultiDoc } from "../json-to-md.js";
import type { SysProMDocument } from "../schema.js";

// ---------------------------------------------------------------------------
// Reusable CLI schemas — shared across all commands
// ---------------------------------------------------------------------------

/** @deprecated Use --path option in readOpts/mutationOpts instead. */
export const inputArg = z
	.string()
	.describe("SysProM document path (JSON, .md, or directory)");

/** Empty args schema for commands that take no positional arguments. */
export const noArgs = z.object({}).strict();

/** Shared --path option for specifying the SysProM document location. */
const pathOpt = z
	.string()
	.optional()
	.describe("SysProM document path (auto-detected if omitted)");

// ---------------------------------------------------------------------------
// Default input resolution
// ---------------------------------------------------------------------------

/**
 * Resolve a SysProM document path. If no explicit path is given, search the
 * working directory by priority:
 *   1. .spm.json  2. .spm.md  3. .spm/
 *   4. *.spm.json 5. *.spm.md 6. *.spm/ (glob — must be unique)
 */
export function resolveInput(input?: string, cwd?: string): string {
	if (input) return input;

	const dir = resolve(cwd ?? ".");

	// Priority 1–3: exact names
	const exact = [".spm.json", ".spm.md", ".spm"] as const;
	for (const name of exact) {
		const candidate = join(dir, name);
		if (existsSync(candidate)) return candidate;
	}

	// Priority 4–6: glob by suffix
	const entries = readdirSync(dir);
	const suffixes = [".spm.json", ".spm.md", ".spm"] as const;
	for (const suffix of suffixes) {
		const matches = entries
			.filter((e) => e.endsWith(suffix) && e !== suffix)
			.map((e) => join(dir, e))
			.filter((p) => {
				if (suffix === ".spm") {
					try {
						return statSync(p).isDirectory();
					} catch {
						return false;
					}
				}
				return true;
			});
		if (matches.length === 1) return matches[0];
		if (matches.length > 1) {
			const names = matches.map((m) => m.slice(dir.length + 1)).join(", ");
			throw new Error(
				`Multiple SysProM documents found: ${names}. Specify one explicitly.`,
			);
		}
	}

	throw new Error(
		"No SysProM document found in current directory. Specify a path or run `spm init`.",
	);
}

/** Common output/persistence options for read-only commands. */
export const readOpts = z.object({
	path: pathOpt,
	json: z.boolean().optional().default(false).describe("output as JSON"),
});

/** Common output/persistence options for mutation commands. */
export const mutationOpts = z.object({
	path: pathOpt,
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

/** Load a document from a CLI input path (auto-resolved if omitted). */
export function loadDoc(input?: string): LoadedDoc {
	return loadDocument(resolveInput(input));
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
