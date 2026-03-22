import * as z from "zod";
import { defineOperation } from "./define-operation.js";
import { Node, SysProMDocument } from "../schema.js";

export const TimelineEvent = z.object({
	nodeId: z.string(),
	nodeName: z.string(),
	nodeType: z.string(),
	state: z.string(),
	timestamp: z.string(),
});

export type TimelineEvent = z.infer<typeof TimelineEvent>;

export const timelineOp = defineOperation({
	name: "timeline",
	description:
		"Extract all timestamped lifecycle events from a document, sorted chronologically",
	input: z.object({
		doc: SysProMDocument,
	}),
	output: z.array(TimelineEvent),
	fn: (input) => {
		const events: TimelineEvent[] = [];

		function processNode(node: Node): void {
			if (node.lifecycle) {
				for (const [state, value] of Object.entries(node.lifecycle)) {
					if (typeof value === "string") {
						events.push({
							nodeId: node.id,
							nodeName: node.name,
							nodeType: node.type,
							state,
							timestamp: value,
						});
					}
				}
			}

			if (node.subsystem) {
				for (const subNode of node.subsystem.nodes) {
					processNode(subNode);
				}
			}
		}

		for (const node of input.doc.nodes) {
			processNode(node);
		}

		events.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

		return events;
	},
});
