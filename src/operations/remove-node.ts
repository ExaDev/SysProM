import * as z from "zod";
import { defineOperation } from "./define-operation.js";
import { SysProMDocument } from "../schema.js";

/** Zod schema for the result of removing a node — the updated document plus any warnings. */
export const RemoveResult = z.object({
	doc: SysProMDocument,
	warnings: z.array(z.string()),
});

/** Result of removing a node: the updated document and any warnings about lingering references. */
export type RemoveResult = z.infer<typeof RemoveResult>;

/**
 * Remove a node and all relationships involving it. Also removes the node from
 * view includes and external references. Cleans up scope and operation references.
 * @throws {Error} If the node ID is not found.
 */
export const removeNodeOp = defineOperation({
	name: "removeNode",
	description:
		"Remove a node and all relationships involving it. Cleans up all references in scopes, operations, views, and external references.",
	input: z.object({
		doc: SysProMDocument,
		id: z.string(),
	}),
	output: RemoveResult,
	fn({ doc, id }) {
		const nodeIdx = doc.nodes.findIndex((n) => n.id === id);
		if (nodeIdx === -1) {
			throw new Error(`Node not found: ${id}`);
		}

		const warnings: string[] = [];

		// Remove the node
		const newNodes = doc.nodes.filter((n) => n.id !== id);

		// Clean up all references to the removed node
		const cleanedNodes = newNodes.map((n) => {
			let updated = n;

			// Remove from view includes
			if (n.includes?.includes(id)) {
				const newIncludes = n.includes.filter((i) => i !== id);
				updated = {
					...updated,
					includes: newIncludes.length > 0 ? newIncludes : undefined,
				};
			}

			// Remove from scope
			if (n.scope?.includes(id)) {
				const newScope = n.scope.filter((s) => s !== id);
				warnings.push(`${n.id} scope still references ${id}`);
				updated = {
					...updated,
					scope: newScope.length > 0 ? newScope : undefined,
				};
			}

			// Remove from operations
			const opsWithTarget = n.operations?.some((op) => op.target === id);
			if (opsWithTarget) {
				const newOps = n.operations?.filter((op) => op.target !== id);
				warnings.push(`${n.id} operations still reference ${id}`);
				updated = {
					...updated,
					operations: newOps && newOps.length > 0 ? newOps : undefined,
				};
			}

			return updated;
		});

		// Remove relationships involving this node
		const oldRelCount = (doc.relationships ?? []).length;
		const newRelationships = (doc.relationships ?? []).filter(
			(r) => r.from !== id && r.to !== id,
		);
		if (newRelationships.length < oldRelCount) {
			warnings.push(`Removed relationships involving ${id}`);
		}

		// Remove from external references
		const newExternalRefs = (doc.external_references ?? []).filter(
			(ref) => ref.node_id !== id,
		);

		return {
			doc: {
				...doc,
				nodes: cleanedNodes,
				relationships:
					newRelationships.length > 0 ? newRelationships : undefined,
				external_references:
					newExternalRefs.length > 0 ? newExternalRefs : undefined,
			},
			warnings,
		};
	},
});
