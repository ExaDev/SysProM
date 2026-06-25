import * as z from "zod";
import { defineOperation } from "./define-operation.js";
import { SysProMDocument } from "../schema.js";

/** Create a new empty SysProM document with metadata, ready for nodes and relationships to be added. */
export const initDocumentOp = defineOperation({
	name: "initDocument",
	description: "Create a new empty SysProM document with metadata.",
	input: z.object({
		title: z.string().optional().default("Untitled"),
		scope: z.string().optional().default("system"),
	}),
	output: SysProMDocument,
	fn({ title, scope }) {
		const doc: z.infer<typeof SysProMDocument> = {
			metadata: {
				title,
				doc_type: "sysprom",
				scope,
				status: "active",
				version: 1,
			},
			nodes: [],
			relationships: [],
		};
		return doc;
	},
});
