/**
 * ELK layered graph layout — builds an ELK JSON graph from Cytoscape visible
 * elements, runs the ELK layered algorithm (main-thread bundled build), and
 * extracts node positions plus orthogonal edge routes.
 *
 * The default `elkjs` entry (`new ELK()` from `elkjs`) spawns a web worker
 * (`elk-worker.min.js`) that 404s under Vite. Instead we use
 * `elkjs/lib/elk.bundled.js` — a self-contained UMD bundle that runs the entire
 * layout engine synchronously on the main thread, no worker required. The
 * bundled build is dynamically imported so it lands in its own chunk, loaded
 * only when the ELK Layered layout is activated.
 *
 * ELK's layered algorithm assigns nodes to discrete layers and minimises edge
 * crossings, then routes edges orthogonally — so edges go *around* nodes rather
 * than through them. The edge section bend points are applied to Cytoscape
 * edges as `segments` curve-style control points, preserving ELK's orthogonal
 * routing in the rendered graph.
 */
import type {
	ElkNode,
	ElkExtendedEdge,
	ElkEdgeSection,
	ElkPoint,
	ELK,
} from "elkjs/lib/elk-api";

import { MIN_NODE_CLEARANCE } from "./orphanPlacement";

/**
 * Uniform node box size fed to ELK. ELK needs concrete dimensions so it can
 * pack layers and route edges around node bounding boxes. The value is large
 * enough relative to the stylesheet's 28px rendered node that ELK's orthogonal
 * router leaves visible clearance.
 */
export const ELK_NODE_WIDTH = 60;
export const ELK_NODE_HEIGHT = 30;

/**
 * ELK layered layout configuration. Direction DOWN stacks layers top-to-bottom;
 * orthogonal edge routing makes edges route around nodes; crossing minimisation
 * uses the LAYER_SWEEP strategy. Spacing values are tuned for readability on a
 * dense graph and respect the global minimum node clearance.
 */
export const ELK_LAYOUT_OPTIONS: Readonly<Record<string, string>> = {
	"elk.algorithm": "layered",
	"elk.direction": "DOWN",
	"elk.layered.spacing.nodeNodeBetweenLayers": String(
		Math.max(MIN_NODE_CLEARANCE, 80),
	),
	"elk.layered.spacing.edgeNodeBetweenLayers": "40",
	"elk.spacing.nodeNode": String(MIN_NODE_CLEARANCE),
	"elk.layered.crossingMinimization.strategy": "LAYER_SWEEP",
	"elk.edgeRouting": "orthogonal",
	"elk.layered.nodePlacement.strategy": "NETWORK_SIMPLEX",
	"elk.layered.nodePlacement.favorStraightEdges": "true",
};

/**
 * A node visible in the Cytoscape graph, in the minimal shape ELK needs.
 */
export interface VisibleNode {
	readonly id: string;
}

/**
 * An edge visible in the Cytoscape graph, in the minimal shape ELK needs.
 */
export interface VisibleEdge {
	readonly id: string;
	readonly source: string;
	readonly target: string;
	readonly type: string;
}

/**
 * Build the ELK root graph JSON from visible nodes and edges. Every
 * relationship type is included except `supersedes` (consistent with the
 * Emergent topology). Edges referencing nodes not in the visible set are
 * skipped so ELK does not receive dangling references. The edge mapping
 * records the Cytoscape source/target/type for each ELK edge index so
 * `processElkResult` can translate routes back.
 *
 * Pure: no side effects, no I/O. Tested without a browser.
 */
export function buildElkGraph(
	nodes: readonly VisibleNode[],
	edges: readonly VisibleEdge[],
): {
	readonly graph: ElkNode;
	readonly edgeMapping: {
		readonly source: string;
		readonly target: string;
		readonly type: string;
	}[];
} {
	const nodeIds = new Set(nodes.map((n) => n.id));
	const children: ElkNode[] = nodes.map((node) => ({
		id: node.id,
		width: ELK_NODE_WIDTH,
		height: ELK_NODE_HEIGHT,
	}));
	const elkEdges: ElkExtendedEdge[] = [];
	const edgeMapping: {
		source: string;
		target: string;
		type: string;
	}[] = [];
	let edgeIndex = 0;
	for (const edge of edges) {
		if (edge.type === "supersedes") continue;
		if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) continue;
		elkEdges.push({
			id: `elk-edge-${String(edgeIndex++)}`,
			sources: [edge.source],
			targets: [edge.target],
		});
		edgeMapping.push({
			source: edge.source,
			target: edge.target,
			type: edge.type,
		});
	}
	return {
		graph: {
			id: "root",
			layoutOptions: { ...ELK_LAYOUT_OPTIONS },
			children,
			edges: elkEdges,
		},
		edgeMapping,
	};
}

/**
 * A computed position for a single node.
 */
export interface NodePosition {
	readonly x: number;
	readonly y: number;
}

