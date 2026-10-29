import * as z from "zod";
import { defineOperation } from "./define-operation.js";
import { Relationship, SysProMDocument } from "../schema.js";

/** Query relationships from a SysProM document with optional filters for from, to, and type. */
export const queryRelationshipsOp = defineOperation({
	name: "query-relationships",
	description:
		"Query relationships with optional filters for from, to, and type",
	input: z.object({
		doc: SysProMDocument,
		from: z.string().optional(),
		to: z.string().optional(),
		type: z.string().optional(),
	}),
	output: z.array(Relationship),
	fn: (input) => {
		let rels = input.doc.relationships ?? [];

		if (input.type) {
			rels = rels.filter((r) => r.type === input.type);
		}

		if (input.from) {
			rels = rels.filter((r) => r.from === input.from);
		}

		if (input.to) {
			rels = rels.filter((r) => r.to === input.to);
		}

		return rels;
	},
});
