import * as z from "zod";
import { defineOperation } from "./define-operation.js";
import { SysProMDocument, Node } from "../schema.js";

interface CheckResult {
  warnings: string[];
  info: string[];
}

function performCheck(doc: SysProMDocument): CheckResult {
  const warnings: string[] = [];
  const info: string[] = [];
  const ids = new Set(doc.nodes.map((n: Node) => n.id));
  const relTargets = new Set<string>();

  for (const r of doc.relationships ?? []) {
    relTargets.add(r.from);
    relTargets.add(r.to);
  }

  for (const node of doc.nodes) {
    // Decisions without rationale
    if (node.type === "decision" && !node.rationale) {
      warnings.push(`${node.id}: decision has no rationale`);
    }

    // Decisions without context
    if (node.type === "decision" && !node.context) {
      info.push(`${node.id}: decision has no context`);
    }

    // Changes without scope
    if (
      node.type === "change" &&
      (!node.scope || node.scope.length === 0)
    ) {
      warnings.push(`${node.id}: change has no scope`);
    }

    // Changes without operations
    if (
      node.type === "change" &&
      (!node.operations || node.operations.length === 0)
    ) {
      info.push(`${node.id}: change has no operations`);
    }

    // Nodes with no description
    if (!node.description) {
      info.push(`${node.id}: no description`);
    }

    // Orphan nodes (not referenced by any relationship)
    if (!relTargets.has(node.id)) {
      // Intent nodes are expected to be roots
      if (node.type !== "intent") {
        info.push(`${node.id}: orphan node (no relationships)`);
      }
    }

    // Scope references non-existent nodes
    if (node.scope) {
      for (const s of node.scope) {
        if (!ids.has(s)) {
          warnings.push(
            `${node.id}: scope references non-existent node ${s}`,
          );
        }
      }
    }
  }

  return { warnings, info };
}

export const checkOp = defineOperation({
  name: "check",
  description:
    "Check a SysProM document for issues and warnings. Performs quality/lint checks beyond schema validation.",
  input: z.object({
    doc: SysProMDocument,
  }),
  output: z.object({
    warnings: z.array(z.string()),
    info: z.array(z.string()),
  }),
  fn({ doc }) {
    return performCheck(doc);
  },
});
