/**
 * Orphan node placement — prevents disconnected nodes from tiling into a dense
 * grid square or collapsing into a single horizontal line after the primary
 * layout settles.
 *
 * Three concerns are handled here:
 *
 * 1. **View nodes** — view nodes link to their members via the `includes`
 *    data field (an array of node IDs), not via relationships. After the
 *    primary layout settles, each view node with at least one visible
 *    included member is repositioned to the centroid of those members. This
 *    places the view near the centre of its members without distorting the
 *    layout (synthetic edges would create a star topology that hierarchical
 *    and force-directed layouts handle poorly when a view includes many
 *    nodes). A view with no visible members is treated as an orphan and falls
 *    through to the type-grouped placement below.
 *
 * 2. **Truly-orphan nodes** — nodes with no relationship edges AND not
 *    included in any view with visible members. After the primary layout
 *    settles we identify these nodes (they have zero incident edges in the
 *    layout subgraph) and reposition them in **type-grouped clusters around
 *    the periphery** of the laid-out bounding box, so they read as
 *    intentional grouped sets ("the invariants", "the decisions", …) rather
 *    than detached clutter.
 *
 * 3. **Cluster labels** — each type-group is annotated with a labelled
 *    compound-style node (e.g. "Invariants (11)") positioned just outside
 *    the group, reusing the same `type: "cluster"` rendering the "By
 *    subsystem" layout uses for its compound parents.
 *
 * The grouping, peripheral anchoring, and centroid placement are pure
 * functions, so they can be unit-tested without a Cytoscape instance.
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
 * A typed group of orphan node IDs, in the order they should be laid out
 * within their cluster. The `type` is the SysProM node type (e.g.
 * `"invariant"`, `"decision"`); `label` is the human-readable cluster title
 * (e.g. `"Invariants"`).
 */
export interface OrphanGroup {
	readonly type: string;
	readonly label: string;
	readonly ids: readonly string[];
}

/**
 * A label descriptor for a placed orphan cluster: the synthetic node ID to
 * use for the label, the display label text, and where to position it.
 */
export interface OrphanLabel {
	readonly id: string;
	readonly label: string;
	readonly x: number;
	readonly y: number;
}

/**
 * Result of placing orphan groups: per-node positions plus per-group labels.
 */
