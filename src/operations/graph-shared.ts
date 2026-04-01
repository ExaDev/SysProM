import { type Node, type Relationship, NODE_FILE_MAP } from "../schema.js";

// ---------------------------------------------------------------------------
// Mermaid ID sanitisation
// ---------------------------------------------------------------------------

/**
 * Sanitise an identifier for use in Mermaid diagrams by replacing
 * non-alphanumeric/underscore characters with an underscore.
 * @param id - Identifier to sanitise
 * @example
 * // sanitiseMermaidId('I1:Name') // 'I1_Name'
 */
export function sanitiseMermaidId(id: string): string {
	return id.replace(/[^\w]/g, "_");
}

// ---------------------------------------------------------------------------
// Node type categories (clusters)
// ---------------------------------------------------------------------------

/**
 *
 */
export interface NodeCategory {
	name: string;
	label: string;
	types: string[];
	colour: string;
	textColour: string;
}

export const NODE_CATEGORIES: NodeCategory[] = [
	{
		name: "intent",
		label: "Intent",
		types: NODE_FILE_MAP.INTENT,
		colour: "#4A90D9",
		textColour: "#fff",
	},
	{
		name: "state",
		label: "State",
		types: NODE_FILE_MAP.STATE,
		colour: "#67A86B",
		textColour: "#fff",
	},
	{
		name: "invariant",
		label: "Invariants",
		types: NODE_FILE_MAP.INVARIANTS,
		colour: "#E8913A",
		textColour: "#fff",
	},
	{
		name: "decision",
		label: "Decisions",
		types: NODE_FILE_MAP.DECISIONS,
		colour: "#9B59B6",
		textColour: "#fff",
	},
	{
		name: "change",
		label: "Changes",
		types: NODE_FILE_MAP.CHANGES,
		colour: "#E74C3C",
		textColour: "#fff",
	},
	{
		name: "meta",
		label: "Meta",
		types: ["view", "milestone"],
		colour: "#95A5A6",
		textColour: "#fff",
	},
];

/**
 * Return the category for a given node. Falls back to the last category
 * if the node type is unknown.
 * @param node - Node to obtain category for
 * @example
 * // categoryForNode(node).name
 */
export function categoryForNode(node: Node): NodeCategory {
	return (
		NODE_CATEGORIES.find((c) => c.types.includes(node.type)) ??
		NODE_CATEGORIES[NODE_CATEGORIES.length - 1]
	);
}

/**
 * Return the category for a node type.
 * @param type - Node type string
 * @example
 * // categoryForType('intent').name // 'intent'
 */
export function categoryForType(type: string): NodeCategory {
	return (
		NODE_CATEGORIES.find((c) => c.types.includes(type)) ??
		NODE_CATEGORIES[NODE_CATEGORIES.length - 1]
	);
}

// ---------------------------------------------------------------------------
// Mermaid shape helpers
// ---------------------------------------------------------------------------

/**
 *
 */
export type MermaidShape =
	| "rounded"
	| "rectangle"
	| "rhombus"
	| "parallelogram";

const NODE_TYPE_SHAPES: Record<string, MermaidShape> = {
	intent: "rounded",
	concept: "rounded",
	capability: "rounded",
	element: "rectangle",
	realisation: "rectangle",
	invariant: "parallelogram",
	principle: "parallelogram",
	policy: "parallelogram",
	protocol: "rectangle",
	stage: "rectangle",
	role: "rectangle",
	gate: "rectangle",
	mode: "rectangle",
	artefact: "rectangle",
	decision: "rhombus",
	change: "rectangle",
	view: "rectangle",
	milestone: "rectangle",
};

/**
 * Map a node to its Mermaid shape.
 * @param node - Node to determine shape for
 * @example
 */
export function mermaidShapeForNode(node: Node): MermaidShape {
	return NODE_TYPE_SHAPES[node.type] ?? "rectangle";
}

/**
 * Render a Mermaid node definition for a node id/name/shape.
 * @param id - Node id
 * @param name - Node name
 * @param shape - Shape to render
 * @param mode - Label mode, friendly shows id and name, compact shows id only
 * @example
 */
export function renderMermaidNode(
	id: string,
	name: string,
	shape: MermaidShape,
	mode: "friendly" | "compact" = "friendly",
): string {
	const safeId = sanitiseMermaidId(id);
	const label = mode === "compact" ? id : `${id}: ${name}`;
	switch (shape) {
		case "rounded":
			return `${safeId}([${label}])`;
		case "rhombus":
			return `${safeId}{{${label}}}`;
		case "parallelogram":
			return `${safeId}[/${label}/]`;
		case "rectangle":
		default:
			return `${safeId}[${label}]`;
	}
}

