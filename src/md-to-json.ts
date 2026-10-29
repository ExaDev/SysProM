import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import {
	type SysProMDocument,
	markdownSingleToJson,
	parseMultiDoc,
} from "@sysprom/core";

export { markdownSingleToJson };

/**
 * Parse a multi-document Markdown folder into a SysProM document. Thin fs
 * wrapper over the pure `parseMultiDoc` from `@sysprom/core`: reads the
 * directory into a filename → content map (flattening subsystem and grouping
 * subdirectories with `/`-separated keys), then delegates to `parseMultiDoc`.
 * Behaviour is identical to the previous inline implementation.
 * @param dir - Path to the directory containing Markdown files.
 * @returns The parsed SysProM document.
 * @example
 * ```ts
 * const doc = markdownMultiDocToJson("./SysProM");
 * ```
 */
export function markdownMultiDocToJson(dir: string): SysProMDocument {
	const files = readMultiDocFiles(dir, "");
	return parseMultiDoc(files);
}

/**
 * Recursively read a multi-document directory into a flat filename → content
 * map. Top-level files use bare names (e.g. "README.md", "INTENT.md"); files
 * inside subsystem folders and grouping directories are prefixed with their
 * containing folder path joined by `/`, matching the layout produced by
 * `renderMultiDoc` / `jsonToMarkdownMultiDoc`. Both `.spm.md` single-file
 * subsystems and folder-style subsystems (with their own README.md and
 * document files) are collected.
 */
function readMultiDocFiles(
	dir: string,
	prefix: string,
): Record<string, string> {
	const files: Record<string, string> = {};

	for (const entry of readdirSync(dir)) {
		const entryPath = join(dir, entry);
		const st = statSync(entryPath);
		const key = prefix ? `${prefix}${entry}` : entry;

		if (st.isDirectory()) {
			// Subsystem folder (has README.md) or grouping folder (no
			// README.md). Either way, recurse and prefix all child keys with
			// `${entry}/`. parseMultiDoc distinguishes subsystem vs grouping
			// by whether a README.md appears under that prefix.
			Object.assign(files, readMultiDocFiles(entryPath, `${key}/`));
		} else if (entry.endsWith(".md")) {
			// Top-level document files (README.md, INTENT.md, ...) and nested
			// document files inside subsystem/grouping folders. Single-file
			// subsystems (`.spm.md`) are also captured here.
			files[key] = readFileSync(entryPath, "utf8");
		}
	}

	return files;
}

/**
 * Parse Markdown into a SysProM document, auto-detecting single-file or
 * multi-doc format.
 * @param input - File path or directory path to parse.
 * @returns The parsed SysProM document.
 * @example
 * ```ts
 * const doc = markdownToJson("./SysProM");
 * ```
 */
export function markdownToJson(input: string): SysProMDocument {
	if (statSync(input).isDirectory()) {
		return markdownMultiDocToJson(input);
	}
	return markdownSingleToJson(readFileSync(input, "utf8"));
}
