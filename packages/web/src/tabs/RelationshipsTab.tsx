import React, { useMemo, useState } from "react";
import {
	queryRelationshipsOp,
	RELATIONSHIP_LABEL_TO_TYPE,
	type SysProMDocument,
} from "@sysprom/core";
import { table, filterRow, select, monospace, badge } from "../styles.css";

const REL_LABELS = Object.keys(RELATIONSHIP_LABEL_TO_TYPE);

export function RelationshipsTab({
	doc,
}: {
	readonly doc: SysProMDocument;
}): React.ReactElement {
	const [typeFilter, setTypeFilter] = useState("");
	const [fromFilter, setFromFilter] = useState("");
	const [toFilter, setToFilter] = useState("");

	const rels = useMemo(() => {
		return queryRelationshipsOp({
			doc,
			...(typeFilter ? { type: typeFilter } : {}),
			...(fromFilter ? { from: fromFilter } : {}),
			...(toFilter ? { to: toFilter } : {}),
		});
	}, [doc, typeFilter, fromFilter, toFilter]);

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
					{REL_LABELS.map((label) => {
						const type = RELATIONSHIP_LABEL_TO_TYPE[label];
						return (
							<option key={type} value={type}>
								{label}
							</option>
						);
					})}
				</select>
				<input
					className={select}
					placeholder="From ID..."
					value={fromFilter}
					onChange={(e) => {
						setFromFilter(e.target.value);
					}}
				/>
				<input
					className={select}
					placeholder="To ID..."
					value={toFilter}
					onChange={(e) => {
						setToFilter(e.target.value);
					}}
				/>
				<span
					style={{ marginLeft: "auto", color: "#6b6b78", fontSize: "12px" }}
				>
					{rels.length} relationship{rels.length === 1 ? "" : "s"}
				</span>
			</div>
			<table className={table}>
				<thead>
					<tr>
						<th>From</th>
						<th>Type</th>
						<th>To</th>
					</tr>
				</thead>
				<tbody>
					{rels.map((r, i) => (
						<tr key={`${r.from}-${r.type}-${r.to}-${String(i)}`}>
							<td className={monospace}>{r.from}</td>
							<td>
								<span className={badge}>{r.type}</span>
							</td>
							<td className={monospace}>{r.to}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
