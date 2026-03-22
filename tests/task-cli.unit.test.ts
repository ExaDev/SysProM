import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { addPlanTaskOp, updatePlanTaskOp } from "../src/index.js";
import type { SysProMDocument, Node } from "../src/schema.js";

function makeChangeDoc(
	plan?: { description: string; done?: boolean }[],
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
		const newDoc = addPlanTaskOp({ doc, changeId: "CH1", description: "new task" });
		assert.equal(newDoc.nodes[0].plan?.length, 2);
		assert.equal(newDoc.nodes[0].plan?.[1].description, "new task");
		assert.equal(newDoc.nodes[0].plan?.[1].done, false);
	});

	it("creates plan array when plan is undefined", () => {
		const doc = makeChangeDoc();
		const newDoc = addPlanTaskOp({ doc, changeId: "CH1", description: "first task" });
		assert.equal(newDoc.nodes[0].plan?.length, 1);
		assert.equal(newDoc.nodes[0].plan?.[0].description, "first task");
		assert.equal(newDoc.nodes[0].plan?.[0].done, false);
	});

	it("does not mutate the original doc", () => {
		const doc = makeChangeDoc([{ description: "task A", done: false }]);
		addPlanTaskOp({ doc, changeId: "CH1", description: "task B" });
		assert.equal(doc.nodes[0].plan?.length, 1);
	});

	it("throws Node not found for unknown change ID", () => {
		const doc = makeChangeDoc();
		assert.throws(
			() => addPlanTaskOp({ doc, changeId: "MISSING", description: "task" }),
			/Node not found.*MISSING/,
		);
	});
});

describe("updatePlanTask", () => {
	it("sets done: true at a valid index", () => {
		const doc = makeChangeDoc([{ description: "task A", done: false }]);
		const newDoc = updatePlanTaskOp({ doc, changeId: "CH1", taskIndex: 0, done: true });
		assert.equal(newDoc.nodes[0].plan?.[0].done, true);
	});

	it("sets done: false at a valid index (undone)", () => {
		const doc = makeChangeDoc([{ description: "task A", done: true }]);
		const newDoc = updatePlanTaskOp({ doc, changeId: "CH1", taskIndex: 0, done: false });
		assert.equal(newDoc.nodes[0].plan?.[0].done, false);
	});

	it("throws out-of-range for index equal to plan length", () => {
		const doc = makeChangeDoc([{ description: "task A", done: false }]);
		assert.throws(
			() => updatePlanTaskOp({ doc, changeId: "CH1", taskIndex: 1, done: true }),
			/Task index 1 out of range/,
		);
	});

	it("throws out-of-range for negative index", () => {
		const doc = makeChangeDoc([{ description: "task A", done: false }]);
		assert.throws(
			() => updatePlanTaskOp({ doc, changeId: "CH1", taskIndex: -1, done: true }),
			/Task index -1 out of range/,
		);
	});

	it("throws when plan is undefined", () => {
		const doc = makeChangeDoc();
		assert.throws(() => updatePlanTaskOp({ doc, changeId: "CH1", taskIndex: 0, done: true }), /out of range/);
	});

	it("throws Node not found for unknown change ID", () => {
		const doc = makeChangeDoc([{ description: "task A", done: false }]);
		assert.throws(
			() => updatePlanTaskOp({ doc, changeId: "MISSING", taskIndex: 0, done: true }),
			/Node not found.*MISSING/,
		);
	});

	it("does not mutate the original doc", () => {
		const doc = makeChangeDoc([{ description: "task A", done: false }]);
		updatePlanTaskOp({ doc, changeId: "CH1", taskIndex: 0, done: true });
		assert.equal(doc.nodes[0].plan?.[0].done, false);
	});

	it("does not mutate other tasks in the plan", () => {
		const doc = makeChangeDoc([
			{ description: "task A", done: false },
			{ description: "task B", done: false },
		]);
		const newDoc = updatePlanTaskOp({ doc, changeId: "CH1", taskIndex: 0, done: true });
		assert.equal(newDoc.nodes[0].plan?.[1].done, false);
	});
});
