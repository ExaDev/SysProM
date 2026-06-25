import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
	buildElkGraph,
	computeSegments,
	processElkResult,
	ELK_NODE_WIDTH,
	ELK_NODE_HEIGHT,
	ELK_LAYOUT_OPTIONS,
	type VisibleNode,
	type VisibleEdge,
} from "../src/graph/elkLayout";

// `describe`/`it` from node:test return thenable `Test` objects, so each call
// is prefixed with `void` to satisfy `no-floating-promises` without relaxing
// the rule.
void describe("ELK layout", () => {
	void describe("buildElkGraph", () => {
		void it("builds a graph with all visible nodes as children", () => {
			const nodes: VisibleNode[] = [{ id: "A" }, { id: "B" }, { id: "C" }];
			const { graph, edgeMapping } = buildElkGraph(nodes, []);
			assert.equal(graph.id, "root");
			assert.equal(graph.children?.length, 3);
			assert.equal(graph.edges?.length, 0);
			assert.equal(edgeMapping.length, 0);
		});

		void it("assigns uniform width and height to each node", () => {
			const { graph } = buildElkGraph([{ id: "A" }], []);
			const child = graph.children?.[0];
			assert.ok(child);
			assert.equal(child.width, ELK_NODE_WIDTH);
			assert.equal(child.height, ELK_NODE_HEIGHT);
		});

		void it("creates edges for all non-supersedes relationships", () => {
			const nodes: VisibleNode[] = [{ id: "A" }, { id: "B" }, { id: "C" }];
			const edges: VisibleEdge[] = [
				{ id: "e1", source: "A", target: "B", type: "refines" },
				{ id: "e2", source: "B", target: "C", type: "affects" },
				{ id: "e3", source: "A", target: "C", type: "supersedes" },
			];
			const { graph, edgeMapping } = buildElkGraph(nodes, edges);
			assert.equal(graph.edges?.length, 2);
			assert.equal(edgeMapping.length, 2);
			// The supersedes edge is excluded.
			assert.equal(
				edgeMapping.every((m) => m.type !== "supersedes"),
				true,
			);
		});

		void it("skips edges referencing nodes not in the visible set", () => {
			const nodes: VisibleNode[] = [{ id: "A" }, { id: "B" }];
			const edges: VisibleEdge[] = [
				{ id: "e1", source: "A", target: "B", type: "refines" },
				{ id: "e2", source: "A", target: "Z", type: "affects" },
				{ id: "e3", source: "X", target: "B", type: "depends_on" },
			];
			const { graph } = buildElkGraph(nodes, edges);
			assert.equal(graph.edges?.length, 1);
		});

		void it("includes the layered algorithm in layout options", () => {
			const { graph } = buildElkGraph([{ id: "A" }], []);
			assert.equal(graph.layoutOptions["elk.algorithm"], "layered");
			assert.equal(graph.layoutOptions["elk.edgeRouting"], "orthogonal");
		});
	});

	void describe("ELK_LAYOUT_OPTIONS", () => {
		void it("uses DOWN direction", () => {
			assert.equal(ELK_LAYOUT_OPTIONS["elk.direction"], "DOWN");
		});

		void it("uses LAYER_SWEEP crossing minimisation", () => {
			assert.equal(
				ELK_LAYOUT_OPTIONS["elk.layered.crossingMinimization.strategy"],
				"LAYER_SWEEP",
			);
		});

		void it("sets node spacing to at least the minimum clearance", () => {
			const spacing = Number(ELK_LAYOUT_OPTIONS["elk.spacing.nodeNode"]);
			assert.ok(spacing >= 56);
		});
	});

	void describe("processElkResult", () => {
		void it("offsets node positions to centre coordinates", () => {
			// ELK gives top-left positions; processElkResult should offset by
			// half width/height so positions are centre-based.
			const elkResult = {
				id: "root",
				children: [
					{
						id: "A",
						x: 0,
						y: 0,
						width: ELK_NODE_WIDTH,
						height: ELK_NODE_HEIGHT,
					},
					{
						id: "B",
						x: 100,
						y: 200,
						width: ELK_NODE_WIDTH,
						height: ELK_NODE_HEIGHT,
					},
				],
				edges: [],
			};
			const result = processElkResult(elkResult, []);
			const posA = result.positions.get("A");
			assert.ok(posA);
			assert.equal(posA.x, ELK_NODE_WIDTH / 2);
			assert.equal(posA.y, ELK_NODE_HEIGHT / 2);
			const posB = result.positions.get("B");
			assert.ok(posB);
			assert.equal(posB.x, 100 + ELK_NODE_WIDTH / 2);
			assert.equal(posB.y, 200 + ELK_NODE_HEIGHT / 2);
		});

		void it("extracts edge routes with segment data", () => {
			const elkResult = {
				id: "root",
				children: [
					{
						id: "A",
						x: 0,
						y: 0,
						width: ELK_NODE_WIDTH,
						height: ELK_NODE_HEIGHT,
					},
					{
						id: "B",
						x: 200,
						y: 0,
						width: ELK_NODE_WIDTH,
						height: ELK_NODE_HEIGHT,
					},
				],
				edges: [
					{
						id: "elk-edge-0",
						sources: ["A"],
						targets: ["B"],
						sections: [
							{
								id: "s0",
								startPoint: { x: 30, y: 15 },
								endPoint: { x: 200, y: 15 },
							},
						],
					},
				],
			};
			const mapping = [{ source: "A", target: "B", type: "refines" }];
			const result = processElkResult(elkResult, mapping);
			assert.equal(result.routes.length, 1);
			const route = result.routes[0];
			assert.equal(route.source, "A");
			assert.equal(route.target, "B");
			assert.equal(route.type, "refines");
			assert.ok(route.points.length >= 2);
		});

		void it("handles edges without sections gracefully", () => {
			const elkResult = {
				id: "root",
				children: [
					{
						id: "A",
						x: 0,
						y: 0,
						width: ELK_NODE_WIDTH,
						height: ELK_NODE_HEIGHT,
					},
				],
				edges: [{ id: "elk-edge-0", sources: ["A"], targets: ["A"] }],
			};
			const mapping = [{ source: "A", target: "A", type: "refines" }];
			const result = processElkResult(elkResult, mapping);
			assert.equal(result.routes.length, 0);
		});

		void it("concatenates bend points across multiple sections", () => {
			const elkResult = {
				id: "root",
				children: [
					{
						id: "A",
						x: 0,
						y: 0,
						width: ELK_NODE_WIDTH,
						height: ELK_NODE_HEIGHT,
					},
					{
						id: "B",
						x: 300,
						y: 0,
						width: ELK_NODE_WIDTH,
						height: ELK_NODE_HEIGHT,
					},
				],
				edges: [
					{
						id: "elk-edge-0",
						sources: ["A"],
						targets: ["B"],
						sections: [
							{
								id: "s0",
								startPoint: { x: 30, y: 15 },
								bendPoints: [{ x: 100, y: 15 }],
								endPoint: { x: 100, y: 50 },
							},
							{
								id: "s1",
								startPoint: { x: 100, y: 50 },
								bendPoints: [{ x: 200, y: 50 }],
								endPoint: { x: 270, y: 15 },
							},
						],
					},
				],
			};
			const mapping = [{ source: "A", target: "B", type: "refines" }];
			const result = processElkResult(elkResult, mapping);
			assert.equal(result.routes.length, 1);
			// Section 0 contributes: start, 1 bend, end (3 points).
			// Section 1 contributes: 1 bend, end (2 points — start is skipped
			// as it duplicates the junction from section 0's end).
			// Total: 5 points.
			assert.equal(result.routes[0].points.length, 5);
		});
	});

	void describe("computeSegments", () => {
		void it("returns empty arrays for a single straight segment", () => {
			const source = { x: 0, y: 0 };
			const target = { x: 100, y: 0 };
			const points = [
				{ x: 0, y: 0 },
				{ x: 100, y: 0 },
			];
			const { weights, distances } = computeSegments(points, source, target);
			assert.deepEqual(weights, []);
			assert.deepEqual(distances, []);
		});

		void it("computes weight and distance for a midpoint above the line", () => {
			const source = { x: 0, y: 0 };
			const target = { x: 100, y: 0 };
			// A bend point at (50, -20) in screen coords (above the x-axis).
			// The cross product (px*dy - py*dx) / len = (50*0 - (-20)*100)/100 = 20.
			// So the signed distance is +20 for a point above the line.
			const points = [
				{ x: 0, y: 0 },
				{ x: 50, y: -20 },
				{ x: 100, y: 0 },
			];
			const { weights, distances } = computeSegments(points, source, target);
			assert.equal(weights.length, 1);
			assert.equal(distances.length, 1);
			assert.ok(Math.abs(weights[0] - 0.5) < 0.001);
			assert.ok(Math.abs(distances[0] - 20) < 0.001);
		});

		void it("returns empty for coincident source and target", () => {
			const source = { x: 50, y: 50 };
			const target = { x: 50, y: 50 };
			const points = [
				{ x: 50, y: 50 },
				{ x: 60, y: 40 },
				{ x: 50, y: 50 },
			];
			const { weights, distances } = computeSegments(points, source, target);
			assert.deepEqual(weights, []);
			assert.deepEqual(distances, []);
		});

		void it("computes correct weight for a diagonal source-target line", () => {
			const source = { x: 0, y: 0 };
			const target = { x: 100, y: 100 };
			// Bend at (100, 0): projects to 0.5 along the diagonal.
			const points = [
				{ x: 0, y: 0 },
				{ x: 100, y: 0 },
				{ x: 100, y: 100 },
			];
			const { weights } = computeSegments(points, source, target);
			assert.equal(weights.length, 1);
			assert.ok(Math.abs(weights[0] - 0.5) < 0.001);
		});
	});
});
