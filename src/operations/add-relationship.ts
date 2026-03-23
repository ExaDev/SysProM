import * as z from "zod";
import { defineOperation } from "./define-operation.js";
import { SysProMDocument, Relationship } from "../schema.js";
import {
	isValidEndpointPair,
	RELATIONSHIP_ENDPOINT_TYPES,
} from "../endpoint-types.js";

/**
 * Add a relationship to a SysProM document. Returns a new document with the relationship appended.
 * @throws {Error} If either endpoint node does not exist, endpoint types are invalid, or the relationship is a duplicate.
 */
export const addRelationshipOp = defineOperation({
	name: "addRelationship",
	description:
		"Add a relationship to the document. Throws if either endpoint node does not exist, endpoint types are invalid, or the relationship is a duplicate.",
	input: z.object({
		doc: SysProMDocument,
		rel: Relationship,
	}),
	output: SysProMDocument,
	fn({ doc, rel }) {
		const nodeMap = new Map(doc.nodes.map((n) => [n.id, n]));
		const fromNode = nodeMap.get(rel.from);
		const toNode = nodeMap.get(rel.to);

		if (!fromNode) {
			throw new Error(`Node not found: ${rel.from}`);
		}
		if (!toNode) {
			throw new Error(`Node not found: ${rel.to}`);
		}

		// Validate endpoint types for this relationship
		if (!isValidEndpointPair(rel.type, fromNode.type, toNode.type)) {
			const endpoints = RELATIONSHIP_ENDPOINT_TYPES[rel.type];
			throw new Error(
				`Invalid endpoint types for ${rel.type}: ${fromNode.type} → ${toNode.type}. Valid: [${endpoints.from.join(", ")}] → [${endpoints.to.join(", ")}]`,
			);
		}

		// Check for duplicate relationship
		const isDuplicate = (doc.relationships ?? []).some(
			(r) => r.from === rel.from && r.to === rel.to && r.type === rel.type,
		);
		if (isDuplicate) {
			throw new Error(
				`Duplicate relationship already exists: ${rel.from} --${rel.type}--> ${rel.to}`,
			);
		}

		return {
			...doc,
			relationships: [...(doc.relationships ?? []), rel],
		};
	},
});
