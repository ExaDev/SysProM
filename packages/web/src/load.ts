import {
	SysProMDocument,
	markdownSingleToJson,
	parseMultiDoc,
	validateOp,
	type ValidationResult,
	type SysProMDocument as SysProMDocumentType,
} from "@sysprom/core";

export interface LoadResult {
	doc: SysProMDocumentType;
	validation: ValidationResult;
	source: string;
}

/** Parse and validate a single `.SysProM.json` file. */
export function loadJsonFile(content: string, filename: string): LoadResult {
	const raw: unknown = JSON.parse(content);
	const doc = SysProMDocument.parse(raw);
	return finalise(doc, filename);
}

/** Parse and validate a single `.SysProM.md` file. */
export function loadMarkdownFile(
	content: string,
	filename: string,
): LoadResult {
	const doc = markdownSingleToJson(content);
	return finalise(doc, filename);
}

/** Parse and validate multiple `.SysProM.md` files (keyed by filename). */
export function loadMultiDoc(
	files: Record<string, string>,
	label: string,
): LoadResult {
	const doc = parseMultiDoc(files);
	return finalise(doc, label);
}

function finalise(doc: SysProMDocumentType, source: string): LoadResult {
	const validation = validateOp({ doc });
	return { doc, validation, source };
}

/**
 * Read a File object in the browser. Returns its text content.
 * Uses the File.text() method available in all modern browsers.
 */
export function readFileText(file: File): Promise<string> {
	return file.text();
}
