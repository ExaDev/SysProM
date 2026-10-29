/**
 * Operations barrel. The pure operations live in `@sysprom/core` and are
 * re-exported here so existing callers (CLI, MCP) keep resolving. The
 * fs-backed operations (sync, Spec-Kit) remain in this directory.
 */
export * from "@sysprom/core/operations/index.js";

// Synchronisation operations
export {
	syncDocumentsOp,
	type BidirectionalSyncResult,
	type ConflictStrategy,
} from "./sync.js";

// Spec-Kit interoperability operations
export { speckitImportOp } from "./speckit-import.js";
export { speckitExportOp } from "./speckit-export.js";
export { speckitSyncOp, type SyncResult } from "./speckit-sync.js";
export { speckitDiffOp, type DiffResult } from "./speckit-diff.js";