/**
 * An orthogonal edge route: the source and target node IDs of the Cytoscape
 * edge this route applies to, plus the ordered list of bend points (in
 * Cytoscape model coordinates, already offset by node half-dimensions), and
 * the computed Cytoscape `segments` curve-style parameters.
 */
export interface EdgeRoute {
	readonly source: string;
	readonly target: string;
	readonly type: string;
	readonly points: readonly { readonly x: number; readonly y: number }[];
	/**
	 * Cytoscape `segment-distances` values: signed perpendicular distances
	 * from each bend point to the source-target straight line. Paired with
	 * `segmentWeights`.
	 */
	readonly segmentDistances: readonly number[];
	/**
	 * Cytoscape `segment-weights` values: fractional position (0-1) of each
	 * bend point projected onto the source-target straight line. Paired with
	 * `segmentDistances`.
	 */
	readonly segmentWeights: readonly number[];
}

/**
 * Result of an ELK layout run: per-node positions and per-edge orthogonal
 * routes, keyed for application to Cytoscape elements.
 */
export interface ElkLayoutResult {
	readonly positions: ReadonlyMap<string, NodePosition>;
	readonly routes: readonly EdgeRoute[];
}

/**
 * Narrow `unknown` to `Record<string, unknown>` without a type assertion.
 * After `typeof === "object"`, `!== null`, and `!Array.isArray()`, the value
 * is a plain object whose properties can be safely accessed by key.
 */
function isStringRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Determine whether an ELK result child or edge has positioned content. Used as
 * a type guard over the `unknown` sections of the raw ELK JSON output.
 */
function isElkPoint(value: unknown): value is ElkPoint {
	if (!isStringRecord(value)) return false;
	if (!("x" in value) || !("y" in value)) return false;
	return typeof value.x === "number" && typeof value.y === "number";
}

/**
 * Type guard: narrow an `unknown` to `ElkEdgeSection[]` (ELK edge sections).
 * Uses `in`-based narrowing on each element via `isStringRecord` so member
 * access on `startPoint` / `endPoint` is type-safe.
 */
function isSectionArray(value: unknown): value is ElkEdgeSection[] {
	if (!Array.isArray(value)) return false;
	return value.every((item) => {
		if (!isStringRecord(item)) return false;
		if (!("startPoint" in item) || !("endPoint" in item)) return false;
		return isElkPoint(item.startPoint) && isElkPoint(item.endPoint);
	});
}

/**
 * Extract ordered bend points from an ELK edge's sections. Each section has a
 * start point, optional bend points, and an end point; concatenated they form
 * the full orthogonal polyline. The first section's start point is the source
 * anchor; subsequent sections chain start-to-end.
 */
function extractSectionPoints(
	sections: readonly ElkEdgeSection[],
): { readonly x: number; readonly y: number }[] {
	const points: { x: number; y: number }[] = [];
	for (let i = 0; i < sections.length; i++) {
		const section = sections[i];
		const start = section.startPoint;
		// Avoid duplicating the junction point between consecutive sections:
		// each section's start is the previous section's end.
		if (i === 0) {
			points.push({ x: start.x, y: start.y });
		}
		if (section.bendPoints) {
			for (const bp of section.bendPoints) {
				if (isElkPoint(bp)) points.push({ x: bp.x, y: bp.y });
			}
		}
		const end = section.endPoint;
		points.push({ x: end.x, y: end.y });
	}
	return points;
}

/**
 * Compute Cytoscape `segments` curve-style parameters (weights and distances)
 * for a set of bend points relative to the source-target line.
 *
 * For each bend point $B$:
 * - **weight** $w = \frac{(B - S) \cdot \vec{d}}{|\vec{d}|^2}$ — the
 *   fractional position along the source-to-target vector $\vec{d}$.
 * - **distance** $dist = \frac{(B - S) \times \vec{d}}{|\vec{d}|}$ — the signed
 *   perpendicular distance from $B$ to the source-target line (positive on one
 *   side, negative on the other).
 *
 * Interior bend points (excluding the first source point and last target
 * point) are converted; endpoints are implied by Cytoscape's `segments` style.
 *
 * Pure: no side effects. Tested without a browser.
 */
export function computeSegments(
	bendPoints: readonly { readonly x: number; readonly y: number }[],
	source: { readonly x: number; readonly y: number },
	target: { readonly x: number; readonly y: number },
): { readonly weights: number[]; readonly distances: number[] } {
	const dx = target.x - source.x;
	const dy = target.y - source.y;
	const lenSq = dx * dx + dy * dy;
	if (lenSq < 0.0001) return { weights: [], distances: [] };
	const len = Math.sqrt(lenSq);
	const weights: number[] = [];
	const distances: number[] = [];
	// Interior points only — skip first (source anchor) and last (target anchor).
	for (let i = 1; i < bendPoints.length - 1; i++) {
		const bp = bendPoints[i];
		const px = bp.x - source.x;
		const py = bp.y - source.y;
		// Projection fraction along the source-target line.
		const w = (px * dx + py * dy) / lenSq;
		// Signed perpendicular distance (cross product / length).
		const dist = (px * dy - py * dx) / len;
		weights.push(w);
		distances.push(dist);
	}
	return { weights, distances };
}

