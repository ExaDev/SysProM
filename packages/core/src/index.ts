/**
 * `@sysprom/core` — browser-safe SysProM library logic.
 *
 * Contains the pure (no Node filesystem) subset of SysProM: schema types and
 * validators, domain operations, JSON ↔ Markdown conversion (pure helpers
 * only), and utilities. The root `sysprom` package re-exports everything here
 * and adds the fs-backed wrappers (loadDocument/saveDocument, multi-doc file
 * I/O, sync, Spec-Kit interoperability).
 *
 * This package must not import any `node:*` built-in. Downstream bundlers
 * (Vite, esbuild, webpack) can include it with zero Node polyfills.
 * @packageDocumentation
 */

// Schema types and validators
export {
	SysProMDocument,
	Node,
	Relationship,
	NodeType,
	NodeStatus,
	RelationshipType,
	ImpactPolarity,
	Text,
	Option,
	Operation,
	ExternalReference,
	ExternalReferenceRole,
	Metadata,
	NODE_TYPE_LABELS,
	NODE_LABEL_TO_TYPE,
	RELATIONSHIP_TYPE_LABELS,
	RELATIONSHIP_LABEL_TO_TYPE,
	IMPACT_POLARITY_LABELS,
	EXTERNAL_REFERENCE_ROLE_LABELS,
	EXTERNAL_REFERENCE_LABEL_TO_ROLE,
	NODE_STATUSES,
	NODE_FILE_MAP,
	NODE_ID_PREFIX,
	toJSONSchema,
} from "./schema.js";

// Operations (single source of truth for domain logic + metadata)
export {
	defineOperation,
	type OperationDef,
	type DefinedOperation,
	addNodeOp,
	removeNodeOp,
	updateNodeOp,
	addRelationshipOp,
	removeRelationshipOp,
	updateMetadataOp,
	nextIdOp,
	initDocumentOp,
	planInitOp,
	planAddTaskOp,
	planStartTaskOp,
	planCompleteTaskOp,
	planReopenTaskOp,
	planStatusOp,
	planProgressOp,
	planGateOp,
	queryNodesOp,
	queryNodeOp,
	queryRelationshipsOp,
	traceFromNodeOp,
	timelineOp,
	nodeHistoryOp,
	stateAtOp,
	validateOp,
	statsOp,
	searchOp,
	checkOp,
	graphOp,
	renameOp,
	jsonToMarkdownOp,
	markdownToJsonOp,
	inferCompletenessOp,
	inferLifecycleOp,
	inferImpactOp,
	impactSummaryOp,
	inferDerivedOp,
	type RemoveResult,
	type ValidationResult,
	type DocumentStats,
	type NodeDetail,
	type TraceNode,
	type TimelineEvent,
	type NodeState,
	type PlanStatusResult,
	type PhaseProgressResult,
	type GateResultOutput,
	type CompletenessOutput,
	type LifecycleOutput,
	type ImpactOutput,
	type ImpactSummaryOutput,
	type DerivedOutput,
} from "./operations/index.js";

// Conversion (pure — fs wrappers live in the root `sysprom` package)
export {
	jsonToMarkdownSingle,
	renderMultiDoc,
	type ConvertOptions,
} from "./json-to-md.js";

export { markdownSingleToJson, parseMultiDoc } from "./md-to-json.js";

// Endpoint types
export {
	RELATIONSHIP_ENDPOINT_TYPES,
	isValidEndpointPair,
} from "./endpoint-types.js";

// Utilities
export { canonicalise, type FormatOptions } from "./canonical-json.js";
export {
	textToString,
	textToLines,
	textToMarkdown,
	markdownToText,
} from "./text.js";
export { hasLifecycleState, primaryLifecycleState } from "./lifecycle-state.js";
