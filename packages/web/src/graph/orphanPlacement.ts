/**
 * Orphan node placement — prevents disconnected nodes from tiling into a dense
 * grid square after the primary layout settles.
 *
 * Two concerns are handled here:
 *
 * 1. **View nodes** — view nodes link to their members via the `includes`
 *    data field (an array of node IDs), not via relationships. After the
 *    primary layout settles, each view node is repositioned to the centroid of
 *    its includes members that are visible and already positioned. This places
 *    the view near the centre of its members without distorting the layout
 *    (synthetic edges would create a star topology that hierarchical and
 *    force-directed layouts handle poorly when a view includes many nodes).
 *
 * 2. **Truly-orphan nodes** — nodes with no relationship edges AND not
 *    included in any view. After the primary layout settles we identify these
 *    nodes (they have zero incident edges in the layout subgraph) and
 *    reposition them in a loose arc around the periphery of the laid-out
 *    bounding box, so they read as "unlinked" rather than forming a dense
 *    block.
 *
 * The arc and centroid placement are pure functions, so they can be
 * unit-tested without a Cytoscape instance.
 */
import type { Core, NodeCollection, Position } from "cytoscape";

import type { SysProMDocument, Node } from "@sysprom/core";

/**
 * A positioned node: ID plus x/y coordinates. The minimal shape needed to
 * compute peripheral orphan placement.
 */
export interface PositionedNode {
	readonly id: string;
	readonly x: number;
	readonly y: number;
}

/**
 * An axis-aligned bounding box in layout coordinate space.
 */
export interface BoundingBox {
	readonly x1: number;
	readonly y1: number;
	readonly x2: number;
	readonly y2: number;
}

/**
 * Compute the bounding box of a set of positioned nodes. Returns `undefined`
 * if the set is empty.
 */
export function boundingBox(
	nodes: readonly PositionedNode[],
): BoundingBox | undefined {
	if (nodes.length === 0) return undefined;
	const first = nodes[0];
	let x1 = first.x;
	let y1 = first.y;
	let x2 = first.x;
	let y2 = first.y;
	for (const node of nodes) {
		if (node.x < x1) x1 = node.x;
		if (node.y < y1) y1 = node.y;
		if (node.x > x2) x2 = node.x;
		if (node.y > y2) y2 = node.y;
	}
	return { x1, y1, x2, y2 };
}

/**
 * Compute the centroid (arithmetic mean position) of a set of positioned
 * nodes. Returns `undefined` if the set is empty.
 *
 * Used to place a view node at the centre of its `includes` members after
 * the primary layout has positioned them.
 */
export function centroid(
	nodes: readonly PositionedNode[],
): Position | undefined {
	if (nodes.length === 0) return undefined;
	let sx = 0;
	let sy = 0;
	for (const node of nodes) {
		sx += node.x;
		sy += node.y;
	}
	return { x: sx / nodes.length, y: sy / nodes.length };
}

/**
 * Compute positions for a set of orphan nodes arranged in a loose arc along
 * the bottom edge of the bounding box, spread across its full width.
 *
 * The arc sits below the main mass with a vertical gap proportional to the
 * box height, so orphans read as a separate "unlinked" cluster rather than
 * overlapping positioned nodes. Nodes are spaced evenly left-to-right with a
 * per-node gap derived from the box width.
 *
 * Returns a map from node ID to `{ x, y }` position.
 */
export function placeOrphansInArc(
	orphanIds: readonly string[],
	box: BoundingBox,
): Map<string, Position> {
	const positions = new Map<string, Position>();
	if (orphanIds.length === 0) return positions;

	const width = box.x2 - box.x1;
	const height = box.y2 - box.y1;

	// Vertical gap below the main mass: at least 150px, scales with height.
	const gap = Math.max(150, height * 0.25);
	const arcY = box.y2 + gap;

	// Horizontal padding so orphans don't start exactly at the left edge.
	const sidePadding = Math.max(80, width * 0.05);
	const usableWidth = width + sidePadding * 2;

	// Spread orphans evenly across the width. For a single orphan, centre it.
	if (orphanIds.length === 1) {
		const cx = (box.x1 + box.x2) / 2;
		positions.set(orphanIds[0], { x: cx, y: arcY });
		return positions;
	}

	const step = usableWidth / (orphanIds.length - 1);
	for (let i = 0; i < orphanIds.length; i++) {
		const id = orphanIds[i];
		const x = box.x1 - sidePadding + step * i;
		positions.set(id, { x, y: arcY });
	}
	return positions;
}

/**
 * Determine which node IDs are orphans relative to a set of edges: a node is
 * an orphan if no edge in the set has it as a source or target.
 *
 * Both `nodeIds` and `edges` should reflect the layout subgraph — i.e. the
 * edges that were active for the layout, not the full overlay set.
 */
export function identifyOrphans(
	nodeIds: readonly string[],
	edges: readonly { readonly source: string; readonly target: string }[],
): string[] {
	const connected = new Set<string>();
	for (const edge of edges) {
		connected.add(edge.source);
		connected.add(edge.target);
	}
	return nodeIds.filter((id) => !connected.has(id));
}

