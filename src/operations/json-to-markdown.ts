import * as z from "zod";
import { defineOperation } from "./define-operation.js";
import { SysProMDocument } from "../schema.js";
import { jsonToMarkdownSingle } from "../json-to-md.js";

/** Convert a SysProM document to single-file Markdown representation. */
export const jsonToMarkdownOp = defineOperation({
	name: "jsonToMarkdown",
	description: "Convert a SysProM document to single-file Markdown",
	input: z.object({
		doc: SysProMDocument,
	}),
	output: z.string(),
	fn: ({ doc }) => jsonToMarkdownSingle(doc),
});
