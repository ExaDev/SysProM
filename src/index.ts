/**
 * SysProM — System Provenance Model
 *
 * A recursive, decision-driven model for recording where every part of a
 * system came from, what decisions shaped it, and how it reached its current form.
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
	Text,
	Option,
	Operation,
	Task,
	ExternalReference,
	ExternalReferenceRole,
	Metadata,
	NODE_TYPE_LABELS,
	NODE_LABEL_TO_TYPE,
	RELATIONSHIP_TYPE_LABELS,
	RELATIONSHIP_LABEL_TO_TYPE,
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
	addPlanTaskOp,
	updatePlanTaskOp,
	markTaskDoneOp,
	markTaskUndoneOp,
	taskListOp,
	planInitOp,
	planAddTaskOp,
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
	speckitImportOp,
	speckitExportOp,
	speckitSyncOp,
	speckitDiffOp,
	inferCompletenessOp,
	inferLifecycleOp,
	inferImpactOp,
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
	type SyncResult,
	type DiffResult,
	type CompletenessOutput,
	type LifecycleOutput,
	type ImpactOutput,
	type DerivedOutput,
} from "./operations/index.js";

// Conversion
export {
	jsonToMarkdownSingle,
	jsonToMarkdownMultiDoc,
	jsonToMarkdown,
	type ConvertOptions,
} from "./json-to-md.js";

export {
	markdownSingleToJson,
	markdownMultiDocToJson,
	markdownToJson,
} from "./md-to-json.js";

// Validation
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
