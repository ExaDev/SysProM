import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
	parseConstitution,
	parseSpec,
	parsePlan,
	parseTasks,
	parseChecklist,
} from "../src/speckit/parse.js";

// ============================================================================
// Test parseConstitution
// ============================================================================

describe("parseConstitution", () => {
	const SAMPLE_CONSTITUTION = `# TestProject Constitution

## Core Principles

### Simplicity First

Keep all components simple and focused. Avoid unnecessary complexity.

### Test Everything

All code must have automated tests. No exceptions.

## Governance

Changes to principles require team consensus.

**Version**: 1.0 | **Ratified**: 2025-01-01 | **Last Amended**: 2025-06-01
`;

	it("creates a protocol node with name containing Constitution", () => {
		const result = parseConstitution(SAMPLE_CONSTITUTION, "TEST");
		const protocolNode = result.nodes.find((n) => n.type === "protocol");
		assert(protocolNode, "protocol node should exist");
		assert.match(
			protocolNode.name,
			/Constitution/i,
			"protocol name should contain Constitution",
		);
	});

	it("creates invariant nodes for each principle", () => {
		const result = parseConstitution(SAMPLE_CONSTITUTION, "TEST");
		const invariants = result.nodes.filter((n) => n.type === "invariant");
		assert.equal(invariants.length, 2, "should have 2 invariant nodes");

		const names = invariants.map((n) => n.name);
		assert(
			names.some((n) => n.includes("Simplicity First")),
			"should have Simplicity First invariant",
		);
		assert(
			names.some((n) => n.includes("Test Everything")),
			"should have Test Everything invariant",
		);
	});

	it("creates a policy node for Governance", () => {
		const result = parseConstitution(SAMPLE_CONSTITUTION, "TEST");
		const policyNode = result.nodes.find(
			(n) => n.type === "policy" && n.name === "Governance",
		);
		assert(policyNode, "governance policy node should exist");
	});

	it("invariant nodes have part_of relationship to protocol", () => {
		const result = parseConstitution(SAMPLE_CONSTITUTION, "TEST");
		const invariants = result.nodes.filter((n) => n.type === "invariant");
		const protocolId = result.nodes.find((n) => n.type === "protocol")?.id;

		for (const inv of invariants) {
			const rel = result.relationships.find(
				(r) => r.from === inv.id && r.to === protocolId && r.type === "part_of",
			);
			assert(
				rel,
				`invariant ${inv.id} should have part_of relationship to protocol`,
			);
		}
	});

	it("correct number of nodes created", () => {
		const result = parseConstitution(SAMPLE_CONSTITUTION, "TEST");
		// 1 protocol + 2 invariants + 1 policy = 4
		assert.equal(result.nodes.length, 4, "should have 4 nodes total");
	});

	it("correct number of relationships", () => {
		const result = parseConstitution(SAMPLE_CONSTITUTION, "TEST");
		// 2 part_of for invariants + 1 part_of for policy = 3
		assert.equal(result.relationships.length, 3, "should have 3 relationships");
	});

	it("all relationships are part_of type", () => {
		const result = parseConstitution(SAMPLE_CONSTITUTION, "TEST");
		const allPartOf = result.relationships.every((r) => r.type === "part_of");
		assert(allPartOf, "all relationships should be part_of type");
	});
});

// ============================================================================
// Test parseSpec
// ============================================================================

