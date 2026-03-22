import * as z from "zod";
import { defineOperation } from "./define-operation.js";
import { SysProMDocument, RelationshipType } from "../schema.js";

export const removeRelationshipOp = defineOperation({
  name: "removeRelationship",
  description:
    "Remove a relationship matching from, type, and to. Throws if the relationship is not found.",
  input: z.object({
    doc: SysProMDocument,
    from: z.string(),
    type: RelationshipType,
    to: z.string(),
  }),
  output: SysProMDocument,
  fn({ doc, from, type, to }) {
    const rels = doc.relationships ?? [];
    const idx = rels.findIndex(
      (r) => r.from === from && r.type === type && r.to === to,
    );
    if (idx === -1) {
      throw new Error(`Relationship not found: ${from} ${type} ${to}`);
    }

    const newRelationships = rels.filter(
      (r) => !(r.from === from && r.type === type && r.to === to),
    );

    return {
      ...doc,
      relationships: newRelationships.length > 0 ? newRelationships : undefined,
    };
  },
});
