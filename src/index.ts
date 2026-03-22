/**
 * SysProM — System Provenance Model
 *
 * A recursive, decision-driven model for recording where every part of a
 * system came from, what decisions shaped it, and how it reached its current form.
 *
 * @packageDocumentation
 */

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
export { validate, type ValidationResult } from "./validate.js";

// Stats
export { stats, type DocumentStats } from "./stats.js";

// Query
export {
  queryNodes,
  queryNode,
  queryRelationships,
  traceFromNode,
  type NodeFilters,
  type RelationshipFilters,
  type NodeDetail,
  type TraceNode,
} from "./query.js";

// Mutation
export {
  nextId,
  addNode,
  removeNode,
  updateNode,
  addRelationship,
  removeRelationship,
  updateMetadata,
  type RemoveResult,
} from "./mutate.js";

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
  timeline,
  nodeHistory,
  stateAt,
  type TimelineEvent,
  type NodeState,
} from "./temporal.js";
