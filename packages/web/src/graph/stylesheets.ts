/**
 * Cytoscape stylesheet definitions driven by the app's vanilla-extract theme
 * tokens. Node fill/shape is keyed by SysProM node `type`; edge line-colour
 * and width by relationship `type`; dashed/border styles carry semantic
 * meaning (pending, deprecated, subsystem-bearing).
 */
import type { StylesheetJson, StylesheetJsonBlock, Css } from "cytoscape";
import { theme } from "../styles.css";

/** Node shape literal union from Cytoscape. */
type NodeShape = Css.NodeShape;

// Per-type palette. Fills are distinct hues so the 18 node types are visually
// separable in a dense graph. Each pairs a fill with a darker border.
interface TypeStyle {
	readonly fill: string;
	readonly border: string;
	readonly shape: NodeShape;
}

const TYPE_STYLES: Readonly<Record<string, TypeStyle>> = {
	intent: { fill: "#f59f00", border: "#e67700", shape: "round-rectangle" },
	concept: { fill: "#f783ac", border: "#c2255c", shape: "round-rectangle" },
	capability: {
		fill: "#69db7c",
		border: "#2b8a3e",
		shape: "round-rectangle",
	},
	element: { fill: "#74c0fc", border: "#1971c2", shape: "rectangle" },
	realisation: {
		fill: "#ffc078",
		border: "#d9480f",
		shape: "rectangle",
	},
	artefact: { fill: "#b197fc", border: "#5f3dc4", shape: "hexagon" },
	invariant: { fill: "#ffa8a8", border: "#c92a2a", shape: "diamond" },
	principle: { fill: "#ffa8a8", border: "#c92a2a", shape: "diamond" },
	policy: { fill: "#ffa8a8", border: "#c92a2a", shape: "diamond" },
	protocol: { fill: "#63e6be", border: "#0ca678", shape: "vee" },
	stage: { fill: "#63e6be", border: "#0ca678", shape: "vee" },
	role: { fill: "#a5d8ff", border: "#1971c2", shape: "ellipse" },
	gate: { fill: "#ffec99", border: "#f08c00", shape: "octagon" },
	mode: { fill: "#ffc9c9", border: "#c92a2a", shape: "tag" },
	decision: { fill: "#d0bfff", border: "#5f3dc4", shape: "round-diamond" },
	change: { fill: "#d3f9d8", border: "#2b8a3e", shape: "round-tag" },
	view: { fill: "#e9dbff", border: "#6741d9", shape: "round-triangle" },
	milestone: { fill: "#fff3bf", border: "#f08c00", shape: "star" },
};

function typeStyle(type: string): TypeStyle {
	return (
		TYPE_STYLES[type] ?? {
			fill: theme.color.textMuted,
			border: theme.color.text,
			shape: "ellipse",
		}
	);
}

// Per-relationship-type colour and width. Refinement-chain types are green;
// dependency/structure types blue; constraint/governance red; temporal grey.
interface RelStyle {
	readonly colour: string;
	readonly width: number;
}

const REL_STYLES: Readonly<Record<string, RelStyle>> = {
	refines: { colour: "#2b8a3e", width: 2 },
	realises: { colour: "#2b8a3e", width: 2 },
	implements: { colour: "#2b8a3e", width: 1.5 },
	depends_on: { colour: "#1971c2", width: 1.5 },
	part_of: { colour: "#1971c2", width: 1.5 },
	constrained_by: { colour: "#c92a2a", width: 1.5 },
	governed_by: { colour: "#c92a2a", width: 1.5 },
	affects: { colour: "#e8590c", width: 1.5 },
	must_preserve: { colour: "#c92a2a", width: 2 },
	supersedes: { colour: "#e8590c", width: 1.5 },
	precedes: { colour: "#868e96", width: 1 },
	must_follow: { colour: "#868e96", width: 1 },
	produces: { colour: "#5f3dc4", width: 1.5 },
	modifies: { colour: "#5f3dc4", width: 1.5 },
};

function relStyle(type: string): RelStyle {
	return REL_STYLES[type] ?? { colour: theme.color.textMuted, width: 1 };
}

