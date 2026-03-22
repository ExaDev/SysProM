import { writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { canonicalise } from "../canonical-json.js";
import type { SysProMDocument } from "../schema.js";

function parseFlag(args: string[], flag: string): string | undefined {
  const idx = args.indexOf(flag);
  if (idx >= 0 && idx + 1 < args.length) return args[idx + 1];
  return undefined;
}

export function run(args: string[]): void {
  if (args.length < 1) {
    console.error("Usage: sysprom init <output> [--title <title>] [--scope <scope>]");
    process.exit(1);
  }

  const outputPath = resolve(args[0]);
  if (existsSync(outputPath)) {
    console.error(`File already exists: ${outputPath}`);
    process.exit(1);
  }

  const title = parseFlag(args, "--title") ?? "Untitled";
  const scope = parseFlag(args, "--scope") ?? "system";

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
}
