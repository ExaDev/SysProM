import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { sysproMDocument } from "../schema.js";
import { jsonToMarkdown } from "../json-to-md.js";

const args = process.argv.slice(2);

if (args.length < 2) {
  console.error("Usage: json2md <input.json> <output> [--single-file]");
  console.error("");
  console.error("  <output> can be a .md file (single-file) or a directory (multi-doc)");
  console.error("  --single-file  Force single-file output even if output has no .md extension");
  process.exit(1);
}

const inputPath = resolve(args[0]);
const outputPath = resolve(args[1]);
const forceSingle = args.includes("--single-file");

const raw = JSON.parse(readFileSync(inputPath, "utf8")) as unknown;

if (!sysproMDocument.is(raw)) {
  const result = sysproMDocument.safeParse(raw);
  if (!result.success) {
    console.error("Input is not a valid SysProM document:");
    for (const issue of result.error.issues) {
      console.error(`  ${issue.path.join(".")}: ${issue.message}`);
    }
  }
  process.exit(1);
}

const form =
  forceSingle || outputPath.endsWith(".md") ? "single-file" : "multi-doc";

jsonToMarkdown(raw, outputPath, { form });

if (form === "single-file") {
  console.log(`Written to ${outputPath}`);
} else {
  console.log(`Written to ${outputPath}/`);
}
