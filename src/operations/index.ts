export {
	defineOperation,
	type OperationDef,
	type DefinedOperation,
} from "./define-operation.js";

// Mutation operations
export { addNodeOp } from "./add-node.js";
export { removeNodeOp, type RemoveResult } from "./remove-node.js";
export { updateNodeOp } from "./update-node.js";
export { addRelationshipOp } from "./add-relationship.js";
export { removeRelationshipOp } from "./remove-relationship.js";
export { updateMetadataOp } from "./update-metadata.js";
export { nextIdOp } from "./next-id.js";
export { initDocumentOp } from "./init-document.js";
export { addPlanTaskOp } from "./add-plan-task.js";
export { updatePlanTaskOp } from "./update-plan-task.js";
export { taskListOp } from "./task-list.js";
export { planInitOp } from "./plan-init.js";
export { planAddTaskOp } from "./plan-add-task.js";
export { planStatusOp, type PlanStatusResult } from "./plan-status.js";
export { planProgressOp, type PhaseProgressResult } from "./plan-progress.js";
export { planGateOp, type GateResultOutput } from "./plan-gate.js";

// Query operations
export { queryNodesOp } from "./query-nodes.js";
export { queryNodeOp, type NodeDetail } from "./query-node.js";
export { queryRelationshipsOp } from "./query-relationships.js";
export { traceFromNodeOp, type TraceNode } from "./trace-from-node.js";

// Temporal operations
export { timelineOp, type TimelineEvent } from "./timeline.js";
export { nodeHistoryOp } from "./node-history.js";
export { stateAtOp, type NodeState } from "./state-at.js";

// Inspection operations
export { validateOp, type ValidationResult } from "./validate.js";
export { statsOp, type DocumentStats } from "./stats.js";

// New API operations (previously CLI-only)
export { searchOp } from "./search.js";
export { checkOp } from "./check.js";
export { graphOp } from "./graph.js";
export { renameOp } from "./rename.js";
