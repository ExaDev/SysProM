import * as z from "zod";
import { defineOperation } from "./define-operation.js";
import { Node, SysProMDocument } from "../schema.js";

/** Zod schema for a timestamped lifecycle event of a specific node. */
export const TimelineEvent = z.object({
	nodeId: z.string(),
	nodeName: z.string(),
	nodeType: z.string(),
	state: z.string(),
	timestamp: z.string(),
});

/** A timestamped lifecycle event of a specific node. */
export type TimelineEvent = z.infer<typeof TimelineEvent>;

/** Extract the lifecycle history of a specific node, sorted chronologically. Searches recursively into subsystems. Returns an empty array if the node is not found. */
export const nodeHistoryOp = defineOperation({
	name: "node-history",
	description:
		"Extract the lifecycle history of a specific node, sorted chronologically",
	input: z.object({
		doc: SysProMDocument,
		nodeId: z.string(),
	}),
	output: z.array(TimelineEvent),
	fn: (input) => {
		function findNode(
			searchDoc: SysProMDocument,
			id: string,
		): Node | undefined {
			for (const node of searchDoc.nodes) {
				if (node.id === id) {
					return node;
				}
				if (node.subsystem) {
					const found = findNode(node.subsystem, id);
					if (found) {
						return found;
					}
				}
			}
			return undefined;
		}

		const node = findNode(input.doc, input.nodeId);
		if (!node) {
			return [];
		}

		const events: TimelineEvent[] = [];

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

		events.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

		return events;
	},
});
