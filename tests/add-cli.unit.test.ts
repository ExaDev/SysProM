import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { addNodeOp } from "../src/index.js";
import type { SysProMDocument } from "../src/schema.js";

function makeDoc(): SysProMDocument {
	return {
		nodes: [
			{ id: "D1", type: "decision", name: "Existing Decision" },
			{ id: "I1", type: "intent", name: "Some Intent" },
		],
		relationships: [],
	};
}

describe("addNode change-decision guard", () => {
	it("adds change node with implements relationship when decisionId provided", () => {
		const doc = makeDoc();
		const result = addNodeOp({
			doc,
			node: { id: "CH1", type: "change", name: "My Change" },
			decisionId: "D1",
		});
		assert.equal(result.nodes.length, 3);
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
		assert.equal(result.nodes.length, 3);
		assert.ok(result.nodes.find((n) => n.id === "CN1"));
	});

	it("ignores decisionId for non-change nodes", () => {
		const doc = makeDoc();
		const result = addNodeOp({
			doc,
			node: { id: "CN1", type: "concept", name: "My Concept" },
			decisionId: "D1",
		});
		assert.equal(result.nodes.length, 3);
		// Should not create a relationship for non-change nodes
		assert.equal(
			result.relationships?.filter((r) => r.from === "CN1").length ?? 0,
			0,
		);
	});
});
