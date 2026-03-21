import type {
  SysProMDocument,
  Node,
  Relationship,
  RelationshipType,
} from "./schema.js";

export interface RemoveResult {
  doc: SysProMDocument;
  warnings: string[];
}

/**
 * Add a node to the document. Returns a new document.
 * Throws if a node with the same ID already exists.
 */
export function addNode(doc: SysProMDocument, node: Node): SysProMDocument {
  if (doc.nodes.some((n) => n.id === node.id)) {
    throw new Error(`Node with ID '${node.id}' already exists.`);
  }
  return {
    ...doc,
    nodes: [...doc.nodes, node],
  };
}

/**
 * Remove a node and all relationships involving it. Returns a new document and warnings.
 * Also removes the node from view includes and external references.
 */
export function removeNode(doc: SysProMDocument, id: string): RemoveResult {
  const nodeIdx = doc.nodes.findIndex((n) => n.id === id);
  if (nodeIdx === -1) {
    throw new Error(`Node not found: ${id}`);
  }

  const warnings: string[] = [];

  // Remove the node
  const newNodes = doc.nodes.filter((n) => n.id !== id);

  // Update view includes
  const nodesWithIncludes = newNodes.map((n) => {
    if (n.includes?.includes(id)) {
      const newIncludes = n.includes.filter((i) => i !== id);
      return { ...n, includes: newIncludes.length > 0 ? newIncludes : undefined };
    }
    return n;
  });

  // Remove relationships involving this node
  const newRelationships = (doc.relationships ?? []).filter(
    (r) => r.from !== id && r.to !== id,
  );

  // Check for scope and operation references
  for (const n of nodesWithIncludes) {
    if (n.scope?.includes(id)) {
      warnings.push(`${n.id} scope still references ${id}`);
    }
    if (n.operations?.some((op) => op.target === id)) {
      warnings.push(`${n.id} operations still reference ${id}`);
    }
  }

  // Remove from external references
  const newExternalRefs = (doc.external_references ?? []).filter(
    (ref) => ref.node_id !== id,
  );

  return {
    doc: {
      ...doc,
      nodes: nodesWithIncludes,
      relationships: newRelationships.length > 0 ? newRelationships : undefined,
      external_references:
        newExternalRefs.length > 0 ? newExternalRefs : undefined,
    },
    warnings,
  };
}

/**
 * Update specified fields on a node. Returns a new document.
 * Throws if the node is not found.
 */
export function updateNode(
  doc: SysProMDocument,
  id: string,
  fields: Partial<Node>,
): SysProMDocument {
  const nodeIdx = doc.nodes.findIndex((n) => n.id === id);
  if (nodeIdx === -1) {
    throw new Error(`Node not found: ${id}`);
  }

  const oldNode = doc.nodes[nodeIdx];
  const newNode = { ...oldNode, ...fields };

  const newNodes = [...doc.nodes];
  newNodes[nodeIdx] = newNode;

  return { ...doc, nodes: newNodes };
}

/**
 * Add a relationship to the document. Returns a new document.
 * Throws if either endpoint node does not exist.
 */
export function addRelationship(
  doc: SysProMDocument,
  rel: Relationship,
): SysProMDocument {
  const ids = new Set(doc.nodes.map((n) => n.id));
  if (!ids.has(rel.from)) {
    throw new Error(`Node not found: ${rel.from}`);
  }
  if (!ids.has(rel.to)) {
    throw new Error(`Node not found: ${rel.to}`);
  }

  return {
    ...doc,
    relationships: [...(doc.relationships ?? []), rel],
  };
}

/**
 * Remove a relationship matching from, type, and to. Returns a new document.
 * Throws if the relationship is not found.
 */
export function removeRelationship(
  doc: SysProMDocument,
  from: string,
  type: RelationshipType,
  to: string,
): SysProMDocument {
  const rels = doc.relationships ?? [];
  const idx = rels.findIndex(
    (r) => r.from === from && r.type === type && r.to === to,
  );
  if (idx === -1) {
    throw new Error(`Relationship not found: ${from} ${type} ${to}`);
  }

  const newRelationships = rels.filter(
    (r) => !(r.from === from && r.type === type && r.to === to),
  );

  return {
    ...doc,
    relationships: newRelationships.length > 0 ? newRelationships : undefined,
  };
}

/**
 * Update metadata fields. Returns a new document.
 */
export function updateMetadata(
  doc: SysProMDocument,
  fields: Record<string, unknown>,
): SysProMDocument {
  return {
    ...doc,
    metadata: { ...doc.metadata, ...fields },
  };
}
