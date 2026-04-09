import { readFileSync, statSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { markdownToJson } from "./md-to-json.js";
import { SysProMDocument } from "./schema.js";

/**
 * Result of detecting changes between JSON and Markdown representations.
 * @property jsonChanged True if JSON has changed since MD was created
 * @property mdChanged True if Markdown has changed since JSON was created
 * @property conflict True if both sides have diverged (both changed)
 */
export interface DetectionResult {
	jsonChanged: boolean;
	mdChanged: boolean;
	conflict: boolean;
}

/**
 * Compute a normalised hash of a document for comparison.
 * Uses canonical JSON representation.
 * @param doc - The SysProM document
 * @returns SHA256 hash of the canonicalised document
 * @example
 * ```ts
 * const hash = normaliseHash({ nodes: [], relationships: [] });
 * ```
 */
function normaliseHash(doc: unknown): string {
	const keys = doc && typeof doc === "object" ? Object.keys(doc).sort() : [];
	const sorted = JSON.stringify(doc, keys);
	return createHash("sha256").update(sorted).digest("hex");
}

/**
 * Detect whether JSON and/or Markdown have changed.
 * Strategy:
 * 1. Parse both JSON and Markdown to document objects.
 * 2. If documents are identical, no change.
 * 3. If documents differ, use file modification times to determine which was
 *    edited more recently. The newer file is considered the "changed" one.
 *    If modification times are very close (< 100ms), treat as conflict.
 * @param jsonPath - Path to JSON file
 * @param mdPath - Path to Markdown file (single or multi-doc)
 * @returns Detection result with jsonChanged, mdChanged, and conflict flags
 * @example
 * ```ts
 * const result = detectChanges("doc.spm.json", "doc.spm.md");
 * if (result.conflict) throw new Error("Both files changed");
 * ```
 */
export function detectChanges(
	jsonPath: string,
	mdPath: string,
): DetectionResult {
	// Read files
	const jsonContent = readFileSync(jsonPath, "utf8");

	// Parse JSON
	const jsonDoc: unknown = JSON.parse(jsonContent);
	if (!SysProMDocument.is(jsonDoc)) {
		throw new Error("JSON file is not a valid SysProM document");
	}

	// Parse Markdown to document (or treat as empty if it doesn't exist)
	const mdDoc = existsSync(mdPath)
		? markdownToJson(mdPath)
		: { nodes: [], relationships: [] };

	// Compare parsed documents
	const jsonHash = normaliseHash(jsonDoc);
	const mdHash = normaliseHash(mdDoc);

	// If both parse to identical documents, no changes on either side
	if (jsonHash === mdHash) {
		return {
			jsonChanged: false,
			mdChanged: false,
			conflict: false,
		};
	}

	// If markdown file doesn't exist, treat as if JSON changed (JSON is the source)
	if (!existsSync(mdPath)) {
		return {
			jsonChanged: true,
			mdChanged: false,
			conflict: false,
		};
	}

	// Parsed documents differ. Use file modification times to determine which changed.
	// The file that was modified more recently is the one that diverged.
	const jsonStats = statSync(jsonPath);
	const mdStats = statSync(mdPath);

	const timeDiff = Math.abs(jsonStats.mtimeMs - mdStats.mtimeMs);

	// If modification times are very close (within 100ms), treat as simultaneous edit (conflict)
	if (timeDiff < 100) {
		return {
			jsonChanged: true,
			mdChanged: true,
			conflict: true,
		};
	}

	// Otherwise, determine which file is newer
	if (jsonStats.mtimeMs > mdStats.mtimeMs) {
		// JSON is newer → JSON was modified after MD
		return {
			jsonChanged: true,
			mdChanged: false,
			conflict: false,
		};
	} else {
		// MD is newer → MD was modified after JSON
		return {
			jsonChanged: false,
			mdChanged: true,
			conflict: false,
		};
	}
}