export interface OrphanPlacement {
	readonly positions: ReadonlyMap<string, Position>;
	readonly labels: readonly OrphanLabel[];
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
 * Minimum centre-to-centre distance that must hold between any two nodes
 * after a layout settles. This is the layout's hard clearance invariant: no
 * two nodes may overlap or sit closer than this in the final rendered
 * positions.
 *
 * The value is derived from the stylesheet's node size (28px → 14px radius),
 * doubled for the two-node pair, plus a 28px breathing-gap so labels and
 * selection borders never collide either: 14 + 14 + 28 = 56.
 */
export const MIN_NODE_CLEARANCE = 56;

/**
 * Maximum number of separation iterations. Each iteration scans every
 * violating pair once and pushes them apart; thirty iterations converges on
 * the sample document (223 nodes) without measurable cost.
 */
const CLEARANCE_ITERATIONS = 30;

/**
 * A node with its bounding radius for clearance resolution. `fixed` nodes
 * are not moved (e.g. compound parents that anchor a cluster).
 */
export interface ClearanceNode {
	readonly id: string;
	x: number;
	y: number;
	readonly radius: number;
	readonly fixed: boolean;
}

/**
 * Resolve a single pair of nodes that are too close, returning the
 * displacement to apply to each (`a` moves by `ax/ay`, `b` by `bx/by`).
 * Returns zeroes when the pair already satisfies the clearance or both nodes
 * are fixed. Pure: does not mutate its inputs.
 */
function resolvePair(
	a: ClearanceNode,
	b: ClearanceNode,
): {
	readonly ax: number;
	readonly ay: number;
	readonly bx: number;
	readonly by: number;
} {
	const dx = b.x - a.x;
	const dy = b.y - a.y;
	const distSq = dx * dx + dy * dy;
	const target = a.radius + b.radius + MIN_NODE_CLEARANCE;
	const zero = { ax: 0, ay: 0, bx: 0, by: 0 };
	if (distSq >= target * target) return zero;
	const dist = Math.sqrt(distSq) || 0.0001;
	const overlap = target - dist;
	const ux = dx / dist;
	const uy = dy / dist;
	if (a.fixed && b.fixed) return zero;
	if (a.fixed) return { ax: 0, ay: 0, bx: ux * overlap, by: uy * overlap };
	if (b.fixed) return { ax: -ux * overlap, ay: -uy * overlap, bx: 0, by: 0 };
	return {
		ax: -(ux * overlap) / 2,
		ay: -(uy * overlap) / 2,
		bx: (ux * overlap) / 2,
		by: (uy * overlap) / 2,
	};
}

/**
 * Iteratively push apart any pair of nodes whose centre-to-centre distance is
 * less than `MIN_NODE_CLEARANCE`, so the clearance invariant holds in the
 * final positions. Fixed nodes are never moved; the moving node absorbs the
 * full displacement for a fixed/moving pair, otherwise each absorbs half.
 *
 * Mutates the `x`/`y` of the supplied `ClearanceNode` objects in place —
 * callers build these fresh from Cytoscape positions and write the resolved
 * values back, so no live renderer state is touched here.
 *
 * This is a bounded greedy relaxation: it always terminates (capped at
 * `CLEARANCE_ITERATIONS`) and removes every violation a single pass can
 * resolve. On the SysProM sample the budget converges; if it ever does not,
 * the worst case is reduced (not increased) overlap.
 */
export function enforceClearance(nodes: ClearanceNode[]): void {
	if (nodes.length < 2) return;
	for (let iter = 0; iter < CLEARANCE_ITERATIONS; iter++) {
		let violations = 0;
		for (let i = 0; i < nodes.length; i++) {
			const a = nodes[i];
			for (let j = i + 1; j < nodes.length; j++) {
				const b = nodes[j];
				const d = resolvePair(a, b);
				if (d.ax === 0 && d.ay === 0 && d.bx === 0 && d.by === 0) continue;
				violations++;
				a.x += d.ax;
				a.y += d.ay;
				b.x += d.bx;
				b.y += d.by;
			}
		}
		if (violations === 0) break;
	}
}

/**
 * Spacing constants for the peripheral clusters, in layout coordinate units.
 * Tuned against the ~28px node size used by the stylesheet.
 */
const NODE_SPACING = 70;
/** How far a cluster's nodes are offset outward from the bounding-box edge. */
const PERIPHERY_OFFSET = 160;
/** Extra outward offset for the cluster label, beyond the nodes. */
const LABEL_OFFSET = 52;

/**
 * Arrange a small group of nodes into a compact, roughly square grid centred
 * on `(cx, cy)`. Returns the per-ID positions in the order of `ids`.
 *
 * A grid (rather than a line) keeps each cluster compact even when a type has
 * many members, so the overall silhouette reads as several small grouped
 * blocks around the periphery rather than a single line of detached nodes.
 */
function gridPositions(
	ids: readonly string[],
	cx: number,
	cy: number,
): Position[] {
	const n = ids.length;
	if (n === 0) return [];
	if (n === 1) return [{ x: cx, y: cy }];
	const cols = Math.ceil(Math.sqrt(n));
	const rows = Math.ceil(n / cols);
	const startX = cx - ((cols - 1) * NODE_SPACING) / 2;
	const startY = cy - ((rows - 1) * NODE_SPACING) / 2;
	const positions: Position[] = [];
	for (let i = 0; i < n; i++) {
		const col = i % cols;
		const row = Math.floor(i / cols);
		positions.push({
			x: startX + col * NODE_SPACING,
			y: startY + row * NODE_SPACING,
		});
	}
	return positions;
}

/**
 * Pick a centre point for cluster `index` of `total`, distributed around the
 * four sides of the bounding box and offset outward by `offset`.
 *
 * Groups are walked around the perimeter so neighbouring types sit on
 * neighbouring sides rather than stretching along one edge. The starting
 * side rotates with `total` so a single group still lands somewhere
 * reasonable (bottom-centre) and small counts fan out rather than piling up.
 *
 * Returns the cluster centre plus a unit outward normal describing which way
 * the cluster faces (used to offset the label further out).
 */
function perimeterAnchor(
	box: BoundingBox,
	index: number,
	total: number,
	offset: number,
): {
	readonly cx: number;
	readonly cy: number;
	readonly nx: number;
	readonly ny: number;
} {
	const width = box.x2 - box.x1;
	const height = box.y2 - box.y1;
	const cx = (box.x1 + box.x2) / 2;

	// Four sides: bottom, right, top, left. For a single group we always use
	// the bottom-centre so it reads as a single labelled cluster.
	if (total === 1) {
		return { cx, cy: box.y2 + offset, nx: 0, ny: 1 };
	}

	const sides = 4;
	const side = index % sides;
	// Evenly fraction along the side, with margin from corners.
	const slotsPerSide = Math.ceil(total / sides);
	const slotIndex = Math.floor(index / sides);
	const t =
		slotsPerSide <= 1 ? 0.5 : 0.2 + (0.6 * slotIndex) / (slotsPerSide - 1);

	if (side === 0) {
		// Bottom edge, left-to-right.
		return {
			cx: box.x1 + width * t,
			cy: box.y2 + offset,
			nx: 0,
			ny: 1,
		};
	}
	if (side === 1) {
		// Right edge, top-to-bottom.
		return {
			cx: box.x2 + offset,
			cy: box.y1 + height * t,
			nx: 1,
			ny: 0,
		};
	}
	if (side === 2) {
		// Top edge, right-to-left.
		return {
			cx: box.x2 - width * t,
			cy: box.y1 - offset,
			nx: 0,
			ny: -1,
		};
	}
	// Left edge, bottom-to-top.
	return {
		cx: box.x1 - offset,
		cy: box.y2 - height * t,
		nx: -1,
		ny: 0,
	};
}

/**
 * Compute positions for orphan nodes arranged as **type-grouped clusters
 * around the periphery** of the laid-out bounding box.
 *
 * Each group is laid out as a compact grid centred on an anchor point on one
 * of the four sides of the box (groups are distributed around all sides so
 * the silhouette reads as several labelled sets around the edge — not a
 * single line, not a dense square). A label descriptor is returned per group
 * so the caller can render an "Invariants (n)"-style annotation just outside
 * the cluster.
 *
 * Returns `{ positions, labels }`. `positions` maps each orphan node ID to
 * its `{ x, y }` position; `labels` carries one `OrphanLabel` per group.
 */
export function placeOrphansByType(
	groups: readonly OrphanGroup[],
	box: BoundingBox,
): OrphanPlacement {
	const positions = new Map<string, Position>();
	const labels: OrphanLabel[] = [];
	if (groups.length === 0) return { positions, labels };

	const total = groups.length;
	for (let gi = 0; gi < total; gi++) {
		const group = groups[gi];
		if (group.ids.length === 0) continue;
		const anchor = perimeterAnchor(box, gi, total, PERIPHERY_OFFSET);
		const nodePositions = gridPositions(group.ids, anchor.cx, anchor.cy);
		for (let i = 0; i < group.ids.length; i++) {
			positions.set(group.ids[i], nodePositions[i]);
		}
		// Label sits further out along the outward normal of the side.
		const grid = gridOf(group.ids.length);
		const labelDistance =
			LABEL_OFFSET + (Math.floor((grid.rows - 1) / 2) + 1) * NODE_SPACING;
		labels.push({
			id: orphanLabelId(group.type),
			label: `${group.label} (${String(group.ids.length)})`,
			x: anchor.cx + anchor.nx * labelDistance,
			y: anchor.cy + anchor.ny * labelDistance,
		});
	}
	return { positions, labels };
}

/** Grid dimensions for `n` nodes (columns, rows). */
function gridOf(n: number): { readonly cols: number; readonly rows: number } {
	if (n <= 1) return { cols: 1, rows: 1 };
	const cols = Math.ceil(Math.sqrt(n));
	const rows = Math.ceil(n / cols);
	return { cols, rows };
}

/**
 * Synthetic ID for an orphan cluster's label node. Prefixed so it cannot
 * collide with real SysProM node IDs (which use type prefixes like `INT1`).
 */
export function orphanLabelId(type: string): string {
	return `orphan-label:${type}`;
}

/**
 * Build the list of orphan groups from a set of orphan IDs and a type lookup.
 * Groups are sorted alphabetically by type so the peripheral layout is
 * deterministic across runs. The label is the capitalised plural of the type
 * (e.g. `invariant` -> `Invariants`).
 */
export function buildOrphanGroups(
	orphanIds: readonly string[],
	typeOf: (id: string) => string,
): OrphanGroup[] {
	const byType = new Map<string, string[]>();
	for (const id of orphanIds) {
		const type = typeOf(id);
		const bucket = byType.get(type);
		if (bucket === undefined) {
			byType.set(type, [id]);
		} else {
			bucket.push(id);
		}
	}
	return [...byType.entries()]
		.sort((a, b) => a[0].localeCompare(b[0]))
		.map(([type, ids]) => ({
			type,
			label: clusterLabel(type),
			ids: [...ids].sort((a, b) => a.localeCompare(b)),
		}));
}

/** Capitalised plural label for a SysProM node type. */
function clusterLabel(type: string): string {
	const capitalised = type.charAt(0).toUpperCase() + type.slice(1);
	return pluralise(capitalised);
}

/** Naive English pluraliser, sufficient for the SysProM node-type vocabulary. */
function pluralise(word: string): string {
	if (word.endsWith("y") && !word.endsWith("ay")) {
		return `${word.slice(0, -1)}ies`;
	}
	if (
		word.endsWith("s") ||
		word.endsWith("x") ||
		word.endsWith("ch") ||
		word.endsWith("sh")
	) {
		return `${word}es`;
	}
	return `${word}s`;
}

// ---------------------------------------------------------------------------
// Cytoscape integration — operate on a live instance after layout settles.
// ---------------------------------------------------------------------------

/**
 * After the primary layout has settled, reposition view nodes to the centroid
 * of their `includes` members, then place truly-orphan nodes (no incident
 * layout edges and not in any view with visible members) in type-grouped
 * clusters around the periphery of the laid-out bounding box. Each cluster
 * is annotated with a labelled synthetic node.
 *
 * The `layoutEdges` parameter is the set of edges that drove the layout
 * (backbone for Refinement, emergent for Emergent topology, all for Overview).
 * A node is an orphan only if none of these edges touch it. Overlay edges
 * (hidden during layout) do not count — they were not part of the ranking.
 *
 * The bounding box for the clusters is computed from connected (non-orphan)
 * nodes only, so the clusters sit around the main laid-out mass rather than
 * being skewed by orphan positions that the primary layout may have
 * scattered.
 *
 * The `doc` provides view `includes` membership data so view nodes can be
 * positioned at their members' centroid. Views with no visible members fall
 * through to orphan grouping under their own type.
 */
export function placeOrphansAfterLayout(
	cy: Core,
	doc: SysProMDocument,
	layoutEdges: ReadonlySet<string>,
): readonly OrphanLabel[] {
	const visibleNodes = cy.nodes(":visible");
	const viewIncludes = collectViewIncludes(doc);

	// First pass: position views that have visible members at their centroid.
	// Views without visible members are returned so they fall through to
	// orphan grouping.
	const orphanedViews = placeViewsAtCentroid(cy, viewIncludes);
	const viewIdsWithMembers = new Set<string>();
	for (const [viewId] of viewIncludes) {
		if (!orphanedViews.has(viewId)) viewIdsWithMembers.add(viewId);
	}

	const orphanIds = identifyLayoutOrphans(
		visibleNodes,
		viewIdsWithMembers,
		layoutEdges,
	);
	// Type lookup straight from the document so the pure helpers stay free of
	// Cytoscape coupling.
	const typeOfNode = buildTypeLookup(doc);
	const groups = buildOrphanGroups(orphanIds, typeOfNode);
	const labels = placeOrphanClusters(cy, visibleNodes, groups);
	// Finally, enforce the hard node-clearance invariant across every visible
	// node (main mass, view-centroid placements, orphan clusters, and labels).
	enforceClearanceOnCytoscape(cy);
	return labels;
}

/**
 * Enforce the hard node-clearance invariant on a settled Cytoscape instance:
 * iterate every visible node, build `ClearanceNode` records from current
 * positions, run the pure separation pass, and write the adjusted positions
 * back. Decorative orphan-label nodes participate but are free to move.
 *
 * Intended to run after every layout (structural layouts call it via
 * `placeOrphansAfterLayout`; the Trace layout calls it directly).
 */
export function enforceClearanceOnCytoscape(cy: Core): void {
	const visible = cy.nodes(":visible");
	const visibleArray = visible.toArray();
	if (visibleArray.length < 2) return;
	const clearance: ClearanceNode[] = [];
	const positions = new Map<string, { x: number; y: number }>();
	for (const node of visibleArray) {
		const pos = node.position();
		// Real nodes render at the stylesheet's 28px size (14px radius).
		// Compound cluster parents (the "By subsystem" layout) are containers,
		// not point nodes, so they participate with zero radius.
		const isCluster = node.data("type") === "cluster";
		clearance.push({
			id: node.id(),
			x: pos.x,
			y: pos.y,
			radius: isCluster ? 0 : 14,
			fixed: false,
		});
		positions.set(node.id(), { x: pos.x, y: pos.y });
	}
	enforceClearance(clearance);
	for (const cn of clearance) {
		const original = positions.get(cn.id);
		if (original === undefined) continue;
		if (original.x === cn.x && original.y === cn.y) continue;
		cy.getElementById(cn.id).position({ x: cn.x, y: cn.y });
	}
}

/**
 * Build an ID -> type lookup from the document for the pure grouping helper.
 */
function buildTypeLookup(doc: SysProMDocument): (id: string) => string {
	const types = new Map<string, string>();
	for (const node of doc.nodes) {
		types.set(node.id, node.type);
	}
	return (id: string): string => types.get(id) ?? "node";
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
 * Type guard extracting a `string[]` from a node's `includes` field using
 * safe `in`-based narrowing (no index-signature access or `as` casts).
 */
function readIncludes(node: Node): string[] {
	if (!("includes" in node)) return [];
	const value = node.includes;
	if (!Array.isArray(value)) return [];
	return value.filter((item): item is string => typeof item === "string");
}

/**
 * Identify visible nodes that have zero incident edges in the `layoutEdges`
 * set, excluding view nodes that were placed at their members' centroid.
 * Views without visible members are NOT excluded here — they fall through to
 * orphan grouping.
 */
function identifyLayoutOrphans(
	visibleNodes: NodeCollection,
	viewIdsWithMembers: ReadonlySet<string>,
	layoutEdges: ReadonlySet<string>,
): string[] {
	const orphans: string[] = [];
	for (const node of visibleNodes) {
		const id = node.id();
		if (viewIdsWithMembers.has(id)) continue;
		let hasLayoutEdge = false;
		const incident = node.connectedEdges();
		for (const edge of incident) {
			if (layoutEdges.has(edge.id())) {
				hasLayoutEdge = true;
				break;
			}
		}
		if (!hasLayoutEdge) orphans.push(id);
	}
	return orphans;
}

/**
 * Reposition orphan nodes into type-grouped peripheral clusters and render a
 * label node per cluster. The bounding box is computed from connected
 * (non-orphan, non-view) nodes only, so the clusters sit around the main
 * laid-out mass. Any label nodes left over from a previous layout pass are
 * removed first.
 */
function placeOrphanClusters(
	cy: Core,
	visibleNodes: NodeCollection,
	groups: readonly OrphanGroup[],
): readonly OrphanLabel[] {
	if (groups.length === 0) return [];
	const connected: PositionedNode[] = [];
	for (const node of visibleNodes) {
		const id = node.id();
		// Skip nodes that are about to be repositioned as orphans; include
		// view nodes at their members' centroid as part of the mass.
		const isOrphan = groups.some((g) => g.ids.some((oid) => oid === id));
		if (isOrphan) continue;
		const pos = node.position();
		connected.push({ id, x: pos.x, y: pos.y });
	}
	const box = boundingBox(connected);
	if (box === undefined) return [];
	const placement = placeOrphansByType(groups, box);
	for (const [id, pos] of placement.positions) {
		cy.getElementById(id).position(pos);
	}
	// Labels are returned (not rendered as Cytoscape nodes) so the React layer
	// can render them as HTML overlays, which stay readable at any zoom unlike
	// canvas text.
	return placement.labels;
}

/**
 * Reposition each view node to the centroid of its visible members.
 * Runs before orphan placement so the bounding box of the connected mass
 * reflects final view positions. Returns the set of view IDs that had no
 * visible members — these fall through to orphan grouping.
 */
function placeViewsAtCentroid(
	cy: Core,
	viewIncludes: ReadonlyMap<string, string[]>,
): Set<string> {
	const orphaned = new Set<string>();
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
		} else {
			// No visible members: the view is effectively orphaned and will
			// be grouped by its type alongside the other orphans.
			orphaned.add(viewId);
		}
	}
	return orphaned;
}
