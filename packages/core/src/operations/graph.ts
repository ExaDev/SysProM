import * as z from "zod";
import { defineOperation } from "./define-operation.js";
import { SysProMDocument, type Relationship, type Node } from "../schema.js";
import {
	sanitiseMermaidId,
	NODE_CATEGORIES,
	mermaidShapeForNode,
	renderMermaidNode,
	renderMermaidClassDefs,
	mermaidClassForNode,
	dotNodeAttrsWithMode,
	filterNodes,
	filterRelationships,
	applyConnectedOnly,
	renderRelationshipLabel,
	renderMermaidClickDirectives,
	type GraphFilterOptions,
	type MermaidClickMap,
} from "./graph-shared.js";

// ---------------------------------------------------------------------------
// DOT generation
// ---------------------------------------------------------------------------

function generateDot(
	nodes: Node[],
	rels: Relationship[],
	cluster: boolean,
	layout: string,
	labelMode: "friendly" | "compact",
): string {
	const lines: string[] = [];
	lines.push("digraph SysProM {");
	// Map mermaid layout to DOT rankdir where needed
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

	if (cluster) {
		for (const cat of NODE_CATEGORIES) {
			const catNodes = nodes.filter((n) => cat.types.includes(n.type));
			if (catNodes.length === 0) continue;
			lines.push(`  subgraph cluster_${cat.name} {`);
			lines.push(`    label="${cat.label}";`);
			lines.push(`    style=filled;`);
			lines.push(`    color="${cat.colour}22";`);
			for (const node of catNodes) {
				lines.push(
					`    "${node.id}" ${dotNodeAttrsWithMode(node, labelMode)};`,
				);
			}
			lines.push("  }");
		}
		const clusteredIds = new Set(
			NODE_CATEGORIES.flatMap((c) =>
				nodes.filter((n) => c.types.includes(n.type)).map((n) => n.id),
			),
		);
		for (const node of nodes) {
			if (!clusteredIds.has(node.id)) {
				lines.push(`  "${node.id}" ${dotNodeAttrsWithMode(node, labelMode)};`);
			}
		}
	} else {
		for (const node of nodes) {
			lines.push(`  "${node.id}" ${dotNodeAttrsWithMode(node, labelMode)};`);
		}
	}

	for (const rel of rels ?? []) {
		const label = renderRelationshipLabel(rel);
		const attrs = [`label="${label}"`];
		if (rel.polarity === "negative") attrs.push("style=dashed");
		if (rel.strength !== undefined && rel.strength >= 0.8) {
			attrs.push("penwidth=2");
		}
		lines.push(`  "${rel.from}" -> "${rel.to}" [${attrs.join(" ")}];`);
	}

	lines.push("}");
	return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Mermaid generation
// ---------------------------------------------------------------------------

function generateMermaid(
	nodes: Node[],
	rels: Relationship[],
	cluster: boolean,
	layout: string,
	labelMode: "friendly" | "compact",
	clickMap?: MermaidClickMap,
): string {
	const lines: string[] = [];
	lines.push(`graph ${layout}`);

	for (const def of renderMermaidClassDefs()) {
		lines.push(`  ${def}`);
	}
	lines.push("");

	const nodeIds = new Set(nodes.map((n) => n.id));

	if (cluster) {
		for (const cat of NODE_CATEGORIES) {
			const catNodes = nodes.filter((n) => cat.types.includes(n.type));
			if (catNodes.length === 0) continue;
			lines.push(`  subgraph ${cat.name} ["${cat.label}"]`);
			for (const node of catNodes) {
				const shape = mermaidShapeForNode(node);
				const cls = mermaidClassForNode(node);
				lines.push(
					`    ${renderMermaidNode(node.id, node.name, shape, labelMode)}:::${cls}`,
				);
			}
			lines.push("  end");
			lines.push("");
		}
		const categorizedTypes = new Set(NODE_CATEGORIES.flatMap((c) => c.types));
		for (const node of nodes) {
			if (categorizedTypes.has(node.type)) continue;
			const shape = mermaidShapeForNode(node);
			const cls = mermaidClassForNode(node);
			lines.push(
				`  ${renderMermaidNode(node.id, node.name, shape, labelMode)}:::${cls}`,
			);
		}
	} else {
		for (const node of nodes) {
			const shape = mermaidShapeForNode(node);
			const cls = mermaidClassForNode(node);
			lines.push(
				`  ${renderMermaidNode(node.id, node.name, shape, labelMode)}:::${cls}`,
			);
		}
	}

	lines.push("");
	for (const rel of rels ?? []) {
		if (!nodeIds.has(rel.from) || !nodeIds.has(rel.to)) continue;
		const fromId = sanitiseMermaidId(rel.from);
		const toId = sanitiseMermaidId(rel.to);
		const label = renderRelationshipLabel(rel);
		let edge = `${fromId} -->|${label}| ${toId}`;
		if (rel.polarity === "negative") {
			edge = `${fromId} -.->|${label}| ${toId}`;
		}
		lines.push(`  ${edge}`);
	}

	lines.push(...renderMermaidClickDirectives(nodes, clickMap));

	return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Graph generation
// ---------------------------------------------------------------------------

function generateGraph(
	doc: SysProMDocument,
	format: string,
	filterOpts: GraphFilterOptions,
	layout: string,
	cluster: boolean,
	labelMode: "friendly" | "compact",
	clickMap?: MermaidClickMap,
): string {
	let nodes = filterNodes(doc.nodes, filterOpts);
	const nodeIds = new Set(nodes.map((n) => n.id));
	let rels = filterRelationships(doc.relationships ?? [], filterOpts, nodeIds);

	if (filterOpts.connectedOnly) {
		nodes = applyConnectedOnly(nodes, rels);
		rels = filterRelationships(rels, {}, new Set(nodes.map((n) => n.id)));
	}

	if (format === "dot") {
		// Historically DOT output used left-right rankdir by default regardless
		// of the Mermaid default layout. Preserve that behaviour: if the
		// requested layout is the Mermaid default "TD", map it to "LR" for DOT
		// so existing tests and callers keep expecting LR unless another layout
		// was explicitly chosen.
		const dotLayout = layout === "TD" ? "LR" : layout;
		return generateDot(nodes, rels, cluster, dotLayout, labelMode);
	}

	return generateMermaid(nodes, rels, cluster, layout, labelMode, clickMap);
}

/** Generate a graph of a SysProM document in Mermaid or DOT format, with optional filtering. */
export const graphOp = defineOperation({
	name: "graph",
	description:
		"Generate a graph of the SysProM document in Mermaid or DOT format, with optional filtering by node type, node ID, or relationship type.",
	input: z.object({
		doc: SysProMDocument,
		format: z.enum(["mermaid", "dot"]).default("mermaid"),
		typeFilter: z.string().optional(),
		nodeTypes: z.array(z.string()).optional(),
		nodeIds: z.array(z.string()).optional(),
		relTypes: z.array(z.string()).optional(),
		layout: z.enum(["LR", "TD", "RL", "BT"]).default("TD"),
		cluster: z.boolean().default(true),
		labelMode: z.enum(["friendly", "compact"]).default("friendly"),
		connectedOnly: z.boolean().default(false),
		clickTargets: z.record(z.string(), z.string()).optional(),
	}),
	output: z.string(),
	fn({
		doc,
		format,
		typeFilter,
		nodeTypes,
		nodeIds,
		relTypes,
		layout,
		cluster,
		labelMode,
		connectedOnly,
		clickTargets,
	}) {
		const filterOpts: GraphFilterOptions = {
			nodeTypes,
			nodeIds,
			relTypes: relTypes ?? (typeFilter ? [typeFilter] : undefined),
			connectedOnly,
		};
		const clickMap = clickTargets
			? new Map(Object.entries(clickTargets))
			: undefined;
		return generateGraph(
			doc,
			format,
			filterOpts,
			layout,
			cluster,
			labelMode,
			clickMap,
		);
	},
});
