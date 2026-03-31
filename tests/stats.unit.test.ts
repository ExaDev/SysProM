import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { statsOp } from "../src/index.js";
import type { SysProMDocument, Node } from "../src/schema.js";

function makeDoc(
	nodes: Node[] = [],
	metadata?: SysProMDocument["metadata"],
): SysProMDocument {
	return { nodes, metadata };
}

describe("stats", () => {
	it("correct node counts by type", () => {
		const doc = makeDoc([
			{ id: "INT1", type: "intent", name: "A" },
			{ id: "INT2", type: "intent", name: "B" },
			{ id: "CON1", type: "concept", name: "C" },
		]);
		const result = statsOp({ doc });
		assert.equal(result.nodesByType.intent, 2);
		assert.equal(result.nodesByType.concept, 1);
	});

	it("correct relationship counts by type", () => {
		const doc: SysProMDocument = {
			nodes: [
				{ id: "INT1", type: "intent", name: "A" },
				{ id: "INT2", type: "intent", name: "B" },
			],
			relationships: [
				{ from: "INT1", to: "INT2", type: "refines" },
				{ from: "INT2", to: "INT1", type: "depends_on" },
			],
		};
		const result = statsOp({ doc });
		assert.equal(result.relationshipsByType.refines, 1);
		assert.equal(result.relationshipsByType.depends_on, 1);
	});

	it("correct subsystem count and depth", () => {
		const doc: SysProMDocument = {
			nodes: [
				{
					id: "ELEM1",
					type: "element",
					name: "Subsystem",
					subsystem: {
						nodes: [
							{
								id: "ELEM2",
								type: "element",
								name: "Nested",
								subsystem: {
									nodes: [{ id: "ELEM3", type: "element", name: "Deep" }],
								},
							},
						],
					},
				},
			],
		};
		const result = statsOp({ doc });
		assert.equal(result.subsystemCount, 2);
		assert.equal(result.maxSubsystemDepth, 2);
	});

	it("correct lifecycle summaries", () => {
		const doc = makeDoc([
			{
				id: "DEC1",
				type: "decision",
				name: "D",
				lifecycle: { proposed: true, reviewed: true },
			},
			{
				id: "DEC2",
				type: "decision",
				name: "DEC2",
				lifecycle: { proposed: true },
			},
			{
				id: "CHG1",
				type: "change",
				name: "C",
				lifecycle: { implemented: true },
			},
		]);
		const result = statsOp({ doc });
		assert.equal(result.decisionLifecycle.proposed, 2);
		assert.equal(result.decisionLifecycle.reviewed, 1);
		assert.equal(result.changeLifecycle.implemented, 1);
	});

	it("correct view and external reference counts", () => {
		const doc: SysProMDocument = {
			nodes: [
				{ id: "VIEW1", type: "view", name: "View", includes: ["INT1"] },
				{ id: "INT1", type: "intent", name: "Intent" },
			],
			external_references: [
				{ role: "source", identifier: "https://example.com" },
			],
		};
		const result = statsOp({ doc });
		assert.equal(result.viewCount, 1);
		assert.equal(result.externalReferenceCount, 1);
	});

	it("uses title from metadata", () => {
		const doc = makeDoc([], { title: "My Doc" });
		const result = statsOp({ doc });
		assert.equal(result.title, "My Doc");
	});

	it("returns (untitled) when no title", () => {
		const doc = makeDoc([]);
		const result = statsOp({ doc });
		assert.equal(result.title, "(untitled)");
	});
});
