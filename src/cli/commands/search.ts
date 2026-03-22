import * as z from "zod";
import type { CommandDef } from "../define-command.js";
import { loadDocument } from "../../io.js";
import { textToString } from "../../text.js";
import type { Node } from "../../schema.js";

type Args = { input: string; term: string };
type Opts = { json?: boolean };

export const searchCommand: CommandDef = {
  name: "search",
  description: "Search for nodes in a SysProM document",
  args: z.object({
    input: z.string().describe("Path to SysProM document"),
    term: z.string().describe("Search term"),
  }),
  opts: z.object({
    json: z.boolean().optional().describe("Output results as JSON"),
  }).strict(),
  action(args: unknown, opts: unknown) {
    const typedArgs = args as Args;
    const typedOpts = opts as Opts;
    const { doc } = loadDocument(typedArgs.input);
    const term = typedArgs.term.toLowerCase();

    const matches: Node[] = [];

    function searchNode(node: Node): void {
      const fields = [
        node.id,
        node.name,
        node.description ? textToString(node.description) : "",
        node.context ? textToString(node.context) : "",
        node.rationale ? textToString(node.rationale) : "",
      ];

      if (fields.some((f) => f.toLowerCase().includes(term))) {
        matches.push(node);
      }

      // Search subsystems recursively
      if (node.subsystem) {
        for (const sub of node.subsystem.nodes) {
          searchNode(sub);
        }
      }
    }

    for (const node of doc.nodes) {
      searchNode(node);
    }

    if (typedOpts.json) {
      console.log(JSON.stringify(matches, null, 2));
    } else {
      if (matches.length === 0) {
        console.log(`No matches for "${typedArgs.term}"`);
      } else {
        for (const m of matches) {
          const desc = m.description
            ? " — " + textToString(m.description).slice(0, 60)
            : "";
          console.log(
            `${m.id.padEnd(12)} ${m.type.padEnd(16)} ${m.name}${desc}`,
          );
        }
        console.log(`\n${matches.length} match(es)`);
      }
    }
  },
};
