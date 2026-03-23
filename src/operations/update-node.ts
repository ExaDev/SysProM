import * as z from "zod";
import { defineOperation } from "./define-operation.js";
import { SysProMDocument, NodeBase } from "../schema.js";

/**
 * Update specified fields on a node, merging the provided fields into the existing node.
 * @throws {Error} If the node ID is not found.
 */
export const updateNodeOp = defineOperation({
	name: "updateNode",
	description:
		"Update specified fields on a node. Throws if the node is not found.",
	input: z.object({
		doc: SysProMDocument,
		id: z.string(),
		fields: NodeBase.partial(),
	}),
	output: SysProMDocument,
	fn({ doc, id, fields }) {
		const nodeIdx = doc.nodes.findIndex((n) => n.id === id);
		if (nodeIdx === -1) {
			throw new Error(`Node not found: ${id}`);
		}

		const oldNode = doc.nodes[nodeIdx];
		const newNode = { ...oldNode, ...fields };

		const newNodes = [...doc.nodes];
		newNodes[nodeIdx] = newNode;

		return { ...doc, nodes: newNodes };
	},
});
