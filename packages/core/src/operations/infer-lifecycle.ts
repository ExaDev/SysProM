import * as z from "zod";
import { defineOperation } from "./define-operation.js";
import { SysProMDocument } from "../schema.js";

/**
 * Lifecycle inference result for a single node.
 */
const LifecycleResult = z.object({
	id: z.string(),
	type: z.string(),
	name: z.string(),
	lifecycle: z
		.record(z.string(), z.union([z.boolean(), z.string()]))
		.optional(),
	inferredState: z.string(),
	inferredPhase: z.enum(["early", "middle", "late", "terminal", "unknown"]),
});

/** Lifecycle inference result for a single node. */
export type LifecycleResult = z.infer<typeof LifecycleResult>;

/**
 * Output schema for inferLifecycleOp.
 */
const LifecycleOutput = z.object({
	nodes: z.array(LifecycleResult),
	summary: z.record(z.string(), z.number()),
});

/** Output of lifecycle inference operation. */
export type LifecycleOutput = z.infer<typeof LifecycleOutput>;

/**
 * Lifecycle phases based on typical progression.
 */
const PHASE_MAP: Record<string, "early" | "middle" | "late" | "terminal"> = {
	proposed: "early",
	accepted: "early",
	defined: "early",
	in_progress: "middle",
	active: "middle",
	experimental: "middle",
	implemented: "late",
	adopted: "late",
	introduced: "late",
	complete: "late",
	consolidated: "late",
	deprecated: "terminal",
	retired: "terminal",
	superseded: "terminal",
	abandoned: "terminal",
	deferred: "terminal",
};

/**
 * Determine the most advanced lifecycle state from lifecycle record.
 * @param lifecycle - The lifecycle record to analyse.
 * @returns The most advanced state name, or null if no active states.
 * @example
 * ```ts
 * getMostAdvancedState({ proposed: true, accepted: "2024-01-15" });
 * // Returns "accepted"
 * ```
 */
function getMostAdvancedState(
	lifecycle: Record<string, boolean | string> | undefined,
): string | null {
	if (!lifecycle) return null;

	// Find states that are true or have a date string
	const activeStates = Object.entries(lifecycle)
		.filter(([, value]) => value === true || typeof value === "string")
		.map(([state]) => state);

	if (activeStates.length === 0) return null;

	// Return the last active state (assumes ordered by progression)
	return activeStates[activeStates.length - 1];
}

/**
 * Infer lifecycle state for all nodes based on lifecycle fields.
 *
 * Returns inferred state, phase classification, and summary statistics.
 */
export const inferLifecycleOp = defineOperation({
	name: "infer-lifecycle",
	description: "Infer lifecycle state for nodes based on lifecycle fields",
	input: z.object({
		doc: SysProMDocument,
	}),
	output: LifecycleOutput,
	fn: (input): LifecycleOutput => {
		const results: LifecycleResult[] = [];
		const summary: Record<string, number> = {
			early: 0,
			middle: 0,
			late: 0,
			terminal: 0,
			unknown: 0,
		};

		for (const node of input.doc.nodes) {
			// Determine inferred state from lifecycle only
			let inferredState: string;
			let inferredPhase: "early" | "middle" | "late" | "terminal" | "unknown";

			const lifecycleState = getMostAdvancedState(node.lifecycle);

			if (lifecycleState) {
				inferredState = lifecycleState;
				inferredPhase = PHASE_MAP[lifecycleState] ?? "unknown";
			} else {
				inferredState = "undefined";
				inferredPhase = "unknown";
			}

			summary[inferredPhase]++;

			results.push({
				id: node.id,
				type: node.type,
				name: node.name,
				lifecycle: node.lifecycle,
				inferredState,
				inferredPhase,
			});
		}

		return { nodes: results, summary };
	},
});
