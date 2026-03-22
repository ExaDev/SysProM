import * as z from "zod";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type { CommandDef } from "../define-command.js";
import { markdownToJson } from "../../md-to-json.js";
import { canonicalise } from "../../canonical-json.js";

type Args = { input: string; output: string };
type Opts = Record<string, never>;

export const md2jsonCommand: CommandDef = {
  name: "md2json",
  description: "Convert SysProM Markdown to JSON format",
  apiLink: "markdownToJson",
  args: z.object({
    input: z.string().describe("Path to SysProM Markdown (file or directory)"),
    output: z.string().describe("Output JSON file path"),
  }),
  opts: z.object({}).strict(),
  action(args: unknown, opts: unknown) {
    const typedArgs = args as Args;
    const inputPath = resolve(typedArgs.input);
    const outputPath = resolve(typedArgs.output);

    const doc = markdownToJson(inputPath);
    writeFileSync(outputPath, canonicalise(doc, { indent: "\t" }) + "\n");
    console.log(`Written to ${outputPath}`);
  },
};
