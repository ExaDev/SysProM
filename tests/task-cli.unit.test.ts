import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { addPlanTask, updatePlanTask } from "../src/index.js";
import type { SysProMDocument, Node } from "../src/schema.js";

function makeChangeDoc(
  plan?: Array<{ description: string; done?: boolean }>,
): SysProMDocument {
  const node: Node = {
    id: "CH1",
    type: "change",
    name: "Test Change",
    ...(plan !== undefined ? { plan } : {}),
  };
  return { nodes: [node] };
}

describe("addPlanTask", () => {
  it("appends task when plan already exists", () => {
    const doc = makeChangeDoc([{ description: "existing task", done: false }]);
    const newDoc = addPlanTask(doc, "CH1", "new task");
    assert.equal(newDoc.nodes[0].plan?.length, 2);
    assert.equal(newDoc.nodes[0].plan?.[1].description, "new task");
    assert.equal(newDoc.nodes[0].plan?.[1].done, false);
  });

  it("creates plan array when plan is undefined", () => {
    const doc = makeChangeDoc();
    const newDoc = addPlanTask(doc, "CH1", "first task");
    assert.equal(newDoc.nodes[0].plan?.length, 1);
    assert.equal(newDoc.nodes[0].plan?.[0].description, "first task");
    assert.equal(newDoc.nodes[0].plan?.[0].done, false);
  });

  it("does not mutate the original doc", () => {
    const doc = makeChangeDoc([{ description: "task A", done: false }]);
    addPlanTask(doc, "CH1", "task B");
    assert.equal(doc.nodes[0].plan?.length, 1);
  });

  it("throws Node not found for unknown change ID", () => {
    const doc = makeChangeDoc();
    assert.throws(
      () => addPlanTask(doc, "MISSING", "task"),
      /Node not found.*MISSING/,
    );
  });
});

describe("updatePlanTask", () => {
  it("sets done: true at a valid index", () => {
    const doc = makeChangeDoc([{ description: "task A", done: false }]);
    const newDoc = updatePlanTask(doc, "CH1", 0, true);
    assert.equal(newDoc.nodes[0].plan?.[0].done, true);
  });

  it("sets done: false at a valid index (undone)", () => {
    const doc = makeChangeDoc([{ description: "task A", done: true }]);
    const newDoc = updatePlanTask(doc, "CH1", 0, false);
    assert.equal(newDoc.nodes[0].plan?.[0].done, false);
  });

  it("throws out-of-range for index equal to plan length", () => {
    const doc = makeChangeDoc([{ description: "task A", done: false }]);
    assert.throws(
      () => updatePlanTask(doc, "CH1", 1, true),
      /Task index 1 out of range/,
    );
  });

  it("throws out-of-range for negative index", () => {
    const doc = makeChangeDoc([{ description: "task A", done: false }]);
    assert.throws(
      () => updatePlanTask(doc, "CH1", -1, true),
      /Task index -1 out of range/,
    );
  });

  it("throws when plan is undefined", () => {
    const doc = makeChangeDoc();
    assert.throws(() => updatePlanTask(doc, "CH1", 0, true), /out of range/);
  });

  it("throws Node not found for unknown change ID", () => {
    const doc = makeChangeDoc([{ description: "task A", done: false }]);
    assert.throws(
      () => updatePlanTask(doc, "MISSING", 0, true),
      /Node not found.*MISSING/,
    );
  });

  it("does not mutate the original doc", () => {
    const doc = makeChangeDoc([{ description: "task A", done: false }]);
    updatePlanTask(doc, "CH1", 0, true);
    assert.equal(doc.nodes[0].plan?.[0].done, false);
  });

  it("does not mutate other tasks in the plan", () => {
    const doc = makeChangeDoc([
      { description: "task A", done: false },
      { description: "task B", done: false },
    ]);
    const newDoc = updatePlanTask(doc, "CH1", 0, true);
    assert.equal(newDoc.nodes[0].plan?.[1].done, false);
  });
});
