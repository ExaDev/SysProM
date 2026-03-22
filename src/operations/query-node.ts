import * as z from "zod";
import { defineOperation } from "./define-operation.js";
import { Node, Relationship, SysProMDocument } from "../schema.js";

export const NodeDetail = z.object({
  node: Node,
  outgoing: z.array(Relationship),
  incoming: z.array(Relationship),
}).nullable();

export type NodeDetail = z.infer<typeof NodeDetail>;

export const queryNodeOp = defineOperation({
  name: "query-node",
  description: "Query a single node by ID with its incoming and outgoing relationships",
  input: z.object({
    doc: SysProMDocument,
    id: z.string(),
  }),
  output: NodeDetail,
  fn: (input) => {
    const node = input.doc.nodes.find((n) => n.id === input.id);
    if (!node) return null;

    const outgoing = (input.doc.relationships ?? []).filter(
      (r) => r.from === input.id,
    );
    const incoming = (input.doc.relationships ?? []).filter(
      (r) => r.to === input.id,
    );

    return { node, outgoing, incoming };
  },
});
