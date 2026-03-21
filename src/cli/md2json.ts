import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { markdownToJson } from "../md-to-json.js";
import { canonicalise } from "../canonical-json.js";

const args = process.argv.slice(2);

if (args.length < 2) {
  console.error("Usage: md2json <input> <output.json>");
  console.error("");
  console.error("  <input> can be a .md file (single-file) or a directory (multi-doc)");
  process.exit(1);
}

const inputPath = resolve(args[0]);
const outputPath = resolve(args[1]);

const doc = markdownToJson(inputPath);
writeFileSync(outputPath, canonicalise(doc, { indent: "\t" }) + "\n");
console.log(`Written to ${outputPath}`);
