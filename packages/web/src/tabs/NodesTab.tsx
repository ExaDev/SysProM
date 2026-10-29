import React, { useMemo, useState } from "react";
import {
	queryNodesOp,
	NODE_LABEL_TO_TYPE,
	type SysProMDocument,
} from "@sysprom/core";
import {
	table,
	filterRow,
	select,
	input,
	badge,
	monospace,
} from "../styles.css";

const TYPE_OPTIONS = Object.keys(NODE_LABEL_TO_TYPE);

export function NodesTab({
	doc,
}: {
	readonly doc: SysProMDocument;
}): React.ReactElement {
	const [typeFilter, setTypeFilter] = useState("");
	const [textFilter, setTextFilter] = useState("");

	const nodes = useMemo(() => {
		const result = queryNodesOp({
			doc,
			...(typeFilter ? { type: typeFilter } : {}),
		});
		if (textFilter.trim() === "") return result;
		const needle = textFilter.toLowerCase();
		return result.filter(
			(n) =>
				n.id.toLowerCase().includes(needle) ||
				n.name.toLowerCase().includes(needle),
		);
	}, [doc, typeFilter, textFilter]);

	return (
		<div>
			<div className={filterRow}>
				<select
					className={select}
					value={typeFilter}
					onChange={(e) => {
						setTypeFilter(e.target.value);
					}}
				>
					<option value="">All types</option>
					{TYPE_OPTIONS.map((label) => {
						const type = NODE_LABEL_TO_TYPE[label];
						return (
							<option key={type} value={type}>
								{label}
							</option>
						);
					})}
				</select>
				<input
					className={input}
					placeholder="Filter by ID or name..."
					value={textFilter}
					onChange={(e) => {
						setTextFilter(e.target.value);
					}}
				/>
				<span
					style={{ marginLeft: "auto", color: "#6b6b78", fontSize: "12px" }}
				>
					{nodes.length} node{nodes.length === 1 ? "" : "s"}
				</span>
			</div>
			<table className={table}>
				<thead>
					<tr>
						<th>ID</th>
						<th>Type</th>
						<th>Name</th>
						<th>Status</th>
					</tr>
				</thead>
				<tbody>
					{nodes.map((n) => {
						const status = n.lifecycle
							? Object.entries(n.lifecycle)
									.filter(([, v]) => v === true || typeof v === "string")
									.map(([k]) => k)
									.join(", ")
							: "—";
						return (
							<tr key={n.id}>
								<td className={monospace}>{n.id}</td>
								<td>
									<span className={badge}>{n.type}</span>
								</td>
								<td>{n.name}</td>
								<td className={monospace} style={{ color: "#6b6b78" }}>
									{status}
								</td>
							</tr>
						);
					})}
				</tbody>
			</table>
		</div>
	);
}