describe("parseSpec", () => {
	const SAMPLE_SPEC = `# Feature Specification: User Authentication

**Feature Branch**: \`001-user-auth\`
**Created**: 2025-01-15
**Status**: Draft

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Login with Email (Priority: P1)

Users can log in using their email and password.

**Why this priority**: Core authentication is the foundation.

**Independent Test**: Can test by submitting credentials and verifying session creation.

**Acceptance Scenarios**:

1. **Given** a registered user, **When** they enter valid credentials, **Then** they receive a session token
2. **Given** a registered user, **When** they enter wrong password, **Then** they see an error message

---

### User Story 2 - Password Reset (Priority: P2)

Users can reset their password via email link.

**Why this priority**: Important for account recovery.

**Independent Test**: Can test by requesting reset and clicking link.

**Acceptance Scenarios**:

1. **Given** a registered user, **When** they request reset, **Then** they receive an email

### Edge Cases

- What happens when email doesn't exist?
- How does system handle expired tokens?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST authenticate users via email and password
- **FR-002**: System MUST hash passwords before storage
- **FR-003**: System MUST support password reset [NEEDS CLARIFICATION: reset method]

### Key Entities *(include if feature involves data)*

- **User**: Represents an authenticated user with email, password hash, and session data
- **Session**: Active authentication session with expiry

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can complete login in under 3 seconds
- **SC-002**: 99.9% uptime for authentication service
`;

	it("creates an artefact node for the spec", () => {
		const result = parseSpec(SAMPLE_SPEC, "TEST");
		const specNode = result.nodes.find((n) => n.type === "artefact");
		assert(specNode, "spec artefact node should exist");
		assert.match(
			specNode.name,
			/User Authentication/,
			"spec name should match feature name",
		);
	});

	it("spec artefact has proposed lifecycle state (mapped from Draft)", () => {
		const result = parseSpec(SAMPLE_SPEC, "TEST");
		const specNode = result.nodes.find((n) => n.type === "artefact");
		assert.equal(
			specNode?.lifecycle?.proposed,
			true,
			"spec lifecycle should include proposed",
		);
	});

	it("creates 2 capability nodes for user stories", () => {
		const result = parseSpec(SAMPLE_SPEC, "TEST");
		const capabilities = result.nodes.filter((n) => n.type === "capability");
		assert.equal(
			capabilities.length,
			2,
			"should have 2 capability nodes for user stories",
		);
	});

	it("user story 1 has priority info in name or description", () => {
		const result = parseSpec(SAMPLE_SPEC, "TEST");
		const capability = result.nodes.find(
			(n) => n.type === "capability" && n.name.includes("Login with Email"),
		);
		assert(capability, "should find Login with Email capability");

		const content = [capability.name, capability.description]
			.join(" ")
			.toUpperCase();
		assert.match(content, /P1/, "user story should contain priority P1");
	});

	it("creates 3 invariant nodes for functional requirements", () => {
		const result = parseSpec(SAMPLE_SPEC, "TEST");
		const frNodes = result.nodes.filter(
			(n) => n.type === "invariant" && n.id.includes("FR-"),
		);
		assert.equal(frNodes.length, 3, "should have 3 FR invariant nodes");
	});

	it("FR-003 has proposed lifecycle state (NEEDS CLARIFICATION)", () => {
		const result = parseSpec(SAMPLE_SPEC, "TEST");
		const fr003 = result.nodes.find(
			(n) => n.type === "invariant" && n.name === "FR-3",
		);
		assert(fr003, "FR-003 should exist");
		assert.equal(
			fr003.lifecycle?.proposed,
			true,
			"FR-003 should have proposed lifecycle state due to NEEDS CLARIFICATION",
		);
	});

	it("creates 2 invariant nodes for success criteria", () => {
		const result = parseSpec(SAMPLE_SPEC, "TEST");
		const scNodes = result.nodes.filter(
			(n) => n.type === "invariant" && n.id.includes("SC-"),
		);
		assert.equal(scNodes.length, 2, "should have 2 SC invariant nodes");
	});

	it("creates 2 concept nodes for key entities", () => {
		const result = parseSpec(SAMPLE_SPEC, "TEST");
		const concepts = result.nodes.filter((n) => n.type === "concept");
		assert.equal(
			concepts.length,
			2,
			"should have 2 concept nodes for entities",
		);

		const names = concepts.map((n) => n.name);
		assert(names.includes("User"), "should have User entity concept");
		assert(names.includes("Session"), "should have Session entity concept");
	});

	it("capabilities have refines relationship to spec artefact", () => {
		const result = parseSpec(SAMPLE_SPEC, "TEST");
		const capabilities = result.nodes.filter((n) => n.type === "capability");
		const specId = result.nodes.find((n) => n.type === "artefact")?.id;

		for (const cap of capabilities) {
			const rel = result.relationships.find(
				(r) => r.from === cap.id && r.to === specId && r.type === "refines",
			);
			assert(
				rel,
				`capability ${cap.id} should have refines relationship to spec`,
			);
		}
	});

	it("requirements have constrained_by relationship to spec artefact", () => {
		const result = parseSpec(SAMPLE_SPEC, "TEST");
		const requirements = result.nodes.filter(
			(n) =>
				n.type === "invariant" &&
				(n.id.includes("FR-") || n.id.includes("SC-")),
		);
		const specId = result.nodes.find((n) => n.type === "artefact")?.id;

		for (const req of requirements) {
			const rel = result.relationships.find(
				(r) =>
					r.from === req.id && r.to === specId && r.type === "constrained_by",
			);
			assert(
				rel,
				`requirement ${req.id} should have constrained_by relationship to spec`,
			);
		}
	});

	it("handles missing status field with Draft default lifecycle state", () => {
		const specNoStatus = `# Feature Specification: Test Feature

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Test Story (Priority: P1)

Test story description.

**Independent Test**: Test description.

## Requirements *(mandatory)*

### Functional Requirements

## Success Criteria *(mandatory)*

### Measurable Outcomes
`;

		const result = parseSpec(specNoStatus, "TEST");
		const specNode = result.nodes.find((n) => n.type === "artefact");
		assert.equal(
			specNode?.lifecycle?.proposed,
			true,
			"missing status should default to proposed lifecycle state",
		);
	});
});

