/**
 * Layout configurations for the five interactive graph modes.
 *
 * The relationship graph is split into a structural backbone (refines,
 * part_of, realises, implements, precedes, must_follow) and cross-cutting
 * overlays (affects, must_preserve, depends_on, constrained_by, governed_by,
 * supersedes, modifies, produces).
 *
 * The Refinement hierarchy ranks on the backbone only; the Emergent topology
 * ranks on the backbone *plus* the governance / impact edges
 * (`EMERGENT_REL_TYPES` — everything except `supersedes`), so that decisions,
 * changes, invariants, principles, and policies cluster near the nodes they
 * affect or constrain rather than being packed into a disconnected grid. In
 * both modes the edges not used for ranking are hidden during layout and
 * restored afterwards so they render as overlays between already-positioned
 * nodes.
 *
 * - **Refinement hierarchy** (default) — dagre top-down DAG over backbone edges.
 * - **Emergent topology** — fcose over emergent edges; clusters surface from connectivity.
 * - **By subsystem** — fcose compound layout grouping nodes by recursive subsystem.
 * - **Overview** — fcose over all edges.
 * - **Trace** — Cytoscape breadthfirst from a selected node.
 */
import type {
	LayoutOptions,
	ShapedLayoutOptions,
	BreadthFirstLayoutOptions,
	Core,
	Collection,
} from "cytoscape";
import {
	BACKBONE_REL_TYPES,
	CROSS_CUTTING_REL_TYPES,
	EMERGENT_REL_TYPES,
} from "./elements";

export type LayoutMode =
	| "refinement"
	| "emergent"
	| "subsystem"
	| "overview"
	| "trace";

/**
 * Options for the fcose layout extension. fcose has no bundled TypeScript
 * declarations, so this interface mirrors its documented option set. At
 * runtime the values are passed straight through to Cytoscape.
 */
interface FcoseLayoutOptions extends ShapedLayoutOptions {
	name: "fcose";
	randomize?: boolean;
	nodeRepulsion?: number | ((node: unknown) => number);
	idealEdgeLength?: number | ((edge: unknown) => number);
	edgeElasticity?: number | ((edge: unknown) => number);
	gravity?: number;
	numIter?: number;
	tile?: boolean;
	packComponents?: boolean;
	quality?: "draft" | "default";
}

/**
 * Options for the dagre layout extension (cytoscape-dagre). Declared inline
 * because cytoscape-dagre's own `.d.ts` lives in node_modules and is not
 * exported as a value type we can extend here; this mirrors its documented
 * option set and is passed straight through to Cytoscape at runtime.
 */
interface DagreLayoutOptions extends ShapedLayoutOptions {
	name: "dagre";
	rankDir?: "TB" | "BT" | "LR" | "RL";
	nodeSep?: number;
	edgeSep?: number;
	rankSep?: number;
	ranker?: "network-simplex" | "tight-tree" | "longest-path";
	acyclicer?: "greedy";
	fit?: boolean;
	padding?: number;
	spacingFactor?: number;
}

/**
 * Select the visible elements that drive a layout: all visible nodes plus only
 * the edges whose type is in the backbone set. Cross-cutting edges are
 * excluded so they cannot influence the ranking/cluster computation.
 */
export function backboneSubgraph(cy: Core): Collection {
	const visibleNodes = cy.nodes(":visible");
	const backboneEdges = cy
		.edges(":visible")
		.filter((edge) => isBackboneType(edge.data("type")));
	return visibleNodes.union(backboneEdges);
}

/**
 * Select the visible elements that drive the Emergent topology layout: all
 * visible nodes plus the edges whose type is in the emergent set (backbone
 * plus governance / impact — everything except `supersedes`). This keeps
 * decisions, changes, invariants, and policies connected to their targets so
 * they cluster naturally instead of being packed into a disconnected grid.
 */
export function emergentSubgraph(cy: Core): Collection {
	const visibleNodes = cy.nodes(":visible");
	const emergentEdges = cy
		.edges(":visible")
		.filter((edge) => isEmergentType(edge.data("type")));
	return visibleNodes.union(emergentEdges);
}

/**
 * Select cross-cutting edges (visible) for the Refinement hide/restore overlay
 * dance — the full set of non-backbone types.
 */
export function crossCuttingEdges(cy: Core): Collection {
	return cy
		.edges(":visible")
		.filter((edge) => isCrossCuttingType(edge.data("type")));
}

/**
 * Select the edges hidden during the Emergent layout: only `supersedes`, the
 * single relationship type excluded from `EMERGENT_REL_TYPES`. These are
 * restored afterwards so they render as overlays between positioned nodes.
 */
export function nonEmergentEdges(cy: Core): Collection {
	return cy
		.edges(":visible")
		.filter((edge) => !isEmergentType(edge.data("type")));
}

