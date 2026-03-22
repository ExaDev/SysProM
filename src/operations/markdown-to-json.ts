import * as z from "zod";
import { defineOperation } from "./define-operation.js";
import { SysProMDocument } from "../schema.js";
import { markdownSingleToJson } from "../md-to-json.js";

/** Parse single-file Markdown content into a SysProM document. */
export const markdownToJsonOp = defineOperation({
	name: "markdownToJson",
	description: "Parse Markdown content into a SysProM document",
	input: z.object({
		content: z.string(),
	}),
	output: SysProMDocument,
	fn: ({ content }) => markdownSingleToJson(content),
});
