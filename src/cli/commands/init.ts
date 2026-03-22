import * as z from "zod";
import { writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import type { CommandDef } from "../define-command.js";
import { canonicalise } from "../../canonical-json.js";
import type { SysProMDocument } from "../../schema.js";

type Args = { output: string };
type Opts = { title?: string; scope?: string };

export const initCommand: CommandDef = {
  name: "init",
  description: "Create a new SysProM document",
  args: z.object({
    output: z.string().describe("Output file path"),
  }),
  opts: z
    .object({
      title: z.string().optional().describe("Document title"),
      scope: z.string().optional().describe("Document scope"),
    })
    .strict(),
  action(args: unknown, opts: unknown) {
    const typedArgs = args as Args;
    const typedOpts = opts as Opts;
    const outputPath = resolve(typedArgs.output);
    if (existsSync(outputPath)) {
      console.error(`File already exists: ${outputPath}`);
      process.exit(1);
    }

    const title = typedOpts.title ?? "Untitled";
    const scope = typedOpts.scope ?? "system";

    const doc: SysProMDocument = {
      metadata: {
        title,
        doc_type: "sysprom",
        scope,
        status: "active",
        version: 1,
      },
      nodes: [],
      relationships: [],
    };

    writeFileSync(outputPath, canonicalise(doc, { indent: "\t" }) + "\n");
    console.log(`Created ${outputPath}`);
  },
};
