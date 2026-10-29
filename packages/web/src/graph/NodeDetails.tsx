/**
 * Side panel showing details for the currently selected graph node.
 */
import React from "react";
import type { SysProMDocument, Relationship, NodeType } from "@sysprom/core";
import { NODE_TYPE_LABELS } from "@sysprom/core";
import {
	detailsPanel,
	detailsField,
	detailsLabel,
	detailsValue,
	badge,
	sectionTitle,
	muted,
} from "../styles.css";

export function NodeDetails({
	nodeId,
	doc,
}: {
	readonly nodeId: string | null;
	readonly doc: SysProMDocument;
}): React.ReactElement {
	if (!nodeId) {
		return (
			<aside className={detailsPanel}>
				<p className={muted} style={{ margin: 0 }}>
					Click a node to see its details.
				</p>
			</aside>
		);
	}

	const node = doc.nodes.find((n) => n.id === nodeId);
	if (!node) {
		return (
			<aside className={detailsPanel}>
				<p className={muted} style={{ margin: 0 }}>
					Node {nodeId} not found.
				</p>
			</aside>
		);
	}

	const relationships = doc.relationships ?? [];
	const incoming = relationships.filter((r) => r.to === nodeId);
	const outgoing = relationships.filter((r) => r.from === nodeId);
	const description =
		typeof node.description === "string" ? node.description : undefined;
	const subsystem = node.subsystem;

	return (
		<aside className={detailsPanel}>
			<div className={detailsField}>
				<div className={detailsLabel}>ID</div>
				<div
					className={detailsValue}
					style={{ fontFamily: "ui-monospace, monospace" }}
				>
					{node.id}
				</div>
			</div>
			<div className={detailsField}>
				<div className={detailsLabel}>Type</div>
				<div className={detailsValue}>
					<span className={badge}>{typeLabel(node.type)}</span>
				</div>
			</div>
			<div className={detailsField}>
				<div className={detailsLabel}>Name</div>
				<div className={detailsValue}>{node.name}</div>
			</div>
			{primaryStatus(node.lifecycle) && (
				<div className={detailsField}>
					<div className={detailsLabel}>Status</div>
					<div className={detailsValue}>
						<span className={badge}>{primaryStatus(node.lifecycle)}</span>
					</div>
				</div>
			)}
			{lifecycleList(node.lifecycle).length > 0 && (
				<div className={detailsField}>
					<div className={detailsLabel}>Lifecycle</div>
					<div className={detailsValue}>
						{lifecycleList(node.lifecycle).join(", ")}
					</div>
				</div>
			)}
			{description && (
				<div className={detailsField}>
					<div className={detailsLabel}>Description</div>
					<div className={detailsValue}>{description}</div>
				</div>
			)}
			<div className={sectionTitle} style={{ fontSize: "13px" }}>
				Relationships
			</div>
			<div className={detailsField}>
				<div className={detailsLabel}>Incoming</div>
				<div className={detailsValue}>{String(incoming.length)}</div>
			</div>
			<div className={detailsField}>
				<div className={detailsLabel}>Outgoing</div>
				<div className={detailsValue}>{String(outgoing.length)}</div>
			</div>
			{incoming.length > 0 && (
				<RelationshipList title="Incoming" rels={incoming} doc={doc} />
			)}
			{outgoing.length > 0 && (
				<RelationshipList title="Outgoing" rels={outgoing} doc={doc} />
			)}
			{subsystem && (
				<div className={detailsField}>
					<div className={detailsLabel}>Subsystem</div>
					<div className={detailsValue}>{subsystemSummary(subsystem)}</div>
				</div>
			)}
		</aside>
	);
}

function RelationshipList({
	title,
	rels,
	doc,
}: {
	readonly title: string;
	readonly rels: readonly Relationship[];
	readonly doc: SysProMDocument;
}): React.ReactElement {
	return (
		<div className={detailsField}>
			<div className={detailsLabel}>{title}</div>
			<div className={detailsValue} style={{ fontSize: "12px" }}>
				{rels.map((rel, index) => {
					const otherId = title === "Incoming" ? rel.from : rel.to;
					const other = doc.nodes.find((n) => n.id === otherId);
					return (
						<div key={`${rel.from}-${rel.to}-${rel.type}-${String(index)}`}>
							<span className={badge}>{rel.type}</span>{" "}
							<span style={{ fontFamily: "ui-monospace, monospace" }}>
								{otherId}
							</span>
							{other ? `: ${other.name}` : ""}
						</div>
					);
				})}
			</div>
		</div>
	);
}

function typeLabel(type: NodeType): string {
	return NODE_TYPE_LABELS[type];
}

/** Render a human-readable summary of a recursive subsystem's contents. */
function subsystemSummary(subsystem: SysProMDocument): string {
	const nodeCount = subsystem.nodes.length;
	const relCount = subsystem.relationships?.length ?? 0;
	const nodePart = `${String(nodeCount)} node${plural(nodeCount)}`;
	const relPart =
		relCount > 0 ? `, ${String(relCount)} relationship${plural(relCount)}` : "";
	return `Contains ${nodePart}${relPart}.`;
}

function plural(count: number): string {
	return count === 1 ? "" : "s";
}

function primaryStatus(
	lifecycle: Record<string, boolean | string> | undefined,
): string | undefined {
	if (!lifecycle) return undefined;
	// Return the first truthy key.
	for (const [key, value] of Object.entries(lifecycle)) {
		if (value === true || typeof value === "string") return key;
	}
	return undefined;
}

function lifecycleList(
	lifecycle: Record<string, boolean | string> | undefined,
): string[] {
	if (!lifecycle) return [];
	return Object.entries(lifecycle)
		.filter(([, value]) => value === true || typeof value === "string")
		.map(([key]) => key);
}
