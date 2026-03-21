import type { SysProMDocument } from "./schema.js";

export interface DocumentStats {
  title: string;
  nodesByType: Record<string, number>;
  relationshipsByType: Record<string, number>;
  totalNodes: number;
  totalRelationships: number;
  subsystemCount: number;
  maxSubsystemDepth: number;
  viewCount: number;
  externalReferenceCount: number;
  decisionLifecycle: Record<string, number>;
  changeLifecycle: Record<string, number>;
}

/**
 * Computes statistics about a SysProM document.
 */
export function stats(doc: SysProMDocument): DocumentStats {
  // Node counts by type
  const nodesByType: Record<string, number> = {};
  for (const n of doc.nodes) {
    nodesByType[n.type] = (nodesByType[n.type] ?? 0) + 1;
  }

  // Relationship counts by type
  const relationshipsByType: Record<string, number> = {};
  for (const r of doc.relationships ?? []) {
    relationshipsByType[r.type] = (relationshipsByType[r.type] ?? 0) + 1;
  }

  // Subsystem stats
  let subsystemCount = 0;
  let maxDepth = 0;
  function countSubsystems(nodes: typeof doc.nodes, depth: number): void {
    for (const n of nodes) {
      if (n.subsystem) {
        subsystemCount++;
        if (depth + 1 > maxDepth) maxDepth = depth + 1;
        countSubsystems(n.subsystem.nodes, depth + 1);
      }
    }
  }
  countSubsystems(doc.nodes, 0);

  // Lifecycle status for decisions and changes
  const decisionLifecycle: Record<string, number> = {};
  const changeLifecycle: Record<string, number> = {};
  for (const n of doc.nodes) {
    if (n.lifecycle) {
      const statusMap =
        n.type === "decision"
          ? decisionLifecycle
          : n.type === "change"
            ? changeLifecycle
            : null;
      if (statusMap) {
        for (const [state, done] of Object.entries(n.lifecycle)) {
          if (done) {
            statusMap[state] = (statusMap[state] ?? 0) + 1;
          }
        }
      }
    }
  }

  // View count
  const viewCount = doc.nodes.filter((n) => n.type === "view").length;
  const externalReferenceCount = (doc.external_references ?? []).length;

  return {
    title: (doc.metadata?.title as string) ?? "(untitled)",
    nodesByType,
    relationshipsByType,
    totalNodes: doc.nodes.length,
    totalRelationships: (doc.relationships ?? []).length,
    subsystemCount,
    maxSubsystemDepth: maxDepth,
    viewCount,
    externalReferenceCount,
    decisionLifecycle,
    changeLifecycle,
  };
}
