import * as z from "zod";
import { defineOperation } from "./define-operation.js";
import { SysProMDocument } from "../schema.js";
import { generateSpecKitProject } from "../speckit/generate.js";

/** Export a SysProM document to Spec-Kit format, writing specification files to the output directory. Only nodes matching the given ID prefix are exported. */
export const speckitExportOp = defineOperation({
	name: "speckitExport",
	description: "Export a SysProM document to Spec-Kit format",
	input: z.object({
		doc: SysProMDocument,
		speckitDir: z.string().describe("Path to Spec-Kit output directory"),
		prefix: z.string().describe("ID prefix identifying nodes to export"),
	}),
	output: z.void(),
	fn: ({ doc, speckitDir, prefix }) => {
		generateSpecKitProject(doc, speckitDir, prefix);
	},
});
