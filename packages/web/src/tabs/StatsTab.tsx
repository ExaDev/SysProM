import React from "react";
import { statsOp, type SysProMDocument } from "@sysprom/core";
import {
	theme,
	statGrid,
	statCard,
	statLabel,
	statValue,
	statSub,
	sectionTitle,
	badge,
} from "../styles.css";

export function StatsTab({
	doc,
}: {
	readonly doc: SysProMDocument;
}): React.ReactElement {
	const stats = statsOp({ doc });

	const typeEntries = Object.entries(stats.nodesByType).sort(
		(a, b) => b[1] - a[1],
	);
	const relEntries = Object.entries(stats.relationshipsByType).sort(
		(a, b) => b[1] - a[1],
	);

	return (
		<div>
			<div className={statGrid}>
				<div className={statCard}>
					<div className={statLabel}>Title</div>
					<div className={statValue} style={{ fontSize: "16px" }}>
						{stats.title}
					</div>
				</div>
				<div className={statCard}>
					<div className={statLabel}>Nodes</div>
					<div className={statValue}>{stats.totalNodes}</div>
				</div>
				<div className={statCard}>
					<div className={statLabel}>Relationships</div>
					<div className={statValue}>{stats.totalRelationships}</div>
				</div>
				<div className={statCard}>
					<div className={statLabel}>Subsystems</div>
					<div className={statValue}>{stats.subsystemCount}</div>
					<div className={statSub}>max depth {stats.maxSubsystemDepth}</div>
				</div>
				<div className={statCard}>
					<div className={statLabel}>Views</div>
					<div className={statValue}>{stats.viewCount}</div>
				</div>
				<div className={statCard}>
					<div className={statLabel}>External References</div>
					<div className={statValue}>{stats.externalReferenceCount}</div>
				</div>
			</div>

			<div className={sectionTitle}>Nodes by type</div>
			<div className={statGrid}>
				{typeEntries.map(([type, count]) => (
					<div key={type} className={statCard}>
						<div className={statLabel}>{type}</div>
						<div className={statValue}>{count}</div>
					</div>
				))}
			</div>

			{relEntries.length > 0 && (
				<>
					<div className={sectionTitle}>Relationships by type</div>
					<div
						style={{ display: "flex", flexWrap: "wrap", gap: theme.space.xs }}
					>
						{relEntries.map(([type, count]) => (
							<span key={type} className={badge}>
								{type}: {count}
							</span>
						))}
					</div>
				</>
			)}
		</div>
	);
}
