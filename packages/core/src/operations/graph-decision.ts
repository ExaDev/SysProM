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

const DECISION_REL_TYPES = new Set([
	"must_preserve",
	"affects",
	"constrained_by",
	"supersedes",
]);

function collectDecisionMap(
	doc: SysProMDocument,
	seedIds?: string[],
): { nodes: Node[]; rels: Relationship[] } {
	const decisions = doc.nodes.filter((n) => n.type === "decision");
	const decisionIds = new Set(
		seedIds && seedIds.length > 0
			? decisions.filter((d) => seedIds.includes(d.id)).map((d) => d.id)
			: decisions.map((d) => d.id),
	);

	const rels = (doc.relationships ?? []).filter(
		(r) =>
			DECISION_REL_TYPES.has(r.type) &&
			(decisionIds.has(r.from) || decisionIds.has(r.to)),
	);

	const nodeIds = new Set<string>(decisionIds);
	for (const r of rels) {
		nodeIds.add(r.from);
		nodeIds.add(r.to);
	}

	const nodes = doc.nodes.filter((n) => nodeIds.has(n.id));
	return { nodes, rels };
}

function generateDecisionMermaid(
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
		const style = rel.type === "must_preserve" ? "-.->" : "-->";
		const label = renderRelationshipLabel(rel);
		lines.push(`  ${fromId} ${style}|${label}| ${toId}`);
	}

	lines.push(...renderMermaidClickDirectives(nodes, clickMap));

	return lines.join("\n");
}

function generateDecisionDot(
	nodes: Node[],
	rels: Relationship[],
	layout: string,
	labelMode: "friendly" | "compact",
): string {
	const lines: string[] = [];
	lines.push("digraph DecisionMap {");
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
		// rel is known to be a Relationship from the doc shape; pass through directly
		const attrs = [`label="${renderRelationshipLabel(rel)}"`];
		if (rel.type === "must_preserve") attrs.push("style=dashed");
		lines.push(`  "${rel.from}" -> "${rel.to}" [${attrs.join(" ")}];`);
	}

	lines.push("}");
	return lines.join("\n");
}

/** Generate a decision map diagram showing decisions, their links to invariants, and affected nodes. */
export const graphDecisionOp = defineOperation({
	name: "graphDecision",
	description:
		"Generate a decision map showing decisions, their links to invariants (must_preserve), and affected nodes.",
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
		const { nodes, rels } = collectDecisionMap(doc, seedIds);
		if (format === "dot") {
			return generateDecisionDot(nodes, rels, layout, labelMode);
		}
		const clickMap = clickTargets
			? new Map(Object.entries(clickTargets))
			: undefined;
		const mermaid = generateDecisionMermaid(nodes, rels, labelMode, clickMap);
		const mermaidLines = mermaid.split("\n");
		mermaidLines[0] = `graph ${layout}`;
		return mermaidLines.join("\n");
	},
});
