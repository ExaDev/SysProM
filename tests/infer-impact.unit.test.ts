import { describe, it } from "node:test";
import assert from "node:assert";
import { inferImpactOp } from "../src/operations/infer-impact.js";
import type { SysProMDocument } from "../src/schema.js";

describe("inferImpactOp", () => {
	it("finds direct impacts via affects relationship", () => {
		const doc: SysProMDocument = {
			nodes: [
				{ id: "DEC1", type: "decision", name: "Decision" },
				{ id: "ELEM1", type: "element", name: "Element" },
			],
			relationships: [{ from: "DEC1", to: "ELEM1", type: "affects" }],
		};

		const result = inferImpactOp({ doc, startId: "DEC1" });

		assert.strictEqual(result.sourceId, "DEC1");
		assert.strictEqual(result.impactedNodes.length, 1);
		assert.strictEqual(result.impactedNodes[0].id, "ELEM1");
		assert.strictEqual(result.impactedNodes[0].impactType, "direct");
		assert.strictEqual(result.impactedNodes[0].distance, 1);
		assert.strictEqual(result.summary.direct, 1);
		assert.strictEqual(result.summary.total, 1);
	});

	it("finds direct impacts via depends_on relationship", () => {
		const doc: SysProMDocument = {
			nodes: [
				{ id: "ELEM1", type: "element", name: "Element 1" },
				{ id: "ELEM2", type: "element", name: "Element 2" },
			],
			relationships: [{ from: "ELEM1", to: "ELEM2", type: "depends_on" }],
		};

		const result = inferImpactOp({ doc, startId: "ELEM1" });

		assert.strictEqual(result.impactedNodes.length, 1);
		assert.strictEqual(result.impactedNodes[0].id, "ELEM2");
		assert.strictEqual(result.impactedNodes[0].impactType, "direct");
	});

	it("finds transitive impacts through multiple hops", () => {
		const doc: SysProMDocument = {
			nodes: [
				{ id: "DEC1", type: "decision", name: "Decision" },
				{ id: "ELEM1", type: "element", name: "Element 1" },
				{ id: "ELEM2", type: "element", name: "Element 2" },
			],
			relationships: [
				{ from: "DEC1", to: "ELEM1", type: "affects" },
				{ from: "ELEM1", to: "ELEM2", type: "depends_on" },
			],
		};

		const result = inferImpactOp({ doc, startId: "DEC1" });

		assert.strictEqual(result.impactedNodes.length, 2);
		assert.strictEqual(result.impactedNodes[0].distance, 1);
		assert.strictEqual(result.impactedNodes[1].distance, 2);
		assert.strictEqual(result.impactedNodes[1].impactType, "transitive");
		assert.strictEqual(result.summary.transitive, 1);
	});

	it("finds potential impacts via part_of relationship", () => {
		const doc: SysProMDocument = {
			nodes: [
				{ id: "ELEM1", type: "element", name: "Element" },
				{ id: "ELEM2", type: "element", name: "Part" },
			],
			relationships: [{ from: "ELEM1", to: "ELEM2", type: "part_of" }],
		};

		const result = inferImpactOp({ doc, startId: "ELEM1" });

		assert.strictEqual(result.impactedNodes.length, 1);
		assert.strictEqual(result.impactedNodes[0].impactType, "potential");
		assert.strictEqual(result.summary.potential, 1);
	});

	it("avoids cycles in impact graph", () => {
		const doc: SysProMDocument = {
			nodes: [
				{ id: "ELEM1", type: "element", name: "Element 1" },
				{ id: "ELEM2", type: "element", name: "Element 2" },
			],
			relationships: [
				{ from: "ELEM1", to: "ELEM2", type: "depends_on" },
				{ from: "ELEM2", to: "ELEM1", type: "depends_on" },
			],
		};

		const result = inferImpactOp({ doc, startId: "ELEM1" });

		// Should visit ELEM2 once, not infinitely loop
		assert.strictEqual(result.impactedNodes.length, 1);
		assert.strictEqual(result.impactedNodes[0].id, "ELEM2");
	});

	it("returns empty for node with no outgoing impact relationships", () => {
		const doc: SysProMDocument = {
			nodes: [
				{ id: "INT1", type: "intent", name: "Intent" },
				{ id: "INT2", type: "intent", name: "Other" },
			],
			relationships: [],
		};

		const result = inferImpactOp({ doc, startId: "INT1" });

		assert.strictEqual(result.impactedNodes.length, 0);
		assert.strictEqual(result.summary.total, 0);
	});

	it("includes node details in results", () => {
		const doc: SysProMDocument = {
			nodes: [
				{ id: "DEC1", type: "decision", name: "Decision" },
				{ id: "ELEM1", type: "element", name: "Element" },
			],
			relationships: [{ from: "DEC1", to: "ELEM1", type: "affects" }],
		};

		const result = inferImpactOp({ doc, startId: "DEC1" });

		assert.ok(result.impactedNodes[0].node);
		assert.strictEqual(result.impactedNodes[0].node.name, "Element");
		assert.strictEqual(result.impactedNodes[0].node.type, "element");
	});

	it("sorts by distance then impact type priority", () => {
		const doc: SysProMDocument = {
			nodes: [
				{ id: "DEC1", type: "decision", name: "Decision" },
				{ id: "ELEM1", type: "element", name: "Element 1" },
				{ id: "ELEM2", type: "element", name: "Element 2" },
				{ id: "ELEM3", type: "element", name: "Element 3" },
			],
			relationships: [
				{ from: "DEC1", to: "ELEM1", type: "affects" },
				{ from: "DEC1", to: "ELEM2", type: "part_of" },
				{ from: "ELEM1", to: "ELEM3", type: "depends_on" },
			],
		};

		const result = inferImpactOp({ doc, startId: "DEC1" });

		// Should be sorted: direct (ELEM1), potential (ELEM2), transitive (ELEM3)
		assert.strictEqual(result.impactedNodes[0].id, "ELEM1");
		assert.strictEqual(result.impactedNodes[0].distance, 1);
		assert.strictEqual(result.impactedNodes[1].id, "ELEM2");
		assert.strictEqual(result.impactedNodes[1].distance, 1);
		assert.strictEqual(result.impactedNodes[2].id, "ELEM3");
		assert.strictEqual(result.impactedNodes[2].distance, 2);
	});
});
