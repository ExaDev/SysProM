import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { addNodeOp } from "../src/index.js";
import type { SysProMDocument } from "../src/schema.js";

function makeDoc(): SysProMDocument {
	return {
		nodes: [
			{ id: "D1", type: "decision", name: "Existing Decision" },
			{ id: "I1", type: "intent", name: "Some Intent" },
			{ id: "EL1", type: "element", name: "Some Element" },
			{ id: "INV1", type: "invariant", name: "Some Invariant" },
			{ id: "POL1", type: "policy", name: "Some Policy" },
		],
		relationships: [],
	};
}

describe("addNode change-decision guard (INV2)", () => {
	it("adds change node with implements relationship when decisionId provided", () => {
		const doc = makeDoc();
		const result = addNodeOp({
			doc,
			node: { id: "CH1", type: "change", name: "My Change" },
			decisionId: "D1",
		});
		assert.equal(result.nodes.length, 6);
		assert.ok(result.nodes.find((n) => n.id === "CH1"));
		const rel = result.relationships?.find(
			(r) => r.from === "CH1" && r.to === "D1" && r.type === "implements",
		);
		assert.ok(rel, "implements relationship should be created");
	});

	it("throws when change node added without decisionId", () => {
		const doc = makeDoc();
		assert.throws(
			() =>
				addNodeOp({
					doc,
					node: { id: "CH1", type: "change", name: "My Change" },
				}),
			/change.*requires.*decisionId/i,
		);
	});

	it("throws when decisionId does not exist", () => {
		const doc = makeDoc();
		assert.throws(
			() =>
				addNodeOp({
					doc,
					node: { id: "CH1", type: "change", name: "My Change" },
					decisionId: "D999",
				}),
			/not found.*D999/i,
		);
	});

	it("throws when decisionId references a non-decision node", () => {
		const doc = makeDoc();
		assert.throws(
			() =>
				addNodeOp({
					doc,
					node: { id: "CH1", type: "change", name: "My Change" },
					decisionId: "I1",
				}),
			/not a decision/i,
		);
	});

	it("adds non-change nodes without requiring decisionId", () => {
		const doc = makeDoc();
		const result = addNodeOp({
			doc,
			node: { id: "CN1", type: "concept", name: "My Concept" },
		});
		assert.equal(result.nodes.length, 6);
		assert.ok(result.nodes.find((n) => n.id === "CN1"));
	});

	it("ignores decisionId for non-change nodes", () => {
		const doc = makeDoc();
		const result = addNodeOp({
			doc,
			node: { id: "CN1", type: "concept", name: "My Concept" },
			decisionId: "D1",
		});
		assert.equal(result.nodes.length, 6);
		assert.equal(
			result.relationships?.filter((r) => r.from === "CN1").length ?? 0,
			0,
		);
	});
});

describe("addNode realisation-element guard (INV10)", () => {
	it("adds realisation with implements relationship when elementId provided", () => {
		const doc = makeDoc();
		const result = addNodeOp({
			doc,
			node: { id: "R1", type: "realisation", name: "My Realisation" },
			elementId: "EL1",
		});
		assert.equal(result.nodes.length, 6);
		assert.ok(result.nodes.find((n) => n.id === "R1"));
		const rel = result.relationships?.find(
			(r) => r.from === "R1" && r.to === "EL1" && r.type === "implements",
		);
		assert.ok(rel, "implements relationship should be created");
	});

	it("throws when realisation added without elementId", () => {
		const doc = makeDoc();
		assert.throws(
			() =>
				addNodeOp({
					doc,
					node: { id: "R1", type: "realisation", name: "My Realisation" },
				}),
			/realisation.*requires.*elementId/i,
		);
	});

	it("throws when elementId does not exist", () => {
		const doc = makeDoc();
		assert.throws(
			() =>
				addNodeOp({
					doc,
					node: { id: "R1", type: "realisation", name: "My Realisation" },
					elementId: "EL999",
				}),
			/not found.*EL999/i,
		);
	});

	it("throws when elementId references a non-element node", () => {
		const doc = makeDoc();
		assert.throws(
			() =>
				addNodeOp({
					doc,
					node: { id: "R1", type: "realisation", name: "My Realisation" },
					elementId: "D1",
				}),
			/not an element/i,
		);
	});
});

describe("addNode gate-invariant guard (INV8)", () => {
	it("adds gate with governed_by relationship when governedById provided with invariant", () => {
		const doc = makeDoc();
		const result = addNodeOp({
			doc,
			node: { id: "G1", type: "gate", name: "My Gate" },
			governedById: "INV1",
		});
		assert.equal(result.nodes.length, 6);
		assert.ok(result.nodes.find((n) => n.id === "G1"));
		const rel = result.relationships?.find(
			(r) =>
				r.from === "G1" && r.to === "INV1" && r.type === "governed_by",
		);
		assert.ok(rel, "governed_by relationship should be created");
	});

	it("adds gate with governed_by relationship when governedById provided with policy", () => {
		const doc = makeDoc();
		const result = addNodeOp({
			doc,
			node: { id: "G1", type: "gate", name: "My Gate" },
			governedById: "POL1",
		});
		const rel = result.relationships?.find(
			(r) =>
				r.from === "G1" && r.to === "POL1" && r.type === "governed_by",
		);
		assert.ok(rel, "governed_by relationship should be created for policy");
	});

	it("throws when gate added without governedById", () => {
		const doc = makeDoc();
		assert.throws(
			() =>
				addNodeOp({
					doc,
					node: { id: "G1", type: "gate", name: "My Gate" },
				}),
			/gate.*requires.*governedById/i,
		);
	});

	it("throws when governedById does not exist", () => {
		const doc = makeDoc();
		assert.throws(
			() =>
				addNodeOp({
					doc,
					node: { id: "G1", type: "gate", name: "My Gate" },
					governedById: "INV999",
				}),
			/not found.*INV999/i,
		);
	});

	it("throws when governedById references neither invariant nor policy", () => {
		const doc = makeDoc();
		assert.throws(
			() =>
				addNodeOp({
					doc,
					node: { id: "G1", type: "gate", name: "My Gate" },
					governedById: "D1",
				}),
			/not an invariant or policy/i,
		);
	});
});
