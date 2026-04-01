import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
	initDocument,
	addTask,
	planStatus,
	planProgress,
	checkGate,
} from "../src/speckit/plan.js";
import type { SysProMDocument, Node, Relationship } from "../src/schema.js";

// ============================================================================
// Helper function to create test documents
// ============================================================================

function makeDoc(
	nodes: Node[] = [],
	relationships: Relationship[] = [],
): SysProMDocument {
	return {
		nodes,
		relationships: relationships.length > 0 ? relationships : undefined,
		metadata: {
			title: "Test Document",
			doc_type: "speckit",
		},
	};
}

// ============================================================================
// Test initDocument
// ============================================================================

describe("initDocument", () => {
	it("creates exactly 4 nodes", () => {
		const doc = initDocument("FEAT", "My Feature");
		assert.equal(doc.nodes?.length, 4, "should create 4 skeleton nodes");
	});

	it("creates nodes with correct IDs", () => {
		const doc = initDocument("FEAT", "My Feature");
		const ids = doc.nodes?.map((n) => n.id).sort();
		assert.deepEqual(ids, [
			"FEAT-CHK",
			"FEAT-CONST",
			"FEAT-PROT-IMPL",
			"FEAT-SPEC",
		]);
	});

	it("creates exactly 2 relationships", () => {
		const doc = initDocument("FEAT", "My Feature");
		assert.equal(
			doc.relationships?.length,
			2,
			"should create 2 initial relationships",
		);
	});

	it("SPEC governed_by CONST", () => {
		const doc = initDocument("FEAT", "My Feature");
		const rel = doc.relationships?.find(
			(r) => r.from === "FEAT-SPEC" && r.type === "governed_by",
		);
		assert.ok(rel, "SPEC should have governed_by relationship");
		assert.equal(rel?.to, "FEAT-CONST");
	});

	it("CHK governed_by PROT-IMPL", () => {
		const doc = initDocument("FEAT", "My Feature");
		const rel = doc.relationships?.find(
			(r) => r.from === "FEAT-CHK" && r.type === "governed_by",
		);
		assert.ok(rel, "CHK should have governed_by relationship");
		assert.equal(rel?.to, "FEAT-PROT-IMPL");
	});

	it("PROT-IMPL has empty subsystem", () => {
		const doc = initDocument("FEAT", "My Feature");
		const protImpl = doc.nodes?.find((n) => n.id === "FEAT-PROT-IMPL");
		assert.ok(protImpl?.subsystem, "PROT-IMPL should have subsystem");
		assert.equal(protImpl?.subsystem?.nodes?.length, 0);
		assert.equal(protImpl?.subsystem?.relationships?.length, 0);
	});

	it("metadata has doc_type speckit", () => {
		const doc = initDocument("FEAT", "My Feature");
		assert.equal(doc.metadata?.doc_type, "speckit");
	});

	it("metadata title is the feature name", () => {
		const doc = initDocument("FEAT", "My Feature");
		assert.equal(doc.metadata?.title, "My Feature");
	});

	it("CONST description is placeholder", () => {
		const doc = initDocument("FEAT", "My Feature");
		const const_ = doc.nodes?.find((n) => n.id === "FEAT-CONST");
		assert.ok(const_?.description);
	});

	it("SPEC lifecycle includes proposed", () => {
		const doc = initDocument("FEAT", "My Feature");
		const spec = doc.nodes?.find((n) => n.id === "FEAT-SPEC");
		assert.equal(spec?.lifecycle?.proposed, true);
	});

	it("CHK lifecycle is empty", () => {
		const doc = initDocument("FEAT", "My Feature");
		const chk = doc.nodes?.find((n) => n.id === "FEAT-CHK");
		assert.deepEqual(chk?.lifecycle, {});
	});
});

// ============================================================================
// Test addTask
// ============================================================================

