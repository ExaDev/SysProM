import { loadDocument, saveDocument } from "../io.js";
import type { SysProMDocument } from "../schema.js";

export function run(args: string[]): void {
  if (args.length < 3) {
    console.error("Usage: sysprom rename <input> <old-id> <new-id>");
    process.exit(1);
  }

  try {
    const { doc, format, path } = loadDocument(args[0]);
    const oldId = args[1];
    const newId = args[2];

    // Check old ID exists
    const node = doc.nodes.find((n) => n.id === oldId);
    if (!node) {
      console.error(`Node not found: ${oldId}`);
      process.exit(1);
    }

    // Check new ID doesn't already exist
    if (doc.nodes.some((n) => n.id === newId)) {
      console.error(`Node already exists: ${newId}`);
      process.exit(1);
    }

    const updated = renameNodeId(doc, oldId, newId);
    saveDocument(updated, format, path);
    console.log(`Renamed ${oldId} → ${newId}`);
  } catch (err: unknown) {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
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
    updated.subsystem = renameNodeId(updated.subsystem as SysProMDocument, oldId, newId);
  }

  return updated;
}
