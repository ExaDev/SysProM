/**
 * Imperative Cytoscape.js React component.
 *
 * Creates a single Cytoscape instance on mount (preserved across re-renders),
 * then updates elements, layouts, and highlight state via the Cytoscape API.
 * This avoids the cost of tearing down and rebuilding the renderer on every
 * prop change — essential for the 223-node sample document.
 */
import React, { useEffect, useRef, useState } from "react";
import cytoscape, {
	type Core,
	type Collection,
	type EventObject,
	type NodeSingular,
} from "cytoscape";
import fcose from "cytoscape-fcose";
import dagre from "cytoscape-dagre";
import type { SysProMDocument } from "@sysprom/core";
import {
	buildElements,
	buildSubsystemElements,
	neighbourhoodElementIds,
} from "./elements";
import { buildStylesheet } from "./stylesheets";
import {
	backboneSubgraph,
	crossCuttingEdges,
	emergentSubgraph,
	nonEmergentEdges,
	buildRefinementLayoutOptions,
	buildEmergentLayoutOptions,
	buildSubsystemLayoutOptions,
	buildOverviewLayoutOptions,
	buildTraceLayoutOptions,
	toLayoutOptions,
	type LayoutMode,
	type BackboneLayoutOptions,
} from "./layouts";
import {
	placeOrphansAfterLayout,
	enforceClearanceOnCytoscape,
	type OrphanLabel,
} from "./orphanPlacement";

// Register the layout extensions once.
cytoscape.use(fcose);
cytoscape.use(dagre);

/**
 * Type guard narrowing an `EventObject.target` (typed as `any` by Cytoscape)
 * to a `NodeSingular`. Used by the delegated `tap` handler.
 */
function isNodeSingular(target: unknown): target is NodeSingular {
	if (typeof target !== "object" || target === null) return false;
	if (!("isNode" in target)) return false;
	const fn = target.isNode;
	if (typeof fn !== "function") return false;
	return Boolean(fn.call(target));
}

export interface CytoscapeGraphHandle {
	/** The underlying Cytoscape core instance. */
	readonly cy: Core;
}

export interface GraphSelection {
	readonly nodeId: string | null;
}

export interface CytoscapeGraphProps {
	/** The full SysProM document — source of truth for nodes and edges. */
	readonly doc: SysProMDocument;
	/** Active layout mode. */
	readonly layout: LayoutMode;
	/** Root node ID for the Trace layout (ignored otherwise). */
	readonly traceRootId: string | null;
	/** Set of node IDs currently visible after filtering. */
	readonly visibleNodeIds: ReadonlySet<string>;
	/** Called when the user selects a node (or null on background click). */
	readonly onSelect: (nodeId: string | null) => void;
}

/**
 * Render an interactive Cytoscape graph. The instance is created once and kept
 * in a ref; subsequent prop changes update elements, visibility, layout, and
 * highlight through the Cytoscape API.
 */
