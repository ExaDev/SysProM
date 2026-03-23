import * as z from "zod";
import { readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { loadDocument, saveDocument, type Format } from "../io.js";
import { jsonToMarkdownMultiDoc } from "../json-to-md.js";
import type { SysProMDocument } from "../schema.js";

// ---------------------------------------------------------------------------
// Reusable CLI schemas — shared across all commands
// ---------------------------------------------------------------------------

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
 *   1. .SysProM.json   2. .SysProM.md   3. .SysProM/
 *   4. .spm.json       5. .spm.md       6. .spm/
 *   7. .sysprom.json   8. .sysprom.md   9. .sysprom/
 *  10. *.SysProM.json  11. *.SysProM.md 12. *.SysProM/
 *  13. *.spm.json     14. *.spm.md     15. *.spm/
 *  16. *.sysprom.json 17. *.sysprom.md 18. *.sysprom/
 *
 * All matching is case-insensitive. Glob tiers must have exactly one match.
 * @param input - Explicit document path, or undefined for auto-detection.
 * @param cwd - Working directory to search from (defaults to `.`).
 * @returns The resolved document path.
 * @example
 * ```ts
 * resolveInput() // => auto-detects ".SysProM.json" in cwd
 * resolveInput("my-doc.SysProM.json") // => "my-doc.SysProM.json"
 * ```
 */
export function resolveInput(input?: string, cwd?: string): string {
	if (input) return input;

	const dir = resolve(cwd ?? ".");

	// Exact names to check, in priority order (case-insensitive)
	const exactNames = [
		".SysProM.json",
		".SysProM.md",
		".SysProM",
		".spm.json",
		".spm.md",
		".spm",
		".sysprom.json",
		".sysprom.md",
		".sysprom",
	] as const;

	const entries = readdirSync(dir);

	for (const name of exactNames) {
		const isDirSuffix =
			name.endsWith(".SysProM") ||
			name.endsWith(".spm") ||
			name.endsWith(".sysprom");
		const found = entries.filter((e) => e.toLowerCase() === name);
		if (found.length > 1) {
			throw new Error(
				`Multiple SysProM documents found: ${found.join(", ")}. Specify one explicitly.`,
			);
		}
		if (found.length === 1) {
			const candidate = join(dir, found[0]);
			if (isDirSuffix) {
				try {
					if (statSync(candidate).isDirectory()) return candidate;
				} catch {
					/* skip */
				}
			} else {
				return candidate;
			}
		}
	}

	// Glob suffixes in priority order (case-insensitive)
	const globSuffixes = [
		".SysProM.json",
		".SysProM.md",
		".SysProM",
		".spm.json",
		".spm.md",
		".spm",
		".sysprom.json",
		".sysprom.md",
		".sysprom",
	] as const;

	for (const suffix of globSuffixes) {
		const isDirSuffix =
			suffix === ".SysProM" || suffix === ".spm" || suffix === ".sysprom";
		const matches = entries
			.filter((e) => {
				const lower = e.toLowerCase();
				return lower.endsWith(suffix) && lower !== suffix;
			})
			.map((e) => join(dir, e))
			.filter((p) => {
				if (isDirSuffix) {
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

/** Inferred type for read-only CLI options (input path, JSON output flag). */
export type ReadOpts = z.infer<typeof readOpts>;
/** Inferred type for mutation CLI options (extends ReadOpts with sync-to-markdown). */
export type MutationOpts = z.infer<typeof mutationOpts>;

// ---------------------------------------------------------------------------
// Shared helpers for CLI commands
// ---------------------------------------------------------------------------

/** A document loaded from a CLI input path with its format and resolved path. */
export interface LoadedDoc {
	doc: SysProMDocument;
	format: Format;
	path: string;
}

/**
 * Load a document from a CLI input path (auto-resolved if omitted).
 * @param input - Explicit document path, or undefined for auto-detection.
 * @returns The loaded document with format and resolved path.
 * @example
 * ```ts
 * const { doc, format, path } = loadDoc();
 * ```
 */
export function loadDoc(input?: string): LoadedDoc {
	return loadDocument(resolveInput(input));
}

/**
 * Persist a document and optionally sync to markdown.
 * @param doc - The document to save.
 * @param loaded - The original loaded document (provides format and path).
 * @param opts - Mutation options (e.g. sync-to-markdown flag).
 * @example
 * ```ts
 * const loaded = loadDoc();
 * const updated = addNodeOp({ doc: loaded.doc, node });
 * persistDoc(updated, loaded, { syncMd: "./SysProM" });
 * ```
 */
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
