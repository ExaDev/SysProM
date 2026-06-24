import * as z from "zod";
import { defineOperation } from "./define-operation.js";
import {
	SysProMDocument,
	ExternalReference,
	ExternalReferenceRole,
} from "../schema.js";

/**
 * Add an external reference to a node.
 *
 * External references link nodes to source documents, ADRs, standards, code files,
 * and other resources outside the SysProM graph.
 */
export const addExternalReferenceOp = defineOperation({
	name: "add-external-reference",
	description: "Add an external reference to a node",
	input: z.object({
		doc: SysProMDocument,
		nodeId: z.string().describe("The node to add the reference to"),
		role: ExternalReferenceRole.describe(
			"Reference role (e.g. source, output, evidence, standard)",
		),
		identifier: z
			.string()
			.describe("Reference identifier (URI, file path, etc.)"),
		description: z
			.string()
			.optional()
			.describe("Optional description of the reference"),
	}),
	output: SysProMDocument,
	fn: (input) => {
		const node = input.doc.nodes.find((n) => n.id === input.nodeId);
		if (!node) {
			throw new Error(`Node not found: ${input.nodeId}`);
		}

		const newRef: ExternalReference = {
			role: input.role,
			identifier: input.identifier,
			...(input.description && { description: input.description }),
		};

		const updatedNode = {
			...node,
			external_references: [...(node.external_references ?? []), newRef],
		};

		return {
			...input.doc,
			nodes: input.doc.nodes.map((n) =>
				n.id === input.nodeId ? updatedNode : n,
			),
		};
	},
});