export function CytoscapeGraph({
	doc,
	layout,
	traceRootId,
	visibleNodeIds,
	onSelect,
}: CytoscapeGraphProps): React.ReactElement {
	const containerRef = useRef<HTMLDivElement>(null);
	const cyRef = useRef<Core | null>(null);
	const onSelectRef = useRef(onSelect);
	onSelectRef.current = onSelect;
	// Orphan-cluster labels rendered as an HTML overlay (canvas text is
	// unreadable at the zoom levels a full-graph fit produces).
	const [labels, setLabels] = useState<readonly OrphanLabel[]>([]);
	// Bumped on every viewport change so the overlay re-renders at the new
	// pan/zoom, keeping the label chips pinned to their clusters.
	const [viewportTick, setViewportTick] = useState(0);

	// Initialise the Cytoscape instance exactly once.
	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		const stylesheet = buildStylesheet();
		const cy = cytoscape({
			container,
			elements: [],
			style: stylesheet,
			minZoom: 0.05,
			maxZoom: 4,
			pixelRatio: 1.5,
			textureOnViewport: true,
			hideEdgesOnViewport: false,
			hideLabelsOnViewport: true,
		});
		cyRef.current = cy;

		// Node tap: select and highlight the node's neighbourhood.
		const handleNodeTap = (event: EventObject): void => {
			const target: unknown = event.target;
			if (!isNodeSingular(target)) return;
			highlightNeighbourhood(cy, target.id());
			onSelectRef.current(target.id());
		};

		// Background tap: clear selection. A core `tap` fires for every tap
		// (including on nodes/edges), so guard on the target being the core
		// itself — otherwise this handler would immediately undo the node-tap
		// selection above.
		const handleBackgroundTap = (event: EventObject): void => {
			if (event.target !== cy) return;
			clearHighlight(cy);
			onSelectRef.current(null);
		};

		cy.on("tap", "node", handleNodeTap);
		cy.on("tap", handleBackgroundTap);

		// Keep the HTML label overlay in sync with pan/zoom.
		const handleViewport = (): void => {
			setViewportTick((t) => t + 1);
		};
		cy.on("pan zoom", handleViewport);

		return () => {
			cy.destroy();
			cyRef.current = null;
		};
	}, []);

	// Rebuild the element set when the document changes, or when switching
	// between the flat and subsystem (compound) element sets. The subsystem
	// layout flattens the recursive document tree into compound clusters and
	// needs a different element set; the other four layouts share the flat set.
	const useSubsystemElements = layout === "subsystem";
	useEffect(() => {
		const cy = cyRef.current;
		if (!cy) return;
		const elements = useSubsystemElements
			? buildSubsystemElements(doc)
			: buildElements(doc);
		cy.elements().remove();
		cy.add(elements);
	}, [doc, useSubsystemElements]);

	// Apply visibility filtering. Compound cluster parents (type "cluster") are
	// always shown; child nodes follow the filter state.
	useEffect(() => {
		const cy = cyRef.current;
		if (!cy) return;
		cy.nodes().forEach((node) => {
			if (node.data("type") === "cluster") {
				node.removeClass("hidden");
				node.style("display", "element");
				return;
			}
			const visible = visibleNodeIds.has(node.id());
			if (visible) {
				node.removeClass("hidden");
				node.style("display", "element");
			} else {
				node.addClass("hidden");
				node.style("display", "none");
			}
		});
		// Hide edges whose endpoints are not both visible.
		cy.edges().forEach((edge) => {
			const sourceVisible = visibleNodeIds.has(edge.source().id());
			const targetVisible = visibleNodeIds.has(edge.target().id());
			if (sourceVisible && targetVisible) {
				edge.style("display", "element");
			} else {
				edge.style("display", "none");
			}
		});
	}, [visibleNodeIds]);

	// Apply the active layout. Refinement ranks on the strict backbone edges
	// (a clean top-down DAG); Emergent ranks on the broader emergent edge set
	// (backbone plus governance / impact) so decisions, changes, invariants,
	// and policies cluster near their targets. In both modes the edges not
	// used for ranking are hidden during layout and restored as overlays once
	// positions have settled. Subsystem uses a compound fcose. Overview runs
	// fcose on all edges. Trace runs breadthfirst from a node.
	// Structural layouts — refinement, emergent, subsystem, overview. This
	// effect deliberately does NOT depend on `traceRootId`: `traceRootId`
	// follows the current selection, so depending on it here would re-run the
	// layout every time a node is clicked. Selecting a node must only highlight
	// its neighbourhood, not re-arrange the graph.
	useEffect(() => {
		const cy = cyRef.current;
		if (!cy) return;
		if (layout === "refinement") {
			runRankedLayout(
				cy,
				doc,
				buildRefinementLayoutOptions(),
				backboneSubgraph,
				crossCuttingEdges,
				setLabels,
			);
		} else if (layout === "emergent") {
			runRankedLayout(
				cy,
				doc,
				buildEmergentLayoutOptions(),
				emergentSubgraph,
				nonEmergentEdges,
				setLabels,
			);
		} else if (layout === "subsystem") {
			runFcoseLayout(cy, doc, buildSubsystemLayoutOptions(), setLabels);
		} else if (layout === "overview") {
			runFcoseLayout(cy, doc, buildOverviewLayoutOptions(), setLabels);
		}
		// layout === "trace" is handled by the dedicated trace effect below.
	}, [layout, doc, useSubsystemElements]);

	// Trace layout — the only layout keyed on `traceRootId`, so the graph
	// re-traces when the selected root changes. Guarded to trace mode so that
	// selecting a node in any other layout never triggers a re-layout.
	useEffect(() => {
		const cy = cyRef.current;
		if (!cy) return;
		if (layout !== "trace" || !traceRootId) return;
		setLabels([]);
		const traceLayout = cy.layout(
			toLayoutOptions(buildTraceLayoutOptions(traceRootId)),
		);
		traceLayout.one("layoutstop", () => {
			// Enforce the hard node-clearance invariant after the trace settles.
			setTimeout(() => {
				enforceClearanceOnCytoscape(cy);
				cy.fit(undefined, 40);
			}, 0);
		});
		traceLayout.run();
	}, [layout, traceRootId]);

	return (
		<div style={{ position: "relative", width: "100%", height: "100%" }}>
			<div
				ref={containerRef}
				style={{ width: "100%", height: "100%", zIndex: 1 }}
			/>
			<OrphanLabelOverlay
				cyRef={cyRef}
				labels={labels}
				viewportTick={viewportTick}
			/>
		</div>
	);
}

/**
 * HTML overlay rendering orphan-cluster label chips pinned to their clusters.
 * Canvas text is unreadable at the zoom levels a full-graph fit produces, so
 * labels are rendered as DOM elements whose screen position is recomputed on
 * every pan/zoom tick from each label's model coordinates via
 * `cy.renderedPoint`.
 */