describe("addTask", () => {
	it("first addTask creates CHG-1 at top level", () => {
		const doc = initDocument("FEAT", "My Feature");
		const updated = addTask(doc, "FEAT");

		const protImpl = updated.nodes?.find((n) => n.id === "FEAT-PROT-IMPL");
		const taskIds = protImpl?.subsystem?.nodes?.map((n) => n.id);
		assert.deepEqual(taskIds, ["CHG-1"]);
	});

	it("first addTask does not create must_follow", () => {
		const doc = initDocument("FEAT", "My Feature");
		const updated = addTask(doc, "FEAT");

		const protImpl = updated.nodes?.find((n) => n.id === "FEAT-PROT-IMPL");
		const rels = protImpl?.subsystem?.relationships;
		const mustFollow = rels?.filter((r) => r.type === "must_follow");
		assert.equal(
			mustFollow?.length,
			0,
			"first task should not have must_follow",
		);
	});

	it("second addTask creates CHG-2", () => {
		const doc = initDocument("FEAT", "My Feature");
		let updated = addTask(doc, "FEAT");
		updated = addTask(updated, "FEAT");

		const protImpl = updated.nodes?.find((n) => n.id === "FEAT-PROT-IMPL");
		const taskIds = protImpl?.subsystem?.nodes?.map((n) => n.id).sort();
		assert.deepEqual(taskIds, ["CHG-1", "CHG-2"]);
	});

	it("second addTask creates CHG-2 must_follow CHG-1", () => {
		const doc = initDocument("FEAT", "My Feature");
		let updated = addTask(doc, "FEAT");
		updated = addTask(updated, "FEAT");

		const protImpl = updated.nodes?.find((n) => n.id === "FEAT-PROT-IMPL");
		const mustFollow = protImpl?.subsystem?.relationships?.filter(
			(r) => r.type === "must_follow",
		);
		assert.equal(mustFollow?.length, 1);
		assert.equal(mustFollow?.[0].from, "CHG-2");
		assert.equal(mustFollow?.[0].to, "CHG-1");
	});

	it("does not mutate original document", () => {
		const doc = initDocument("FEAT", "My Feature");
		const protImplBefore = doc.nodes?.find((n) => n.id === "FEAT-PROT-IMPL");
		const nodeCountBefore = protImplBefore?.subsystem?.nodes?.length;

		addTask(doc, "FEAT");

		const protImplAfter = doc.nodes?.find((n) => n.id === "FEAT-PROT-IMPL");
		const nodeCountAfter = protImplAfter?.subsystem?.nodes?.length;

		assert.equal(
			nodeCountBefore,
			nodeCountAfter,
			"original doc should not change",
		);
	});

	it("third addTask creates CHG-3 must_follow CHG-2", () => {
		let doc = initDocument("FEAT", "My Feature");
		doc = addTask(doc, "FEAT");
		doc = addTask(doc, "FEAT");
		doc = addTask(doc, "FEAT");

		const protImpl = doc.nodes?.find((n) => n.id === "FEAT-PROT-IMPL");
		const chg3Follow = protImpl?.subsystem?.relationships?.find(
			(r) => r.from === "CHG-3" && r.type === "must_follow",
		);
		assert.equal(chg3Follow?.to, "CHG-2");
	});

	it("addTask with custom name uses that name", () => {
		const doc = initDocument("FEAT", "My Feature");
		const updated = addTask(doc, "FEAT", "Setup");

		const protImpl = updated.nodes?.find((n) => n.id === "FEAT-PROT-IMPL");
		const change = protImpl?.subsystem?.nodes?.find((n) => n.id === "CHG-1");
		assert.equal(change?.name, "Setup");
	});

	it("addTask without name defaults to Task N", () => {
		const doc = initDocument("FEAT", "My Feature");
		const updated = addTask(doc, "FEAT");

		const protImpl = updated.nodes?.find((n) => n.id === "FEAT-PROT-IMPL");
		const change = protImpl?.subsystem?.nodes?.find((n) => n.id === "CHG-1");
		assert.equal(change?.name, "Task 1");
	});

	it("addTask with parentId creates nested task", () => {
		let doc = initDocument("FEAT", "My Feature");
		doc = addTask(doc, "FEAT", "Phase 1");
		doc = addTask(doc, "FEAT", "Subtask 1", "CHG-1");

		const protImpl = doc.nodes?.find((n) => n.id === "FEAT-PROT-IMPL");
		const parent = protImpl?.subsystem?.nodes?.find((n) => n.id === "CHG-1");
		const child = parent?.subsystem?.nodes?.find((n) => n.id === "CHG-1-1");
		assert.ok(child);
		assert.equal(child?.name, "Subtask 1");
	});
});

