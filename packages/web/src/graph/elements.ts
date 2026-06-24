/**
 * Build Cytoscape element descriptors directly from a SysProM document.
 *
 * The document is the single source of truth — we never parse a Mermaid string.
 * Nodes map to Cytoscape nodes, relationships map to Cytoscape edges, with
 * deduplication by a composite key.
 */
import type { Core, ElementDefinition } from "cytoscape";
import type { SysProMDocument } from "@sysprom/core";
import { primaryLifecycleState } from "@sysprom/core";

/** The SysProM abstraction layers, in canonical refinement order. */
export const ABSTRACTION_LAYERS = [
	"intent",
	"concept",
	"capability",
	"element",
	"realisation",
	"artefact",
] as const;

/**
 * A numeric rank for each node type, used by the ELK layered layout to group
 * nodes by abstraction layer. Types not in the canonical chain are ordered
 * after it but kept stable.
 */
const LAYER_RANK: Readonly<Record<string, number>> = {
	intent: 0,
	concept: 1,
	capability: 2,
	element: 3,
	realisation: 4,
	artefact: 5,
	invariant: 6,
	principle: 7,
	policy: 8,
	protocol: 9,
	stage: 10,
	role: 11,
	gate: 12,
	mode: 13,
	decision: 14,
	change: 15,
	view: 16,
	milestone: 17,
};

/** Map a node type to its ELK layered-layout rank. Lower = earlier layer. */
export function layerRank(type: string): number {
	return LAYER_RANK[type] ?? 99;
}

/** Determine whether a node status indicates incompleteness (dashed style). */
export function isPendingStatus(status: string | undefined): boolean {
	return (
		status === "proposed" || status === "deferred" || status === "experimental"
	);
}

/** Determine whether a node status indicates deprecation (dimmed style). */
export function isDeprecatedStatus(status: string | undefined): boolean {
	return (
		status === "deprecated" ||
		status === "retired" ||
		status === "superseded" ||
		status === "abandoned"
	);
}

/** Extra data carried on each Cytoscape node element. */
export interface SyspromNodeData {
	id: string;
	type: string;
	name: string;
	status: string | undefined;
	lifecycle: Record<string, boolean | string> | undefined;
	description: string | undefined;
	hasSubsystem: boolean;
	subsystemNodeCount: number;
	layerRank: number;
}

/** Extra data carried on each Cytoscape edge element. */
export interface SyspromEdgeData {
	id: string;
	source: string;
	target: string;
	type: string;
	polarity: string | undefined;
	strength: number | undefined;
}

/** Build Cytoscape element definitions from a parsed SysProM document. */
export function buildElements(doc: SysProMDocument): ElementDefinition[] {
	const elements: ElementDefinition[] = [];
	const seenEdges = new Set<string>();

	for (const node of doc.nodes) {
		const status = primaryLifecycleState(node);
		const subsystem = node.subsystem;
		const description =
			typeof node.description === "string" ? node.description : undefined;
		const subsystemNodeCount = subsystem ? subsystem.nodes.length : 0;
		const data: SyspromNodeData = {
			id: node.id,
			type: node.type,
			name: node.name,
			status,
			lifecycle: node.lifecycle,
			description,
			hasSubsystem: subsystem !== undefined,
			subsystemNodeCount,
			layerRank: layerRank(node.type),
		};
		elements.push({ group: "nodes", data });
	}

	const relationships = doc.relationships ?? [];
	for (const rel of relationships) {
		const id = `${rel.from}->${rel.to}:${rel.type}`;
		if (seenEdges.has(id)) continue;
		seenEdges.add(id);
		const data: SyspromEdgeData = {
			id,
			source: rel.from,
			target: rel.to,
			type: rel.type,
			polarity: rel.polarity,
			strength: rel.strength,
		};
		elements.push({ group: "edges", data });
	}

	return elements;
}

/**
 * Return the set of element IDs adjacent to a given node ID in a Cytoscape
 * instance (the node, its connected edges, and the edges' other endpoints).
 * Used for neighbourhood highlighting.
 */
export function neighbourhoodElementIds(cy: Core, nodeId: string): Set<string> {
	const result = new Set<string>();
	const node = cy.getElementById(nodeId);
	if (node.empty()) return result;
	result.add(nodeId);
	node.connectedEdges().forEach((edge) => {
		result.add(edge.id());
		result.add(edge.source().id());
		result.add(edge.target().id());
	});
	return result;
}
