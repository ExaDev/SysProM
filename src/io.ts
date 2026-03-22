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
 * Load a SysProM document from a file (JSON or Markdown).
 * @param input - File path or directory to load from.
 * @returns The loaded document with its detected format and resolved path.
 */
export function loadDocument(input: string): LoadedDocument {
	const path = resolve(input);
	const format = detectFormat(path);

	let doc: SysProMDocument;
	switch (format) {
		case "json": {
			const raw: unknown = JSON.parse(readFileSync(path, "utf8"));
			const result = SysProMDocument.safeParse(raw);
			if (!result.success) {
				throw new Error(
					`Invalid SysProM document:\n${result.error.issues.map((i) => `  ${i.path.join(".")}: ${i.message}`).join("\n")}`,
				);
			}
			doc = result.data;
			break;
		}
		case "single-md": {
			const content = readFileSync(path, "utf8");
			doc = markdownSingleToJson(content);
			break;
		}
		case "multi-md": {
			doc = markdownMultiDocToJson(path);
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
