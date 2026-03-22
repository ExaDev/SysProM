import * as z from "zod";
import type { CommandDef } from "../define-command.js";
import { removeNodeOp } from "../../operations/index.js";
import { loadDocument, saveDocument } from "../../io.js";
import { jsonToMarkdownMultiDoc } from "../../json-to-md.js";

const argsSchema = z.object({
  input: z.string().describe("Path to SysProM document"),
  nodeId: z.string().describe("ID of the node to remove"),
});

const optsSchema = z
  .object({
    json: z.boolean().optional().describe("Output result as JSON"),
    dryRun: z.boolean().optional().describe("Simulate removal without saving"),
    sync: z.string().optional().describe("Sync changes to Markdown directory"),
  })
  .strict();

export const removeCommand: CommandDef<typeof argsSchema, typeof optsSchema> = {
  name: "remove",
  description: removeNodeOp.def.description,
  apiLink: removeNodeOp.def.name,
  args: argsSchema,
  opts: optsSchema,
  action(args, opts) {
    const { doc, format, path } = loadDocument(args.input);
    const targetId = args.nodeId;
    const removedNode = doc.nodes.find((n) => n.id === targetId);

    try {
      const result = removeNodeOp({ doc, id: targetId });

      // Count removed relationships
      const before = (doc.relationships ?? []).length;
      const after = (result.doc.relationships ?? []).length;
      const removedRels = before - after;

      if (!opts.dryRun) {
        saveDocument(result.doc, format, path);

        if (opts.sync) {
          jsonToMarkdownMultiDoc(result.doc, opts.sync);
          console.log(`Synced to ${opts.sync}`);
        }
      }

      if (opts.json) {
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
          `${opts.dryRun ? "[dry-run] Would remove" : "Removed"} ${removedNode?.type} ${targetId} — ${removedNode?.name}`,
        );
      }
    } catch (err: unknown) {
      console.error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  },
};
