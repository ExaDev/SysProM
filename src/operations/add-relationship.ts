import * as z from "zod";
import { defineOperation } from "./define-operation.js";
import { SysProMDocument, Relationship } from "../schema.js";

export const addRelationshipOp = defineOperation({
	name: "addRelationship",
	description:
		"Add a relationship to the document. Throws if either endpoint node does not exist.",
	input: z.object({
		doc: SysProMDocument,
		rel: Relationship,
	}),
	output: SysProMDocument,
	fn({ doc, rel }) {
		const ids = new Set(doc.nodes.map((n) => n.id));
		if (!ids.has(rel.from)) {
			throw new Error(`Node not found: ${rel.from}`);
		}
		if (!ids.has(rel.to)) {
			throw new Error(`Node not found: ${rel.to}`);
		}

		return {
			...doc,
			relationships: [...(doc.relationships ?? []), rel],
		};
	},
});
