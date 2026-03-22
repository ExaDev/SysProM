import * as z from "zod";
import type { CommandDef } from "../define-command.js";
import { renameOp } from "../../operations/index.js";
import { loadDocument, saveDocument } from "../../io.js";

const argsSchema = z.object({
  input: z.string().describe("Path to SysProM document"),
  oldId: z.string().describe("Current node ID"),
  newId: z.string().describe("New node ID"),
});

const optsSchema = z.object({}).strict();

export const renameCommand: CommandDef<typeof argsSchema, typeof optsSchema> = {
  name: "rename",
  description: renameOp.def.description,
  apiLink: renameOp.def.name,
  args: argsSchema,
  opts: optsSchema,
  action(args) {
    try {
      const { doc, format, path } = loadDocument(args.input);
      const updated = renameOp({ doc, oldId: args.oldId, newId: args.newId });
      saveDocument(updated, format, path);
      console.log(`Renamed ${args.oldId} → ${args.newId}`);
    } catch (err: unknown) {
      console.error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  },
};
