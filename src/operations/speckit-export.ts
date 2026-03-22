import * as z from "zod";
import { defineOperation } from "./define-operation.js";
import { SysProMDocument } from "../schema.js";
import { generateSpecKitProject } from "../speckit/generate.js";

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
