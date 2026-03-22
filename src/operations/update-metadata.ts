import * as z from "zod";
import { defineOperation } from "./define-operation.js";
import { SysProMDocument } from "../schema.js";

export const updateMetadataOp = defineOperation({
	name: "updateMetadata",
	description: "Update metadata fields. Returns a new document.",
	input: z.object({
		doc: SysProMDocument,
		fields: z.record(z.string(), z.unknown()),
	}),
	output: SysProMDocument,
	fn({ doc, fields }) {
		return {
			...doc,
			metadata: { ...doc.metadata, ...fields },
		};
	},
});
