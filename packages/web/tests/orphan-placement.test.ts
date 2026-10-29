import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
	MIN_NODE_CLEARANCE,
	boundingBox,
	buildOrphanGroups,
	centroid,
	enforceClearance,
	identifyOrphans,
	orphanLabelId,
	placeOrphansByType,
} from "../src/graph/orphanPlacement";
import type { ClearanceNode, OrphanGroup } from "../src/graph/orphanPlacement";

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

	void describe("buildOrphanGroups", () => {
		void it("returns empty for no orphans", () => {
			assert.deepEqual(
				buildOrphanGroups([], () => "x"),
				[],
			);
		});

		void it("groups IDs by type and sorts groups by type name", () => {
			const typeOf = (id: string): string => {
				if (id.startsWith("D")) return "decision";
				if (id.startsWith("I")) return "invariant";
				return "policy";
			};
			const groups = buildOrphanGroups(["I2", "D1", "I1", "P1", "D2"], typeOf);
			assert.equal(groups.length, 3);
			// Alphabetical by type: decision, invariant, policy.
			assert.equal(groups[0].type, "decision");
			assert.equal(groups[1].type, "invariant");
			assert.equal(groups[2].type, "policy");
			// IDs sorted within each group.
			assert.deepEqual(groups[0].ids, ["D1", "D2"]);
			assert.deepEqual(groups[1].ids, ["I1", "I2"]);
			assert.deepEqual(groups[2].ids, ["P1"]);
		});

		void it("capitalises and pluralises the label", () => {
			const groups = buildOrphanGroups(["I1"], () => "invariant");
			assert.equal(groups[0].label, "Invariants");
			const policies = buildOrphanGroups(["P1"], () => "policy");
			assert.equal(policies[0].label, "Policies");
		});
	});

	void describe("placeOrphansByType", () => {
		const box = { x1: 0, y1: 0, x2: 400, y2: 200 };

		void it("returns empty placement for no groups", () => {
			const result = placeOrphansByType([], box);
			assert.equal(result.positions.size, 0);
			assert.equal(result.labels.length, 0);
		});

		void it("places a single group as a compact grid below the box", () => {
			const group: OrphanGroup = {
				type: "invariant",
				label: "Invariants",
				ids: ["I1", "I2", "I3"],
			};
			const result = placeOrphansByType([group], box);
			assert.equal(result.positions.size, 3);
			assert.equal(result.labels.length, 1);
			// Every node sits below the bounding box (single group -> bottom).
			for (const id of group.ids) {
				const pos = result.positions.get(id);
				assert.ok(pos, `missing position for ${id}`);
				assert.ok(pos.y > 200, `${id} should be below the box`);
			}
			// Nodes must NOT be collinear in a single horizontal line: they
			// form a 2-row grid, so at least two distinct Y values exist.
			const ys = new Set(
				group.ids.map((id) => {
					const p = result.positions.get(id);
					assert.ok(p);
					return p.y;
				}),
			);
			assert.ok(ys.size > 1, "cluster must be a grid, not a line");
			// Label sits further out than the nodes.
			const label = result.labels[0];
			assert.ok(label.y > 200, "label should be below the box");
			assert.equal(label.label, "Invariants (3)");
			assert.equal(label.id, orphanLabelId("invariant"));
		});

		void it("distributes multiple groups around the periphery", () => {
			const groups: OrphanGroup[] = [
				{ type: "decision", label: "Decisions", ids: ["D1", "D2"] },
				{ type: "invariant", label: "Invariants", ids: ["I1"] },
				{ type: "policy", label: "Policies", ids: ["P1", "P2"] },
				{ type: "change", label: "Changes", ids: ["C1"] },
			];
			const result = placeOrphansByType(groups, box);
			assert.equal(result.positions.size, 6);
			assert.equal(result.labels.length, 4);
			// Collect which side each group centre falls on.
			const centres = groups.map((g) => {
				const first = g.ids[0];
				const p = result.positions.get(first);
				assert.ok(p);
				return { type: g.type, x: p.x, y: p.y };
			});
			const below = centres.filter((c) => c.y > 200).length;
			const above = centres.filter((c) => c.y < 0).length;
			const right = centres.filter((c) => c.x > 400).length;
			const left = centres.filter((c) => c.x < 0).length;
			// With four groups the anchors cycle through all four sides.
			assert.ok(below >= 1, "at least one group below");
			assert.ok(above >= 1, "at least one group above");
			assert.ok(right >= 1, "at least one group to the right");
			assert.ok(left >= 1, "at least one group to the left");
		});

		void it("does not place every orphan on the same Y (no single line)", () => {
			const groups: OrphanGroup[] = Array.from({ length: 5 }, (_, i) => {
				const s = String(i);
				return {
					type: `t${s}`,
					label: `T${s}`,
					ids: [`n${s}-1`, `n${s}-2`, `n${s}-3`],
				};
			});
			const result = placeOrphansByType(groups, box);
			const ys = new Set<number>();
			for (const g of groups) {
				for (const id of g.ids) {
					const p = result.positions.get(id);
					assert.ok(p);
					ys.add(Math.round(p.y));
				}
			}
			// Five groups across four sides => multiple distinct Y bands.
			assert.ok(ys.size > 2, "orphans must span multiple Y bands, not a line");
		});
	});

	void describe("enforceClearance", () => {
		/** Build a fresh ClearanceNode (ids must be unique per test). */
		const node = (
			id: string,
			x: number,
			y: number,
			radius = 14,
			fixed = false,
		): ClearanceNode => ({ id, x, y, radius, fixed });

		void it("is a no-op for fewer than two nodes", () => {
			const single = [node("A", 0, 0)];
			enforceClearance(single);
			assert.equal(single[0].x, 0);
			assert.equal(single[0].y, 0);
		});

		void it("pushes apart overlapping nodes to at least MIN_NODE_CLEARANCE", () => {
			const nodes = [
				node("A", 0, 0),
				node("B", 10, 0), // 24px apart centre-to-centre < 56
			];
			enforceClearance(nodes);
			const dx = nodes[1].x - nodes[0].x;
			const dy = nodes[1].y - nodes[0].y;
			const dist = Math.sqrt(dx * dx + dy * dy);
			const target = 14 + 14 + MIN_NODE_CLEARANCE;
			assert.ok(
				dist >= target - 0.5,
				`expected >= ${String(target)}, got ${String(dist)}`,
			);
		});

		void it("leaves already-separated nodes untouched", () => {
			const far = 200;
			const nodes = [node("A", 0, 0), node("B", far, 0)];
			enforceClearance(nodes);
			assert.equal(nodes[0].x, 0);
			assert.equal(nodes[1].x, far);
		});

		void it("respects fixed nodes by moving only the free one", () => {
			const nodes = [node("A", 0, 0, 14, true), node("B", 10, 0, 14, false)];
			enforceClearance(nodes);
			assert.equal(nodes[0].x, 0); // fixed A did not move
			const dx = nodes[1].x - nodes[0].x;
			const dist = Math.abs(dx);
			const target = 14 + 14 + MIN_NODE_CLEARANCE;
			assert.ok(
				dist >= target - 0.5,
				`free node should have been pushed to ${String(target)}`,
			);
		});

		void it("resolves a tight 2D cluster so every pair clears the minimum", () => {
			// Four nodes in a tight 2x2 block: the relaxation has room to
			// push them apart in two dimensions without oscillation.
			const nodes: ClearanceNode[] = [
				node("A", 0, 0),
				node("B", 5, 0),
				node("C", 0, 5),
				node("D", 5, 5),
			];
			enforceClearance(nodes);
			const target = 14 + 14 + MIN_NODE_CLEARANCE;
			for (let i = 0; i < nodes.length; i++) {
				for (let j = i + 1; j < nodes.length; j++) {
					const dx = nodes[j].x - nodes[i].x;
					const dy = nodes[j].y - nodes[i].y;
					const dist = Math.sqrt(dx * dx + dy * dy);
					assert.ok(
						dist >= target - 0.5,
						`pair ${nodes[i].id}/${nodes[j].id} too close: ${String(dist)} < ${String(target)}`,
					);
				}
			}
		});
	});
});
