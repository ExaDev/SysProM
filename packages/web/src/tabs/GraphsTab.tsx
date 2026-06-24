import React, { useEffect, useMemo, useRef, useState } from "react";
import mermaid from "mermaid";
import { graphOp, type SysProMDocument } from "@sysprom/core";
import { CytoscapeGraph } from "../graph/CytoscapeGraph";
import { GraphFilters, type FilterState } from "../graph/GraphFilters";
import { NodeDetails } from "../graph/NodeDetails";
import { Legend } from "../graph/Legend";
import type { LayoutMode } from "../graph/layouts";
import {
	filterRow,
	select,
	button,
	graphCanvas,
	graphWorkspace,
	layoutControls,
	layoutButton,
	muted,
} from "../styles.css";

mermaid.initialize({
	startOnLoad: false,
	theme: "default",
	securityLevel: "loose",
	flowchart: { useMaxWidth: true },
});

type View = "interactive" | "mermaid";

const LAYOUT_LABELS: Readonly<Record<LayoutMode, string>> = {
	layered: "Layered (ELK)",
	overview: "Overview (fCoSE)",
	trace: "Trace from selected",
};

const LAYOUT_MODES: readonly LayoutMode[] = ["layered", "overview", "trace"];

export function GraphsTab({
	doc,
}: {
	readonly doc: SysProMDocument;
}): React.ReactElement {
	const [view, setView] = useState<View>("interactive");
	const [layout, setLayout] = useState<LayoutMode>("overview");
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [showMermaidSource, setShowMermaidSource] = useState(false);

	// Filters default to everything visible.
	const [filters, setFilters] = useState<FilterState>(() =>
		initialFilters(doc),
	);

	// Recompute filters when a new document is loaded.
	useEffect(() => {
		setFilters(initialFilters(doc));
		setSelectedId(null);
	}, [doc]);

	// Compute the visible node set from filters.
	const visibleNodeIds = useMemo(() => {
		const result = new Set<string>();
		for (const node of doc.nodes) {
			if (!filters.visibleTypes.has(node.type)) continue;
			const statuses = Object.entries(node.lifecycle ?? {})
				.filter(([, value]) => value === true || typeof value === "string")
				.map(([key]) => key);
			// A node is visible if it has no lifecycle status set (so it is
			// never filtered out by status) or at least one of its statuses is
			// in the visible set.
			const statusVisible =
				statuses.length === 0 ||
				statuses.some((s) => filters.visibleStatuses.has(s));
			if (statusVisible) result.add(node.id);
		}
		return result;
	}, [doc, filters]);

	return (
		<div>
			<div className={filterRow}>
				<select
					className={select}
					value={view}
					onChange={(e) => {
						setView(e.target.value === "mermaid" ? "mermaid" : "interactive");
					}}
				>
					<option value="interactive">Interactive graph</option>
					<option value="mermaid">View as Mermaid</option>
				</select>
			</div>

			{view === "interactive" ? (
				<InteractiveView
					doc={doc}
					layout={layout}
					onLayoutChange={setLayout}
					selectedId={selectedId}
					onSelect={setSelectedId}
					filters={filters}
					onFiltersChange={setFilters}
					visibleNodeIds={visibleNodeIds}
				/>
			) : (
				<MermaidView
					doc={doc}
					showSource={showMermaidSource}
					onToggleSource={setShowMermaidSource}
				/>
			)}
		</div>
	);
}

function InteractiveView({
	doc,
	layout,
	onLayoutChange,
	selectedId,
	onSelect,
	filters,
	onFiltersChange,
	visibleNodeIds,
}: {
	readonly doc: SysProMDocument;
	readonly layout: LayoutMode;
	readonly onLayoutChange: (mode: LayoutMode) => void;
	readonly selectedId: string | null;
	readonly onSelect: (id: string | null) => void;
	readonly filters: FilterState;
	readonly onFiltersChange: (next: FilterState) => void;
	readonly visibleNodeIds: ReadonlySet<string>;
}): React.ReactElement {
	return (
		<div>
			<div className={filterRow} style={{ alignItems: "flex-start" }}>
				<GraphFilters doc={doc} state={filters} onChange={onFiltersChange} />
				<div style={{ marginLeft: "auto" }}>
					<div className={layoutControls}>
						{LAYOUT_MODES.map((mode) => (
							<button
								key={mode}
								type="button"
								className={layoutButton}
								data-active={layout === mode}
								onClick={() => {
									onLayoutChange(mode);
								}}
								disabled={mode === "trace" && selectedId === null}
								title={
									mode === "trace" && selectedId === null
										? "Select a node first"
										: undefined
								}
							>
								{LAYOUT_LABELS[mode]}
							</button>
						))}
					</div>
					<p
						className={muted}
						style={{ fontSize: "11px", marginTop: "4px", textAlign: "right" }}
					>
						{visibleNodeIds.size} of {doc.nodes.length} nodes visible
						{layout === "trace" && selectedId
							? ` — tracing from ${selectedId}`
							: ""}
					</p>
				</div>
			</div>

			<div className={graphWorkspace}>
				<div className={graphCanvas}>
					<CytoscapeGraph
						doc={doc}
						layout={layout}
						traceRootId={selectedId}
						visibleNodeIds={visibleNodeIds}
						onSelect={onSelect}
					/>
				</div>
				<NodeDetails nodeId={selectedId} doc={doc} />
			</div>

			<div style={{ marginTop: "12px" }}>
				<Legend />
			</div>
		</div>
	);
}

