import React, { useMemo, useState } from "react";
import {
	traceFromNodeOp,
	type SysProMDocument,
	type TraceNode,
} from "@sysprom/core";
import {
	filterRow,
	select,
	traceTree,
	monospace,
	badge,
	muted,
} from "../styles.css";

export function TraceTab({
	doc,
}: {
	readonly doc: SysProMDocument;
}): React.ReactElement {
	const nodeIds = useMemo(
		() => doc.nodes.map((n) => n.id).sort((a, b) => a.localeCompare(b)),
		[doc],
	);
	const [selected, setSelected] = useState(nodeIds[0] ?? "");

	const trace = useMemo(() => {
		if (!selected) return null;
		return traceFromNodeOp({ doc, startId: selected });
	}, [doc, selected]);

	return (
		<div>
			<div className={filterRow}>
				<select
					className={select}
					value={selected}
					onChange={(e) => {
						setSelected(e.target.value);
					}}
				>
					{nodeIds.map((id) => (
						<option key={id} value={id}>
							{id}
						</option>
					))}
				</select>
			</div>
			{trace && (
				<div className={traceTree}>
					<TraceBranch node={trace} depth={0} />
				</div>
			)}
			{trace?.children.length === 0 && (
				<p className={muted}>
					No refinement chain from this node (no refines/realises/implements
					relationships point to it).
				</p>
			)}
		</div>
	);
}

function TraceBranch({
	node,
	depth,
}: {
	readonly node: TraceNode;
	readonly depth: number;
}): React.ReactElement | null {
	const indent = "  ".repeat(depth);
	const label = node.node ? node.node.name : "(unknown)";
	const type = node.node?.type;
	return (
		<div>
			<div>
				{indent}
				<span className={monospace}>{node.id}</span>{" "}
				{type && <span className={badge}>{type}</span>} <span>{label}</span>
			</div>
			{node.children.map((child, i) => (
				<TraceBranch
					key={`${child.id}-${String(i)}`}
					node={child}
					depth={depth + 1}
				/>
			))}
		</div>
	);
}
