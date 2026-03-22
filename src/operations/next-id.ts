import * as z from "zod";
import { defineOperation } from "./define-operation.js";
import { SysProMDocument, NodeType, NODE_ID_PREFIX } from "../schema.js";

export const nextIdOp = defineOperation({
	name: "nextId",
	description:
		"Generate the next available ID for a given node type. Scans existing node IDs matching the type's prefix and returns prefix + (max + 1).",
	input: z.object({
		doc: SysProMDocument,
		type: NodeType,
	}),
	output: z.string(),
	fn({ doc, type }) {
		const prefix = NODE_ID_PREFIX[type];
		if (!prefix) {
			throw new Error(`No ID prefix defined for node type: ${type}`);
		}
		const pattern = new RegExp(`^${prefix}(\\d+)$`);
		let max = 0;
		for (const node of doc.nodes) {
			const match = pattern.exec(node.id);
			if (match) {
				const num = parseInt(match[1], 10);
				if (num > max) max = num;
			}
		}
		return `${prefix}${String(max + 1)}`;
	},
});
