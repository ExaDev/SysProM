import type { Node, NodeStatus } from "./schema.js";
import { NODE_STATUSES } from "./schema.js";

function isLifecycleReached(value: boolean | string | undefined): boolean {
	return value === true || typeof value === "string";
}

/**
 * Return true when a lifecycle state is marked as reached on a node.
 */
export function hasLifecycleState(node: Node, state: string): boolean {
	return isLifecycleReached(node.lifecycle?.[state]);
}

/**
 * Return the most advanced reached lifecycle state, if any.
 */
export function primaryLifecycleState(node: Node): NodeStatus | undefined {
	for (let index = NODE_STATUSES.length - 1; index >= 0; index -= 1) {
		const state = NODE_STATUSES[index];
		if (hasLifecycleState(node, state)) {
			return state;
		}
	}
	return undefined;
}
