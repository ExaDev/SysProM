import React, { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import { graphOp, type SysProMDocument } from "@sysprom/core";
import { filterRow, select, graphContainer, button } from "../styles.css";

mermaid.initialize({
	startOnLoad: false,
	theme: "default",
	securityLevel: "loose",
	flowchart: { useMaxWidth: true },
});

type DiagramKind = "relationship" | "refinement" | "decision" | "dependency";

const DIAGRAM_LABELS: Record<DiagramKind, string> = {
	relationship: "Relationship Graph",
	refinement: "Refinement Chain",
	decision: "Decision Map",
	dependency: "Dependency Graph",
};

// Per-diagram layout defaults matching the CLI json2md behaviour.
const DIAGRAM_LAYOUT: Record<DiagramKind, "TD" | "LR"> = {
	relationship: "TD",
	refinement: "TD",
	decision: "TD",
	dependency: "LR",
};

interface GraphKindConfig {
	typeFilter?: string;
	relTypes?: string[];
}

const DIAGRAM_KINDS = [
	"relationship",
	"refinement",
	"decision",
	"dependency",
] as const;

// The four diagram kinds the CLI produces. Each uses a different
// relationship-type filter so the generated graph is focused.
const KIND_CONFIG: Record<DiagramKind, GraphKindConfig> = {
	relationship: {},
	refinement: { relTypes: ["refines"] },
	decision: {
		relTypes: ["affects", "must_preserve", "supersedes"],
	},
	dependency: { relTypes: ["depends_on", "part_of"] },
};

function isDiagramKind(value: string): value is DiagramKind {
	return value in DIAGRAM_LABELS;
}

function isLabelMode(value: string): value is "friendly" | "compact" {
	return value === "friendly" || value === "compact";
}

let renderCounter = 0;

export function GraphsTab({
	doc,
}: {
	readonly doc: SysProMDocument;
}): React.ReactElement {
	const [kind, setKind] = useState<DiagramKind>("relationship");
	const [labelMode, setLabelMode] = useState<"friendly" | "compact">(
		"friendly",
	);
	const containerRef = useRef<HTMLDivElement>(null);
	const [error, setError] = useState<string | null>(null);

	const diagram = React.useMemo(() => {
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
						const value = e.target.value;
						if (isDiagramKind(value)) setKind(value);
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
						const value = e.target.value;
						if (isLabelMode(value)) setLabelMode(value);
					}}
				>
					<option value="friendly">Friendly labels</option>
					<option value="compact">Compact labels</option>
				</select>
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
			<div className={graphContainer} ref={containerRef} />
			<details style={{ marginTop: "12px" }}>
				<summary className={button} style={{ display: "inline-block" }}>
					Show Mermaid source
				</summary>
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
			</details>
		</div>
	);
}
