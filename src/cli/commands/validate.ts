import * as z from "zod";
import pc from "picocolors";
import type { CommandDef } from "../define-command.js";
import { validate as validateDoc } from "../../validate.js";
import { loadDocument } from "../../io.js";

type Args = { input: string };
type Opts = Record<string, never>;

export const validateCommand: CommandDef = {
  name: "validate",
  description: "Validate a SysProM document against the schema",
  apiLink: "validate",
  args: z.object({
    input: z.string().describe("Path to SysProM document"),
  }),
  opts: z.object({}).strict(),
  action(args: unknown, opts: unknown) {
    const typedArgs = args as Args;
    const { doc } = loadDocument(typedArgs.input);
    const result = validateDoc(doc);

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
