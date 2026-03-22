import * as z from "zod";
import { defineOperation } from "./define-operation.js";
import { SysProMDocument, Node } from "../schema.js";

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function isNode(value: unknown): value is Node {
	return (
		isRecord(value) &&
		"id" in value &&
		typeof value.id === "string" &&
		"type" in value &&
		typeof value.type === "string"
	);
}

function isSysProMDocument(value: unknown): value is SysProMDocument {
	return (
		isRecord(value) &&
		"nodes" in value &&
		Array.isArray(value.nodes) &&
		"metadata" in value &&
		isRecord(value.metadata)
	);
}

function renameNodeReferences(
	node: unknown,
	oldId: string,
	newId: string,
): unknown {
	if (!isRecord(node)) {
		return node;
	}

	const updated: Record<string, unknown> = { ...node };

	// Rename the node itself
	if (updated.id === oldId) {
		updated.id = newId;
	}

	// Update scope references
	if (Array.isArray(updated.scope)) {
		updated.scope = updated.scope.map((s): unknown => {
			return typeof s === "string" && s === oldId ? newId : s;
		});
	}

	// Update includes references
	if (Array.isArray(updated.includes)) {
		updated.includes = updated.includes.map((i): unknown => {
			return typeof i === "string" && i === oldId ? newId : i;
		});
	}

	// Update selected (if it references a node)
	if (updated.selected === oldId) {
		updated.selected = newId;
	}

	// Update operations targets
	if (Array.isArray(updated.operations)) {
		updated.operations = updated.operations.map((op): unknown => {
			if (!isRecord(op)) return op;
			if ("target" in op) {
				return {
					...op,
					target: op.target === oldId ? newId : op.target,
				};
			}
			return op;
		});
	}

	// Recurse into subsystems
	if (isSysProMDocument(updated.subsystem)) {
		updated.subsystem = renameNodeId(updated.subsystem, oldId, newId);
	}

	return updated;
}

function renameNodeId(
	doc: SysProMDocument,
	oldId: string,
	newId: string,
): SysProMDocument {
	const updatedNodes: Node[] = [];
	for (const node of doc.nodes) {
		const updated = renameNodeReferences(node, oldId, newId);
		if (isNode(updated)) {
			updatedNodes.push(updated);
		}
	}

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
		nodes: updatedNodes,
		relationships: relationships.length > 0 ? relationships : undefined,
		external_references:
			external_references.length > 0 ? external_references : undefined,
	};
}

/**
 * Rename a node ID across all references in the document — the node itself,
 * relationships, scope, includes, operation targets, external references, and
 * recursively into subsystems.
 * @throws {Error} If the old ID is not found or the new ID already exists.
 */
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
