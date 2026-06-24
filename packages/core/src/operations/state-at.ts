import * as z from "zod";
import { defineOperation } from "./define-operation.js";
import { Node, SysProMDocument } from "../schema.js";

/** Zod schema for a node's active lifecycle states at a point in time. */
export const NodeState = z.object({
	nodeId: z.string(),
	nodeName: z.string(),
	activeStates: z.array(z.string()),
});

/** A node's active lifecycle states at a given point in time. */
export type NodeState = z.infer<typeof NodeState>;

/** Determine the active lifecycle states of all nodes at a specific point in time. Boolean lifecycle values are always included; ISO date values are included if they precede the query timestamp. */
export const stateAtOp = defineOperation({
	name: "state-at",
	description:
		"Determine the active states of all nodes at a specific point in time",
	input: z.object({
		doc: SysProMDocument,
		timestamp: z.string(),
	}),
	output: z.array(NodeState),
	fn: (input) => {
		const nodeStates = new Map<string, NodeState>();

		function processNode(node: Node): void {
			if (node.lifecycle) {
				const activeStates: string[] = [];

				for (const [state, value] of Object.entries(node.lifecycle)) {
					if (typeof value === "boolean") {
						if (value) {
							activeStates.push(state);
						}
					} else if (typeof value === "string") {
						if (value.localeCompare(input.timestamp) <= 0) {
							activeStates.push(state);
						}
					}
				}

				if (activeStates.length > 0) {
					nodeStates.set(node.id, {
						nodeId: node.id,
						nodeName: node.name,
						activeStates: activeStates.sort(),
					});
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

		return Array.from(nodeStates.values()).sort((a, b) =>
			a.nodeId.localeCompare(b.nodeId),
		);
	},
});
