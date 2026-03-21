import type { SysProMDocument, Node, Relationship } from "./schema.js";

export interface NodeFilters {
  type?: string;
  status?: string;
}

export interface RelationshipFilters {
  from?: string;
  to?: string;
  type?: string;
}

export interface NodeDetail {
  node: Node;
  outgoing: Relationship[];
  incoming: Relationship[];
}

export interface TraceNode {
  id: string;
  node: Node | undefined;
  children: TraceNode[];
}

const TRACE_TYPES = new Set(["refines", "realises", "implements"]);

/**
 * Query nodes with optional filters.
 *
 * @param doc - The SysProM document to query.
 * @param filters - Optional filters for node type and status.
 * @returns Matching nodes.
 */
export function queryNodes(
  doc: SysProMDocument,
  filters?: NodeFilters,
): Node[] {
  let nodes = doc.nodes;
  if (filters?.type) {
    nodes = nodes.filter((n) => n.type === filters.type);
  }
  if (filters?.status) {
    nodes = nodes.filter((n) => n.status === filters.status);
  }
  return nodes;
}

/**
 * Query a single node by ID with its relationships.
 *
 * @param doc - The SysProM document to query.
 * @param id - The node ID to look up.
 * @returns The node with its incoming and outgoing relationships, or undefined.
 */
export function queryNode(doc: SysProMDocument, id: string): NodeDetail | undefined {
  const node = doc.nodes.find((n) => n.id === id);
  if (!node) return undefined;

  const outgoing = (doc.relationships ?? []).filter((r) => r.from === id);
  const incoming = (doc.relationships ?? []).filter((r) => r.to === id);

  return { node, outgoing, incoming };
}

/**
 * Query relationships with optional filters.
 *
 * @param doc - The SysProM document to query.
 * @param filters - Optional filters for from, to, and type.
 * @returns Matching relationships.
 */
export function queryRelationships(
  doc: SysProMDocument,
  filters?: RelationshipFilters,
): Relationship[] {
  let rels = doc.relationships ?? [];
  if (filters?.type) {
    rels = rels.filter((r) => r.type === filters.type);
  }
  if (filters?.from) {
    rels = rels.filter((r) => r.from === filters.from);
  }
  if (filters?.to) {
    rels = rels.filter((r) => r.to === filters.to);
  }
  return rels;
}

/**
 * Trace refinement chain from a node (follows refines, realises, implements).
 * Returns a tree structure where children are nodes that refine/realise/implement the parent.
 *
 * @param doc - The SysProM document to trace through.
 * @param startId - The root node ID to start tracing from.
 * @returns A tree of traced nodes.
 */
export function traceFromNode(doc: SysProMDocument, startId: string): TraceNode {
  const visited = new Set<string>();

  function trace(id: string): TraceNode {
    if (visited.has(id)) {
      return { id, node: undefined, children: [] };
    }
    visited.add(id);

    const node = doc.nodes.find((n) => n.id === id);

    const children = (doc.relationships ?? [])
      .filter((r) => r.to === id && TRACE_TYPES.has(r.type))
      .map((r) => trace(r.from));

    return { id, node, children };
  }

  return trace(startId);
}
