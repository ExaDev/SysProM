import * as z from "zod";
import { defineOperation } from "./define-operation.js";
import {
	Node,
	SysProMDocument,
	ImpactPolarity,
	type ImpactPolarity as ImpactPolarityType,
} from "../schema.js";

/**
 * Impact node in the impact trace.
 */
const ImpactNode = z.object({
	id: z.string(),
	node: Node.optional(),
	impactType: z.enum(["direct", "transitive", "potential"]),
	distance: z.number().int().nonnegative(),
	polarity: ImpactPolarity.optional(),
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
	"influence",
]);

/**
 * Type guard for ImpactPolarity validation.
 * @param val - The value to validate
 * @returns true if the value is a valid ImpactPolarity
 * @example
 * if (isValidPolarity(rel.polarity)) { ... }
 */
function isValidPolarity(val: unknown): val is ImpactPolarityType {
	return ImpactPolarity.safeParse(val).success;
}

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
 * impacted, or potentially impacted. Supports bidirectional traversal
 * (CHG40) with optional polarity annotations.
 */
export const inferImpactOp = defineOperation({
	name: "infer-impact",
	description:
		"Infer impact from a node through the graph following impact relationships",
	input: z.object({
		doc: SysProMDocument,
		startId: z.string(),
		direction: z.enum(["outgoing", "incoming", "bidirectional"]).optional(),
		maxDepth: z.number().int().positive().optional(),
		relationshipFilter: z.array(z.string()).optional(),
	}),
	output: ImpactOutput,
	fn: (input): ImpactOutput => {
		const nodeMap = new Map(input.doc.nodes.map((n) => [n.id, n]));
		const visited = new Set<string>();
		const impactedNodes: ImpactNode[] = [];
		const relationships = input.doc.relationships ?? [];
		const direction = input.direction ?? "outgoing";

		visited.add(input.startId);

		// Helper: check if relationship type is impactful
		const isImpactRel = (type: string) =>
			input.relationshipFilter
				? input.relationshipFilter.includes(type)
				: IMPACT_RELATIONSHIPS.has(type);

		const isPotentialRel = (type: string) =>
			!input.relationshipFilter && POTENTIAL_IMPACT_RELATIONSHIPS.has(type);

		// Helper: get edges based on direction
		const getEdges = (
			nodeId: string,
		): { to: string; type: string; polarity?: string }[] => {
			const edges: { to: string; type: string; polarity?: string }[] = [];

			if (direction !== "incoming") {
				// Outgoing edges
				relationships
					.filter((r) => r.from === nodeId)
					.forEach((r) => {
						if (isImpactRel(r.type) || isPotentialRel(r.type)) {
							edges.push({ to: r.to, type: r.type, polarity: r.polarity });
						}
					});
			}

			if (direction !== "outgoing") {
				// Incoming edges
				relationships
					.filter((r) => r.to === nodeId)
					.forEach((r) => {
						if (isImpactRel(r.type) || isPotentialRel(r.type)) {
							edges.push({ to: r.from, type: r.type, polarity: r.polarity });
						}
					});
			}

			return edges;
		};

		// BFS traversal
		const queue: {
			id: string;
			distance: number;
			impactType: "direct" | "transitive" | "potential";
			polarity?: string;
		}[] = [];

		// Start: add direct impacts from startId
		const directEdges = getEdges(input.startId);
		for (const edge of directEdges) {
			const impactType = isPotentialRel(edge.type) ? "potential" : "direct";
			queue.push({
				id: edge.to,
				distance: 1,
				impactType,
				polarity: edge.polarity,
			});
		}

		while (queue.length > 0) {
			const current = queue.shift();
			if (!current) break;

			if (visited.has(current.id)) continue;
			if (input.maxDepth && current.distance > input.maxDepth) continue;

			visited.add(current.id);

			const node = nodeMap.get(current.id);
			const impactNode: ImpactNode = {
				id: current.id,
				node,
				impactType: current.impactType,
				distance: current.distance,
			};
			// Assign polarity if it's valid
			if (current.polarity && isValidPolarity(current.polarity)) {
				impactNode.polarity = current.polarity;
			}
			impactedNodes.push(impactNode);

			// Find next-hop impacts
			const nextEdges = getEdges(current.id);
			for (const edge of nextEdges) {
				if (!visited.has(edge.to)) {
					const nextImpactType =
						current.distance >= 1 ? "transitive" : current.impactType;
					queue.push({
						id: edge.to,
						distance: current.distance + 1,
						impactType: nextImpactType,
						polarity: edge.polarity,
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

/**
 * Output schema for impactSummaryOp.
 */
const ImpactSummaryOutput = z.object({
	hotspots: z.array(
		z.object({
			nodeId: z.string(),
			node: Node.optional(),
			incomingImpactCount: z.number(),
			outgoingImpactCount: z.number(),
			totalImpact: z.number(),
		}),
	),
	summary: z.object({
		totalNodes: z.number(),
		totalImpactedNodes: z.number(),
		averageDegree: z.number(),
	}),
});

/** Output of impact summary inference operation. */
export type ImpactSummaryOutput = z.infer<typeof ImpactSummaryOutput>;

/**
 * Analyse the entire document for impact hotspots.
 *
 * Identifies nodes that are heavily impacted or that impact many other nodes.
 * Useful for identifying critical elements and dependencies.
 */
export const impactSummaryOp = defineOperation({
	name: "infer-impact-summary",
	description:
		"Analyse the entire document for impact hotspots — nodes with high incoming or outgoing impact",
	input: z.object({
		doc: SysProMDocument,
	}),
	output: ImpactSummaryOutput,
	fn: (input): ImpactSummaryOutput => {
		const nodeMap = new Map(input.doc.nodes.map((n) => [n.id, n]));
		const relationships = input.doc.relationships ?? [];

		const impactStats = new Map<
			string,
			{ incoming: number; outgoing: number }
		>();

		// Count incoming and outgoing impact relationships
		for (const node of input.doc.nodes) {
			impactStats.set(node.id, { incoming: 0, outgoing: 0 });
		}

		for (const rel of relationships) {
			if (IMPACT_RELATIONSHIPS.has(rel.type)) {
				const fromStats = impactStats.get(rel.from);
				const toStats = impactStats.get(rel.to);
				if (fromStats) fromStats.outgoing += 1;
				if (toStats) toStats.incoming += 1;
			}
		}

		// Build hotspots list
		const hotspots: {
			nodeId: string;
			node?: Node;
			incomingImpactCount: number;
			outgoingImpactCount: number;
			totalImpact: number;
		}[] = [];

		for (const [nodeId, stats] of impactStats.entries()) {
			const totalImpact = stats.incoming + stats.outgoing;
			if (totalImpact > 0) {
				hotspots.push({
					nodeId,
					node: nodeMap.get(nodeId),
					incomingImpactCount: stats.incoming,
					outgoingImpactCount: stats.outgoing,
					totalImpact,
				});
			}
		}

		// Sort by total impact (descending)
		hotspots.sort((a, b) => b.totalImpact - a.totalImpact);

		const totalImpactedNodes = hotspots.length;
		const averageDegree =
			totalImpactedNodes > 0
				? hotspots.reduce((sum, h) => sum + h.totalImpact, 0) /
					totalImpactedNodes
				: 0;

		return {
			hotspots,
			summary: {
				totalNodes: input.doc.nodes.length,
				totalImpactedNodes,
				averageDegree,
			},
		};
	},
});