// ============================================================================
// Test planStatus
// ============================================================================

describe("planStatus", () => {
	it("empty document: all undefined, nextStep recommends init", () => {
		const doc = makeDoc();

		const status = planStatus(doc, "FEAT");
		assert.equal(status.constitution.defined, false);
		assert.equal(status.spec.defined, false);
		assert.equal(status.plan.defined, false);
		assert.equal(status.checklist.defined, false);
		assert.match(
			status.nextStep,
			/plan init/,
			"nextStep should recommend init",
		);
	});

	it("document with constitution: constitution defined", () => {
		const nodes: Node[] = [
			{
				id: "FEAT-CONST",
				type: "protocol",
				name: "My Feature Constitution",
			},
		];
		const doc = makeDoc(nodes);

		const status = planStatus(doc, "FEAT");
		assert.equal(status.constitution.defined, true);
	});

	it("constitution counts principles", () => {
		const nodes: Node[] = [
			{
				id: "FEAT-CONST",
				type: "protocol",
				name: "My Feature Constitution",
			},
			{
				id: "FEAT-INV-1",
				type: "principle",
				name: "Simplicity",
			},
			{
				id: "FEAT-INV-2",
				type: "principle",
				name: "Clarity",
			},
		];
		const relationships: Relationship[] = [
			{ from: "FEAT-INV-1", to: "FEAT-CONST", type: "part_of" },
			{ from: "FEAT-INV-2", to: "FEAT-CONST", type: "part_of" },
		];
		const doc = makeDoc(nodes, relationships);

		const status = planStatus(doc, "FEAT");
		assert.equal(status.constitution.principleCount, 2);
	});

	it("spec counts user stories", () => {
		const nodes: Node[] = [
			{
				id: "FEAT-SPEC",
				type: "artefact",
				name: "My Feature Specification",
			},
			{
				id: "FEAT-US-1",
				type: "capability",
				name: "User Story 1",
			},
			{
				id: "FEAT-US-2",
				type: "capability",
				name: "User Story 2",
			},
		];
		const doc = makeDoc(nodes);

		const status = planStatus(doc, "FEAT");
		assert.equal(status.spec.userStoryCount, 2);
	});

	it("detects stories needing acceptance criteria", () => {
		const nodes: Node[] = [
			{
				id: "FEAT-SPEC",
				type: "artefact",
				name: "My Feature Specification",
			},
			{
				id: "FEAT-US-1",
				type: "capability",
				name: "User Story 1",
				description: "No acceptance criteria here",
			},
			{
				id: "FEAT-US-2",
				type: "capability",
				name: "User Story 2",
				description:
					"**Given** I am a user\n**When** I click submit\n**Then** it works",
			},
		];
		const doc = makeDoc(nodes);

		const status = planStatus(doc, "FEAT");
		assert.deepEqual(status.spec.storiesNeedingAcceptanceCriteria, [
			"FEAT-US-1",
		]);
	});

	it("counts tasks across all change nodes", () => {
		let doc = initDocument("FEAT", "My Feature");
		doc = addTask(doc, "FEAT");
		doc = addTask(doc, "FEAT");

		// Add tasks to change nodes
		const protImpl = doc.nodes?.find((n) => n.id === "FEAT-PROT-IMPL");
		const chg1 = protImpl?.subsystem?.nodes?.find((n) => n.id === "CHG-1");
		if (chg1) {
			chg1.plan = [
				{ description: "Task 1", done: false },
				{ description: "Task 2", done: true },
			];
		}
		const chg2 = protImpl?.subsystem?.nodes?.find((n) => n.id === "CHG-2");
		if (chg2) {
			chg2.plan = [{ description: "Task 3", done: false }];
		}

		const status = planStatus(doc, "FEAT");
		assert.equal(status.tasks.total, 3);
		assert.equal(status.tasks.done, 1);
	});

	it("counts checklist lifecycle items", () => {
		const nodes: Node[] = [
			{
				id: "FEAT-CHK",
				type: "gate",
				name: "My Feature Checklist",
				lifecycle: {
					"Item 1": true,
					"Item 2": false,
					"Item 3": true,
				},
			},
		];
		const doc = makeDoc(nodes);

		const status = planStatus(doc, "FEAT");
		assert.equal(status.checklist.total, 3);
		assert.equal(status.checklist.done, 2);
	});
});

