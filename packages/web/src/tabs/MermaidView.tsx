/**
 * Mermaid diagram view — lazy-loaded so that the `mermaid` library is only
 * fetched when the user activates "View as Mermaid".
 */
import React, { useEffect, useMemo, useRef, useState } from "react";
import { graphOp, type SysProMDocument } from "@sysprom/core";
import { button, filterRow, select } from "../styles.css";

let mermaidInitialised = false;

interface MermaidApi {
	render: (id: string, text: string) => Promise<{ svg: string }>;
}

/**
 * Dynamically import mermaid (moving it into its own chunk) and initialise it
 * on first use. Subsequent calls return the cached module.
 */
async function loadMermaid(): Promise<MermaidApi> {
	const { default: mermaid } = await import("mermaid");
	if (!mermaidInitialised) {
		mermaid.initialize({
			startOnLoad: false,
			theme: "default",
			securityLevel: "loose",
			flowchart: { useMaxWidth: true },
		});
		mermaidInitialised = true;
	}
	return mermaid;
}

export function MermaidView({
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
				const mermaid = await loadMermaid();
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
