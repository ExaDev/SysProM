import * as z from "zod";
import type { CommandDef } from "../define-command.js";
import { graphOp } from "../../operations/index.js";
import { loadDocument } from "../../io.js";

const argsSchema = z.object({
  input: z.string().describe("Path to SysProM document"),
});

const optsSchema = z
  .object({
    format: z
      .enum(["mermaid", "dot"])
      .optional()
      .describe("Output format"),
    type: z.string().optional().describe("Filter by relationship type"),
  })
  .strict();

export const graphCommand: CommandDef<typeof argsSchema, typeof optsSchema> = {
  name: "graph",
  description: graphOp.def.description,
  apiLink: graphOp.def.name,
  args: argsSchema,
  opts: optsSchema,
  action(args, opts) {
    try {
      const { doc } = loadDocument(args.input);
      const output = graphOp({ doc, format: opts.format ?? "mermaid", typeFilter: opts.type });
      console.log(output);
    } catch (err: unknown) {
      console.error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  },
};