// ============================================================================
// Test planProgress
// ============================================================================

describe("planProgress", () => {
	it("no PROT-IMPL returns empty array", () => {
		const doc = makeDoc();

		const progress = planProgress(doc, "FEAT");
		assert.deepEqual(progress, []);
	});

	it("tasks with no items show 0%", () => {
		const doc = initDocument("FEAT", "My Feature");
		const updated = addTask(doc, "FEAT");

		const progress = planProgress(updated, "FEAT");
		assert.equal(progress.length, 1);
		assert.equal(progress[0].percent, 0);
		assert.equal(progress[0].done, 0);
		assert.equal(progress[0].total, 0);
	});

	it("task with 4/5 items shows 80%", () => {
		const doc = initDocument("FEAT", "My Feature");
		const updated = addTask(doc, "FEAT");

		const protImpl = updated.nodes?.find((n) => n.id === "FEAT-PROT-IMPL");
		const chg = protImpl?.subsystem?.nodes?.find((n) => n.id === "CHG-1");
		if (chg) {
			chg.plan = [
				{ description: "T1", done: true },
				{ description: "T2", done: true },
				{ description: "T3", done: true },
				{ description: "T4", done: true },
				{ description: "T5", done: false },
			];
		}

		const progress = planProgress(updated, "FEAT");
		assert.equal(progress[0].percent, 80);
		assert.equal(progress[0].done, 4);
		assert.equal(progress[0].total, 5);
	});

	it("multiple tasks returned in topological order", () => {
		let doc = initDocument("FEAT", "My Feature");
		doc = addTask(doc, "FEAT");
		doc = addTask(doc, "FEAT");
		doc = addTask(doc, "FEAT");

		const progress = planProgress(doc, "FEAT");
		assert.equal(progress.length, 3);
		assert.equal(progress[0].phase, 1);
		assert.equal(progress[1].phase, 2);
		assert.equal(progress[2].phase, 3);
	});

	it("task names are returned", () => {
		let doc = initDocument("FEAT", "My Feature");
		doc = addTask(doc, "FEAT", "Setup");
		doc = addTask(doc, "FEAT", "Build");

		const progress = planProgress(doc, "FEAT");
		assert.equal(progress[0].name, "Setup");
		assert.equal(progress[1].name, "Build");
	});
});

// ============================================================================
// Test checkGate
// ============================================================================

