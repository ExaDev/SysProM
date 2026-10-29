/**
 * Type and status filters for the interactive graph. Updates are live — the
 * parent recomputes the visible-node set on every change.
 */
import React, { useMemo } from "react";
import type { SysProMDocument, NodeType } from "@sysprom/core";
import { NODE_TYPE_LABELS } from "@sysprom/core";
import {
	filterGroup,
	filterGroupLabel,
	filterCheckboxRow,
} from "../styles.css";

export interface FilterState {
	readonly visibleTypes: ReadonlySet<string>;
	readonly visibleStatuses: ReadonlySet<string>;
}

export function GraphFilters({
	doc,
	state,
	onChange,
}: {
	readonly doc: SysProMDocument;
	readonly state: FilterState;
	readonly onChange: (next: FilterState) => void;
}): React.ReactElement {
	// Distinct types and statuses actually present in the document, so the
	// checkbox lists are minimal and relevant.
	const presentTypes = useMemo(() => {
		const set = new Set<NodeType>();
		for (const node of doc.nodes) set.add(node.type);
		return set;
	}, [doc]);

	const presentStatuses = useMemo(() => {
		const set = new Set<string>();
		for (const node of doc.nodes) {
			for (const key of Object.keys(node.lifecycle ?? {})) {
				set.add(key);
			}
		}
		return set;
	}, [doc]);

	const toggleType = (type: NodeType): void => {
		const next = new Set(state.visibleTypes);
		if (next.has(type)) next.delete(type);
		else next.add(type);
		onChange({ ...state, visibleTypes: next });
	};

	const toggleStatus = (status: string): void => {
		const next = new Set(state.visibleStatuses);
		if (next.has(status)) next.delete(status);
		else next.add(status);
		onChange({ ...state, visibleStatuses: next });
	};

	return (
		<div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
			<div className={filterGroup}>
				<span className={filterGroupLabel}>Node types</span>
				{[...presentTypes]
					.sort((a, b) => a.localeCompare(b))
					.map((type) => (
						<label key={type} className={filterCheckboxRow}>
							<input
								type="checkbox"
								checked={state.visibleTypes.has(type)}
								onChange={() => {
									toggleType(type);
								}}
							/>
							{typeStyleLabel(type)}
						</label>
					))}
			</div>
			<div className={filterGroup}>
				<span className={filterGroupLabel}>Statuses</span>
				{[...presentStatuses]
					.sort((a, b) => a.localeCompare(b))
					.map((status) => (
						<label key={status} className={filterCheckboxRow}>
							<input
								type="checkbox"
								checked={state.visibleStatuses.has(status)}
								onChange={() => {
									toggleStatus(status);
								}}
							/>
							{status}
						</label>
					))}
			</div>
		</div>
	);
}

function typeStyleLabel(type: NodeType): string {
	return NODE_TYPE_LABELS[type];
}
