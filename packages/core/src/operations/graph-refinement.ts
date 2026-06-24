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
	renderMermaidClickDirectives,
	type MermaidClickMap,
} from "./graph-shared.js";

const REFINEMENT_REL_TYPES = new Set(["refines", "realises", "implements"]);

function collectRefinementChain(
	doc: SysProMDocument,
	seedIds?: string[],
): { nodes: Node[]; rels: Relationship[] } {
	const rels = (doc.relationships ?? []).filter((r) =>
		REFINEMENT_REL_TYPES.has(r.type),
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

function generateRefinementMermaid(
	nodes: Node[],
	rels: Relationship[],
	labelMode: "friendly" | "compact",
	clickMap?: MermaidClickMap,
): string {
	const lines: string[] = [];
	lines.push("graph TD");

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
		const label = renderRelationshipLabel(rel);
		lines.push(`  ${fromId} -->|${label}| ${toId}`);
	}

	lines.push(...renderMermaidClickDirectives(nodes, clickMap));

	return lines.join("\n");
}

function generateRefinementDot(
	nodes: Node[],
	rels: Relationship[],
	layout: string,
	labelMode: "friendly" | "compact",
): string {
	const lines: string[] = [];
	lines.push("digraph RefinementChain {");
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
		const label = renderRelationshipLabel(rel);
		lines.push(`  "${rel.from}" -> "${rel.to}" [label="${label}"];`);
	}

	lines.push("}");
	return lines.join("\n");
}

/** Generate a refinement chain diagram showing how nodes elaborate through abstraction layers. */
export const graphRefinementOp = defineOperation({
	name: "graphRefinement",
	description:
		"Generate a refinement chain diagram showing intent → concept → capability → element → realisation relationships.",
	input: z.object({
		doc: SysProMDocument,
		format: z.enum(["mermaid", "dot"]).default("mermaid"),
		seedIds: z.array(z.string()).optional(),
		layout: z.enum(["LR", "TD", "RL", "BT"]).default("TD"),
		labelMode: z.enum(["friendly", "compact"]).default("friendly"),
		clickTargets: z.record(z.string(), z.string()).optional(),
	}),
	output: z.string(),
	fn({ doc, format, seedIds, layout, labelMode, clickTargets }) {
		const { nodes, rels } = collectRefinementChain(doc, seedIds);
		if (format === "dot") {
			return generateRefinementDot(nodes, rels, layout, labelMode);
		}
		const clickMap = clickTargets
			? new Map(Object.entries(clickTargets))
			: undefined;
		const mermaid = generateRefinementMermaid(nodes, rels, labelMode, clickMap);
		const mermaidLines = mermaid.split("\n");
		mermaidLines[0] = `graph ${layout}`;
		return mermaidLines.join("\n");
	},
});
