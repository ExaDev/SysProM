import * as z from "zod";
import { defineOperation } from "./define-operation.js";
import { SysProMDocument, type Relationship, type Node } from "../schema.js";
import {
	sanitiseMermaidId,
	mermaidShapeForNode,
	renderMermaidNode,
	renderMermaidClassDefs,
	mermaidClassForNode,
	dotNodeAttrsWithMode,
	renderRelationshipLabel,
} from "./graph-shared.js";

const DEPENDENCY_REL_TYPES = new Set([
	"depends_on",
	"constrained_by",
	"requires",
	"blocks",
	"governed_by",
]);

function collectDependencyGraph(
	doc: SysProMDocument,
	seedIds?: string[],
): { nodes: Node[]; rels: Relationship[] } {
	const rels = (doc.relationships ?? []).filter((r) =>
		DEPENDENCY_REL_TYPES.has(r.type),
	);

	if (seedIds && seedIds.length > 0) {
		const reachable = new Set<string>(seedIds);
		let changed = true;
		while (changed) {
			changed = false;
			for (const r of rels) {
				if (reachable.has(r.from) && !reachable.has(r.to)) {
					reachable.add(r.to);
					changed = true;
				}
				if (reachable.has(r.to) && !reachable.has(r.from)) {
					reachable.add(r.from);
					changed = true;
				}
			}
		}
		const filteredRels = rels.filter(
			(r) => reachable.has(r.from) && reachable.has(r.to),
		);
		const nodes = doc.nodes.filter((n) => reachable.has(n.id));
		return { nodes, rels: filteredRels };
	}

	const nodeIds = new Set(rels.flatMap((r) => [r.from, r.to]));
	const nodes = doc.nodes.filter((n) => nodeIds.has(n.id));
	return { nodes, rels };
}

function generateDependencyMermaid(
	nodes: Node[],
	rels: Relationship[],
	labelMode: "friendly" | "compact",
): string {
	const lines: string[] = [];
	lines.push("graph LR");

	for (const def of renderMermaidClassDefs()) {
		lines.push(`  ${def}`);
	}
	lines.push("");

	for (const node of nodes) {
		const shape = mermaidShapeForNode(node);
		const cls = mermaidClassForNode(node);
		lines.push(
			`  ${renderMermaidNode(node.id, node.name, shape, labelMode)}:::${cls}`,
		);
	}

	lines.push("");
	for (const rel of rels) {
		const fromId = sanitiseMermaidId(rel.from);
		const toId = sanitiseMermaidId(rel.to);
		const style =
			rel.type === "blocks"
				? "-.->|blocked|"
				: rel.type === "requires"
					? "==>|required|"
					: `-->|${rel.type}|`;
		const label = renderRelationshipLabel(rel);
		if (rel.type === "blocks") {
			lines.push(`  ${toId} ${style} ${fromId}`);
		} else {
			lines.push(`  ${fromId} ${style}${label ? `|${label}| ` : " "}${toId}`);
		}
	}

	return lines.join("\n");
}

function generateDependencyDot(
	nodes: Node[],
	rels: Relationship[],
	layout: string,
	labelMode: "friendly" | "compact",
): string {
	const lines: string[] = [];
	lines.push("digraph Dependencies {");
	const rankdir =
		layout === "TD"
			? "TB"
			: layout === "BT"
				? "BT"
				: layout === "RL"
					? "RL"
					: "LR";
	lines.push(`  rankdir=${rankdir};`);
	lines.push("  node [style=filled];");

	for (const node of nodes) {
		lines.push(`  "${node.id}" ${dotNodeAttrsWithMode(node, labelMode)};`);
	}
	for (const rel of rels) {
		const attrs = [`label="${renderRelationshipLabel(rel)}"`];
		if (rel.type === "blocks") {
			attrs.push("style=dashed", "color=red");
			lines.push(`  "${rel.to}" -> "${rel.from}" [${attrs.join(" ")}];`);
		} else {
			if (rel.type === "requires") attrs.push("penwidth=2");
			lines.push(`  "${rel.from}" -> "${rel.to}" [${attrs.join(" ")}];`);
		}
	}

	lines.push("}");
	return lines.join("\n");
}

/** Generate a dependency graph showing how nodes depend on, constrain, and require each other. */
export const graphDependencyOp = defineOperation({
	name: "graphDependency",
	description:
		"Generate a dependency graph showing depends_on, constrained_by, requires, blocks, and governed_by relationships.",
	input: z.object({
		doc: SysProMDocument,
		format: z.enum(["mermaid", "dot"]).default("mermaid"),
		seedIds: z.array(z.string()).optional(),
		layout: z.enum(["LR", "TD", "RL", "BT"]).default("LR"),
		labelMode: z.enum(["friendly", "compact"]).default("friendly"),
	}),
	output: z.string(),
	fn({ doc, format, seedIds, layout, labelMode }) {
		const { nodes, rels } = collectDependencyGraph(doc, seedIds);
		if (format === "dot") {
			return generateDependencyDot(nodes, rels, layout, labelMode);
		}
		const mermaid = generateDependencyMermaid(nodes, rels, labelMode);
		const mermaidLines = mermaid.split("\n");
		mermaidLines[0] = `graph ${layout}`;
		return mermaidLines.join("\n");
	},
});
