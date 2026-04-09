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
 * Matching is case-insensitive for base names and directory matches.
 * Files like .SysProM.json, .sysprom.json, and .SYSPROM.JSON are treated
 * as equivalent and all match the .SysProM.json priority tier.
 * Glob tiers must have exactly one match.
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

	// Phase 1: Try exact case-sensitive matches first
	for (const name of exactNames) {
		const isDirSuffix =
			name.endsWith(".SysProM") ||
			name.endsWith(".spm") ||
			name.endsWith(".sysprom");
		const found = entries.filter((e) => e === name);
		if (found.length === 1) {
			// Before returning, check for case-variant collisions on case-sensitive
			// filesystems (e.g. both .spm.json and .SPM.json exist).
			const nameLower = name.toLowerCase();
			const caseVariants = entries.filter(
				(e) => e !== name && e.toLowerCase() === nameLower,
			);
			if (caseVariants.length > 0) {
				throw new Error(
					`Multiple SysProM documents found: ${[name, ...caseVariants].join(", ")}. Specify one explicitly.`,
				);
			}
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

	// Phase 2: Try case-insensitive matches (supports case variations like .SPM.JSON)
	for (const name of exactNames) {
		const isDirSuffix =
			name.endsWith(".SysProM") ||
			name.endsWith(".spm") ||
			name.endsWith(".sysprom");
		const nameLower = name.toLowerCase();
		const found = entries.filter((e) => e.toLowerCase() === nameLower);
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
		const suffixLower = suffix.toLowerCase();
		const matches = entries
			.filter((e) => {
				const lower = e.toLowerCase();
				// Match files ending with this suffix (case-insensitive) that don't start with "."
				// and are not exact matches (those were already checked)
				return (
					lower.endsWith(suffixLower) &&
					lower !== suffixLower &&
					!e.startsWith(".")
				);
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

// ---------------------------------------------------------------------------
// Error formatting and reporting
// ---------------------------------------------------------------------------

const ISSUE_URL = "https://github.com/ExaDev/SysProM/issues/new";

/**
 * Format an error message for CLI output with issue filing guidance.
 * If the error appears to be unexpected (not a user error), suggests filing an issue.
 * @param error - The error to format
 * @param isUserError - Whether this is a user error (e.g. invalid input); if false, suggests filing an issue
 * @returns Formatted error message
 * @example
 * ```ts
 * try { ... } catch (err: unknown) {
 *   console.error(formatCliError(err, false)); // Not a user error - suggest issue
 *   process.exit(1);
 * }
 * ```
 */
export function formatCliError(error: unknown, isUserError = false): string {
	const message = error instanceof Error ? error.message : String(error);
	if (isUserError) {
		return message;
	}
	return `${message}\n\nIf this was unexpected or bad UX, please file an issue:\n${ISSUE_URL}`;
}
