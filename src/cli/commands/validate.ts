import * as z from "zod";
import pc from "picocolors";
import type { CommandDef } from "../define-command.js";
import { validateOp } from "../../operations/index.js";
import { loadDocument } from "../../io.js";

const argsSchema = z.object({
  input: z.string().describe("Path to SysProM document"),
});

const optsSchema = z.object({}).strict();

export const validateCommand: CommandDef<typeof argsSchema, typeof optsSchema> = {
  name: "validate",
  description: validateOp.def.description,
  apiLink: validateOp.def.name,
  args: argsSchema,
  opts: optsSchema,
  action(args) {
    const { doc } = loadDocument(args.input);
    const result = validateOp({ doc });

    if (result.valid) {
      console.log(pc.green("Valid SysProM document."));
      console.log(
        `  ${pc.cyan(String(result.nodeCount))} nodes, ${pc.cyan(String(result.relationshipCount))} relationships`,
      );
    } else {
      console.error(pc.red(`Found ${result.issues.length} issue(s):`));
      for (const issue of result.issues) {
        console.error(`  - ${pc.red(issue)}`);
      }
      process.exit(1);
    }
  },
};
