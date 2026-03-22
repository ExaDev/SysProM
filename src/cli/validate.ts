import pc from "picocolors";
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
    console.log(pc.green("Valid SysProM document."));
    console.log(`  ${pc.cyan(String(result.nodeCount))} nodes, ${pc.cyan(String(result.relationshipCount))} relationships`);
  } else {
    console.error(pc.red(`Found ${result.issues.length} issue(s):`));
    for (const issue of result.issues) {
      console.error(`  - ${pc.red(issue)}`);
    }
    process.exit(1);
  }
}
