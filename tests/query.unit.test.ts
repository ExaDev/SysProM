import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
	queryNodesOp,
	queryNodeOp,
	queryRelationshipsOp,
	traceFromNodeOp,
} from "../src/index.js";
import type { SysProMDocument } from "../src/schema.js";

function makeDoc(): SysProMDocument {
	return {
		nodes: [
			{
				id: "INT1",
				type: "intent",
				name: "Root Intent",
				lifecycle: { accepted: true },
			},
			{
				id: "CON1",
				type: "concept",
				name: "Concept",
				lifecycle: { proposed: true },
			},
			{
				id: "CON2",
				type: "concept",
				name: "Refined Concept",
				lifecycle: { accepted: true },
			},
			{ id: "ELEM1", type: "element", name: "Element" },
		],
		relationships: [
			{ from: "CON1", to: "INT1", type: "refines" },
			{ from: "CON2", to: "CON1", type: "refines" },
			{ from: "ELEM1", to: "CON1", type: "implements" },
		],
	};
}

describe("queryNodes", () => {
	it("returns all nodes", () => {
		const doc = makeDoc();
		const nodes = queryNodesOp({ doc });
		assert.equal(nodes.length, 4);
	});

	it("filters by type", () => {
		const doc = makeDoc();
		const nodes = queryNodesOp({ doc, type: "concept" });
		assert.equal(nodes.length, 2);
		assert.ok(nodes.every((n) => n.type === "concept"));
	});

	it("filters by status", () => {
		const doc = makeDoc();
		const nodes = queryNodesOp({ doc, status: "accepted" });
		assert.equal(nodes.length, 2);
		assert.ok(nodes.every((n) => n.lifecycle?.accepted === true));
	});

	it("filters by type and status", () => {
		const doc = makeDoc();
		const nodes = queryNodesOp({ doc, type: "concept", status: "accepted" });
		assert.equal(nodes.length, 1);
		assert.equal(nodes[0].id, "CON2");
	});
});

describe("queryNode", () => {
	it("returns node with relationships", () => {
		const doc = makeDoc();
		const result = queryNodeOp({ doc, id: "CON1" });
		assert.ok(result);
		assert.equal(result.node.id, "CON1");
		// CON1 has 3 relationships: 1 outgoing (to INT1), 2 incoming (from CON2 and ELEM1)
		assert.equal(result.outgoing.length, 1);
		assert.equal(result.incoming.length, 2);
	});

	it("returns null for missing ID", () => {
		const doc = makeDoc();
		const result = queryNodeOp({ doc, id: "NONEXISTENT" });
		assert.equal(result, null);
	});
});

describe("queryRelationships", () => {
	it("returns all relationships", () => {
		const doc = makeDoc();
		const rels = queryRelationshipsOp({ doc });
		assert.equal(rels.length, 3);
	});

	it("filters by from", () => {
		const doc = makeDoc();
		const rels = queryRelationshipsOp({ doc, from: "CON1" });
		assert.equal(rels.length, 1);
		assert.equal(rels[0].to, "INT1");
	});

	it("filters by to", () => {
		const doc = makeDoc();
		const rels = queryRelationshipsOp({ doc, to: "CON1" });
		assert.equal(rels.length, 2);
		assert.ok(rels.every((r) => r.to === "CON1"));
	});

	it("filters by type", () => {
		const doc = makeDoc();
		const rels = queryRelationshipsOp({ doc, type: "refines" });
		assert.equal(rels.length, 2);
		assert.ok(rels.every((r) => r.type === "refines"));
	});
});

describe("traceFromNode", () => {
	it("traces refinement chain correctly", () => {
		const doc = makeDoc();
		// INT1 <- CON1 <- CON2 (refines chain)
		// INT1 <- CON1 <- ELEM1 (implements)
		const trace = traceFromNodeOp({ doc, startId: "INT1" });

		assert.equal(trace.id, "INT1");
		assert.equal(trace.node?.name, "Root Intent");
		assert.equal(trace.children.length, 1); // Only CON1 refines INT1

		const c1Trace = trace.children[0];
		assert.equal(c1Trace.id, "CON1");
		assert.equal(c1Trace.children.length, 2); // CON2 and ELEM1 both point to CON1

		const childIds = c1Trace.children.map((c) => c.id);
		assert.ok(childIds.includes("CON2"));
		assert.ok(childIds.includes("ELEM1"));
	});

	it("returns empty children for leaf node", () => {
		const doc = makeDoc();
		const trace = traceFromNodeOp({ doc, startId: "ELEM1" });
		assert.equal(trace.id, "ELEM1");
		assert.equal(trace.children.length, 0);
	});

	it("handles missing node gracefully", () => {
		const doc = makeDoc();
		const trace = traceFromNodeOp({ doc, startId: "NONEXISTENT" });
		assert.equal(trace.id, "NONEXISTENT");
		assert.equal(trace.node, undefined);
	});
});
