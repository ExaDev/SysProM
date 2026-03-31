import { readFileSync, writeFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { SysProMDocument } from "./schema.js";
import { markdownSingleToJson, markdownMultiDocToJson } from "./md-to-json.js";
import { jsonToMarkdownSingle, jsonToMarkdownMultiDoc } from "./json-to-md.js";
import { canonicalise } from "./canonical-json.js";

/** Supported serialisation formats for SysProM documents. */
export type Format = "json" | "single-md" | "multi-md";

/** The result of loading a SysProM document from disc. */
export interface LoadedDocument {
	/** The parsed SysProM document. */
	doc: SysProMDocument;
	/** The detected serialisation format. */
	format: Format;
	/** The resolved absolute path the document was loaded from. */
	path: string;
}

function detectFormat(input: string): Format {
	const stat = statSync(input);
	if (stat.isDirectory()) return "multi-md";
	if (input.endsWith(".json")) return "json";
	return "single-md";
}

/**
 * Wrap an error with a descriptive prefix and attach the original as cause.
 * @param prefix - The error prefix (e.g., "Failed to parse JSON")
 * @param error - The caught error
 * @example
 * ```ts
 * try {
 *   const data = JSON.parse(content);
 * } catch (error) {
 *   wrapError("Failed to parse JSON", error);
 * }
 * ```
 */
function wrapError(prefix: string, error: unknown): never {
	throw new Error(
		`${prefix}: ${error instanceof Error ? error.message : String(error)}`,
		{ cause: error },
	);
}

/**
 * Load a SysProM document from a file (JSON or Markdown).
 * @param input - File path or directory to load from.
 * @returns The loaded document with its detected format and resolved path.
 * @example
 * ```ts
 * const { doc, format } = loadDocument("project.spm.json");
 * ```
 */
export function loadDocument(input: string): LoadedDocument {
	const path = resolve(input);

	// Validate file/directory exists
	try {
		statSync(path);
	} catch (error) {
		if (error instanceof Error && "code" in error && error.code === "ENOENT") {
			wrapError(
				`Document not found at ${path}. Create one first with init-document`,
				error,
			);
		}
		throw error;
	}

	const format = detectFormat(path);

	let doc: SysProMDocument;
	switch (format) {
		case "json": {
			try {
				const content = readFileSync(path, "utf8");
				let raw: unknown;
				try {
					raw = JSON.parse(content);
				} catch (error) {
					wrapError("Failed to parse JSON", error);
				}

				const result = SysProMDocument.safeParse(raw);
				if (!result.success) {
					const issues = result.error.issues
						.map((i) => `  ${i.path.join(".")}: ${i.message}`)
						.join("\n");
					throw new Error(`Invalid SysProM document:\n${issues}`);
				}
				doc = result.data;
			} catch (error) {
				wrapError("Failed to load JSON document", error);
			}
			break;
		}
		case "single-md": {
			try {
				const content = readFileSync(path, "utf8");
				doc = markdownSingleToJson(content);
			} catch (error) {
				wrapError("Failed to load Markdown document", error);
			}
			break;
		}
		case "multi-md": {
			try {
				doc = markdownMultiDocToJson(path);
			} catch (error) {
				wrapError("Failed to load Markdown documents", error);
			}
			break;
		}
	}

	return { doc, format, path };
}

/**
 * Save a SysProM document to a file (JSON or Markdown).
 * @param doc - The SysProM document to save.
 * @param format - Output format: 'json', 'single-md', or 'multi-md'.
 * @param path - Destination file path or directory.
 * @example
 * ```ts
 * saveDocument(doc, "json", "output.spm.json");
 * saveDocument(doc, "multi-md", "./SysProM");
 * ```
 */
export function saveDocument(
	doc: SysProMDocument,
	format: Format,
	path: string,
): void {
	switch (format) {
		case "json":
			writeFileSync(path, canonicalise(doc, { indent: "\t" }) + "\n");
			break;
		case "single-md":
			writeFileSync(path, jsonToMarkdownSingle(doc));
			break;
		case "multi-md":
			jsonToMarkdownMultiDoc(doc, path);
			break;
	}
}
