import {
  NodeType,
  NodeStatus,
  RelationshipType,
  ExternalReferenceRole,
  type SysProMDocument,
} from "./schema.js";

export interface ValidationResult {
  valid: boolean;
  issues: string[];
  nodeCount: number;
  relationshipCount: number;
}

const DOMAIN_TYPES = new Set([
  "intent",
  "concept",
  "capability",
  "element",
  "invariant",
]);

/**
 * Validates a SysProM document for structural and semantic correctness.
 *
 * Checks:
 * - Unique node IDs
 * - Valid node types and statuses
 * - Valid relationship types and references
 * - Valid external reference roles
 * - INV2: Changes must reference at least one decision
 * - INV3: Decisions affecting domain nodes must have must_preserve
 * - INV13: Decisions must have options and selected
 *
 * @param doc - The SysProM document to validate.
 * @returns Validation result with issues, node count, and relationship count.
 */
export function validate(doc: SysProMDocument): ValidationResult {
  const issues: string[] = [];

  // Unique node IDs
  const ids = new Set<string>();
  for (const n of doc.nodes) {
    if (ids.has(n.id)) {
      issues.push(`Duplicate node ID: ${n.id}`);
    }
    ids.add(n.id);
  }

  // Valid node types and statuses
  for (const n of doc.nodes) {
    if (!NodeType.is(n.type)) {
      issues.push(`${n.id}: unknown node type '${n.type}'`);
    }
    if (n.status && !NodeStatus.is(n.status)) {
      issues.push(`${n.id}: unknown status '${n.status}'`);
    }
  }

  // Valid relationship types and references
  for (const r of doc.relationships ?? []) {
    if (!RelationshipType.is(r.type)) {
      issues.push(
        `Relationship ${r.from} → ${r.to}: unknown type '${r.type}'`,
      );
    }
    if (!ids.has(r.from)) {
      issues.push(`Relationship references unknown source: ${r.from}`);
    }
    if (!ids.has(r.to)) {
      issues.push(`Relationship references unknown target: ${r.to}`);
    }
  }

  // Valid external reference roles
  for (const ref of doc.external_references ?? []) {
    if (!ExternalReferenceRole.is(ref.role)) {
      issues.push(`External reference: unknown role '${ref.role}'`);
    }
  }

  // INV2: Changes must reference at least one decision
  const decisionIds = new Set(
    doc.nodes.filter((n) => n.type === "decision").map((n) => n.id),
  );
  for (const n of doc.nodes.filter((n) => n.type === "change")) {
    const targets = (doc.relationships ?? [])
      .filter((r) => r.from === n.id)
      .map((r) => r.to);
    const linksToDecision = targets.some((t) => decisionIds.has(t));
    if (!linksToDecision) {
      issues.push(
        `${n.id} (${n.name}): change does not reference any decision`,
      );
    }
  }

  // INV3: Decisions affecting domain nodes must have must_preserve
  const nodeTypes = new Map(doc.nodes.map((n) => [n.id, n.type]));
  for (const n of doc.nodes.filter((n) => n.type === "decision")) {
    const affects = (doc.relationships ?? []).filter(
      (r) => r.from === n.id && r.type === "affects",
    );
    const affectsDomain = affects.some((r) =>
      DOMAIN_TYPES.has(nodeTypes.get(r.to) ?? ""),
    );
    if (!affectsDomain) continue;

    const preserves = (doc.relationships ?? []).filter(
      (r) => r.from === n.id && r.type === "must_preserve",
    );
    if (preserves.length === 0) {
      issues.push(
        `${n.id} (${n.name}): affects domain nodes but has no must_preserve relationship`,
      );
    }
  }

  // INV13: Decisions must have options and selected
  for (const n of doc.nodes.filter((n) => n.type === "decision")) {
    if (!n.options || n.options.length === 0) {
      issues.push(`${n.id} (${n.name}): decision has no options`);
    }
    if (!n.selected) {
      issues.push(`${n.id} (${n.name}): decision has no selected option`);
    }
  }

  return {
    valid: issues.length === 0,
    issues,
    nodeCount: doc.nodes.length,
    relationshipCount: (doc.relationships ?? []).length,
  };
}
