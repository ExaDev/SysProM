import * as z from "zod";
import { defineOperation } from "./define-operation.js";
import { SysProMDocument, Node } from "../schema.js";

/**
 * Add a node to a SysProM document. Returns a new document with the node appended.
 *
 * When adding a `change` node, `decisionId` is required. The operation validates
 * that the referenced node exists and is a decision, then automatically creates
 * an `implements` relationship from the change to the decision (INV2).
 * @throws {Error} If a node with the same ID already exists.
 * @throws {Error} If adding a change without a decisionId.
 * @throws {Error} If decisionId references a missing or non-decision node.
 */
export const addNodeOp = defineOperation({
	name: "addNode",
	description:
		"Add a node to the document. Throws if the ID already exists. Change nodes require a decisionId.",
	input: z.object({
		doc: SysProMDocument,
		node: Node,
		decisionId: z.string().optional(),
	}),
	output: SysProMDocument,
	fn({ doc, node, decisionId }) {
		if (doc.nodes.some((n) => n.id === node.id)) {
			throw new Error(`Node with ID '${node.id}' already exists.`);
		}

		if (node.type === "change") {
			if (!decisionId) {
				throw new Error(
					`Adding a change requires a decisionId. Use --decision <ID> to link this change to its decision.`,
				);
			}
			const target = doc.nodes.find((n) => n.id === decisionId);
			if (!target) {
				throw new Error(
					`Decision not found: ${decisionId}. The referenced decision must exist before adding a change.`,
				);
			}
			if (target.type !== "decision") {
				throw new Error(
					`Node ${decisionId} is not a decision (type: ${target.type}). Changes must reference a decision node.`,
				);
			}
			return {
				...doc,
				nodes: [...doc.nodes, node],
				relationships: [
					...(doc.relationships ?? []),
					{ from: node.id, to: decisionId, type: "implements" as const },
				],
			};
		}

		return {
			...doc,
			nodes: [...doc.nodes, node],
		};
	},
});
