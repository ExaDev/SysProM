import * as z from "zod";
import type { CommandDef } from "../define-command.js";
import { checkOp } from "../../operations/index.js";
import { loadDocument } from "../../io.js";

const argsSchema = z.object({
  input: z.string().describe("Path to SysProM document"),
});

const optsSchema = z.object({
  json: z.boolean().optional().describe("Output results as JSON"),
}).strict();

export const checkCommand: CommandDef<typeof argsSchema, typeof optsSchema> = {
  name: "check",
  description: checkOp.def.description,
  apiLink: checkOp.def.name,
  args: argsSchema,
  opts: optsSchema,
  action(args, opts) {
    const { doc } = loadDocument(args.input);
    const result = checkOp({ doc });

    if (opts.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      if (result.warnings.length === 0 && result.info.length === 0) {
        console.log("No issues found.");
      } else {
        for (const w of result.warnings) console.log(`⚠ ${w}`);
        for (const i of result.info) console.log(`ℹ ${i}`);
        console.log(
          `\n${result.warnings.length} warning(s), ${result.info.length} info`,
        );
      }
    }
  },
};
