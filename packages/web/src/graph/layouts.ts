/**
 * Layout configurations for the three interactive graph modes.
 *
 * - **Layered** — ELK layered/hierarchical, mapping SysProM abstraction layers
 *   (intent->concept->...->artefact) into ELK layer direction.
 * - **Overview** — fcose (force-directed) for a holistic picture.
 * - **Trace** — Cytoscape built-in breadthfirst from a selected node.
 */
import ELK from "elkjs";
import type {
	LayoutOptions,
	ShapedLayoutOptions,
	PresetLayoutOptions,
	BreadthFirstLayoutOptions,
	Position,
} from "cytoscape";
import type { Node } from "@sysprom/core";
import { layerRank } from "./elements";

export type LayoutMode = "layered" | "overview" | "trace";

/**
 * Options for the fcose layout extension. fcose has no bundled TypeScript
 * declarations, so this interface mirrors its documented option set. At
 * runtime the values are passed straight through to Cytoscape.
 */
interface FcoseLayoutOptions extends ShapedLayoutOptions {
	name: "fcose";
	randomize?: boolean;
	nodeRepulsion?: number;
	idealEdgeLength?: number;
	edgeElasticity?: number;
	gravity?: number;
	numIter?: number;
	tile?: boolean;
	packComponents?: boolean;
}

/**
 * Run ELK layered layout asynchronously against the visible nodes and edges and
 * resolve with a map of node ID -> {x, y}. The component applies the result via
 * Cytoscape's `preset` layout.
 *
 * The SysProM abstraction-layer rank (intent=0, concept=1, ...) is fed to ELK
 * as `elk.layered.priority.direction` so earlier layers settle above later ones
 * while still respecting the actual edges.
 */
export async function computeElkPositions(
	nodes: readonly Node[],
	edges: readonly { readonly source: string; readonly target: string }[],
): Promise<Map<string, { readonly x: number; readonly y: number }>> {
	const elk = new ELK();
	const elkNodes = nodes.map((node) => ({
		id: node.id,
		width: 40,
		height: 40,
		layoutOptions: {
			"elk.layered.priority.direction": String(layerRank(node.type)),
		},
	}));
	const elkEdges = edges.map((edge, index) => ({
		id: `e${String(index)}`,
		sources: [edge.source],
		targets: [edge.target],
	}));
	const elkGraph = {
		id: "root",
		layoutOptions: {
			"elk.algorithm": "layered",
			"elk.direction": "DOWN",
			"elk.layered.spacing.nodeNodeBetweenLayers": "70",
			"elk.spacing.nodeNode": "50",
			"elk.layered.nodePlacement.strategy": "NETWORK_SIMPLEX",
			"elk.layered.crossingMinimization.strategy": "LAYER_SWEEP",
		},
		children: elkNodes,
		edges: elkEdges,
	};
	const result = await elk.layout(elkGraph);
	const positions = new Map<
		string,
		{ readonly x: number; readonly y: number }
	>();
	for (const child of result.children ?? []) {
		const x = child.x ?? 0;
		const y = child.y ?? 0;
		positions.set(child.id, { x: x + 20, y: y + 20 });
	}
	return positions;
}

/** Build a Cytoscape `preset` layout that applies the given positions. */
export function buildPresetLayout(
	positions: ReadonlyMap<string, { readonly x: number; readonly y: number }>,
): PresetLayoutOptions {
	const positionFunction = (nodeId: string): Position => {
		const pos = positions.get(nodeId);
		return pos ?? { x: 0, y: 0 };
	};
	return {
		name: "preset",
		animate: true,
		animationDuration: 400,
		fit: true,
		padding: 40,
		positions: positionFunction,
	};
}

/** Build the fcose (force-directed) layout options for the Overview mode. */
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
		tile: true,
		packComponents: true,
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