/**
 * Type guard extracting a `string[]` from a node's `includes` field using
 * safe `in`-based narrowing (no index-signature access or `as` casts).
 */
function readIncludes(node: Node): string[] {
	if (!("includes" in node)) return [];
	const value = node.includes;
	if (!Array.isArray(value)) return [];
	return value.filter((item): item is string => typeof item === "string");
}

// ---------------------------------------------------------------------------
// Cytoscape integration — operate on a live instance after layout settles.
// ---------------------------------------------------------------------------

/**
 * After the primary layout has settled, reposition view nodes to the centroid
 * of their `includes` members, then place truly-orphan nodes (no incident
 * layout edges and not in any view) in a loose arc along the bottom periphery
 * of the laid-out bounding box.
 *
 * The `layoutEdges` parameter is the set of edges that drove the layout
 * (backbone for Refinement, emergent for Emergent topology, all for Overview).
 * A node is an orphan only if none of these edges touch it. Overlay edges
 * (hidden during layout) do not count — they were not part of the ranking.
 *
 * The bounding box for the arc is computed from connected (non-orphan) nodes
 * only, so the arc sits below the main laid-out mass rather than being skewed
 * by orphan positions that the primary layout may have scattered.
 *
 * The `doc` provides view `includes` membership data so view nodes can be
 * positioned at their members' centroid.
 */
export function placeOrphansAfterLayout(
	cy: Core,
	doc: SysProMDocument,
	layoutEdges: ReadonlySet<string>,
): void {
	const visibleNodes = cy.nodes(":visible");
	const viewIncludes = collectViewIncludes(doc);
	const viewIds = new Set(viewIncludes.keys());

	const orphanIds = identifyLayoutOrphans(visibleNodes, viewIds, layoutEdges);
	placeOrphanArc(cy, visibleNodes, orphanIds, viewIds);
	placeViewsAtCentroid(cy, viewIncludes);
}

/**
 * Build a map of view node ID -> includes member IDs from the document.
 * Only views with a non-empty `includes` array are included.
 */
function collectViewIncludes(doc: SysProMDocument): Map<string, string[]> {
	const result = new Map<string, string[]>();
	for (const node of doc.nodes) {
		if (node.type !== "view") continue;
		const includes = readIncludes(node);
		if (includes.length > 0) result.set(node.id, includes);
	}
	return result;
}

/**
 * Identify visible nodes that have zero incident edges in the `layoutEdges`
 * set, excluding view nodes (which are positioned at their members' centroid
 * rather than in the orphan arc).
 */
function identifyLayoutOrphans(
	visibleNodes: NodeCollection,
	viewIds: Set<string>,
	layoutEdges: ReadonlySet<string>,
): Set<string> {
	const orphans = new Set<string>();
	for (const node of visibleNodes) {
		const id = node.id();
		if (viewIds.has(id)) continue;
		let hasLayoutEdge = false;
		const incident = node.connectedEdges();
		for (const edge of incident) {
			if (layoutEdges.has(edge.id())) {
				hasLayoutEdge = true;
				break;
			}
		}
		if (!hasLayoutEdge) orphans.add(id);
	}
	return orphans;
}

/**
 * Reposition orphan nodes into a peripheral arc below the connected mass.
 * The bounding box is computed from connected (non-orphan, non-view) nodes
 * only, so the arc sits below the main laid-out mass.
 */
function placeOrphanArc(
	cy: Core,
	visibleNodes: NodeCollection,
	orphanIds: Set<string>,
	viewIds: Set<string>,
): void {
	if (orphanIds.size === 0) return;
	const connected: PositionedNode[] = [];
	for (const node of visibleNodes) {
		const id = node.id();
		if (orphanIds.has(id) || viewIds.has(id)) continue;
		const pos = node.position();
		connected.push({ id, x: pos.x, y: pos.y });
	}
	const box = boundingBox(connected);
	if (box === undefined) return;
	const placements = placeOrphansInArc([...orphanIds], box);
	for (const [id, pos] of placements) {
		cy.getElementById(id).position(pos);
	}
}

/**
 * Reposition each view node to the centroid of its visible members.
 * Runs after orphan arc placement so the centroid reflects final positions.
 */
function placeViewsAtCentroid(
	cy: Core,
	viewIncludes: Map<string, string[]>,
): void {
	for (const [viewId, memberIds] of viewIncludes) {
		const viewNode = cy.getElementById(viewId);
		if (viewNode.empty()) continue;
		const memberPositions: PositionedNode[] = [];
		for (const memberId of memberIds) {
			const memberNode = cy.getElementById(memberId);
			if (memberNode.empty() || !memberNode.is(":visible")) continue;
			const pos = memberNode.position();
			memberPositions.push({ id: memberId, x: pos.x, y: pos.y });
		}
		const center = centroid(memberPositions);
		if (center !== undefined) {
			viewNode.position(center);
		}
	}
}
