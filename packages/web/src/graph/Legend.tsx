/**
 * Static legend mapping node-type colours/shapes and relationship-type colours
 * to the Cytoscape stylesheet so users can interpret the graph.
 */
import React from "react";
import { RELATIONSHIP_TYPE_LABELS } from "@sysprom/core";
import { typeStyle, relStyle } from "./stylesheets";
import {
	legendGrid,
	legendItem,
	legendSwatch,
	sectionTitle,
} from "../styles.css";

const NODE_TYPES_IN_LEGEND = [
	"intent",
	"concept",
	"capability",
	"element",
	"realisation",
	"artefact",
	"invariant",
	"decision",
	"change",
] as const;

export function Legend(): React.ReactElement {
	return (
		<details>
			<summary
				className={sectionTitle}
				style={{ cursor: "pointer", fontSize: "13px" }}
			>
				Legend
			</summary>
			<div className={legendGrid} style={{ marginTop: "8px" }}>
				<div>
					<strong style={{ fontSize: "11px" }}>Node types</strong>
					{NODE_TYPES_IN_LEGEND.map((type) => {
						const style = typeStyle(type);
						return (
							<div key={type} className={legendItem}>
								<span
									className={legendSwatch}
									style={{
										backgroundColor: style.fill,
										borderColor: style.border,
									}}
								/>
								{label(type)}
							</div>
						);
					})}
				</div>
				<div>
					<strong style={{ fontSize: "11px" }}>Relationship types</strong>
					{Object.entries(RELATIONSHIP_TYPE_LABELS).map(([key, label]) => {
						const style = relStyle(key);
						return (
							<div key={key} className={legendItem}>
								<span
									className={legendSwatch}
									style={{
										backgroundColor: "transparent",
										borderTop: `2px solid ${style.colour}`,
									}}
								/>
								{label}
							</div>
						);
					})}
				</div>
			</div>
		</details>
	);
}

function label(type: string): string {
	const labels: Readonly<Record<string, string>> = {
		intent: "Intent",
		concept: "Concept",
		capability: "Capability",
		element: "Element",
		realisation: "Realisation",
		artefact: "Artefact",
		invariant: "Invariant",
		decision: "Decision",
		change: "Change",
	};
	return labels[type] ?? type;
}
