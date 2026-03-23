import * as z from "zod";
import { defineOperation } from "./define-operation.js";
import { Node, SysProMDocument } from "../schema.js";

/**
 * Impact node in the impact trace.
 */
const ImpactNode = z.object({
	id: z.string(),
	node: Node.optional(),
	impactType: z.enum(["direct", "transitive", "potential"]),
	distance: z.number().int().nonnegative(),
});

/** Impact node in the impact trace. */
export type ImpactNode = z.infer<typeof ImpactNode>;

/**
 * Output schema for inferImpactOp.
 */
const ImpactOutput = z.object({
	sourceId: z.string(),
	impactedNodes: z.array(ImpactNode),
	summary: z.object({
		direct: z.number(),
		transitive: z.number(),
		potential: z.number(),
		total: z.number(),
	}),
});

/** Output of impact inference operation. */
export type ImpactOutput = z.infer<typeof ImpactOutput>;

/**
 * Relationship types that indicate impact propagation.
 */
const IMPACT_RELATIONSHIPS = new Set([
	"affects",
	"depends_on",
	"modifies",
	"constrained_by",
	"requires",
	"produces",
	"consumes",
]);

/**
 * Relationship types that indicate potential impact (weaker signal).
 */
const POTENTIAL_IMPACT_RELATIONSHIPS = new Set([
	"part_of",
	"governed_by",
	"must_follow",
]);

/**
 * Infer impact from a starting node through the graph.
 *
 * Traces impact propagation through affect, dependency, and modification
 * relationships, categorising nodes as directly impacted, transitively
 * impacted, or potentially impacted.
 */
export const inferImpactOp = defineOperation({
	name: "infer-impact",
	description:
		"Infer impact from a node through the graph following impact relationships",
	input: z.object({
		doc: SysProMDocument,
		startId: z.string(),
	}),
	output: ImpactOutput,
	fn: (input): ImpactOutput => {
		const nodeMap = new Map(input.doc.nodes.map((n) => [n.id, n]));
		const visited = new Set<string>();
		const impactedNodes: ImpactNode[] = [];

		// Mark source as visited to exclude it from results
		visited.add(input.startId);

		// BFS traversal with impact type tracking
		const queue: {
			id: string;
			distance: number;
			impactType: "direct" | "transitive" | "potential";
		}[] = [];

		// Start with direct impacts
		const directImpacts = (input.doc.relationships ?? [])
			.filter(
				(r) => r.from === input.startId && IMPACT_RELATIONSHIPS.has(r.type),
			)
			.map((r) => r.to);

		const potentialImpacts = (input.doc.relationships ?? [])
			.filter(
				(r) =>
					r.from === input.startId &&
					POTENTIAL_IMPACT_RELATIONSHIPS.has(r.type),
			)
			.map((r) => r.to);

		// Add direct impacts to queue
		for (const id of directImpacts) {
			queue.push({ id, distance: 1, impactType: "direct" });
		}

		// Add potential impacts to queue
		for (const id of potentialImpacts) {
			if (!directImpacts.includes(id)) {
				queue.push({ id, distance: 1, impactType: "potential" });
			}
		}

		// BFS traversal
		while (queue.length > 0) {
			const current = queue.shift();
			if (!current) break;

			if (visited.has(current.id)) continue;
			visited.add(current.id);

			const node = nodeMap.get(current.id);

			impactedNodes.push({
				id: current.id,
				node,
				impactType: current.impactType,
				distance: current.distance,
			});

			// Find transitive impacts
			const transitiveImpacts = (input.doc.relationships ?? [])
				.filter(
					(r) =>
						r.from === current.id &&
						(IMPACT_RELATIONSHIPS.has(r.type) ||
							POTENTIAL_IMPACT_RELATIONSHIPS.has(r.type)),
				)
				.map((r) => ({
					id: r.to,
					impactType:
						current.distance >= 1
							? ("transitive" as const)
							: current.impactType,
				}));

			for (const impact of transitiveImpacts) {
				if (!visited.has(impact.id)) {
					queue.push({
						id: impact.id,
						distance: current.distance + 1,
						impactType: impact.impactType,
					});
				}
			}
		}

		// Sort by distance, then by impact type priority
		const impactPriority = { direct: 0, transitive: 1, potential: 2 };
		impactedNodes.sort((a, b) => {
			if (a.distance !== b.distance) return a.distance - b.distance;
			return impactPriority[a.impactType] - impactPriority[b.impactType];
		});

		const summary = {
			direct: impactedNodes.filter((n) => n.impactType === "direct").length,
			transitive: impactedNodes.filter((n) => n.impactType === "transitive")
				.length,
			potential: impactedNodes.filter((n) => n.impactType === "potential")
				.length,
			total: impactedNodes.length,
		};

		return {
			sourceId: input.startId,
			impactedNodes,
			summary,
		};
	},
});