/**
 * Render a human-friendly relationship label including polarity and strength
 * @param rel
 * @example
 */
export function renderRelationshipLabel(rel: Relationship): string {
	const parts: string[] = [];
	if (rel.polarity) parts.push(rel.polarity);
	if (rel.strength !== undefined) parts.push(rel.strength.toFixed(2));
	if (parts.length === 0) return rel.type;
	return `${rel.type} (${parts.join(", ")})`;
}

// ---------------------------------------------------------------------------
// Mermaid classDef generation
// ---------------------------------------------------------------------------

/**
 * @example
 */
export function renderMermaidClassDefs(): string[] {
	return NODE_CATEGORIES.map(
		(c) => `classDef ${c.name} fill:${c.colour},color:${c.textColour}`,
	);
}

/**
 * @param node
 * @example
 */
export function mermaidClassForNode(node: Node): string {
	return categoryForNode(node).name;
}

// ---------------------------------------------------------------------------
// DOT attribute helpers
// ---------------------------------------------------------------------------

/**
 * @param node
 * @example
 */
export function dotNodeAttrs(node: Node): string {
	const cat = categoryForNode(node);
	const shape = dotShapeForNode(node);
	return `[label="${node.id}\\n${node.name}" shape=${shape} style=filled fillcolor="${cat.colour}" fontcolor="${cat.textColour}"]`;
}

/**
 * Format a node label according to a mode. "friendly" shows id and name,
 * "compact" shows only the id.
 * @param node
 * @param mode
 * @example
 */
export function formatNodeLabel(node: Node, mode: "friendly" | "compact") {
	if (mode === "compact") return node.id;
	return `${node.id}: ${node.name}`;
}

// Backwards-compatible wrapper to allow optional labelMode parameter

/**
 * @param node
 * @param mode
 * @example
 */
export function dotNodeAttrsWithMode(
	node: Node,
	mode: "friendly" | "compact" = "friendly",
) {
	const cat = categoryForNode(node);
	const shape = dotShapeForNode(node);
	const label = mode === "compact" ? node.id : `${node.id}\\n${node.name}`;
	return `[label="${label}" shape=${shape} style=filled fillcolor="${cat.colour}" fontcolor="${cat.textColour}"]`;
}

function dotShapeForNode(node: Node): string {
	const s = mermaidShapeForNode(node);
	switch (s) {
		case "rounded":
			return "box";
		case "rhombus":
			return "diamond";
		case "parallelogram":
			return "parallelogram";
		case "rectangle":
		default:
			return "box";
	}
}

// ---------------------------------------------------------------------------
// Node filtering
// ---------------------------------------------------------------------------

/**
 *
 */
export interface GraphFilterOptions {
	nodeTypes?: string[];
	nodeIds?: string[];
	relTypes?: string[];
	connectedOnly?: boolean;
}

/**
 * @param nodes
 * @param opts
 * @example
 */
export function filterNodes(nodes: Node[], opts: GraphFilterOptions): Node[] {
	const { nodeTypes, nodeIds } = opts;

	if (nodeTypes && nodeTypes.length > 0) {
		nodes = nodes.filter((n) => nodeTypes.includes(n.type));
	}
	if (nodeIds && nodeIds.length > 0) {
		nodes = nodes.filter((n) => nodeIds.includes(n.id));
	}
	return nodes;
}

/**
 * @param rels
 * @param opts
 * @param allowedNodeIds
 * @example
 */
export function filterRelationships(
	rels: Relationship[],
	opts: GraphFilterOptions,
	allowedNodeIds?: Set<string>,
): Relationship[] {
	const { relTypes } = opts;

	if (relTypes && relTypes.length > 0) {
		rels = rels.filter((r) => relTypes.includes(r.type));
	}
	if (allowedNodeIds) {
		rels = rels.filter(
			(r) => allowedNodeIds.has(r.from) && allowedNodeIds.has(r.to),
		);
	}
	return rels;
}

/**
 * @param nodes
 * @param rels
 * @example
 */
export function applyConnectedOnly(
	nodes: Node[],
	rels: Relationship[],
): Node[] {
	const connectedIds = new Set<string>();
	for (const r of rels) {
		connectedIds.add(r.from);
		connectedIds.add(r.to);
	}
	return nodes.filter((n) => connectedIds.has(n.id));
}
