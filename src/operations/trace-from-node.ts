import * as z from "zod";
import { defineOperation } from "./define-operation.js";
import { Node, SysProMDocument } from "../schema.js";

const TraceTypeSet = new Set(["refines", "realises", "implements"]);

export const TraceNode: z.ZodType<{
  id: string;
  node: Node | undefined;
  children: Array<{
    id: string;
    node: Node | undefined;
    children: unknown[];
  }>;
}> = z.lazy((): z.ZodType<any> =>
  z.object({
    id: z.string(),
    node: Node.nullable(),
    children: z.array(TraceNode),
  }),
);

export type TraceNode = z.infer<typeof TraceNode>;

export const traceFromNodeOp = defineOperation({
  name: "trace-from-node",
  description: "Trace refinement chain from a node (follows refines, realises, implements)",
  input: z.object({
    doc: SysProMDocument,
    startId: z.string(),
  }),
  output: TraceNode,
  fn: (input) => {
    const visited = new Set<string>();

    function trace(id: string): any {
      if (visited.has(id)) {
        return { id, node: undefined, children: [] };
      }
      visited.add(id);

      const node = input.doc.nodes.find((n) => n.id === id);

      const children = (input.doc.relationships ?? [])
        .filter((r) => r.to === id && TraceTypeSet.has(r.type))
        .map((r) => trace(r.from));

      return { id, node, children };
    }

    return trace(input.startId);
  },
});
