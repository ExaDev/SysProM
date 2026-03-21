import { validate as validateDoc } from "../validate.js";
import { loadDocument } from "../io.js";

export function run(args: string[]): void {
  if (args.length < 1) {
    console.error("Usage: sysprom validate <input>");
    process.exit(1);
  }

  const { doc } = loadDocument(args[0]);
  const result = validateDoc(doc);

  if (result.valid) {
    console.log("Valid SysProM document.");
    console.log(`  ${result.nodeCount} nodes, ${result.relationshipCount} relationships`);
  } else {
    console.error(`Found ${result.issues.length} issue(s):`);
    for (const issue of result.issues) {
      console.error(`  - ${issue}`);
    }
    process.exit(1);
  }
}
