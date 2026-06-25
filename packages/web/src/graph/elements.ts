/**
 * Build Cytoscape element descriptors directly from a SysProM document.
 *
 * The document is the single source of truth — we never parse a Mermaid string.
 * Nodes map to Cytoscape nodes, relationships map to Cytoscape edges, with
 * deduplication by a composite key.
 *
 * Relationship types are split into two families so the layout engines can
 * rank on the structural backbone (refinement / decomposition / realisation)
 * and treat the cross-cutting edges (governance, constraint, impact) as
 * overlays that never drive the ranking.
 */
import type { Core, ElementDefinition } from "cytoscape";
import type { SysProMDocument, Node, Relationship } from "@sysprom/core";
import { primaryLifecycleState } from "@sysprom/core";

/**
 * Backbone relationship types — the structural refinement / decomposition /
 * realisation edges. These define the direction of the model: intents sit at
 * the top, realisations and artefacts at the leaves, purely because the edges
 * flow that way (not from a node-type taxonomy).
 */
export const BACKBONE_REL_TYPES: ReadonlySet<string> = new Set([
	"refines",
	"part_of",
	"realises",
	"implements",
	"precedes",
	"must_follow",
]);

/**
 * Cross-cutting relationship types — governance, constraint, dependency, and
 * impact edges that span the refinement hierarchy. They are drawn as overlays
 * between already-positioned nodes and must never drive the ranking.
 */
export const CROSS_CUTTING_REL_TYPES: ReadonlySet<string> = new Set([
	"affects",
	"must_preserve",
	"depends_on",
	"constrained_by",
	"governed_by",
	"supersedes",
	"modifies",
	"produces",
]);

/**
 * Emergent topology relationship types — the backbone plus the governance /
 * constraint / dependency / impact edges that connect decisions, changes,
 * invariants, principles, and policies to the rest of the model. Every
 * relationship type is included *except* `supersedes`, which is pure
 * historical replacement and adds noise without contributing to clustering.
 *
 * The Refinement hierarchy uses the strict backbone (a clean top-down tree);
 * the Emergent topology uses this broader set so that decisions cluster near
 * the capabilities they affect, invariants near the nodes they constrain, and
 * changes near the nodes they modify — instead of being packed into a
 * disconnected grid block.
 */
export const EMERGENT_REL_TYPES: ReadonlySet<string> = new Set([
	...BACKBONE_REL_TYPES,
	"affects",
	"must_preserve",
	"depends_on",
	"constrained_by",
	"governed_by",
	"modifies",
	"produces",
]);

/** True if a relationship type belongs to the structural backbone. */
export function isBackboneRelationship(type: string): boolean {
	return BACKBONE_REL_TYPES.has(type);
}

/** True if a relationship type is cross-cutting (governance / constraint / impact). */
export function isCrossCuttingRelationship(type: string): boolean {
	return CROSS_CUTTING_REL_TYPES.has(type);
}

/**
 * True if a relationship type drives the Emergent topology layout — the
 * backbone plus governance / impact edges (everything except `supersedes`).
 */
