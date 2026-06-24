import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
	boundingBox,
	centroid,
	identifyOrphans,
	placeOrphansInArc,
} from "../src/graph/orphanPlacement";

// `describe`/`it` from node:test return thenable `Test` objects, so each call
// is prefixed with `void` to satisfy `no-floating-promises` without relaxing
// the rule.
void describe("orphan placement", () => {
	void describe("identifyOrphans", () => {
		void it("returns all nodes when there are no edges", () => {
			const result = identifyOrphans(["A", "B", "C"], []);
			const sorted = [...result].sort((a, b) => a.localeCompare(b));
			assert.deepEqual(sorted, ["A", "B", "C"]);
		});

		void it("returns only nodes with no incident edges", () => {
			const edges = [
				{ source: "A", target: "B" },
				{ source: "B", target: "C" },
			];
			const result = identifyOrphans(["A", "B", "C", "D", "E"], edges);
			const sorted = [...result].sort((a, b) => a.localeCompare(b));
			assert.deepEqual(sorted, ["D", "E"]);
		});

		void it("returns empty when all nodes are connected", () => {
			const edges = [{ source: "A", target: "B" }];
			const result = identifyOrphans(["A", "B"], edges);
			assert.deepEqual(result, []);
		});
	});

	void describe("boundingBox", () => {
		void it("returns undefined for empty input", () => {
			assert.equal(boundingBox([]), undefined);
		});

		void it("computes min/max coordinates", () => {
			const box = boundingBox([
				{ id: "A", x: 10, y: 20 },
				{ id: "B", x: -5, y: 50 },
				{ id: "C", x: 100, y: 0 },
			]);
			assert.ok(box);
			assert.equal(box.x1, -5);
			assert.equal(box.y1, 0);
			assert.equal(box.x2, 100);
			assert.equal(box.y2, 50);
		});
	});

	void describe("centroid", () => {
		void it("returns undefined for empty input", () => {
			assert.equal(centroid([]), undefined);
		});

		void it("computes the arithmetic mean position", () => {
			const result = centroid([
				{ id: "A", x: 0, y: 0 },
				{ id: "B", x: 100, y: 200 },
			]);
			assert.ok(result);
			assert.equal(result.x, 50);
			assert.equal(result.y, 100);
		});

		void it("handles a single node", () => {
			const result = centroid([{ id: "A", x: 42, y: 99 }]);
			assert.ok(result);
			assert.equal(result.x, 42);
			assert.equal(result.y, 99);
		});
	});

	void describe("placeOrphansInArc", () => {
		void it("returns empty map for zero orphans", () => {
			const box = { x1: 0, y1: 0, x2: 200, y2: 100 };
			assert.equal(placeOrphansInArc([], box).size, 0);
		});

		void it("centres a single orphan", () => {
			const box = { x1: 0, y1: 0, x2: 200, y2: 100 };
			const result = placeOrphansInArc(["X"], box);
			const pos = result.get("X");
			assert.ok(pos);
			assert.equal(pos.x, 100); // centred
			assert.ok(pos.y > 100); // below the box
		});

		void it("spreads multiple orphans horizontally below the box", () => {
			const box = { x1: 0, y1: 0, x2: 300, y2: 100 };
			const ids = ["O1", "O2", "O3", "O4"];
			const result = placeOrphansInArc(ids, box);
			assert.equal(result.size, 4);
			const xs = ids.map((id) => {
				const p = result.get(id);
				assert.ok(p);
				return p.x;
			});
			// Strictly increasing left to right.
			for (let i = 1; i < xs.length; i++) {
				assert.ok(
					xs[i] > xs[i - 1],
					`expected increasing x at index ${String(i)}`,
				);
			}
			// All below the bounding box.
			for (const id of ids) {
				const p = result.get(id);
				assert.ok(p);
				assert.ok(p.y > 100, `orphan ${id} should be below box`);
			}
		});

		void it("gap scales with box height", () => {
			const smallBox = { x1: 0, y1: 0, x2: 200, y2: 50 };
			const tallBox = { x1: 0, y1: 0, x2: 200, y2: 1000 };
			const smallPos = placeOrphansInArc(["X"], smallBox).get("X");
			const tallPos = placeOrphansInArc(["X"], tallBox).get("X");
			assert.ok(smallPos);
			assert.ok(tallPos);
			// Tall box should push orphan further down.
			assert.ok(tallPos.y > smallPos.y);
		});
	});
});