// ============================================================================
// Test parsePlan
// ============================================================================

describe("parsePlan", () => {
	const SAMPLE_PLAN = `# Implementation Plan: User Authentication

**Branch**: \`001-user-auth\`
**Date**: 2025-01-16
**Spec**: spec.md

## Summary

Implement email-based authentication with session management.

## Technical Context

- Language: TypeScript
- Framework: Express
- Database: PostgreSQL
- Testing: Jest

## Constitution Check

All principles verified. Simplicity maintained.

## Project Structure

src/
auth/
  login.ts
  reset.ts
models/
  user.ts
`;

	it("creates a plan artefact node", () => {
		const result = parsePlan(SAMPLE_PLAN, "TEST");
		const planNode = result.nodes.find((n) => n.type === "artefact");
		assert(planNode, "plan artefact node should exist");
		assert.match(
			planNode.name,
			/User Authentication/,
			"plan name should contain feature name",
		);
	});

	it("creates an element node for technical context", () => {
		const result = parsePlan(SAMPLE_PLAN, "TEST");
		const techNode = result.nodes.find(
			(n) => n.type === "element" && n.name === "Technical Context",
		);
		assert(techNode, "technical context element node should exist");
		assert(techNode.description, "technical context should have description");
	});

	it("creates a gate node for constitution check", () => {
		const result = parsePlan(SAMPLE_PLAN, "TEST");
		const gateNode = result.nodes.find(
			(n) => n.type === "gate" && n.name === "Constitution Check",
		);
		assert(gateNode, "constitution check gate node should exist");
	});

	it("creates an element node for project structure", () => {
		const result = parsePlan(SAMPLE_PLAN, "TEST");
		const structNode = result.nodes.find(
			(n) => n.type === "element" && n.name === "Project Structure",
		);
		assert(structNode, "project structure element node should exist");
	});

	it("plan has depends_on relationship to spec", () => {
		const result = parsePlan(SAMPLE_PLAN, "TEST");
		const planNode = result.nodes.find((n) => n.type === "artefact");
		const dependsRel = result.relationships.find(
			(r) => r.from === planNode?.id && r.type === "depends_on",
		);
		assert(dependsRel, "plan should have depends_on relationship to spec");
		assert.match(dependsRel.to, /SPEC/, "depends_on should target spec node");
	});

	it("gate has governed_by relationship to constitution protocol", () => {
		const result = parsePlan(SAMPLE_PLAN, "TEST");
		const gateNode = result.nodes.find((n) => n.type === "gate");
		const govRel = result.relationships.find(
			(r) => r.from === gateNode?.id && r.type === "governed_by",
		);
		assert(govRel, "gate should have governed_by relationship to protocol");
		assert.match(
			govRel.to,
			/CONST/,
			"governed_by should target constitution protocol",
		);
	});
});

