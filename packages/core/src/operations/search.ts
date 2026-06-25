import * as z from "zod";
import { defineOperation } from "./define-operation.js";
import { SysProMDocument, Node } from "../schema.js";
import { textToString } from "../text.js";

/** Search for nodes by text (case-insensitive) across id, name, description, context, and rationale fields. Recursively searches into subsystems. */
export const searchOp = defineOperation({
	name: "search",
	description:
		"Search for nodes in a SysProM document by text across id, name, description, context, and rationale fields. Recursively searches into subsystems.",
	input: z.object({
		doc: SysProMDocument,
		term: z.string().describe("Search term (case-insensitive)"),
	}),
	output: z.array(Node),
	fn({ doc, term }) {
		const searchTerm = term.toLowerCase();
		const matches: Node[] = [];

		function searchNode(node: Node): void {
			const fields = [
				node.id,
				node.name,
				node.description ? textToString(node.description) : "",
				node.context ? textToString(node.context) : "",
				node.rationale ? textToString(node.rationale) : "",
			];

			if (fields.some((f) => f.toLowerCase().includes(searchTerm))) {
				matches.push(node);
			}

			// Search subsystems recursively
			if (node.subsystem) {
				for (const sub of node.subsystem.nodes) {
					searchNode(sub);
				}
			}
		}

		for (const node of doc.nodes) {
			searchNode(node);
		}

		return matches;
	},
});
