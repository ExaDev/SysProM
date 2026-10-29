import React, { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { type SysProMDocument } from "@sysprom/core";
import { CytoscapeGraph } from "../graph/CytoscapeGraph";
import { GraphFilters, type FilterState } from "../graph/GraphFilters";
import { NodeDetails } from "../graph/NodeDetails";
import { Legend } from "../graph/Legend";
import type { LayoutMode } from "../graph/layouts";
import {
	filterRow,
	select,
	graphCanvas,
	graphWorkspace,
	layoutControls,
	layoutButton,
	muted,
} from "../styles.css";

// Lazy-load the Mermaid view so the mermaid library is fetched in its own
// chunk only when the user activates "View as Mermaid".
const MermaidView = lazy(() =>
	import("./MermaidView").then((mod) => ({ default: mod.MermaidView })),
);

type View = "interactive" | "mermaid";

const LAYOUT_LABELS: Readonly<Record<LayoutMode, string>> = {
	refinement: "Refinement hierarchy",
	emergent: "Emergent topology",
	subsystem: "By subsystem",
	overview: "Overview (fCoSE)",
	elk: "ELK Layered",
	trace: "Trace from selected",
};

const LAYOUT_MODES: readonly LayoutMode[] = [
	"refinement",
	"emergent",
	"subsystem",
	"overview",
	"elk",
	"trace",
];

export function GraphsTab({
	doc,
}: {
	readonly doc: SysProMDocument;
}): React.ReactElement {
	const [view, setView] = useState<View>("interactive");
	const [layout, setLayout] = useState<LayoutMode>("refinement");
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
				<Suspense
					fallback={
						<div className={muted} style={{ padding: "24px" }}>
							Loading Mermaid…
						</div>
					}
				>
					<MermaidView
						doc={doc}
						showSource={showMermaidSource}
						onToggleSource={setShowMermaidSource}
					/>
				</Suspense>
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
