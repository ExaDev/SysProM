import * as z from "zod";
import { defineOperation } from "./define-operation.js";
import { SysProMDocument, Node } from "../schema.js";

/**
 * Validate that a referenced node exists and has the expected type.
 * @param doc - Document to search for the target node.
 * @param doc.nodes - Array of nodes in the document.
 * @param id - ID of the target node to resolve.
 * @param expectedTypes - Allowed node types for the target.
 * @param label - Human-readable label for error messages (e.g. "Decision").
 * @returns The resolved node.
 * @throws {Error} If the node does not exist or has an unexpected type.
 * @example
 * resolveTarget(doc, "D1", ["decision"], "Decision");
 */
function resolveTarget(
	doc: { nodes: readonly { id: string; type: string }[] },
	id: string,
	expectedTypes: readonly string[],
	label: string,
): { id: string; type: string } {
	const target = doc.nodes.find((n) => n.id === id);
	if (!target) {
		throw new Error(
			`${label} not found: ${id}. The referenced node must exist before adding this node.`,
		);
	}
	if (!expectedTypes.includes(target.type)) {
		const typeList = expectedTypes.join(" or ");
		const article = /^[aeiou]/i.test(typeList) ? "an" : "a";
		throw new Error(
			`Node ${id} is not ${article} ${typeList} (type: ${target.type}).`,
		);
	}
	return target;
}

/**
 * Add a node to a SysProM document. Returns a new document with the node appended.
 *
 * Certain node types require a companion relationship at creation time:
 * - `change` requires `decisionId` → creates `implements` relationship (INV2)
 * - `realisation` requires `elementId` → creates `implements` relationship (INV10)
 * - `gate` requires `governedById` → creates `governed_by` relationship (INV8)
 * @throws {Error} If a node with the same ID already exists.
 * @throws {Error} If a required relationship target is missing or has the wrong type.
 */
export const addNodeOp = defineOperation({
	name: "addNode",
	description:
		"Add a node to the document. Throws if the ID already exists. Change, realisation, and gate nodes require companion relationship targets.",
	input: z.object({
		doc: SysProMDocument,
		node: Node,
		decisionId: z.string().optional(),
		elementId: z.string().optional(),
		governedById: z.string().optional(),
	}),
	output: SysProMDocument,
	fn({ doc, node, decisionId, elementId, governedById }) {
		if (doc.nodes.some((n) => n.id === node.id)) {
			throw new Error(`Node with ID '${node.id}' already exists.`);
		}

		const newNodes = [...doc.nodes, node];
		const newRels = [...(doc.relationships ?? [])];

		if (node.type === "change") {
			if (!decisionId) {
				throw new Error(
					`Adding a change requires a decisionId. Use --decision <ID> to link this change to its decision.`,
				);
			}
			resolveTarget(doc, decisionId, ["decision"], "Decision");
			newRels.push({
				from: node.id,
				to: decisionId,
				type: "implements" as const,
			});
		}

		if (node.type === "realisation") {
			if (!elementId) {
				throw new Error(
					`Adding a realisation requires an elementId. Use --element <ID> to link this realisation to its element.`,
				);
			}
			resolveTarget(doc, elementId, ["element"], "Element");
			newRels.push({
				from: node.id,
				to: elementId,
				type: "implements" as const,
			});
		}

		if (node.type === "gate") {
			if (!governedById) {
				throw new Error(
					`Adding a gate requires a governedById. Use --governed-by <ID> to link this gate to the invariant or policy it enforces.`,
				);
			}
			resolveTarget(
				doc,
				governedById,
				["invariant", "policy"],
				"Invariant/policy",
			);
			newRels.push({
				from: node.id,
				to: governedById,
				type: "governed_by" as const,
			});
		}

		return { ...doc, nodes: newNodes, relationships: newRels };
	},
});