// ============================================================================
// Test parseTasks
// ============================================================================

describe("parseTasks", () => {
	const SAMPLE_TASKS = `# Task List: User Authentication

## Phase 1: Setup

- [ ] T001 Create project structure
- [ ] T002 Initialize TypeScript project
- [x] T003 [P] Configure linting

## Phase 2: Core Auth (P1)

- [ ] T004 [US1] Create User model
- [ ] T005 [US1] Implement login endpoint (depends on T004)
- [x] T006 [P] [US1] Write login tests

## Phase 3: Password Reset (P2)

- [ ] T007 [US2] Implement reset flow
- [ ] T008 [US2] Write reset tests
`;

	it("creates a protocol node for implementation", () => {
		const result = parseTasks(SAMPLE_TASKS, "TEST");
		const protocolNode = result.nodes.find((n) => n.type === "protocol");
		assert(protocolNode, "implementation protocol node should exist");
	});

	it("creates phase change nodes (CHG-1, CHG-2, CHG-3)", () => {
		const result = parseTasks(SAMPLE_TASKS, "TEST");
		const protocolNode = result.nodes.find((n) => n.id === "TEST-PROT-IMPL");
		assert.ok(protocolNode?.subsystem, "protocol should have subsystem");
		const changes = protocolNode.subsystem?.nodes?.filter(
			(n) => n.type === "change" && /^CHG-\d+$/.test(n.id),
		);
		assert.equal(changes?.length, 3, "should have 3 phase-level change nodes");
	});

	it("phase change nodes have must_follow relationships in order", () => {
		const result = parseTasks(SAMPLE_TASKS, "TEST");
		const protocolNode = result.nodes.find((n) => n.id === "TEST-PROT-IMPL");
		assert.ok(protocolNode?.subsystem, "protocol should have subsystem");
		const changes = protocolNode.subsystem?.nodes?.filter(
			(n) => n.type === "change" && /^CHG-\d+$/.test(n.id),
		);
		const subsystemRels = protocolNode.subsystem?.relationships ?? [];

		const sortedChanges = (changes ?? []).sort((a, b) => {
			const aNum = parseInt(a.id.split("-").pop() || "0");
			const bNum = parseInt(b.id.split("-").pop() || "0");
			return aNum - bNum;
		});

		// Check that consecutive phase changes have must_follow relationships
		for (let i = 1; i < sortedChanges.length; i++) {
			const change = sortedChanges[i];
			const prevChange = sortedChanges[i - 1];
			const mustFollowRel = subsystemRels.find(
				(r) =>
					r.from === change.id &&
					r.to === prevChange.id &&
					r.type === "must_follow",
			);
			assert(
				mustFollowRel,
				`change ${change.id} should have must_follow relationship to previous change`,
			);
		}
	});

	it("creates nested task nodes with lifecycle states", () => {
		const result = parseTasks(SAMPLE_TASKS, "TEST");
		const protocolNode = result.nodes.find((n) => n.id === "TEST-PROT-IMPL");
		assert.ok(protocolNode?.subsystem, "protocol should have subsystem");
		const changeNodes = protocolNode.subsystem?.nodes?.filter(
			(n) => n.type === "change",
		);
		assert(
			(changeNodes?.length ?? 0) > 0,
			"should have change nodes for tasks",
		);

		for (const change of changeNodes ?? []) {
			const tasks = change.subsystem?.nodes?.filter((n) => n.type === "change");
			assert(tasks, `change ${change.id} should have nested task nodes`);
			for (const task of tasks) {
				assert(
					task.lifecycle?.complete === true ||
						task.lifecycle?.proposed === true,
					"each task should have lifecycle state",
				);
				assert(task.name, "each task should have name");
			}
		}
	});

	it("T003 and T006 are marked complete in nested tasks", () => {
		const result = parseTasks(SAMPLE_TASKS, "TEST");
		const protocolNode = result.nodes.find((n) => n.id === "TEST-PROT-IMPL");
		assert.ok(protocolNode?.subsystem, "protocol should have subsystem");
		const changeNodes = protocolNode.subsystem?.nodes?.filter(
			(n) => n.type === "change",
		);

		let foundCompleted = false;
		for (const change of changeNodes ?? []) {
			const tasks =
				change.subsystem?.nodes?.filter((n) => n.type === "change") ?? [];
			for (const task of tasks) {
				const desc = task.name;
				if (
					(desc.includes("T003") ||
						desc.includes("Configure linting") ||
						desc.includes("T006") ||
						desc.includes("Write login tests")) &&
					task.lifecycle?.complete === true
				) {
					foundCompleted = true;
				}
			}
		}

		assert(foundCompleted, "completed tasks should be marked complete");
	});

	it("total task count matches", () => {
		const result = parseTasks(SAMPLE_TASKS, "TEST");
		const protocolNode = result.nodes.find((n) => n.id === "TEST-PROT-IMPL");
		assert.ok(protocolNode?.subsystem, "protocol should have subsystem");
		const changeNodes = protocolNode.subsystem?.nodes?.filter(
			(n) => n.type === "change",
		);

		let totalTasks = 0;
		for (const change of changeNodes ?? []) {
			totalTasks +=
				change.subsystem?.nodes?.filter((n) => n.type === "change").length ?? 0;
		}

		// 8 tasks total: T001-T008
		assert.equal(totalTasks, 8, "should have 8 total tasks");
	});
});