describe("checkGate", () => {
	it("phase 1 with no stories/FRs: ready", () => {
		const doc = initDocument("FEAT", "My Feature");

		const result = checkGate(doc, "FEAT", 1);
		assert.equal(result.ready, true);
		assert.equal(result.issues.length, 0);
	});

	it("phase 1 with user story but no change: not ready", () => {
		const nodes: Node[] = [
			{
				id: "FEAT-US-1",
				type: "capability",
				name: "User Story 1",
				description:
					"**Given** I am a user\n**When** I click\n**Then** it works",
			},
		];
		const doc = makeDoc(nodes);

		const result = checkGate(doc, "FEAT", 1);
		assert.equal(result.ready, false);
		const issue = result.issues.find((i) => i.kind === "user_story_no_change");
		assert.ok(issue);
		assert.equal((issue as any).storyId, "FEAT-US-1");
	});

	it("phase 1 with user story but no acceptance criteria: not ready", () => {
		const nodes: Node[] = [
			{
				id: "FEAT-US-1",
				type: "capability",
				name: "User Story 1",
				description: "Some description without criteria",
			},
		];
		const doc = makeDoc(nodes);

		const result = checkGate(doc, "FEAT", 1);
		assert.equal(result.ready, false);
		const issue = result.issues.find(
			(i) => i.kind === "user_story_no_acceptance_criteria",
		);
		assert.ok(issue);
	});

	it("phase 1 with FR but no change: not ready", () => {
		const nodes: Node[] = [
			{
				id: "FEAT-FR-1",
				type: "invariant",
				name: "Functional Requirement 1",
			},
		];
		const doc = makeDoc(nodes);

		const result = checkGate(doc, "FEAT", 1);
		assert.equal(result.ready, false);
		const issue = result.issues.find((i) => i.kind === "fr_no_change");
		assert.ok(issue);
		assert.equal((issue as any).frId, "FEAT-FR-1");
	});

	it("phase 1 with full user story: ready", () => {
		const nodes: Node[] = [
			{
				id: "FEAT-US-1",
				type: "capability",
				name: "User Story 1",
				description:
					"**Given** I am a user\n**When** I click submit\n**Then** it works",
			},
			{
				id: "FEAT-CHG-US1",
				type: "change",
				name: "Implement User Story 1",
			},
		];
		const relationships: Relationship[] = [
			{ from: "FEAT-CHG-US1", to: "FEAT-US-1", type: "implements" },
		];
		const doc = makeDoc(nodes, relationships);

		const result = checkGate(doc, "FEAT", 1);
		assert.equal(result.ready, true);
	});

	it("task 2 with incomplete task 1 items: not ready", () => {
		let doc = initDocument("FEAT", "My Feature");
		doc = addTask(doc, "FEAT");
		doc = addTask(doc, "FEAT");

		// Add incomplete items to task 1
		const protImpl = doc.nodes?.find((n) => n.id === "FEAT-PROT-IMPL");
		const chg1 = protImpl?.subsystem?.nodes?.find((n) => n.id === "CHG-1");
		if (chg1) {
			chg1.plan = [{ description: "T1", done: false }];
		}

		const result = checkGate(doc, "FEAT", 2);
		assert.equal(result.ready, false);
		const issue = result.issues.find(
			(i) => i.kind === "previous_tasks_incomplete",
		);
		assert.ok(issue);
		assert.equal((issue as any).phase, 1);
		assert.equal((issue as any).remaining, 1);
	});

	it("task 2 with all task 1 items done: ready (if no other issues)", () => {
		let doc = initDocument("FEAT", "My Feature");
		doc = addTask(doc, "FEAT");
		doc = addTask(doc, "FEAT");

		// Add complete items to task 1
		const protImpl = doc.nodes?.find((n) => n.id === "FEAT-PROT-IMPL");
		const chg1 = protImpl?.subsystem?.nodes?.find((n) => n.id === "CHG-1");
		if (chg1) {
			chg1.plan = [{ description: "T1", done: true }];
		}

		const result = checkGate(doc, "FEAT", 2);
		assert.equal(result.ready, true);
	});
});