export function isEmergentRelationship(type: string): boolean {
	return EMERGENT_REL_TYPES.has(type);
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
	/**
	 * ID of the compound parent for the "By subsystem" layout, or undefined for
	 * top-level nodes. Populated by `buildSubsystemElements`.
	 */
	parent: string | undefined;
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
			parent: undefined,
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

// ---------------------------------------------------------------------------
// Subsystem clustering — flatten the recursive document tree into a compound
// graph for the "By subsystem" layout.
// ---------------------------------------------------------------------------

/** A node paired with the ID of the subsystem cluster that owns it. */
export interface ClusteredNode {
	readonly node: Node;
	/** Cluster parent ID: the owning subsystem node's ID, or "root" for top level. */
	readonly clusterId: string;
}

/** Cluster (compound parent) descriptor for the subsystem layout. */
export interface SubsystemCluster {
	readonly id: string;
	readonly name: string;
	readonly nodeCount: number;
}

/** Result of flattening a document into clustered nodes plus cluster metadata. */
export interface FlattenedDocument {
	readonly clusteredNodes: readonly ClusteredNode[];
	readonly clusters: readonly SubsystemCluster[];
	/** All relationships across all levels of the tree. */
	readonly relationships: readonly Relationship[];
}

/**
 * Flatten the recursive SysProM document tree into a single list of nodes
 * tagged with the ID of the subsystem cluster they belong to. Top-level nodes
 * belong to the synthetic "root" cluster; nodes inside a node's `subsystem`
 * belong to that owner's cluster. Relationships are gathered from every level.
 *
 * Nesting deeper than one level is supported: a node inside a nested subsystem
 * is assigned to its immediate parent cluster.
 */
export function flattenWithSubsystem(doc: SysProMDocument): FlattenedDocument {
	const clusteredNodes: ClusteredNode[] = [];
	const relationships: Relationship[] = [];
	const clusterCounts = new Map<string, number>();

	const visit = (nodes: readonly Node[], clusterId: string): void => {
		for (const node of nodes) {
			clusteredNodes.push({ node, clusterId });
			clusterCounts.set(clusterId, (clusterCounts.get(clusterId) ?? 0) + 1);
			const subsystem = node.subsystem;
			if (subsystem) {
				if (subsystem.relationships) {
					relationships.push(...subsystem.relationships);
				}
				visit(subsystem.nodes, node.id);
			}
		}
	};

	if (doc.relationships) {
		relationships.push(...doc.relationships);
	}
	visit(doc.nodes, "root");

	const ownerName = new Map<string, string>();
	for (const cn of clusteredNodes) {
		ownerName.set(cn.node.id, cn.node.name);
	}

	const clusters: SubsystemCluster[] = [...clusterCounts.entries()]
		.map(([id, count]) => ({
			id,
			name: clusterDisplayName(id, ownerName),
			nodeCount: count,
		}))
		.sort(compareClusters);

	return { clusteredNodes, clusters, relationships };
}

/** Human-readable name for a cluster: "Top level" for root, else the owner node's name. */
function clusterDisplayName(
	id: string,
	ownerName: ReadonlyMap<string, string>,
): string {
	if (id === "root") return "Top level";
	return ownerName.get(id) ?? id;
}

/** Sort clusters: root first, then the rest alphabetically by name. */
function compareClusters(a: SubsystemCluster, b: SubsystemCluster): number {
	if (a.id === "root") return -1;
	if (b.id === "root") return 1;
	return a.name.localeCompare(b.name);
}

/**
 * Build Cytoscape element definitions for the "By subsystem" compound layout:
 * one compound parent per cluster, child nodes nested under their cluster, and
 * edges from every level of the tree. Compound parents render as labelled
 * bounding boxes around their children when fcose runs in compound mode.
 */
export function buildSubsystemElements(
	doc: SysProMDocument,
): ElementDefinition[] {
	const { clusteredNodes, clusters, relationships } = flattenWithSubsystem(doc);
	const elements: ElementDefinition[] = [];
	const seenEdges = new Set<string>();

	// Compound parent nodes — one per cluster.
	for (const cluster of clusters) {
		elements.push({
			group: "nodes",
			data: {
				id: clusterId(cluster.id),
				name: `${cluster.name} (${String(cluster.nodeCount)})`,
				type: "cluster",
			},
		});
	}

	// Child nodes, each pointing at its compound parent.
	for (const { node, clusterId: owner } of clusteredNodes) {
		const status = primaryLifecycleState(node);
		const subsystem = node.subsystem;
		const description =
			typeof node.description === "string" ? node.description : undefined;
		const data: SyspromNodeData = {
			id: node.id,
			type: node.type,
			name: node.name,
			status,
			lifecycle: node.lifecycle,
			description,
			hasSubsystem: subsystem !== undefined,
			subsystemNodeCount: subsystem ? subsystem.nodes.length : 0,
			parent: clusterId(owner),
		};
		elements.push({ group: "nodes", data });
	}

	// Edges across all levels. Compound parents are never edge endpoints.
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
 * Compound parent ID for a cluster. Prefixed so it cannot collide with real
 * node IDs (which match type-prefix patterns like `INT1`, `ELEM5`).
 */
function clusterId(ownerId: string): string {
	return `cluster:${ownerId}`;
}
