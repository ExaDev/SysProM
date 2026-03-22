import * as z from "zod";
import { defineOperation } from "./define-operation.js";
import { SysProMDocument, Relationship } from "../schema.js";

function sanitiseMermaidId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_]/g, "_");
}

function generateDot(
  doc: SysProMDocument,
  rels: SysProMDocument["relationships"],
): string {
  const lines: string[] = [];
  lines.push("digraph SysProM {");
  lines.push("  rankdir=LR;");

  // Add node labels
  for (const node of doc.nodes) {
    const label = `${node.id}\\n${node.name}`;
    lines.push(`  "${node.id}" [label="${label}"];`);
  }

  // Add relationships
  for (const rel of rels ?? []) {
    lines.push(`  "${rel.from}" -> "${rel.to}" [label="${rel.type}"];`);
  }

  lines.push("}");
  return lines.join("\n");
}

function generateMermaid(
  doc: SysProMDocument,
  rels: SysProMDocument["relationships"],
): string {
  const lines: string[] = [];
  lines.push("graph LR");

  // Add node definitions with type-specific shapes
  for (const node of doc.nodes) {
    const id = sanitiseMermaidId(node.id);
    let shape: string;

    if (node.type === "decision") {
      shape = `{${node.id}: ${node.name}}`;
    } else if (node.type === "invariant") {
      shape = `[/${node.id}: ${node.name}/]`;
    } else {
      shape = `[${node.id}: ${node.name}]`;
    }

    lines.push(`  ${id}${shape}`);
  }

  // Add relationships
  for (const rel of rels ?? []) {
    const fromId = sanitiseMermaidId(rel.from);
    const toId = sanitiseMermaidId(rel.to);
    lines.push(`  ${fromId} -->|${rel.type}| ${toId}`);
  }

  return lines.join("\n");
}

function generateGraph(
  doc: SysProMDocument,
  format: string,
  typeFilter?: string,
): string {
  let rels = doc.relationships ?? [];
  if (typeFilter) {
    rels = rels.filter((r) => r.type === typeFilter);
  }

  if (format === "dot") {
    return generateDot(doc, rels);
  }

  return generateMermaid(doc, rels);
}

export const graphOp = defineOperation({
  name: "graph",
  description:
    "Generate a graph of the SysProM document in Mermaid or DOT format, with optional filtering by relationship type.",
  input: z.object({
    doc: SysProMDocument,
    format: z.enum(["mermaid", "dot"]).default("mermaid"),
    typeFilter: z.string().optional(),
  }),
  output: z.string(),
  fn({ doc, format, typeFilter }) {
    return generateGraph(doc, format, typeFilter);
  },
});