// ============================================================================
// Test parseChecklist
// ============================================================================

describe("parseChecklist", () => {
	const SAMPLE_CHECKLIST = `# Review Checklist: User Authentication

**Purpose**: Pre-launch review
**Created**: 2025-01-20

## Security

- [x] CHK001 Input validation on all endpoints
- [ ] CHK002 Rate limiting configured

## Testing

- [x] CHK003 Unit tests pass
- [x] CHK004 Integration tests pass
- [ ] CHK005 Load testing completed
`;

	it("creates a gate node", () => {
		const result = parseChecklist(SAMPLE_CHECKLIST, "TEST");
		const gateNode = result.nodes.find((n) => n.type === "gate");
		assert(gateNode, "checklist gate node should exist");
		assert.match(
			gateNode.name,
			/Review Checklist/,
			"gate name should match checklist title",
		);
	});

	it("lifecycle map has correct checked/unchecked states", () => {
		const result = parseChecklist(SAMPLE_CHECKLIST, "TEST");
		const gateNode = result.nodes.find((n) => n.type === "gate");
		assert(gateNode?.lifecycle, "gate should have lifecycle map");
		assert(
			Object.keys(gateNode.lifecycle).length > 0,
			"lifecycle should have entries",
		);
	});

	it("CHK001 is true (checked)", () => {
		const result = parseChecklist(SAMPLE_CHECKLIST, "TEST");
		const gateNode = result.nodes.find((n) => n.type === "gate");
		assert.equal(gateNode?.lifecycle?.CHK001, true, "CHK001 should be checked");
	});

	it("CHK002 is false (unchecked)", () => {
		const result = parseChecklist(SAMPLE_CHECKLIST, "TEST");
		const gateNode = result.nodes.find((n) => n.type === "gate");
		assert.equal(
			gateNode?.lifecycle?.CHK002,
			false,
			"CHK002 should be unchecked",
		);
	});

	it("CHK003 and CHK004 are true (checked)", () => {
		const result = parseChecklist(SAMPLE_CHECKLIST, "TEST");
		const gateNode = result.nodes.find((n) => n.type === "gate");
		assert.equal(gateNode?.lifecycle?.CHK003, true, "CHK003 should be checked");
		assert.equal(gateNode?.lifecycle?.CHK004, true, "CHK004 should be checked");
	});

	it("CHK005 is false (unchecked)", () => {
		const result = parseChecklist(SAMPLE_CHECKLIST, "TEST");
		const gateNode = result.nodes.find((n) => n.type === "gate");
		assert.equal(
			gateNode?.lifecycle?.CHK005,
			false,
			"CHK005 should be unchecked",
		);
	});

	it("includes purpose in description", () => {
		const result = parseChecklist(SAMPLE_CHECKLIST, "TEST");
		const gateNode = result.nodes.find((n) => n.type === "gate");
		assert.equal(
			gateNode?.context,
			"2025-01-20",
			"context should contain created date",
		);
	});
});
