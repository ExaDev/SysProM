import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  initDocument,
  addPhase,
  planStatus,
  planProgress,
  checkGate,
  type PlanStatus,
  type PhaseProgress,
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
    nodes: nodes.length > 0 ? nodes : undefined,
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

  it("SPEC status is proposed", () => {
    const doc = initDocument("FEAT", "My Feature");
    const spec = doc.nodes?.find((n) => n.id === "FEAT-SPEC");
    assert.equal(spec?.status, "proposed");
  });

  it("CHK lifecycle is empty", () => {
    const doc = initDocument("FEAT", "My Feature");
    const chk = doc.nodes?.find((n) => n.id === "FEAT-CHK");
    assert.deepEqual(chk?.lifecycle, {});
  });
});

// ============================================================================
// Test addPhase
// ============================================================================

describe("addPhase", () => {
  it("first addPhase creates PH-1 and CHG-PH1", () => {
    const doc = initDocument("FEAT", "My Feature");
    const updated = addPhase(doc, "FEAT");

    const protImpl = updated.nodes?.find((n) => n.id === "FEAT-PROT-IMPL");
    const phaseIds = protImpl?.subsystem?.nodes?.map((n) => n.id);
    assert.deepEqual(phaseIds, ["PH-1", "CHG-PH1"]);
  });

  it("first addPhase does not create must_follow", () => {
    const doc = initDocument("FEAT", "My Feature");
    const updated = addPhase(doc, "FEAT");

    const protImpl = updated.nodes?.find((n) => n.id === "FEAT-PROT-IMPL");
    const rels = protImpl?.subsystem?.relationships;
    const mustFollow = rels?.filter((r) => r.type === "must_follow");
    assert.equal(mustFollow?.length, 0, "first phase should not have must_follow");
  });

  it("second addPhase creates PH-2 and CHG-PH2", () => {
    const doc = initDocument("FEAT", "My Feature");
    let updated = addPhase(doc, "FEAT");
    updated = addPhase(updated, "FEAT");

    const protImpl = updated.nodes?.find((n) => n.id === "FEAT-PROT-IMPL");
    const phaseIds = protImpl?.subsystem?.nodes?.map((n) => n.id).sort();
    assert.deepEqual(phaseIds, ["CHG-PH1", "CHG-PH2", "PH-1", "PH-2"]);
  });

  it("second addPhase creates PH-2 must_follow PH-1", () => {
    const doc = initDocument("FEAT", "My Feature");
    let updated = addPhase(doc, "FEAT");
    updated = addPhase(updated, "FEAT");

    const protImpl = updated.nodes?.find((n) => n.id === "FEAT-PROT-IMPL");
    const mustFollow = protImpl?.subsystem?.relationships?.filter(
      (r) => r.type === "must_follow",
    );
    assert.equal(mustFollow?.length, 1);
    assert.equal(mustFollow?.[0].from, "PH-2");
    assert.equal(mustFollow?.[0].to, "PH-1");
  });

  it("does not mutate original document", () => {
    const doc = initDocument("FEAT", "My Feature");
    const protImplBefore = doc.nodes?.find((n) => n.id === "FEAT-PROT-IMPL");
    const nodeCountBefore = protImplBefore?.subsystem?.nodes?.length;

    addPhase(doc, "FEAT");

    const protImplAfter = doc.nodes?.find((n) => n.id === "FEAT-PROT-IMPL");
    const nodeCountAfter = protImplAfter?.subsystem?.nodes?.length;

    assert.equal(nodeCountBefore, nodeCountAfter, "original doc should not change");
  });

  it("third addPhase creates PH-3 must_follow PH-2", () => {
    let doc = initDocument("FEAT", "My Feature");
    doc = addPhase(doc, "FEAT");
    doc = addPhase(doc, "FEAT");
    doc = addPhase(doc, "FEAT");

    const protImpl = doc.nodes?.find((n) => n.id === "FEAT-PROT-IMPL");
    const ph3Follow = protImpl?.subsystem?.relationships?.find(
      (r) => r.from === "PH-3" && r.type === "must_follow",
    );
    assert.equal(ph3Follow?.to, "PH-2");
  });

  it("addPhase with custom name uses that name", () => {
    const doc = initDocument("FEAT", "My Feature");
    const updated = addPhase(doc, "FEAT", "Setup");

    const protImpl = updated.nodes?.find((n) => n.id === "FEAT-PROT-IMPL");
    const stage = protImpl?.subsystem?.nodes?.find((n) => n.id === "PH-1");
    assert.equal(stage?.name, "Setup");
  });

  it("addPhase without name defaults to Phase N", () => {
    const doc = initDocument("FEAT", "My Feature");
    const updated = addPhase(doc, "FEAT");

    const protImpl = updated.nodes?.find((n) => n.id === "FEAT-PROT-IMPL");
    const stage = protImpl?.subsystem?.nodes?.find((n) => n.id === "PH-1");
    assert.equal(stage?.name, "Phase 1");
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
    const doc = initDocument("FEAT", "My Feature");
    let updated = addPhase(doc, "FEAT");
    updated = addPhase(updated, "FEAT");

    // Add tasks to phases
    const protImpl = updated.nodes?.find((n) => n.id === "FEAT-PROT-IMPL");
    const chg1 = protImpl?.subsystem?.nodes?.find((n) => n.id === "CHG-PH1");
    if (chg1) {
      chg1.plan = [
        { description: "Task 1", done: false },
        { description: "Task 2", done: true },
      ];
    }
    const chg2 = protImpl?.subsystem?.nodes?.find((n) => n.id === "CHG-PH2");
    if (chg2) {
      chg2.plan = [
        { description: "Task 3", done: false },
      ];
    }

    const status = planStatus(updated, "FEAT");
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

  it("phases with no tasks show 0%", () => {
    const doc = initDocument("FEAT", "My Feature");
    const updated = addPhase(doc, "FEAT");

    const progress = planProgress(updated, "FEAT");
    assert.equal(progress.length, 1);
    assert.equal(progress[0].percent, 0);
    assert.equal(progress[0].done, 0);
    assert.equal(progress[0].total, 0);
  });

  it("phase with 4/5 tasks shows 80%", () => {
    const doc = initDocument("FEAT", "My Feature");
    let updated = addPhase(doc, "FEAT");

    const protImpl = updated.nodes?.find((n) => n.id === "FEAT-PROT-IMPL");
    const chg = protImpl?.subsystem?.nodes?.find((n) => n.id === "CHG-PH1");
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

  it("multiple phases returned in topological order", () => {
    let doc = initDocument("FEAT", "My Feature");
    doc = addPhase(doc, "FEAT");
    doc = addPhase(doc, "FEAT");
    doc = addPhase(doc, "FEAT");

    const progress = planProgress(doc, "FEAT");
    assert.equal(progress.length, 3);
    assert.equal(progress[0].phase, 1);
    assert.equal(progress[1].phase, 2);
    assert.equal(progress[2].phase, 3);
  });

  it("phase names are returned", () => {
    let doc = initDocument("FEAT", "My Feature");
    doc = addPhase(doc, "FEAT", "Setup");
    doc = addPhase(doc, "FEAT", "Build");

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

  it("phase 2 with incomplete phase 1 tasks: not ready", () => {
    let doc = initDocument("FEAT", "My Feature");
    doc = addPhase(doc, "FEAT");
    doc = addPhase(doc, "FEAT");

    // Add incomplete tasks to phase 1
    const protImpl = doc.nodes?.find((n) => n.id === "FEAT-PROT-IMPL");
    const chg1 = protImpl?.subsystem?.nodes?.find((n) => n.id === "CHG-PH1");
    if (chg1) {
      chg1.plan = [
        { description: "T1", done: false },
      ];
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

  it("phase 2 with all phase 1 tasks done: ready (if no other issues)", () => {
    let doc = initDocument("FEAT", "My Feature");
    doc = addPhase(doc, "FEAT");
    doc = addPhase(doc, "FEAT");

    // Add complete tasks to phase 1
    const protImpl = doc.nodes?.find((n) => n.id === "FEAT-PROT-IMPL");
    const chg1 = protImpl?.subsystem?.nodes?.find((n) => n.id === "CHG-PH1");
    if (chg1) {
      chg1.plan = [
        { description: "T1", done: true },
      ];
    }

    const result = checkGate(doc, "FEAT", 2);
    assert.equal(result.ready, true);
  });
});
