import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { stats } from "../src/index.js";
import type { SysProMDocument, Node } from "../src/schema.js";

function makeDoc(nodes: Node[] = [], metadata?: SysProMDocument["metadata"]): SysProMDocument {
  return { nodes, metadata };
}

describe("stats", () => {
  it("correct node counts by type", () => {
    const doc = makeDoc([
      { id: "I1", type: "intent", name: "A" },
      { id: "I2", type: "intent", name: "B" },
      { id: "C1", type: "concept", name: "C" },
    ]);
    const result = stats(doc);
    assert.equal(result.nodesByType["intent"], 2);
    assert.equal(result.nodesByType["concept"], 1);
  });

  it("correct relationship counts by type", () => {
    const doc: SysProMDocument = {
      nodes: [{ id: "I1", type: "intent", name: "A" }, { id: "I2", type: "intent", name: "B" }],
      relationships: [
        { from: "I1", to: "I2", type: "refines" },
        { from: "I2", to: "I1", type: "depends_on" },
      ],
    };
    const result = stats(doc);
    assert.equal(result.relationshipsByType["refines"], 1);
    assert.equal(result.relationshipsByType["depends_on"], 1);
  });

  it("correct subsystem count and depth", () => {
    const doc: SysProMDocument = {
      nodes: [
        {
          id: "S1",
          type: "element",
          name: "Subsystem",
          subsystem: {
            nodes: [
              {
                id: "S2",
                type: "element",
                name: "Nested",
                subsystem: {
                  nodes: [{ id: "E1", type: "element", name: "Deep" }],
                },
              },
            ],
          },
        },
      ],
    };
    const result = stats(doc);
    assert.equal(result.subsystemCount, 2);
    assert.equal(result.maxSubsystemDepth, 2);
  });

  it("correct lifecycle summaries", () => {
    const doc = makeDoc([
      { id: "D1", type: "decision", name: "D", lifecycle: { proposed: true, reviewed: true } },
      { id: "D2", type: "decision", name: "D2", lifecycle: { proposed: true } },
      { id: "C1", type: "change", name: "C", lifecycle: { implemented: true } },
    ]);
    const result = stats(doc);
    assert.equal(result.decisionLifecycle["proposed"], 2);
    assert.equal(result.decisionLifecycle["reviewed"], 1);
    assert.equal(result.changeLifecycle["implemented"], 1);
  });

  it("correct view and external reference counts", () => {
    const doc: SysProMDocument = {
      nodes: [
        { id: "V1", type: "view", name: "View", includes: ["I1"] },
        { id: "I1", type: "intent", name: "Intent" },
      ],
      external_references: [{ role: "source", identifier: "https://example.com" }],
    };
    const result = stats(doc);
    assert.equal(result.viewCount, 1);
    assert.equal(result.externalReferenceCount, 1);
  });

  it("uses title from metadata", () => {
    const doc = makeDoc([], { title: "My Doc" });
    const result = stats(doc);
    assert.equal(result.title, "My Doc");
  });

  it("returns (untitled) when no title", () => {
    const doc = makeDoc([]);
    const result = stats(doc);
    assert.equal(result.title, "(untitled)");
  });
});
