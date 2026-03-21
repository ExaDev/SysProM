import type {
  SysProMDocument,
  Node,
  Relationship,
  RelationshipType,
  Task,
} from "./schema.js";

export interface RemoveResult {
  doc: SysProMDocument;
  warnings: string[];
}

/**
 * Add a node to the document. Returns a new document.
 * Throws if a node with the same ID already exists.
 *
 * @param doc - The SysProM document to modify.
 * @param node - The node to add.
 * @returns A new document containing the added node.
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
 *
 * @param doc - The SysProM document to modify.
 * @param id - The ID of the node to remove.
 * @returns The updated document and any warnings about remaining references.
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
      return {
        ...n,
        includes: newIncludes.length > 0 ? newIncludes : undefined,
      };
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
 *
 * @param doc - The SysProM document to modify.
 * @param id - The ID of the node to update.
 * @param fields - Partial node fields to merge onto the existing node.
 * @returns A new document with the updated node.
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
 *
 * @param doc - The SysProM document to modify.
 * @param rel - The relationship to add.
 * @returns A new document containing the added relationship.
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
 *
 * @param doc - The SysProM document to modify.
 * @param from - Source node ID.
 * @param type - Relationship type.
 * @param to - Target node ID.
 * @returns A new document without the matching relationship.
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
 *
 * @param doc - The SysProM document to modify.
 * @param fields - Metadata fields to merge.
 * @returns A new document with updated metadata.
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

/**
 * Append a new task to a change node's plan array. Returns a new document.
 * Throws if the node is not found.
 *
 * @param doc - The SysProM document to modify.
 * @param changeId - ID of the change node.
 * @param description - Task description text.
 * @returns A new document with the task appended to the change node's plan.
 */
export function addPlanTask(
  doc: SysProMDocument,
  changeId: string,
  description: string,
): SysProMDocument {
  const node = doc.nodes.find((n) => n.id === changeId);
  if (!node) {
    throw new Error(`Node not found: ${changeId}`);
  }
  const newTask: Task = { description, done: false };
  return updateNode(doc, changeId, { plan: [...(node.plan ?? []), newTask] });
}

/**
 * Set the done status of a task in a change node's plan array. Returns a new document.
 * Throws if the node is not found or the task index is out of range.
 *
 * @param doc - The SysProM document to modify.
 * @param changeId - ID of the change node.
 * @param taskIndex - Zero-based index of the task in the plan.
 * @param done - Whether the task is complete.
 * @returns A new document with the updated task status.
 */
export function updatePlanTask(
  doc: SysProMDocument,
  changeId: string,
  taskIndex: number,
  done: boolean,
): SysProMDocument {
  const node = doc.nodes.find((n) => n.id === changeId);
  if (!node) {
    throw new Error(`Node not found: ${changeId}`);
  }
  const plan = node.plan ?? [];
  if (taskIndex < 0 || taskIndex >= plan.length) {
    throw new Error(
      `Task index ${taskIndex} out of range (plan has ${plan.length} task(s))`,
    );
  }
  const newPlan = [...plan];
  newPlan[taskIndex] = { ...newPlan[taskIndex], done };
  return updateNode(doc, changeId, { plan: newPlan });
}
