import * as z from "zod";
import { defineOperation } from "./define-operation.js";
import { SysProMDocument } from "../schema.js";

/**
 * Remove an external reference from a node by its identifier.
 */
export const removeExternalReferenceOp = defineOperation({
	name: "remove-external-reference",
	description: "Remove an external reference from a node",
	input: z.object({
		doc: SysProMDocument,
		nodeId: z.string().describe("The node to remove the reference from"),
		identifier: z
			.string()
			.describe("The identifier of the reference to remove"),
	}),
	output: SysProMDocument,
	fn: (input) => {
		const node = input.doc.nodes.find((n) => n.id === input.nodeId);
		if (!node) {
			throw new Error(`Node not found: ${input.nodeId}`);
		}

		const refs = node.external_references ?? [];
		const found = refs.some((r) => r.identifier === input.identifier);
		if (!found) {
			throw new Error(
				`Reference not found: ${input.identifier} on node ${input.nodeId}`,
			);
		}

		const updatedNode = {
			...node,
			external_references: refs.filter(
				(r) => r.identifier !== input.identifier,
			),
		};

		return {
			...input.doc,
			nodes: input.doc.nodes.map((n) =>
				n.id === input.nodeId ? updatedNode : n,
			),
		};
	},
});
