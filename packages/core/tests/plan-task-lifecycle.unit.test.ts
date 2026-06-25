import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
	initDocument,
	addTask,
	planStatus,
	planProgress,
	setTaskLifecycle,
} from "../src/speckit/plan.js";
import { validateOp } from "../src/index.js";
import type { SysProMDocument, Node } from "../src/schema.js";

function getTask(doc: SysProMDocument, id: string): Node {
	const prot = doc.nodes.find((node) => node.id === "FEAT-PROT-IMPL");
	if (!prot?.subsystem) throw new Error("Missing FEAT-PROT-IMPL subsystem");
	const task = prot.subsystem.nodes.find((node) => node.id === id);
	if (!task) throw new Error(`Missing task ${id}`);
	return task;
}

describe("plan task lifecycle operations", () => {
	it("start -> complete -> reopen updates lifecycle states", () => {
		let doc = initDocument("FEAT", "Feature");
		doc = addTask(doc, "FEAT", "Implement API");

		doc = setTaskLifecycle(doc, "FEAT", "CHG-1", "start");
		let task = getTask(doc, "CHG-1");
		assert.equal(task.lifecycle?.introduced, true);
		assert.equal(task.lifecycle?.in_progress, true);
		assert.equal(task.lifecycle?.complete, undefined);

		doc = setTaskLifecycle(doc, "FEAT", "CHG-1", "complete");
		task = getTask(doc, "CHG-1");
		assert.equal(task.lifecycle?.complete, true);
		assert.equal(task.lifecycle?.in_progress, undefined);

		doc = setTaskLifecycle(doc, "FEAT", "CHG-1", "reopen");
		task = getTask(doc, "CHG-1");
		assert.equal(task.lifecycle?.complete, undefined);
		assert.equal(task.lifecycle?.in_progress, true);
	});
});

describe("blocked task derivation", () => {
	it("reports dependency_unmet until predecessor is complete", () => {
		let doc = initDocument("FEAT", "Feature");
		doc = addTask(doc, "FEAT", "Task A");
		doc = addTask(doc, "FEAT", "Task B");

		const prot = doc.nodes.find((node) => node.id === "FEAT-PROT-IMPL");
		if (!prot?.subsystem) throw new Error("Missing FEAT-PROT-IMPL subsystem");
		prot.subsystem.relationships = [
			...(prot.subsystem.relationships ?? []),
			{ from: "CHG-2", to: "CHG-1", type: "depends_on" },
		];

		let status = planStatus(doc, "FEAT");
		assert.equal(status.tasks.blocked, 1);
		assert.deepEqual(status.tasks.blockedTasks, [
			{
				taskId: "CHG-2",
				reasons: [{ kind: "dependency_unmet", nodeId: "CHG-1" }],
			},
		]);

		doc = setTaskLifecycle(doc, "FEAT", "CHG-1", "complete");
		status = planStatus(doc, "FEAT");
		assert.equal(status.tasks.blocked, 0);
	});

	it("reports gate_not_ready when constrained gate is incomplete", () => {
		let doc = initDocument("FEAT", "Feature");
		doc = addTask(doc, "FEAT", "Task A");
		doc.nodes.push({ id: "GATE1", type: "gate", name: "Readiness Gate" });

		const prot = doc.nodes.find((node) => node.id === "FEAT-PROT-IMPL");
		if (!prot?.subsystem) throw new Error("Missing FEAT-PROT-IMPL subsystem");
		prot.subsystem.relationships = [
			...(prot.subsystem.relationships ?? []),
			{ from: "CHG-1", to: "GATE1", type: "constrained_by" },
		];

		const progress = planProgress(doc, "FEAT");
		assert.equal(progress[0].blocked, true);
		assert.deepEqual(progress[0].blockageReasons, [
			{ kind: "gate_not_ready", nodeId: "GATE1" },
		]);
	});
});

describe("plan validation rules", () => {
	it("rejects completed tasks with unresolved blockers", () => {
		const doc: SysProMDocument = {
			nodes: [
				{
					id: "PROT1-PROT-IMPL",
					type: "protocol",
					name: "Implementation Protocol",
					subsystem: {
						nodes: [
							{ id: "CHG1", type: "change", name: "Task A" },
							{
								id: "CHG2",
								type: "change",
								name: "Task B",
								lifecycle: { complete: true },
							},
						],
						relationships: [{ from: "CHG2", to: "CHG1", type: "depends_on" }],
					},
				},
			],
		};

		const validation = validateOp({ doc });
		assert.equal(validation.valid, false);
		assert(
			validation.issues.some((issue) =>
				issue.includes("complete task has unresolved blockers"),
			),
		);
	});
});