/**
 * Process a completed ELK layout result into node positions and edge routes.
 * The `edgeIndexToCytoscape` map translates ELK's sequential edge IDs back to
 * the Cytoscape edge source/target/type so routes can be applied to the right
 * Cytoscape edges.
 *
 * Node positions are offset by half the ELK node dimensions so the position
 * represents the node centre (Cytoscape uses centre positioning; ELK uses
 * top-left).
 *
 * Pure: no side effects. Tested without a browser.
 */
export function processElkResult(
	result: ElkNode,
	edgeIndexToCytoscape: readonly {
		readonly source: string;
		readonly target: string;
		readonly type: string;
	}[],
): ElkLayoutResult {
	const positions = new Map<string, NodePosition>();
	const children = result.children ?? [];
	const halfW = ELK_NODE_WIDTH / 2;
	const halfH = ELK_NODE_HEIGHT / 2;
	for (const child of children) {
		const x = child.x ?? 0;
		const y = child.y ?? 0;
		positions.set(child.id, { x: x + halfW, y: y + halfH });
	}

	const routes: EdgeRoute[] = [];
	const edges = result.edges ?? [];
	for (let i = 0; i < edges.length; i++) {
		const elkEdge = edges[i];
		if (i >= edgeIndexToCytoscape.length) continue;
		const mapping = edgeIndexToCytoscape[i];
		const sections = elkEdge.sections;
		if (!isSectionArray(sections)) continue;
		const points = extractSectionPoints(sections);
		if (points.length < 2) continue;
		// Compute Cytoscape segments parameters from the bend points relative
		// to the source and target node centre positions.
		const sourcePos = positions.get(mapping.source);
		const targetPos = positions.get(mapping.target);
		const seg =
			sourcePos !== undefined && targetPos !== undefined
				? computeSegments(points, sourcePos, targetPos)
				: { weights: [], distances: [] };
		routes.push({
			source: mapping.source,
			target: mapping.target,
			type: mapping.type,
			points,
			segmentDistances: seg.distances,
			segmentWeights: seg.weights,
		});
	}

	return { positions, routes };
}

/**
 * Type guard: narrow `unknown` to a constructable ELK factory.
 */
function isConstructor(value: unknown): value is new () => ELK {
	return typeof value === "function";
}

/**
 * Type guard: narrow `unknown` to a module namespace object with a
 * `default` property that is a constructable ELK factory.
 */
function hasDefaultCtor(value: unknown): value is { default: new () => ELK } {
	if (!isStringRecord(value)) return false;
	return isConstructor(value.default);
}

/**
 * Type guard: narrow `unknown` to a module namespace object with an
 * `e` property (Vite's UMD interop wrapper) whose `default` is the ELK
 * constructor.
 */
function hasViteUmdE(
	value: unknown,
): value is { e: { default: new () => ELK } } {
	if (!isStringRecord(value)) return false;
	const e = value.e;
	if (!isStringRecord(e)) return false;
	return isConstructor(e.default);
}

/**
 * Lazy-load the ELK bundled build (main-thread, no web worker) and resolve the
 * constructor. The bundled build is a UMD module; under Vite's ESM interop the
 * default export can be nested at different levels depending on the bundler
 * phase (dev vs. build). This loader handles all known shapes.
 *
 * The dynamic import puts ELK into its own Vite chunk, loaded only when this
 * function is called — keeping the initial bundle small.
 */
async function loadElk(): Promise<ELK> {
	const mod: unknown = await import("elkjs/lib/elk.bundled.js");
	// Shape 1: mod.default is the constructor (ESM default export).
	if (hasDefaultCtor(mod)) {
		return new mod.default();
	}
	// Shape 2: mod.e.default — Vite wraps UMD inner modules in an `e` namespace.
	if (hasViteUmdE(mod)) {
		return new mod.e.default();
	}
	// Shape 3: mod itself is the constructor (UMD global-style).
	if (isConstructor(mod)) {
		return new mod();
	}
	throw new Error(
		"Could not resolve ELK constructor from bundled module. " +
			`Module keys: ${mod !== null && typeof mod === "object" ? Object.keys(mod).join(", ") : typeof mod}`,
	);
}

/**
 * Lazy-load the ELK bundled build (main-thread, no web worker) and run the
 * layered layout. Returns node positions and orthogonal edge routes ready for
 * application to Cytoscape.
 *
 * The dynamic import puts ELK into its own Vite chunk, loaded only when this
 * function is called — keeping the initial bundle small.
 */
export async function runElkLayout(
	nodes: readonly VisibleNode[],
	edges: readonly VisibleEdge[],
): Promise<ElkLayoutResult> {
	const elk = await loadElk();

	const { graph, edgeMapping } = buildElkGraph(nodes, edges);
	const result = await elk.layout(graph);
	return processElkResult(result, edgeMapping);
}
