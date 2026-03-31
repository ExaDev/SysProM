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
		// Optional per-diagram layout overrides when converting to Markdown
		relationshipLayout: z.enum(["LR", "TD", "RL", "BT"]).optional(),
		refinementLayout: z.enum(["LR", "TD", "RL", "BT"]).optional(),
		decisionLayout: z.enum(["LR", "TD", "RL", "BT"]).optional(),
		dependencyLayout: z.enum(["LR", "TD", "RL", "BT"]).optional(),
	}),
	output: z.string(),
	fn: ({
		doc,
		relationshipLayout,
		refinementLayout,
		decisionLayout,
		dependencyLayout,
	}) =>
		jsonToMarkdownSingle(doc, {
			relationshipLayout,
			refinementLayout,
			decisionLayout,
			dependencyLayout,
		}),
});