function OrphanLabelOverlay({
	cyRef,
	labels,
	viewportTick,
}: {
	readonly cyRef: React.RefObject<Core | null>;
	readonly labels: readonly OrphanLabel[];
	readonly viewportTick: number;
}): React.ReactElement | null {
	const cy = cyRef.current;
	// `viewportTick` forces this component to re-render on pan/zoom so the
	// label chips recompute their screen positions.
	if (cy === null || labels.length === 0 || viewportTick < 0) return null;
	return (
		<div
			style={{
				position: "absolute",
				inset: 0,
				pointerEvents: "none",
				overflow: "hidden",
				zIndex: 1000,
			}}
		>
			{labels.map((label) => {
				// Model-to-screen transform: rendered = model * zoom + pan.
				const zoom = cy.zoom();
				const pan = cy.pan();
				const rx = label.x * zoom + pan.x;
				const ry = label.y * zoom + pan.y;
				return (
					<span
						key={label.id}
						style={{
							position: "absolute",
							left: `${String(rx)}px`,
							top: `${String(ry)}px`,
							transform: "translate(-50%, -50%)",
							padding: "2px 8px",
							background: "rgba(255,255,255,0.9)",
							border: "1px solid #868e96",
							borderRadius: "10px",
							fontSize: "12px",
							fontWeight: 600,
							color: "#212529",
							whiteSpace: "nowrap",
							boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
						}}
					>
						{label.label}
					</span>
				);
			})}
		</div>
	);
}

/**
 * Run a layout that ranks on a selected subgraph of edges. The edges not used
 * for ranking are hidden before layout and restored afterwards, so they render
 * as overlays between already-positioned nodes without influencing the
 * ranking.
 *
 * After the layout settles, `placeOrphansAfterLayout` repositions view nodes
 * to the centroid of their `includes` members and places truly-orphan nodes
 * (no incident layout edges, not in any view) in a loose arc along the
 * periphery, so no disconnected block forms.
 *
 * - Refinement passes `backboneSubgraph` + `crossCuttingEdges` (strict
 *   backbone ranking; all governance/impact edges are overlays).
 * - Emergent passes `emergentSubgraph` + `nonEmergentEdges` (backbone plus
 *   governance/impact ranking; only `supersedes` edges are overlays).
 *
 * The layout runs against the subgraph (all visible nodes + the selected
 * edges) via `Collection.layout`, which positions every node in the
 * collection.
 */
function runRankedLayout(
	cy: Core,
	doc: SysProMDocument,
	options: BackboneLayoutOptions,
	selectSubgraph: (cy: Core) => Collection,
	selectOverlays: (cy: Core) => Collection,
	onLabels: (labels: readonly OrphanLabel[]) => void,
): void {
	const overlays = selectOverlays(cy);
	overlays.style("display", "none");
	const subgraph = selectSubgraph(cy);
	const layout = subgraph.layout(toLayoutOptions(options));
	layout.one("layoutstop", () => {
		// Restore overlay edges now that nodes have settled; positions are
		// kept, so the overlays render between the already-placed nodes.
		overlays.style("display", "element");

		// Collect the layout edge IDs for orphan detection.
		const layoutEdgeIds = new Set<string>();
		subgraph.edges().forEach((edge) => {
			layoutEdgeIds.add(edge.id());
		});

		// Place orphans peripherally and views at their members' centroid.
		// Deferred to the next frame so positions are final after animation.
		setTimeout(() => {
			const labels = placeOrphansAfterLayout(cy, doc, layoutEdgeIds);
			onLabels(labels);
			cy.fit(undefined, 40);
		}, 0);
	});
	layout.run();
}

/**
 * Run a fcose layout (Subsystem, Overview) with peripheral orphan placement.
 *
 * After the layout settles, `placeOrphansAfterLayout` repositions view nodes
 * to the centroid of their `includes` members and places truly-orphan nodes
 * in a loose arc along the periphery.
 */
function runFcoseLayout(
	cy: Core,
	doc: SysProMDocument,
	options: BackboneLayoutOptions,
	onLabels: (labels: readonly OrphanLabel[]) => void,
): void {
	const layout = cy.layout(toLayoutOptions(options));
	layout.one("layoutstop", () => {
		const layoutEdgeIds = new Set<string>();
		cy.edges(":visible").forEach((edge) => {
			layoutEdgeIds.add(edge.id());
		});
		// Deferred to the next frame so positions are final after animation.
		setTimeout(() => {
			const labels = placeOrphansAfterLayout(cy, doc, layoutEdgeIds);
			onLabels(labels);
			cy.fit(undefined, 40);
		}, 0);
	});
	layout.run();
}

/** Highlight a node's neighbourhood and dim everything else. */
function highlightNeighbourhood(cy: Core, nodeId: string): void {
	const neighbours = neighbourhoodElementIds(cy, nodeId);
	cy.elements().forEach((ele) => {
		if (neighbours.has(ele.id())) {
			ele.removeClass("dimmed");
			ele.addClass("highlighted");
		} else {
			ele.removeClass("highlighted");
			ele.addClass("dimmed");
		}
	});
}

/** Clear all highlight/dim classes. */
function clearHighlight(cy: Core): void {
	cy.elements().removeClass("dimmed highlighted");
}
