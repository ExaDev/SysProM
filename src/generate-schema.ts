import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { canonicalise } from "./canonical-json.js";
import { toJSONSchema } from "./schema.js";

const schema = toJSONSchema();
const outPath = resolve(
	dirname(fileURLToPath(import.meta.url)),
	"..",
	"schema.json",
);

writeFileSync(outPath, canonicalise(schema, { indent: "\t" }) + "\n");
console.log(`Written to ${outPath}`);
