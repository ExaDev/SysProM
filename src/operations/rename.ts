import * as z from "zod";
import { defineOperation } from "./define-operation.js";
import { SysProMDocument, Node } from "../schema.js";

function renameNodeReferences(node: unknown, oldId: string, newId: string): unknown {
  if (typeof node !== "object" || node === null) {
    return node;
  }

  const obj = node as Record<string, unknown>;
  const updated = { ...obj };

  // Rename the node itself
  if (updated.id === oldId) {
    updated.id = newId;
  }

  // Update scope references
  if (Array.isArray(updated.scope)) {
    updated.scope = updated.scope.map((s) => (s === oldId ? newId : s));
  }

  // Update includes references
  if (Array.isArray(updated.includes)) {
    updated.includes = updated.includes.map((i) => (i === oldId ? newId : i));
  }

  // Update selected (if it references a node)
  if (updated.selected === oldId) {
    updated.selected = newId;
  }

  // Update operations targets
  if (Array.isArray(updated.operations)) {
    updated.operations = updated.operations.map((op: unknown) => {
      if (typeof op !== "object" || op === null) return op;
      const operation = op as Record<string, unknown>;
      return {
        ...operation,
        target: operation.target === oldId ? newId : operation.target,
      };
    });
  }

  // Recurse into subsystems
  if (typeof updated.subsystem === "object" && updated.subsystem !== null) {
    updated.subsystem = renameNodeId(
      updated.subsystem as SysProMDocument,
      oldId,
      newId,
    );
  }

  return updated;
}

function renameNodeId(
  doc: SysProMDocument,
  oldId: string,
  newId: string,
): SysProMDocument {
  const nodes = doc.nodes.map((n) => renameNodeReferences(n, oldId, newId)) as SysProMDocument["nodes"];

  // Update relationships
  const relationships = (doc.relationships ?? []).map((r) => ({
    ...r,
    from: r.from === oldId ? newId : r.from,
    to: r.to === oldId ? newId : r.to,
  }));

  // Update external references
  const external_references = (doc.external_references ?? []).map((ref) => ({
    ...ref,
    node_id: ref.node_id === oldId ? newId : ref.node_id,
  }));

  return {
    ...doc,
    nodes,
    relationships: relationships.length > 0 ? relationships : undefined,
    external_references: external_references.length > 0 ? external_references : undefined,
  };
}

export const renameOp = defineOperation({
  name: "rename",
  description:
    "Rename a node ID across all references in the document. Updates the node's own ID, relationships, scope, includes, operations targets, external references, and recursively into subsystems.",
  input: z.object({
    doc: SysProMDocument,
    oldId: z.string().describe("Current node ID"),
    newId: z.string().describe("New node ID"),
  }),
  output: SysProMDocument,
  fn({ doc, oldId, newId }) {
    // Check old ID exists
    const node = doc.nodes.find((n: Node) => n.id === oldId);
    if (!node) {
      throw new Error(`Node not found: ${oldId}`);
    }

    // Check new ID doesn't already exist
    if (doc.nodes.some((n: Node) => n.id === newId)) {
      throw new Error(`Node already exists: ${newId}`);
    }

    return renameNodeId(doc, oldId, newId);
  },
});
