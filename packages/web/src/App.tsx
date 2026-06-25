import React, { useCallback, useRef, useState } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import { type SysProMDocument as SysProMDocumentType } from "@sysprom/core";
import {
	loadJsonFile,
	loadMarkdownFile,
	loadMultiDoc,
	readFileText,
	type LoadResult,
} from "./load";
import { StatsTab } from "./tabs/StatsTab";
import { NodesTab } from "./tabs/NodesTab";
import { RelationshipsTab } from "./tabs/RelationshipsTab";
import { GraphsTab } from "./tabs/GraphsTab";
import { TraceTab } from "./tabs/TraceTab";
import {
	appShell,
	header,
	title,
	controls,
	button,
	primaryButton,
	dropZone,
	errorBox,
	tabsRoot,
	tabsList,
	tabsTrigger,
	muted,
} from "./styles.css";

const SAMPLE_PATH = "/sample.SysProM.json";

export function App(): React.ReactElement {
	const [result, setResult] = useState<LoadResult | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [dragging, setDragging] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleFiles = useCallback(async (files: FileList | File[]) => {
		setError(null);
		const fileArray = Array.from(files);
		if (fileArray.length === 0) return;

		try {
			if (fileArray.length === 1) {
				const file = fileArray[0];
				const text = await readFileText(file);
				if (file.name.endsWith(".json")) {
					setResult(loadJsonFile(text, file.name));
				} else if (file.name.endsWith(".md")) {
					setResult(loadMarkdownFile(text, file.name));
				} else {
					setError(`Unrecognised file type: ${file.name}`);
				}
			} else {
				// Multiple .md files → multi-doc parse
				const allMd = fileArray.every((f) => f.name.endsWith(".md"));
				if (!allMd) {
					setError(
						"When loading multiple files, all must be .md (multi-doc format).",
					);
					return;
				}
				const entries = await Promise.all(
					fileArray.map(async (f) => [f.name, await readFileText(f)] as const),
				);
				const fileMap = Object.fromEntries(entries);
				setResult(loadMultiDoc(fileMap, `${String(fileArray.length)} files`));
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : String(err));
			setResult(null);
		}
	}, []);

	const loadSample = useCallback(async () => {
		setError(null);
		try {
			const res = await fetch(SAMPLE_PATH);
			if (!res.ok) {
				throw new Error(`Failed to fetch sample: HTTP ${String(res.status)}`);
			}
			const text = await res.text();
			setResult(loadJsonFile(text, "sample.SysProM.json"));
		} catch (err) {
			setError(err instanceof Error ? err.message : String(err));
		}
	}, []);

	const exportDoc = useCallback(() => {
		if (!result) return;
		const json = canonicalJson(result.doc);
		const blob = new Blob([json], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "export.SysProM.json";
		a.click();
		URL.revokeObjectURL(url);
	}, [result]);

	const onDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			setDragging(false);
			if (e.dataTransfer.files.length > 0) {
				void handleFiles(e.dataTransfer.files);
			}
		},
		[handleFiles],
	);

	const doc: SysProMDocumentType | null = result?.doc ?? null;

	return (
		<div className={appShell}>
			<div className={header}>
				<h1 className={title}>SysProM Viewer</h1>
				<div className={controls}>
					<button
						type="button"
						className={button}
						onClick={() => fileInputRef.current?.click()}
					>
						Open file...
					</button>
					<button
						type="button"
						className={button}
						onClick={() => void loadSample()}
					>
						Load sample
					</button>
					{result && (
						<button
							type="button"
							className={`${button} ${primaryButton}`}
							onClick={exportDoc}
						>
							Export JSON
						</button>
					)}
					<input
						ref={fileInputRef}
						type="file"
						accept=".json,.md"
						multiple
						style={{ display: "none" }}
						onChange={(e) => {
							if (e.target.files) void handleFiles(e.target.files);
							e.target.value = "";
						}}
					/>
				</div>
			</div>

			{!doc && (
				<div
					className={dropZone}
					data-active={dragging}
					onDragOver={(e) => {
						e.preventDefault();
						setDragging(true);
					}}
					onDragLeave={() => {
						setDragging(false);
					}}
					onDrop={onDrop}
				>
					<p style={{ margin: 0 }}>
						Drop a <code>.SysProM.json</code> or <code>.SysProM.md</code> file
						here, or use the controls above.
					</p>
					<p className={muted} style={{ margin: "8px 0 0", fontSize: "12px" }}>
						For multi-document folders, drop multiple <code>.md</code> files at
						once.
					</p>
				</div>
			)}

			{error && <div className={errorBox}>{error}</div>}

			{doc && result && (
				<>
					{result.validation.issues.length > 0 && (
						<div className={errorBox}>
							<strong>
								Validation issues ({result.validation.issues.length}):
							</strong>
							{"\n"}
							{result.validation.issues.join("\n")}
						</div>
					)}
					<Tabs.Root defaultValue="stats" className={tabsRoot}>
						<Tabs.List className={tabsList}>
							<Tabs.Trigger value="stats" className={tabsTrigger}>
								Stats
							</Tabs.Trigger>
							<Tabs.Trigger value="nodes" className={tabsTrigger}>
								Nodes
							</Tabs.Trigger>
							<Tabs.Trigger value="rels" className={tabsTrigger}>
								Relationships
							</Tabs.Trigger>
							<Tabs.Trigger value="graphs" className={tabsTrigger}>
								Graphs
							</Tabs.Trigger>
							<Tabs.Trigger value="trace" className={tabsTrigger}>
								Trace
							</Tabs.Trigger>
						</Tabs.List>
						<Tabs.Content value="stats">
							<StatsTab doc={doc} />
						</Tabs.Content>
						<Tabs.Content value="nodes">
							<NodesTab doc={doc} />
						</Tabs.Content>
						<Tabs.Content value="rels">
							<RelationshipsTab doc={doc} />
						</Tabs.Content>
						<Tabs.Content value="graphs">
							<GraphsTab doc={doc} />
						</Tabs.Content>
						<Tabs.Content value="trace">
							<TraceTab doc={doc} />
						</Tabs.Content>
					</Tabs.Root>
				</>
			)}
		</div>
	);
}

/** Deterministic JSON serialisation for export (2-space indent, sorted keys). */
function canonicalJson(doc: SysProMDocumentType): string {
	return JSON.stringify(doc, null, 2);
}
