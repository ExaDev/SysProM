import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { countEdgeCrossings, type Position } from "../src/graph/topology";

// `describe`/`it` from node:test return thenable `Test` objects, so each call
// is prefixed with `void` to satisfy `no-floating-promises` without relaxing
// the rule.
void describe("countEdgeCrossings", () => {
	void it("counts two edges that cross as 1", () => {
		// A(0,0)-C(2,2) and B(0,2)-D(2,0) form an X.
		const positions = new Map<string, Position>([
			["A", { x: 0, y: 0 }],
			["B", { x: 0, y: 2 }],
			["C", { x: 2, y: 2 }],
			["D", { x: 2, y: 0 }],
		]);
		const edges = [
			{ from: "A", to: "C" },
			{ from: "B", to: "D" },
		];
		assert.equal(countEdgeCrossings(positions, edges), 1);
	});

	void it("does not count edges that share an endpoint", () => {
		const positions = new Map<string, Position>([
			["A", { x: 0, y: 0 }],
			["B", { x: 2, y: 0 }],
			["C", { x: 0, y: 2 }],
		]);
		const edges = [
			{ from: "A", to: "B" },
			{ from: "A", to: "C" },
		];
		assert.equal(countEdgeCrossings(positions, edges), 0);
	});

	void it("counts parallel, non-crossing edges as 0", () => {
		const positions = new Map<string, Position>([
			["A", { x: 0, y: 0 }],
			["B", { x: 2, y: 0 }],
			["C", { x: 0, y: 2 }],
			["D", { x: 2, y: 2 }],
		]);
		const edges = [
			{ from: "A", to: "B" },
			{ from: "C", to: "D" },
		];
		assert.equal(countEdgeCrossings(positions, edges), 0);
	});

	void it("counts multiple crossings independently", () => {
		// A horizontal line A-B crossed by two vertical lines C-D and E-F.
		const positions = new Map<string, Position>([
			["A", { x: 0, y: 1 }],
			["B", { x: 4, y: 1 }],
			["C", { x: 1, y: 0 }],
			["D", { x: 1, y: 2 }],
			["E", { x: 3, y: 0 }],
			["F", { x: 3, y: 2 }],
		]);
		const edges = [
			{ from: "A", to: "B" },
			{ from: "C", to: "D" },
			{ from: "E", to: "F" },
		];
		assert.equal(countEdgeCrossings(positions, edges), 2);
	});

	void it("returns 0 for an empty edge set", () => {
		const positions = new Map<string, Position>([["A", { x: 0, y: 0 }]]);
		assert.equal(countEdgeCrossings(positions, []), 0);
	});
});
