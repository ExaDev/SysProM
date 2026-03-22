/**
 * SysProM — System Provenance Model
 *
 * A recursive, decision-driven model for recording where every part of a
 * system came from, what decisions shaped it, and how it reached its current form.
 *
 * @packageDocumentation
 */

import type {
	SysProMDocument,
	Node,
	NodeType,
	Relationship,
	RelationshipType,
} from "./schema.js";
import type {
	ValidationResult,
	DocumentStats,
	NodeDetail,
	TraceNode,
	RemoveResult,
	TimelineEvent,
	NodeState,
} from "./operations/index.js";
import {
	validateOp,
	statsOp,
	queryNodesOp,
	queryNodeOp,
	queryRelationshipsOp,
	traceFromNodeOp,
	nextIdOp,
	addNodeOp,
	removeNodeOp,
	updateNodeOp,
	addRelationshipOp,
	removeRelationshipOp,
	updateMetadataOp,
	addPlanTaskOp,
	updatePlanTaskOp,
	timelineOp,
	nodeHistoryOp,
	stateAtOp,
} from "./operations/index.js";

// Schema types and validators (const and type share the same name)
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
	// Labels
	NODE_TYPE_LABELS,
	NODE_LABEL_TO_TYPE,
	RELATIONSHIP_TYPE_LABELS,
	RELATIONSHIP_LABEL_TO_TYPE,
	EXTERNAL_REFERENCE_ROLE_LABELS,
	EXTERNAL_REFERENCE_LABEL_TO_ROLE,
	NODE_STATUSES,
	NODE_FILE_MAP,
	NODE_ID_PREFIX,
	// Schema generator
	toJSONSchema,
} from "./schema.js";

// Converters: JSON to Markdown
export {
	jsonToMarkdownSingle,
	jsonToMarkdownMultiDoc,
	jsonToMarkdown,
	type ConvertOptions,
} from "./json-to-md.js";

// Converters: Markdown to JSON
export {
	markdownSingleToJson,
	markdownMultiDocToJson,
	markdownToJson,
} from "./md-to-json.js";

// Validation
export { validateOp, type ValidationResult } from "./operations/index.js";

// Stats
export { statsOp, type DocumentStats } from "./operations/index.js";

// Query
export {
	queryNodesOp,
	queryNodeOp,
	queryRelationshipsOp,
	traceFromNodeOp,
	type NodeDetail,
	type TraceNode,
} from "./operations/index.js";

// Mutation
export {
	nextIdOp,
	addNodeOp,
	removeNodeOp,
	updateNodeOp,
	addRelationshipOp,
	removeRelationshipOp,
	updateMetadataOp,
	addPlanTaskOp,
	updatePlanTaskOp,
	type RemoveResult,
} from "./operations/index.js";

// Convenience wrappers for backwards compatibility
export function validate(doc: SysProMDocument): ValidationResult {
	return validateOp({ doc });
}

export function stats(doc: SysProMDocument): DocumentStats {
	return statsOp({ doc });
}

export function queryNodes(
	doc: SysProMDocument,
	filters?: { type?: string; status?: string },
): Node[] {
	return queryNodesOp({ doc, type: filters?.type, status: filters?.status });
}

export function queryNode(
	doc: SysProMDocument,
	id: string,
): NodeDetail | undefined {
	return queryNodeOp({ doc, id }) ?? undefined;
}

export function queryRelationships(
	doc: SysProMDocument,
	filters?: { from?: string; to?: string; type?: string },
): Relationship[] {
	return queryRelationshipsOp({
		doc,
		from: filters?.from,
		to: filters?.to,
		type: filters?.type,
	});
}

export function traceFromNode(
	doc: SysProMDocument,
	startId: string,
): TraceNode {
	return traceFromNodeOp({ doc, startId });
}

export function nextId(doc: SysProMDocument, type: NodeType): string {
	return nextIdOp({ doc, type });
}

export function addNode(doc: SysProMDocument, node: Node): SysProMDocument {
	return addNodeOp({ doc, node });
}

export function removeNode(doc: SysProMDocument, id: string): RemoveResult {
	return removeNodeOp({ doc, id });
}

export function updateNode(
	doc: SysProMDocument,
	id: string,
	fields: Partial<Node>,
): SysProMDocument {
	return updateNodeOp({ doc, id, fields });
}

export function addRelationship(
	doc: SysProMDocument,
	rel: Relationship,
): SysProMDocument {
	return addRelationshipOp({ doc, rel });
}

export function removeRelationship(
	doc: SysProMDocument,
	from: string,
	type: RelationshipType,
	to: string,
): SysProMDocument {
	return removeRelationshipOp({ doc, from, type, to });
}

export function updateMetadata(
	doc: SysProMDocument,
	fields: Record<string, unknown>,
): SysProMDocument {
	return updateMetadataOp({ doc, fields });
}

export function addPlanTask(
	doc: SysProMDocument,
	changeId: string,
	description: string,
): SysProMDocument {
	return addPlanTaskOp({ doc, changeId, description });
}

export function updatePlanTask(
	doc: SysProMDocument,
	changeId: string,
	taskIndex: number,
	done: boolean,
): SysProMDocument {
	return updatePlanTaskOp({ doc, changeId, taskIndex, done });
}

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

// Temporal query
export {
	timelineOp,
	nodeHistoryOp,
	stateAtOp,
	type TimelineEvent,
	type NodeState,
} from "./operations/index.js";

// Convenience wrappers for temporal
export function timeline(doc: SysProMDocument): TimelineEvent[] {
	return timelineOp({ doc });
}

export function nodeHistory(
	doc: SysProMDocument,
	nodeId: string,
): TimelineEvent[] {
	return nodeHistoryOp({ doc, nodeId });
}

export function stateAt(doc: SysProMDocument, timestamp: string): NodeState[] {
	return stateAtOp({ doc, timestamp });
}

// Operations (single source of truth for domain logic + metadata)
export {
	defineOperation,
	type OperationDef,
	type DefinedOperation,
	searchOp,
	checkOp,
	graphOp,
	renameOp,
} from "./operations/index.js";