function MermaidView({
	doc,
	showSource,
	onToggleSource,
}: {
	readonly doc: SysProMDocument;
	readonly showSource: boolean;
	readonly onToggleSource: (next: boolean) => void;
}): React.ReactElement {
	const [kind, setKind] = useState<DiagramKind>("relationship");
	const [labelMode, setLabelMode] = useState<"friendly" | "compact">(
		"friendly",
	);
	const containerRef = useRef<HTMLDivElement>(null);
	const [error, setError] = useState<string | null>(null);

	const diagram = useMemo(() => {
		const config = KIND_CONFIG[kind];
		return graphOp({
			doc,
			format: "mermaid",
			layout: DIAGRAM_LAYOUT[kind],
			cluster: true,
			labelMode,
			...(config.relTypes ? { relTypes: config.relTypes } : {}),
			...(config.typeFilter ? { typeFilter: config.typeFilter } : {}),
		});
	}, [doc, kind, labelMode]);

	useEffect(() => {
		let cancelled = false;
		const render = async (): Promise<void> => {
			const container = containerRef.current;
			if (!container) return;
			setError(null);
			container.innerHTML = "";
			const id = `mmd-${String(renderCounter++)}`;
			try {
				const { svg } = await mermaid.render(id, diagram);
				if (cancelled) return;
				container.innerHTML = svg;
			} catch (err) {
				if (cancelled) return;
				setError(err instanceof Error ? err.message : String(err));
			}
		};
		void render();
		return () => {
			cancelled = true;
		};
	}, [diagram]);

	return (
		<div>
			<div className={filterRow}>
				<select
					className={select}
					value={kind}
					onChange={(e) => {
						if (isDiagramKind(e.target.value)) setKind(e.target.value);
					}}
				>
					{DIAGRAM_KINDS.map((k) => (
						<option key={k} value={k}>
							{DIAGRAM_LABELS[k]}
						</option>
					))}
				</select>
				<select
					className={select}
					value={labelMode}
					onChange={(e) => {
						if (isLabelMode(e.target.value)) setLabelMode(e.target.value);
					}}
				>
					<option value="friendly">Friendly labels</option>
					<option value="compact">Compact labels</option>
				</select>
				<button
					type="button"
					className={button}
					onClick={() => {
						onToggleSource(!showSource);
					}}
				>
					{showSource ? "Hide" : "Show"} Mermaid source
				</button>
			</div>
			{error && (
				<div
					style={{
						padding: "12px",
						backgroundColor: "#fdf0f0",
						color: "#c92a2a",
						borderRadius: "6px",
						fontFamily: "ui-monospace, monospace",
						fontSize: "12px",
						marginBottom: "12px",
						whiteSpace: "pre-wrap",
					}}
				>
					{error}
				</div>
			)}
			<div
				ref={containerRef}
				style={{
					backgroundColor: "#fff",
					border: "1px solid #e2e2e8",
					borderRadius: "8px",
					padding: "16px",
					overflow: "auto",
					minHeight: "300px",
				}}
			/>
			{showSource && (
				<pre
					style={{
						fontFamily: "ui-monospace, monospace",
						fontSize: "12px",
						overflow: "auto",
						padding: "12px",
						backgroundColor: "#f5f5f7",
						borderRadius: "6px",
						marginTop: "8px",
					}}
				>
					{diagram}
				</pre>
			)}
		</div>
	);
}

// --- Mermaid view configuration (preserved from the original GraphsTab) ---

type DiagramKind = "relationship" | "refinement" | "decision" | "dependency";

const DIAGRAM_LABELS: Record<DiagramKind, string> = {
	relationship: "Relationship Graph",
	refinement: "Refinement Chain",
	decision: "Decision Map",
	dependency: "Dependency Graph",
};

const DIAGRAM_LAYOUT: Record<DiagramKind, "TD" | "LR"> = {
	relationship: "TD",
	refinement: "TD",
	decision: "TD",
	dependency: "LR",
};

interface GraphKindConfig {
	readonly typeFilter?: string;
	readonly relTypes?: string[];
}

const DIAGRAM_KINDS = [
	"relationship",
	"refinement",
	"decision",
	"dependency",
] as const;

const KIND_CONFIG: Record<DiagramKind, GraphKindConfig> = {
	relationship: {},
	refinement: { relTypes: ["refines"] },
	decision: { relTypes: ["affects", "must_preserve", "supersedes"] },
	dependency: { relTypes: ["depends_on", "part_of"] },
};

function isDiagramKind(value: string): value is DiagramKind {
	return value in DIAGRAM_LABELS;
}

function isLabelMode(value: string): value is "friendly" | "compact" {
	return value === "friendly" || value === "compact";
}

let renderCounter = 0;

// --- Filter initialisation ---

function initialFilters(doc: SysProMDocument): FilterState {
	const types = new Set<string>();
	const statuses = new Set<string>();
	for (const node of doc.nodes) {
		types.add(node.type);
		for (const key of Object.keys(node.lifecycle ?? {})) {
			statuses.add(key);
		}
	}
	return { visibleTypes: types, visibleStatuses: statuses };
}