function isBackboneType(type: unknown): boolean {
	return typeof type === "string" && BACKBONE_REL_TYPES.has(type);
}

function isCrossCuttingType(type: unknown): boolean {
	return typeof type === "string" && CROSS_CUTTING_REL_TYPES.has(type);
}

function isEmergentType(type: unknown): boolean {
	return typeof type === "string" && EMERGENT_REL_TYPES.has(type);
}

/** Build the dagre options for the Refinement hierarchy (top-down DAG). */
export function buildRefinementLayoutOptions(): DagreLayoutOptions {
	return {
		name: "dagre",
		rankDir: "TB",
		nodeSep: 50,
		edgeSep: 20,
		rankSep: 70,
		ranker: "network-simplex",
		acyclicer: "greedy",
		animate: true,
		animationDuration: 500,
		animationEasing: "ease-out",
		fit: true,
		padding: 40,
		spacingFactor: 1.1,
	};
}

/**
 * Union of the layout-option shapes that can drive a backbone-ranking layout
 * (dagre for the hierarchy, fcose for the emergent topology). Used as the
 * parameter type of `runBackboneLayout` in CytoscapeGraph.
 */
export type BackboneLayoutOptions = DagreLayoutOptions | FcoseLayoutOptions;

/**
 * Build the fcose options for the Emergent topology. Ranks on the emergent
 * edge set (backbone plus governance / impact), so far more edges are present
 * than in the Refinement hierarchy. Tuned for clean cluster separation:
 * higher node repulsion and longer ideal edges keep decisions, invariants,
 * and policies from collapsing onto their targets.
 *
 * `tile` and `packComponents` are disabled: disconnected components would
 * otherwise be packed into a dense grid square. Instead, the remaining
 * orphans (nodes with no incident layout edges) are placed peripherally by
 * `placeOrphansAfterLayout` after the primary layout settles, so they read
 * as an "unlinked" cluster rather than a grid block.
 */
export function buildEmergentLayoutOptions(): FcoseLayoutOptions {
	return {
		name: "fcose",
		animate: true,
		animationDuration: 600,
		animationEasing: "ease-out",
		fit: true,
		padding: 40,
		randomize: true,
		nodeRepulsion: 45000,
		idealEdgeLength: 180,
		edgeElasticity: 0.4,
		gravity: 0.15,
		numIter: 4000,
		tile: false,
		packComponents: false,
		quality: "default",
	};
}

/**
 * Build the fcose compound options for the By subsystem layout.
 *
 * `tile` and `packComponents` are disabled: orphan nodes (those with no
 * relationship edges) are placed peripherally by `placeOrphansAfterLayout`
 * after the layout settles, instead of being packed into a grid square.
 */
export function buildSubsystemLayoutOptions(): FcoseLayoutOptions {
	return {
		name: "fcose",
		animate: true,
		animationDuration: 700,
		animationEasing: "ease-out",
		fit: true,
		padding: 40,
		randomize: true,
		nodeRepulsion: 6000,
		idealEdgeLength: 80,
		edgeElasticity: 0.45,
		gravity: 0.3,
		numIter: 2500,
		tile: false,
		packComponents: false,
		quality: "default",
	};
}

/**
 * Build the fcose (force-directed) layout options for the Overview mode.
 *
 * `tile` and `packComponents` are disabled: orphan nodes are placed
 * peripherally by `placeOrphansAfterLayout` after the layout settles,
 * instead of being packed into a grid square.
 */
export function buildOverviewLayoutOptions(): FcoseLayoutOptions {
	return {
		name: "fcose",
		animate: true,
		animationDuration: 600,
		animationEasing: "ease-out",
		fit: true,
		padding: 40,
		randomize: true,
		nodeRepulsion: 8000,
		idealEdgeLength: 100,
		edgeElasticity: 0.45,
		gravity: 0.25,
		numIter: 2500,
		tile: false,
		packComponents: false,
	};
}

/** Build breadthfirst layout options rooted at the given node ID (Trace mode). */
export function buildTraceLayoutOptions(
	rootId: string,
): BreadthFirstLayoutOptions {
	return {
		name: "breadthfirst",
		animate: true,
		animationDuration: 400,
		fit: true,
		padding: 40,
		roots: [rootId],
		directed: true,
		circle: false,
		spacingFactor: 1.25,
		maximal: false,
	};
}

/**
 * Coerce a specific layout-options object into the `LayoutOptions` union
 * accepted by `cy.layout()`. Each concrete options interface is a member of
 * the union, so this is a widening (always safe) — modelled as a function to
 * avoid `as` assertions.
 */
export function toLayoutOptions(options: LayoutOptions): LayoutOptions {
	return options;
}