/**
 * Build the Cytoscape stylesheet for the graph. Uses `mapData` selectors to
 * drive style from the element data fields, so one stylesheet handles every
 * node/edge type without conditional logic.
 */
export function buildStylesheet(): StylesheetJson {
	const base: StylesheetJsonBlock[] = [
		{
			selector: "node",
			style: {
				label: "data(name)",
				"font-size": "10px",
				"font-family": theme.font.body,
				color: theme.color.text,
				"text-valign": "bottom",
				"text-halign": "center",
				"text-margin-y": 4,
				"text-max-width": "80px",
				"text-wrap": "wrap",
				width: 28,
				height: 28,
				"border-width": 2,
				"background-opacity": 0.9,
				"transition-property":
					"opacity, background-color, border-color, border-width",
				"transition-duration": 150,
			},
		},
		{
			selector: "edge",
			style: {
				"curve-style": "bezier",
				"target-arrow-shape": "triangle",
				"arrow-scale": 0.9,
				"line-color": theme.color.textMuted,
				"target-arrow-color": theme.color.textMuted,
				width: 1.5,
				"text-rotation": "autorotate",
				"font-size": "8px",
				color: theme.color.textMuted,
				opacity: 0.7,
				"transition-property": "opacity, line-color, width",
				"transition-duration": 150,
			},
		},
	];

	// Per-type node styling. One selector per known type.
	const typeSelectors: StylesheetJsonBlock[] = Object.entries(TYPE_STYLES).map(
		([type, style]) => ({
			selector: `node[type="${type}"]`,
			style: {
				"background-color": style.fill,
				"border-color": style.border,
				shape: style.shape,
			},
		}),
	);

	// Per-relationship-type edge styling.
	const relSelectors: StylesheetJsonBlock[] = Object.entries(REL_STYLES).map(
		([type, style]) => ({
			selector: `edge[type="${type}"]`,
			style: {
				"line-color": style.colour,
				"target-arrow-color": style.colour,
				width: style.width,
			},
		}),
	);

	const semantic: StylesheetJsonBlock[] = [
		// Nodes carrying a recursive subsystem: thicker border + dashed ring.
		{
			selector: "node[hasSubsystem]",
			style: {
				"border-width": 3,
				"border-style": "double",
			},
		},
		// Pending nodes (proposed/deferred/experimental): dashed border.
		{
			selector:
				"node[status = 'proposed'], node[status = 'deferred'], node[status = 'experimental']",
			style: {
				"border-style": "dashed",
			},
		},
		// Deprecated nodes: dimmed fill.
		{
			selector:
				"node[status = 'deprecated'], node[status = 'retired'], node[status = 'superseded'], node[status = 'abandoned']",
			style: {
				"background-opacity": 0.4,
			},
		},
		// Positive-polarity edges: green tint.
		{
			selector: "edge[polarity = 'positive']",
			style: { "line-color": "#2b8a3e", "target-arrow-color": "#2b8a3e" },
		},
		// Negative-polarity edges: red tint.
		{
			selector: "edge[polarity = 'negative']",
			style: { "line-color": "#c92a2a", "target-arrow-color": "#c92a2a" },
		},
		// Strong edges: wider.
		{
			selector: "edge[strength >= 0.8]",
			style: { width: 3 },
		},
		// Selection + hover states.
		{
			selector: "node:selected",
			style: {
				"border-width": 4,
				"border-color": theme.color.accent,
				"overlay-color": theme.color.accent,
				"overlay-opacity": 0.2,
			},
		},
		{
			selector: "edge:selected",
			style: { width: 3, opacity: 1 },
		},
		// Hidden nodes (filtered out).
		{
			selector: ".hidden",
			style: { display: "none" },
		},
		// Dimmed (non-neighbour) state — applied via a class toggled on highlight.
		{
			selector: ".dimmed",
			style: { opacity: 0.15 },
		},
		{
			selector: ".highlighted",
			style: { opacity: 1, "border-width": 4 },
		},
	];

	return [...base, ...typeSelectors, ...relSelectors, ...semantic];
}

export { typeStyle, relStyle, type TypeStyle, type RelStyle };
