import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { queryNodes, queryNode, queryRelationships, traceFromNode, type TraceNode } from "../src/index.js";
import type { SysProMDocument } from "../src/schema.js";

function makeDoc(): SysProMDocument {
  return {
    nodes: [
      { id: "I1", type: "intent", name: "Root Intent", status: "accepted" },
      { id: "C1", type: "concept", name: "Concept", status: "proposed" },
      { id: "C2", type: "concept", name: "Refined Concept", status: "accepted" },
      { id: "E1", type: "element", name: "Element" },
    ],
    relationships: [
      { from: "C1", to: "I1", type: "refines" },
      { from: "C2", to: "C1", type: "refines" },
      { from: "E1", to: "C1", type: "implements" },
    ],
  };
}

describe("queryNodes", () => {
  it("returns all nodes", () => {
    const doc = makeDoc();
    const nodes = queryNodes(doc);
    assert.equal(nodes.length, 4);
  });

  it("filters by type", () => {
    const doc = makeDoc();
    const nodes = queryNodes(doc, { type: "concept" });
    assert.equal(nodes.length, 2);
    assert.ok(nodes.every((n) => n.type === "concept"));
  });

  it("filters by status", () => {
    const doc = makeDoc();
    const nodes = queryNodes(doc, { status: "accepted" });
    assert.equal(nodes.length, 2);
    assert.ok(nodes.every((n) => n.status === "accepted"));
  });

  it("filters by type and status", () => {
    const doc = makeDoc();
    const nodes = queryNodes(doc, { type: "concept", status: "accepted" });
    assert.equal(nodes.length, 1);
    assert.equal(nodes[0].id, "C2");
  });
});

describe("queryNode", () => {
  it("returns node with relationships", () => {
    const doc = makeDoc();
    const result = queryNode(doc, "C1");
    assert.ok(result);
    assert.equal(result.node.id, "C1");
    // C1 has 3 relationships: 1 outgoing (to I1), 2 incoming (from C2 and E1)
    assert.equal(result.outgoing.length, 1);
    assert.equal(result.incoming.length, 2);
  });

  it("returns undefined for missing ID", () => {
    const doc = makeDoc();
    const result = queryNode(doc, "NONEXISTENT");
    assert.equal(result, undefined);
  });
});

describe("queryRelationships", () => {
  it("returns all relationships", () => {
    const doc = makeDoc();
    const rels = queryRelationships(doc);
    assert.equal(rels.length, 3);
  });

  it("filters by from", () => {
    const doc = makeDoc();
    const rels = queryRelationships(doc, { from: "C1" });
    assert.equal(rels.length, 1);
    assert.equal(rels[0].to, "I1");
  });

  it("filters by to", () => {
    const doc = makeDoc();
    const rels = queryRelationships(doc, { to: "C1" });
    assert.equal(rels.length, 2);
    assert.ok(rels.every((r) => r.to === "C1"));
  });

  it("filters by type", () => {
    const doc = makeDoc();
    const rels = queryRelationships(doc, { type: "refines" });
    assert.equal(rels.length, 2);
    assert.ok(rels.every((r) => r.type === "refines"));
  });
});

describe("traceFromNode", () => {
  it("traces refinement chain correctly", () => {
    const doc = makeDoc();
    // I1 <- C1 <- C2 (refines chain)
    // I1 <- C1 <- E1 (implements)
    const trace = traceFromNode(doc, "I1");

    assert.equal(trace.id, "I1");
    assert.equal(trace.node?.name, "Root Intent");
    assert.equal(trace.children.length, 1); // Only C1 refines I1

    const c1Trace = trace.children[0];
    assert.equal(c1Trace.id, "C1");
    assert.equal(c1Trace.children.length, 2); // C2 and E1 both point to C1

    const childIds = c1Trace.children.map((c) => (c as TraceNode).id);
    assert.ok(childIds.includes("C2"));
    assert.ok(childIds.includes("E1"));
  });

  it("returns empty children for leaf node", () => {
    const doc = makeDoc();
    const trace = traceFromNode(doc, "E1");
    assert.equal(trace.id, "E1");
    assert.equal(trace.children.length, 0);
  });

  it("handles missing node gracefully", () => {
    const doc = makeDoc();
    const trace = traceFromNode(doc, "NONEXISTENT");
    assert.equal(trace.id, "NONEXISTENT");
    assert.equal(trace.node, undefined);
  });
});
