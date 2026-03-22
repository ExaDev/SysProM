import * as z from "zod";
import { defineOperation } from "./define-operation.js";
import { SysProMDocument, type Node } from "../schema.js";

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
		hard: z.boolean().optional(),
		recursive: z.boolean().optional(),
		repair: z.boolean().optional(),
	}),
	output: RemoveResult,
	fn({ doc, id, hard, recursive, repair }) {
		const nodeIdx = doc.nodes.findIndex((n) => n.id === id);
		if (nodeIdx === -1) {
			throw new Error(`Node not found: ${id}`);
		}

		const nodeToRemove = doc.nodes[nodeIdx];
		const warnings: string[] = [];

		// Check recursive guard for hard delete
		if (hard && nodeToRemove.subsystem) {
			if (!recursive) {
				throw new Error(
					`Cannot hard delete node ${id} with subsystem without --recursive flag`,
				);
			}
		}

		let newNodes: typeof doc.nodes;
		let newRelationships = doc.relationships ?? [];

		if (hard) {
			// Hard delete: physically remove the node
			newNodes = doc.nodes.filter((n) => n.id !== id);

			// Handle must_follow chain repair if requested
			if (repair) {
				const incomingChains = newRelationships.filter(
					(r) => r.to === id && r.type === "must_follow",
				);
				const outgoingChains = newRelationships.filter(
					(r) => r.from === id && r.type === "must_follow",
				);

				// Remove all relationships involving the deleted node
				newRelationships = newRelationships.filter(
					(r) => r.from !== id && r.to !== id,
				);

				// Repair chains by connecting incoming to outgoing
				// Only repair if there are both incoming AND outgoing chains
				if (incomingChains.length > 0 && outgoingChains.length > 0) {
					for (const incoming of incomingChains) {
						for (const outgoing of outgoingChains) {
							// Only add if not already connected
							const exists = newRelationships.some(
								(r) =>
									r.from === incoming.from &&
									r.to === outgoing.to &&
									r.type === "must_follow",
							);
							if (!exists) {
								newRelationships.push({
									from: incoming.from,
									to: outgoing.to,
									type: "must_follow",
								});
								warnings.push(
									`Repaired chain: ${incoming.from} → ${outgoing.to}`,
								);
							}
						}
					}
				}
			} else {
				// Without repair, just remove all relationships
				const oldRelCount = newRelationships.length;
				newRelationships = newRelationships.filter(
					(r) => r.from !== id && r.to !== id,
				);
				if (newRelationships.length < oldRelCount) {
					warnings.push(`Removed relationships involving ${id}`);
				}
			}
		} else {
			// Soft delete: mark as retired and preserve relationships
			newNodes = doc.nodes.map((n) =>
				n.id === id ? { ...n, status: "retired" as const } : n,
			);

			// Don't remove relationships in soft delete
		}

		// Clean up all references to the removed node (both soft and hard)
		const cleanedNodes = newNodes.map((n) => {
			const updates: Partial<Pick<Node, "includes" | "scope" | "operations">> =
				{};

			// Remove from view includes
			if (n.includes?.includes(id)) {
				const newIncludes = n.includes.filter((i) => i !== id);
				updates.includes = newIncludes.length > 0 ? newIncludes : undefined;
			}

			// Remove from scope
			if (n.scope?.includes(id)) {
				const newScope = n.scope.filter((s) => s !== id);
				warnings.push(`${n.id} scope still references ${id}`);
				updates.scope = newScope.length > 0 ? newScope : undefined;
			}

			// Remove from operations
			const opsWithTarget = n.operations?.some((op) => op.target === id);
			if (opsWithTarget) {
				const newOps = n.operations?.filter((op) => op.target !== id);
				warnings.push(`${n.id} operations still reference ${id}`);
				updates.operations = (newOps?.length ?? 0) > 0 ? newOps : undefined;
			}

			return Object.keys(updates).length > 0 ? { ...n, ...updates } : n;
		});

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
