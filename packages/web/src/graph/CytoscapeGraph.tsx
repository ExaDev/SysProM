/**
 * Imperative Cytoscape.js React component.
 *
 * Creates a single Cytoscape instance on mount (preserved across re-renders),
 * then updates elements, layouts, and highlight state via the Cytoscape API.
 * This avoids the cost of tearing down and rebuilding the renderer on every
 * prop change — essential for the 223-node sample document.
 */
import React, { useEffect, useRef } from "react";
import cytoscape, {
	type Core,
	type EventObject,
	type NodeSingular,
} from "cytoscape";
import fcose from "cytoscape-fcose";
import type { SysProMDocument, Node } from "@sysprom/core";
import { buildElements, neighbourhoodElementIds } from "./elements";
import { buildStylesheet } from "./stylesheets";
import {
	computeElkPositions,
	buildPresetLayout,
	buildOverviewLayoutOptions,
	buildTraceLayoutOptions,
	toLayoutOptions,
	type LayoutMode,
} from "./layouts";

// Register the fcose layout extension once.
cytoscape.use(fcose);

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

		// Background tap (no selector → fires on core): clear selection.
		const handleBackgroundTap = (): void => {
			clearHighlight(cy);
			onSelectRef.current(null);
		};

		cy.on("tap", "node", handleNodeTap);
		cy.on("tap", handleBackgroundTap);

		return () => {
			cy.destroy();
			cyRef.current = null;
		};
	}, []);

	// Update the full element set when the document changes.
	useEffect(() => {
		const cy = cyRef.current;
		if (!cy) return;
		const elements = buildElements(doc);
		cy.elements().remove();
		cy.add(elements);
	}, [doc]);

	// Apply visibility filtering.
	useEffect(() => {
		const cy = cyRef.current;
		if (!cy) return;
		cy.nodes().forEach((node) => {
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

	// Apply the active layout.
	useEffect(() => {
		const cy = cyRef.current;
		if (!cy) return;

		if (layout === "layered") {
			void runElkLayered(cy, doc);
		} else if (layout === "overview") {
			cy.layout(toLayoutOptions(buildOverviewLayoutOptions())).run();
		} else {
			// layout === "trace"
			if (traceRootId) {
				cy.layout(toLayoutOptions(buildTraceLayoutOptions(traceRootId))).run();
			}
		}
	}, [layout, traceRootId, doc]);

	return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
}

/**
 * Run the ELK layered layout asynchronously, then apply the computed positions
 * via Cytoscape's preset layout.
 */
async function runElkLayered(cy: Core, doc: SysProMDocument): Promise<void> {
	const visibleNodes = cy.nodes(":visible");
	const visibleNodeIds = new Set(visibleNodes.map((n) => n.id()));
	const nodes: Node[] = doc.nodes.filter((node) => visibleNodeIds.has(node.id));
	const edges = doc.relationships ?? [];
	const visibleEdges = edges
		.filter((rel) => visibleNodeIds.has(rel.from) && visibleNodeIds.has(rel.to))
		.map((rel) => ({ source: rel.from, target: rel.to }));

	const positions = await computeElkPositions(nodes, visibleEdges);
	cy.layout(toLayoutOptions(buildPresetLayout(positions))).run();
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
