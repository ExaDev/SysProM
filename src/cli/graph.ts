import { loadDocument } from "../io.js";
import type { SysProMDocument } from "../schema.js";

export function run(args: string[]): void {
  if (args.length < 1) {
    console.error("Usage: sysprom graph <input> [--format mermaid|dot] [--type <type>]");
    process.exit(1);
  }

  try {
    const { doc } = loadDocument(args[0]);

    // Parse flags
    const formatIdx = args.indexOf("--format");
    const format = formatIdx >= 0 && args[formatIdx + 1] ? args[formatIdx + 1] : "mermaid";

    const typeIdx = args.indexOf("--type");
    const typeFilter = typeIdx >= 0 && args[typeIdx + 1] ? args[typeIdx + 1] : undefined;

    const output = generateGraph(doc, format, typeFilter);
    console.log(output);
  } catch (err: unknown) {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}

function generateGraph(doc: SysProMDocument, format: string, typeFilter?: string): string {
  let rels = doc.relationships ?? [];
  if (typeFilter) {
    rels = rels.filter((r) => r.type === typeFilter);
  }

  if (format === "dot") {
    return generateDot(doc, rels);
  }

  return generateMermaid(doc, rels);
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

function sanitiseMermaidId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_]/g, "_");
}
