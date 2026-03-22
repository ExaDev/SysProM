import * as z from "zod";
import type { CommandDef } from "../define-command.js";
import { removeNode } from "../../mutate.js";
import { loadDocument, saveDocument } from "../../io.js";
import { jsonToMarkdownMultiDoc } from "../../json-to-md.js";

type Args = { input: string; nodeId: string };
type Opts = { json?: boolean; dryRun?: boolean; sync?: string };

export const removeCommand: CommandDef = {
  name: "remove",
  description: "Remove a node from a SysProM document",
  apiLink: "removeNode",
  args: z.object({
    input: z.string().describe("Path to SysProM document"),
    nodeId: z.string().describe("ID of the node to remove"),
  }),
  opts: z
    .object({
      json: z.boolean().optional().describe("Output result as JSON"),
      dryRun: z.boolean().optional().describe("Simulate removal without saving"),
      sync: z.string().optional().describe("Sync changes to Markdown directory"),
    })
    .strict(),
  action(args: unknown, opts: unknown) {
    const typedArgs = args as Args;
    const typedOpts = opts as Opts;
    const { doc, format, path } = loadDocument(typedArgs.input);
    const targetId = typedArgs.nodeId;

    try {
      const result = removeNode(doc, targetId);
      const removedNode = doc.nodes.find((n) => n.id === targetId);

      // Count removed relationships
      const before = (doc.relationships ?? []).length;
      const after = (result.doc.relationships ?? []).length;
      const removedRels = before - after;

      if (!typedOpts.dryRun) {
        saveDocument(result.doc, format, path);

        if (typedOpts.sync) {
          jsonToMarkdownMultiDoc(result.doc, typedOpts.sync);
          console.log(`Synced to ${typedOpts.sync}`);
        }
      }

      if (typedOpts.json) {
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
          console.log(
            `Removed ${removedRels} relationship(s) involving ${targetId}`,
          );
        }

        // Print warnings
        for (const warning of result.warnings) {
          console.warn(`Warning: ${warning}`);
        }

        console.log(
          `${typedOpts.dryRun ? "[dry-run] Would remove" : "Removed"} ${removedNode?.type} ${targetId} — ${removedNode?.name}`,
        );
      }
    } catch (err: unknown) {
      console.error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  },
};
