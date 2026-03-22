import * as z from "zod";
import { defineOperation } from "./define-operation.js";
import { SysProMDocument, Node } from "../schema.js";

export const addNodeOp = defineOperation({
  name: "addNode",
  description: "Add a node to the document. Throws if the ID already exists.",
  input: z.object({
    doc: SysProMDocument,
    node: Node,
  }),
  output: SysProMDocument,
  fn({ doc, node }) {
    if (doc.nodes.some((n) => n.id === node.id)) {
      throw new Error(`Node with ID '${node.id}' already exists.`);
    }
    return {
      ...doc,
      nodes: [...doc.nodes, node],
    };
  },
});
