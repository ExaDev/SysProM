import * as z from "zod";
import { defineOperation } from "./define-operation.js";
import { SysProMDocument } from "../schema.js";

export const RemoveResult = z.object({
	doc: SysProMDocument,
	warnings: z.array(z.string()),
});

export type RemoveResult = z.infer<typeof RemoveResult>;

export const removeNodeOp = defineOperation({
	name: "removeNode",
	description:
		"Remove a node and all relationships involving it. Also removes the node from view includes and external references.",
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
				relationships:
					newRelationships.length > 0 ? newRelationships : undefined,
				external_references:
					newExternalRefs.length > 0 ? newExternalRefs : undefined,
			},
			warnings,
		};
	},
});
