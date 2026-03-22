import { removeNode } from "../mutate.js";
import { loadDocument, saveDocument } from "../io.js";
import { jsonToMarkdownMultiDoc } from "../json-to-md.js";

export function run(args: string[]): void {
  if (args.length < 2) {
    console.error("Usage: sysprom remove <input> <node-id>");
    process.exit(1);
  }

  const { doc, format, path } = loadDocument(args[0]);
  const targetId = args[1];

  try {
    const dryRun = args.includes("--dry-run");
    const asJson = args.includes("--json");

    const result = removeNode(doc, targetId);
    const removedNode = doc.nodes.find((n) => n.id === targetId);

    // Count removed relationships
    const before = (doc.relationships ?? []).length;
    const after = (result.doc.relationships ?? []).length;
    const removedRels = before - after;

    if (!dryRun) {
      saveDocument(result.doc, format, path);

      const syncIdx = args.indexOf("--sync");
      const syncDir = syncIdx >= 0 && args[syncIdx + 1] ? args[syncIdx + 1] : undefined;
      if (syncDir) {
        jsonToMarkdownMultiDoc(result.doc, syncDir);
        console.log(`Synced to ${syncDir}`);
      }
    }

    if (asJson) {
      console.log(
        JSON.stringify(
          {
            removed: removedNode,
            removedRelationships: removedRels,
            warnings: result.warnings,
          },
          null,
          2,
        ),
      );
    } else {
      if (removedRels > 0) {
        console.log(`Removed ${removedRels} relationship(s) involving ${targetId}`);
      }

      // Print warnings
      for (const warning of result.warnings) {
        console.warn(`Warning: ${warning}`);
      }

      console.log(`${dryRun ? "[dry-run] Would remove" : "Removed"} ${removedNode?.type} ${targetId} — ${removedNode?.name}`);
    }
  } catch (err: unknown) {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}
