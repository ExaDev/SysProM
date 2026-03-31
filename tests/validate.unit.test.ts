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
		const doc = makeDoc([{ id: "INT1", type: "intent", name: "Test" }]);
		const result = validateOp({ doc });
		assert.equal(result.valid, true);
		assert.deepEqual(result.issues, []);
	});

	it("duplicate node IDs detected", () => {
		const doc = makeDoc([
			{ id: "INT1", type: "intent", name: "First" },
			{ id: "INT1", type: "intent", name: "Duplicate" },
		]);
		const result = validateOp({ doc });
		assert.equal(result.valid, false);
		assert.ok(result.issues.some((i) => i.includes("Duplicate node ID")));
	});

	it("missing relationship targets detected", () => {
		const doc = makeDoc(
			[{ id: "INT1", type: "intent", name: "A" }],
			[{ from: "INT1", to: "INT2", type: "refines" }],
		);
		const result = validateOp({ doc });
		assert.equal(result.valid, false);
		assert.ok(result.issues.some((i) => i.includes("unknown target")));
	});

	it("decisions affecting domain nodes without must_preserve detected", () => {
		const doc = makeDoc(
			[
				{
					id: "DEC1",
					type: "decision",
					name: "Dec",
					options: [{ id: "a", description: "A" }],
					selected: "a",
				},
				{ id: "INT1", type: "intent", name: "Intent" },
			],
			[{ from: "DEC1", to: "INT1", type: "affects" }],
		);
		const result = validateOp({ doc });
		assert.equal(result.valid, false);
		assert.ok(result.issues.some((i) => i.includes("must_preserve")));
	});

	it("changes without decision references detected", () => {
		const doc = makeDoc([
			{ id: "CHG1", type: "change", name: "Change", scope: ["INT1"] },
			{ id: "INT1", type: "intent", name: "Intent" },
		]);
		const result = validateOp({ doc });
		assert.equal(result.valid, false);
		assert.ok(
			result.issues.some((i) => i.includes("does not reference any decision")),
		);
	});

	it("decisions without options detected", () => {
		const doc = makeDoc([
			{ id: "DEC1", type: "decision", name: "Dec", selected: "a" },
		]);
		const result = validateOp({ doc });
		assert.equal(result.valid, false);
		assert.ok(result.issues.some((i) => i.includes("has no options")));
	});

	it("decisions without selected detected", () => {
		const doc = makeDoc([
			{
				id: "DEC1",
				type: "decision",
				name: "Dec",
				options: [{ id: "a", description: "A" }],
			},
		]);
		const result = validateOp({ doc });
		assert.equal(result.valid, false);
		assert.ok(result.issues.some((i) => i.includes("has no selected")));
	});

	it("justifies relationship type is accepted between principle and invariant", () => {
		const doc = makeDoc(
			[
				{ id: "PRIN1", type: "principle", name: "P" },
				{ id: "INV1", type: "invariant", name: "I" },
			],
			[{ from: "PRIN1", to: "INV1", type: "justifies" }],
		);
		const result = validateOp({ doc });
		assert.equal(result.valid, true);
		assert.deepEqual(result.issues, []);
	});

	it("realises accepts capability → stage", () => {
		const doc = makeDoc(
			[
				{ id: "CAP1", type: "capability", name: "C" },
				{ id: "STG1", type: "stage", name: "S" },
			],
			[{ from: "CAP1", to: "STG1", type: "realises" }],
		);
		const result = validateOp({ doc });
		assert.equal(result.valid, true);
		assert.deepEqual(result.issues, []);
	});

	it("realises accepts artefact → concept", () => {
		const doc = makeDoc(
			[
				{ id: "ART1", type: "artefact", name: "A" },
				{ id: "CON1", type: "concept", name: "C" },
			],
			[{ from: "ART1", to: "CON1", type: "realises" }],
		);
		const result = validateOp({ doc });
		assert.equal(result.valid, true);
		assert.deepEqual(result.issues, []);
	});
});
