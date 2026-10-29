import { describe, it } from "node:test";
import assert from "node:assert";
import { inferDerivedOp } from "../src/operations/infer-derived.js";
import type { SysProMDocument } from "../src/schema.js";

describe("inferDerivedOp", () => {
	it("derives transitive depends_on relationships", () => {
		const doc: SysProMDocument = {
			nodes: [
				{ id: "ELEM1", type: "element", name: "Element 1" },
				{ id: "ELEM2", type: "element", name: "Element 2" },
				{ id: "ELEM3", type: "element", name: "Element 3" },
			],
			relationships: [
				{ from: "ELEM1", to: "ELEM2", type: "depends_on" },
				{ from: "ELEM2", to: "ELEM3", type: "depends_on" },
			],
		};

		const result = inferDerivedOp({ doc });

		const transitive = result.derivedRelationships.find(
			(r) => r.from === "ELEM1" && r.to === "ELEM3",
		);
		assert.ok(transitive);
		assert.strictEqual(transitive.type, "depends_on");
		assert.strictEqual(transitive.derivationType, "transitive");
		assert.strictEqual(transitive.derivedFrom.length, 2);
		assert.strictEqual(result.summary.transitive, 1);
	});

	it("derives transitive refines relationships", () => {
		const doc: SysProMDocument = {
			nodes: [
				{ id: "INT1", type: "intent", name: "Intent" },
				{ id: "CON1", type: "concept", name: "Concept" },
				{ id: "CAP1", type: "capability", name: "Capability" },
			],
			relationships: [
				{ from: "CON1", to: "INT1", type: "refines" },
				{ from: "CAP1", to: "CON1", type: "refines" },
			],
		};

		const result = inferDerivedOp({ doc });

		const transitive = result.derivedRelationships.find(
			(r) => r.from === "CAP1" && r.to === "INT1",
		);
		assert.ok(transitive);
		assert.strictEqual(transitive.type, "refines");
		assert.strictEqual(transitive.derivationType, "transitive");
	});

	it("derives inverse relationships", () => {
		const doc: SysProMDocument = {
			nodes: [
				{ id: "ELEM1", type: "element", name: "Element 1" },
				{ id: "ELEM2", type: "element", name: "Element 2" },
			],
			relationships: [{ from: "ELEM1", to: "ELEM2", type: "depends_on" }],
		};

		const result = inferDerivedOp({ doc });

		const inverse = result.derivedRelationships.find(
			(r) => r.from === "ELEM2" && r.to === "ELEM1",
		);
		assert.ok(inverse);
		assert.strictEqual(inverse.type, "enables");
		assert.strictEqual(inverse.derivationType, "inverse");
		assert.strictEqual(result.summary.inverse, 1);
	});

	it("derives inverse for refines relationship", () => {
		const doc: SysProMDocument = {
			nodes: [
				{ id: "INT1", type: "intent", name: "Intent" },
				{ id: "CON1", type: "concept", name: "Concept" },
			],
			relationships: [{ from: "CON1", to: "INT1", type: "refines" }],
		};

		const result = inferDerivedOp({ doc });

		const inverse = result.derivedRelationships.find(
			(r) => r.from === "INT1" && r.to === "CON1" && r.type === "refined_by",
		);
		assert.ok(inverse);
	});

	it("derives composite potentially_affects relationships", () => {
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

		const result = inferDerivedOp({ doc });

		const composite = result.derivedRelationships.find(
			(r) =>
				r.from === "DEC1" &&
				r.to === "ELEM2" &&
				r.type === "potentially_affects",
		);
		assert.ok(composite);
		assert.strictEqual(composite.derivationType, "composite");
		assert.strictEqual(composite.derivedFrom.length, 2);
		assert.strictEqual(result.summary.composite, 1);
	});

	it("does not duplicate existing relationships", () => {
		const doc: SysProMDocument = {
			nodes: [
				{ id: "ELEM1", type: "element", name: "Element 1" },
				{ id: "ELEM2", type: "element", name: "Element 2" },
			],
			relationships: [{ from: "ELEM1", to: "ELEM2", type: "depends_on" }],
		};

		const result = inferDerivedOp({ doc });

		// Should only have the inverse, not a duplicate depends_on
		const dependsOn = result.derivedRelationships.filter(
			(r) => r.from === "ELEM1" && r.to === "ELEM2" && r.type === "depends_on",
		);
		assert.strictEqual(dependsOn.length, 0);
	});

	it("does not duplicate derived relationships", () => {
		const doc: SysProMDocument = {
			nodes: [
				{ id: "ELEM1", type: "element", name: "Element 1" },
				{ id: "ELEM2", type: "element", name: "Element 2" },
				{ id: "ELEM3", type: "element", name: "Element 3" },
				{ id: "ELEM4", type: "element", name: "Element 4" },
			],
			relationships: [
				{ from: "ELEM1", to: "ELEM2", type: "depends_on" },
				{ from: "ELEM2", to: "ELEM3", type: "depends_on" },
				{ from: "ELEM3", to: "ELEM4", type: "depends_on" },
			],
		};

		const result = inferDerivedOp({ doc });

		// Should have transitive ELEM1->ELEM3, ELEM1->ELEM4, ELEM2->ELEM4
		// Plus inverses
		const transitive = result.derivedRelationships.filter(
			(r) => r.derivationType === "transitive",
		);
		assert.strictEqual(transitive.length, 3);
	});

	it("handles empty document", () => {
		const doc: SysProMDocument = {
			nodes: [],
		};

		const result = inferDerivedOp({ doc });

		assert.strictEqual(result.derivedRelationships.length, 0);
		assert.strictEqual(result.summary.total, 0);
	});

	it("handles document with no relationships", () => {
		const doc: SysProMDocument = {
			nodes: [
				{ id: "INT1", type: "intent", name: "Intent" },
				{ id: "CON1", type: "concept", name: "Concept" },
			],
			relationships: [],
		};

		const result = inferDerivedOp({ doc });

		assert.strictEqual(result.derivedRelationships.length, 0);
	});

	it("derives inverse for realises relationship", () => {
		const doc: SysProMDocument = {
			nodes: [
				{ id: "CAP1", type: "capability", name: "Capability" },
				{ id: "ELEM1", type: "element", name: "Element" },
			],
			relationships: [{ from: "ELEM1", to: "CAP1", type: "realises" }],
		};

		const result = inferDerivedOp({ doc });

		const inverse = result.derivedRelationships.find(
			(r) => r.type === "realised_by",
		);
		assert.ok(inverse);
		assert.strictEqual(inverse.from, "CAP1");
		assert.strictEqual(inverse.to, "ELEM1");
	});

	it("calculates correct summary statistics", () => {
		const doc: SysProMDocument = {
			nodes: [
				{ id: "INT1", type: "intent", name: "Intent" },
				{ id: "CON1", type: "concept", name: "Concept" },
				{ id: "ELEM1", type: "element", name: "Element 1" },
				{ id: "ELEM2", type: "element", name: "Element 2" },
			],
			relationships: [
				{ from: "CON1", to: "INT1", type: "refines" },
				{ from: "ELEM1", to: "ELEM2", type: "depends_on" },
				{ from: "ELEM2", to: "INT1", type: "depends_on" },
			],
		};

		const result = inferDerivedOp({ doc });

		assert.strictEqual(
			result.summary.total,
			result.derivedRelationships.length,
		);
		assert.strictEqual(
			result.summary.transitive +
				result.summary.composite +
				result.summary.inverse,
			result.summary.total,
		);
	});

	it("does not derive from read-model view depends_on relationships", () => {
		const doc: SysProMDocument = {
			nodes: [
				{ id: "DEC1", type: "decision", name: "Decision" },
				{ id: "VIEW1", type: "view", name: "Projection" },
				{ id: "ELEM1", type: "element", name: "Element 1" },
				{ id: "ELEM2", type: "element", name: "Element 2" },
			],
			relationships: [
				{ from: "VIEW1", to: "ELEM1", type: "depends_on" },
				{ from: "ELEM1", to: "ELEM2", type: "depends_on" },
				{ from: "DEC1", to: "VIEW1", type: "affects" },
			],
		};

		const result = inferDerivedOp({ doc });

		const fromViewDependsOn = result.derivedRelationships.filter(
			(r) => r.type === "depends_on" && r.from === "VIEW1",
		);
		const viewInverse = result.derivedRelationships.filter(
			(r) => r.type === "enables" && r.to === "VIEW1",
		);
		const viewComposite = result.derivedRelationships.filter(
			(r) => r.type === "potentially_affects" && r.to === "ELEM1",
		);
		assert.strictEqual(fromViewDependsOn.length, 0);
		assert.strictEqual(viewInverse.length, 0);
		assert.strictEqual(viewComposite.length, 0);
	});
});
