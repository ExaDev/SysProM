import { removeNode } from "../mutate.js";
import { loadDocument, saveDocument } from "../io.js";

export function run(args: string[]): void {
  if (args.length < 2) {
    console.error("Usage: sysprom remove <input> <node-id>");
    process.exit(1);
  }

  const { doc, format, path } = loadDocument(args[0]);
  const targetId = args[1];

  try {
    const result = removeNode(doc, targetId);
    const removedNode = doc.nodes.find((n) => n.id === targetId);

    // Count removed relationships
    const before = (doc.relationships ?? []).length;
    const after = (result.doc.relationships ?? []).length;
    const removedRels = before - after;
    if (removedRels > 0) {
      console.log(`Removed ${removedRels} relationship(s) involving ${targetId}`);
    }

    // Print warnings
    for (const warning of result.warnings) {
      console.warn(`Warning: ${warning}`);
    }

    saveDocument(result.doc, format, path);
    console.log(`Removed ${removedNode?.type} ${targetId} — ${removedNode?.name}`);
  } catch (err) {
    console.error((err as Error).message);
    process.exit(1);
  }
}
