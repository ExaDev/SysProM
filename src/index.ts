/**
 * SysProM — System Provenance Model
 *
 * A recursive, decision-driven model for recording where every part of a
 * system came from, what decisions shaped it, and how it reached its current form.
 *
 * The pure, browser-safe library logic lives in `@sysprom/core` and is
 * re-exported here. This root `sysprom` package additionally provides the
 * Node-bound pieces: filesystem I/O (`loadDocument`/`saveDocument`), the
 * multi-doc conversion wrappers that read/write directories, document sync,
 * and Spec-Kit interoperability (which reads/writes spec files).
 * @packageDocumentation
 */

// Re-export the entire pure core so `import { ... } from "sysprom"` keeps
// working unchanged for every symbol provided today.
export * from "@sysprom/core";

// Conversion — fs wrappers (the pure renderMultiDoc/parseMultiDoc live in core)
export { jsonToMarkdownMultiDoc, jsonToMarkdown } from "./json-to-md.js";

export { markdownMultiDocToJson, markdownToJson } from "./md-to-json.js";

// Synchronisation (fs-backed)
export {
	syncDocumentsOp,
	type BidirectionalSyncResult,
	type ConflictStrategy,
} from "./operations/sync.js";
export { detectChanges, type DetectionResult } from "./sync.js";

// Spec-Kit interoperability operations (fs-backed)
export { speckitImportOp } from "./operations/speckit-import.js";
export { speckitExportOp } from "./operations/speckit-export.js";
export { speckitSyncOp, type SyncResult } from "./operations/speckit-sync.js";
export { speckitDiffOp, type DiffResult } from "./operations/speckit-diff.js";

// IO
export {
	loadDocument,
	saveDocument,
	type Format,
	type LoadedDocument,
} from "./io.js";

// Spec-Kit interoperability
export {
	detectSpecKitProject,
	listFeatures,
	getFeature,
	resolveConstitution,
	type SpecKitProject,
	type SpecKitFeature,
	parseConstitution,
	parseSpec,
	parsePlan,
	parseTasks,
	parseChecklist,
	parseSpecKitFeature,
	generateConstitution,
	generateSpec,
	generatePlan,
	generateTasks,
	generateChecklist,
	generateSpecKitProject,
	type ParseResult,
} from "./speckit/index.js";
