import { describe, it } from "node:test";
import assert from "node:assert";
import { inferCompletenessOp } from "../src/operations/infer-completeness.js";
import type { SysProMDocument } from "../src/schema.js";

describe("inferCompletenessOp", () => {
	it("returns 1.0 score for complete intent with refinements", () => {
		const doc: SysProMDocument = {
			nodes: [
				{ id: "INT1", type: "intent", name: "Test Intent" },
				{ id: "CON1", type: "concept", name: "Test Concept" },
			],
			relationships: [{ from: "CON1", to: "INT1", type: "refines" }],
		};

		const result = inferCompletenessOp({ doc });
		const int1 = result.nodes.find((n) => n.id === "INT1");

		assert.ok(int1);
		assert.strictEqual(int1.score, 1.0);
		assert.strictEqual(int1.issues.length, 0);
	});

	it("returns lower score for intent without refinements", () => {
		const doc: SysProMDocument = {
			nodes: [{ id: "INT1", type: "intent", name: "Test Intent" }],
			relationships: [],
		};

		const result = inferCompletenessOp({ doc });
		const int1 = result.nodes.find((n) => n.id === "INT1");

		assert.ok(int1);
		assert.strictEqual(int1.score, 0.5);
		assert.strictEqual(int1.issues.length, 1);
		assert.ok(int1.issues[0].includes("No refines relationships"));
	});

	it("returns lower score for decision without options", () => {
		const doc: SysProMDocument = {
			nodes: [
				{ id: "DEC1", type: "decision", name: "Test Decision" },
				{ id: "INV1", type: "invariant", name: "Test Invariant" },
			],
			relationships: [{ from: "DEC1", to: "INV1", type: "must_preserve" }],
		};

		const result = inferCompletenessOp({ doc });
		const dec1 = result.nodes.find((n) => n.id === "DEC1");

		assert.ok(dec1);
		assert.ok(dec1.score < 1);
		assert.ok(dec1.issues.some((i) => i.includes("no options")));
		assert.ok(dec1.issues.some((i) => i.includes("no selected option")));
	});

	it("returns 1.0 score for complete decision", () => {
		const doc: SysProMDocument = {
			nodes: [
				{
					id: "DEC1",
					type: "decision",
					name: "Test Decision",
					options: [
						{ id: "OPT-A", description: "Option A" },
						{ id: "OPT-B", description: "Option B" },
					],
					selected: "OPT-A",
					rationale: "A is better",
				},
				{ id: "INV1", type: "invariant", name: "Test Invariant" },
			],
			relationships: [{ from: "DEC1", to: "INV1", type: "must_preserve" }],
		};

		const result = inferCompletenessOp({ doc });
		const dec1 = result.nodes.find((n) => n.id === "DEC1");

		assert.ok(dec1);
		assert.strictEqual(dec1.score, 1.0);
		assert.strictEqual(dec1.issues.length, 0);
	});

	it("returns lower score for change without scope", () => {
		const doc: SysProMDocument = {
			nodes: [{ id: "CHG1", type: "change", name: "Test Change" }],
			relationships: [],
		};

		const result = inferCompletenessOp({ doc });
		const chg1 = result.nodes.find((n) => n.id === "CHG1");

		assert.ok(chg1);
		assert.ok(chg1.score < 1);
		assert.ok(chg1.issues.some((i) => i.includes("no scope")));
	});

	it("returns 1.0 score for change with decision link and plan", () => {
		const doc: SysProMDocument = {
			nodes: [
				{
					id: "CHG1",
					type: "change",
					name: "Test Change",
					scope: ["INT1"],
					plan: [{ description: "Step 1", done: true }],
				},
				{ id: "DEC1", type: "decision", name: "Test Decision" },
			],
			relationships: [{ from: "CHG1", to: "DEC1", type: "implements" }],
		};

		const result = inferCompletenessOp({ doc });
		const chg1 = result.nodes.find((n) => n.id === "CHG1");

		assert.ok(chg1);
		assert.strictEqual(chg1.score, 1.0);
		assert.strictEqual(chg1.issues.length, 0);
	});

	it("calculates correct summary statistics", () => {
		const doc: SysProMDocument = {
			nodes: [
				{ id: "INT1", type: "intent", name: "Complete Intent" },
				{ id: "INT2", type: "intent", name: "Incomplete Intent" },
				{ id: "CON1", type: "concept", name: "Concept" },
			],
			relationships: [
				{ from: "CON1", to: "INT1", type: "refines" },
				// INT2 has no refinements
				// CON1 has no capabilities/elements refining it
			],
		};

		const result = inferCompletenessOp({ doc });

		assert.strictEqual(result.completeNodes, 1); // INT1
		assert.strictEqual(result.incompleteNodes, 2); // INT2, CON1
		assert.ok(result.averageScore > 0 && result.averageScore <= 1);
	});

	it("handles empty document", () => {
		const doc: SysProMDocument = {
			nodes: [],
		};

		const result = inferCompletenessOp({ doc });

		assert.strictEqual(result.nodes.length, 0);
		assert.strictEqual(result.completeNodes, 0);
		assert.strictEqual(result.incompleteNodes, 0);
		assert.ok(Number.isNaN(result.averageScore));
	});
});
