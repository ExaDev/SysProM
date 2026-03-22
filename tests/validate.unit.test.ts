import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validateOp } from "../src/index.js";
import type { SysProMDocument, Node } from "../src/schema.js";

function makeDoc(
	nodes: Node[] = [],
	relationships: SysProMDocument["relationships"] = [],
): SysProMDocument {
	return { nodes, relationships };
}

describe("validate", () => {
	it("valid document returns { valid: true, issues: [] }", () => {
		const doc = makeDoc([{ id: "I1", type: "intent", name: "Test" }]);
		const result = validateOp({ doc });
		assert.equal(result.valid, true);
		assert.deepEqual(result.issues, []);
	});

	it("duplicate node IDs detected", () => {
		const doc = makeDoc([
			{ id: "I1", type: "intent", name: "First" },
			{ id: "I1", type: "intent", name: "Duplicate" },
		]);
		const result = validateOp({ doc });
		assert.equal(result.valid, false);
		assert.ok(result.issues.some((i) => i.includes("Duplicate node ID")));
	});

	it("missing relationship targets detected", () => {
		const doc = makeDoc(
			[{ id: "I1", type: "intent", name: "A" }],
			[{ from: "I1", to: "I2", type: "refines" }],
		);
		const result = validateOp({ doc });
		assert.equal(result.valid, false);
		assert.ok(result.issues.some((i) => i.includes("unknown target")));
	});

	it("decisions affecting domain nodes without must_preserve detected", () => {
		const doc = makeDoc(
			[
				{
					id: "D1",
					type: "decision",
					name: "Dec",
					options: [{ id: "a", description: "A" }],
					selected: "a",
				},
				{ id: "I1", type: "intent", name: "Intent" },
			],
			[{ from: "D1", to: "I1", type: "affects" }],
		);
		const result = validateOp({ doc });
		assert.equal(result.valid, false);
		assert.ok(result.issues.some((i) => i.includes("must_preserve")));
	});

	it("changes without decision references detected", () => {
		const doc = makeDoc([
			{ id: "C1", type: "change", name: "Change", scope: ["I1"] },
			{ id: "I1", type: "intent", name: "Intent" },
		]);
		const result = validateOp({ doc });
		assert.equal(result.valid, false);
		assert.ok(
			result.issues.some((i) => i.includes("does not reference any decision")),
		);
	});

	it("decisions without options detected", () => {
		const doc = makeDoc([
			{ id: "D1", type: "decision", name: "Dec", selected: "a" },
		]);
		const result = validateOp({ doc });
		assert.equal(result.valid, false);
		assert.ok(result.issues.some((i) => i.includes("has no options")));
	});

	it("decisions without selected detected", () => {
		const doc = makeDoc([
			{
				id: "D1",
				type: "decision",
				name: "Dec",
				options: [{ id: "a", description: "A" }],
			},
		]);
		const result = validateOp({ doc });
		assert.equal(result.valid, false);
		assert.ok(result.issues.some((i) => i.includes("has no selected")));
	});
});
