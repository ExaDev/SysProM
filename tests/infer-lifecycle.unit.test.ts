import { describe, it } from "node:test";
import assert from "node:assert";
import { inferLifecycleOp } from "../src/operations/infer-lifecycle.js";
import type { SysProMDocument } from "../src/schema.js";

describe("inferLifecycleOp", () => {
	it("infers early phase from proposed lifecycle state", () => {
		const doc: SysProMDocument = {
			nodes: [
				{
					id: "INT1",
					type: "intent",
					name: "Test",
					lifecycle: { proposed: true },
				},
			],
		};

		const result = inferLifecycleOp({ doc });
		const int1 = result.nodes.find((n) => n.id === "INT1");

		assert.ok(int1);
		assert.strictEqual(int1.inferredPhase, "early");
		assert.strictEqual(int1.inferredState, "proposed");
	});

	it("infers late phase from implemented lifecycle state", () => {
		const doc: SysProMDocument = {
			nodes: [
				{
					id: "CAP1",
					type: "capability",
					name: "Test",
					lifecycle: { implemented: true },
				},
			],
		};

		const result = inferLifecycleOp({ doc });
		const cap1 = result.nodes.find((n) => n.id === "CAP1");

		assert.ok(cap1);
		assert.strictEqual(cap1.inferredPhase, "late");
		assert.strictEqual(cap1.inferredState, "implemented");
	});

	it("infers terminal phase from retired lifecycle state", () => {
		const doc: SysProMDocument = {
			nodes: [
				{
					id: "ELEM1",
					type: "element",
					name: "Test",
					lifecycle: { retired: true },
				},
			],
		};

		const result = inferLifecycleOp({ doc });
		const elem1 = result.nodes.find((n) => n.id === "ELEM1");

		assert.ok(elem1);
		assert.strictEqual(elem1.inferredPhase, "terminal");
		assert.strictEqual(elem1.inferredState, "retired");
	});

	it("infers state from lifecycle field", () => {
		const doc: SysProMDocument = {
			nodes: [
				{
					id: "CHG1",
					type: "change",
					name: "Test",
					lifecycle: {
						proposed: true,
						defined: true,
						implemented: "2024-01-15",
					},
				},
			],
		};

		const result = inferLifecycleOp({ doc });
		const chg1 = result.nodes.find((n) => n.id === "CHG1");

		assert.ok(chg1);
		assert.strictEqual(chg1.inferredState, "implemented");
		assert.strictEqual(chg1.inferredPhase, "late");
	});

	it("uses the most advanced lifecycle state when multiple are present", () => {
		const doc: SysProMDocument = {
			nodes: [
				{
					id: "DEC1",
					type: "decision",
					name: "Test",
					lifecycle: { proposed: true, deprecated: "2024-01-15" },
				},
			],
		};

		const result = inferLifecycleOp({ doc });
		const dec1 = result.nodes.find((n) => n.id === "DEC1");

		assert.ok(dec1);
		assert.strictEqual(dec1.inferredState, "deprecated");
		assert.strictEqual(dec1.inferredPhase, "terminal");
	});

	it("returns unknown phase for node without lifecycle", () => {
		const doc: SysProMDocument = {
			nodes: [{ id: "INT1", type: "intent", name: "Test" }],
		};

		const result = inferLifecycleOp({ doc });
		const int1 = result.nodes.find((n) => n.id === "INT1");

		assert.ok(int1);
		assert.strictEqual(int1.inferredPhase, "unknown");
		assert.strictEqual(int1.inferredState, "undefined");
	});

	it("calculates correct summary statistics", () => {
		const doc: SysProMDocument = {
			nodes: [
				{
					id: "INT1",
					type: "intent",
					name: "Test",
					lifecycle: { proposed: true },
				},
				{ id: "INT2", type: "intent", name: "Test", lifecycle: { active: true } },
				{
					id: "INT3",
					type: "intent",
					name: "Test",
					lifecycle: { implemented: true },
				},
				{
					id: "INT4",
					type: "intent",
					name: "Test",
					lifecycle: { retired: true },
				},
				{ id: "INT5", type: "intent", name: "Test" },
			],
		};

		const result = inferLifecycleOp({ doc });

		assert.strictEqual(result.summary.early, 1);
		assert.strictEqual(result.summary.middle, 1);
		assert.strictEqual(result.summary.late, 1);
		assert.strictEqual(result.summary.terminal, 1);
		assert.strictEqual(result.summary.unknown, 1);
	});

	it("handles middle phase lifecycle states", () => {
		const doc: SysProMDocument = {
			nodes: [
				{
					id: "INT1",
					type: "intent",
					name: "Test",
					lifecycle: { in_progress: true },
				},
				{
					id: "INT2",
					type: "intent",
					name: "Test",
					lifecycle: { experimental: true },
				},
			],
		};

		const result = inferLifecycleOp({ doc });

		assert.strictEqual(result.summary.middle, 2);
	});

	it("handles empty document", () => {
		const doc: SysProMDocument = {
			nodes: [],
		};

		const result = inferLifecycleOp({ doc });

		assert.strictEqual(result.nodes.length, 0);
		assert.strictEqual(result.summary.unknown, 0);
	});
});
