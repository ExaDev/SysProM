import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
	generateConstitution,
	generateSpec,
	generatePlan,
	generateTasks,
	generateChecklist,
} from "../src/speckit/generate.js";
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
// Test generateConstitution
// ============================================================================

describe("generateConstitution", () => {
	it("output contains # TestProject Constitution", () => {
		const nodes: Node[] = [
			{
				id: "TEST-CONST",
				type: "protocol",
				name: "TestProject Constitution",
			},
		];
		const doc = makeDoc(nodes);

		const output = generateConstitution(doc, "TEST");
		assert.match(
			output,
			/# TestProject Constitution/,
			"output should contain constitution heading",
		);
	});

	it("output contains ## Core Principles", () => {
		const nodes: Node[] = [
			{
				id: "TEST-CONST",
				type: "protocol",
				name: "TestProject Constitution",
			},
			{
				id: "TEST-INV-1",
				type: "invariant",
				name: "Simplicity First",
				description: "Keep all components simple and focused.",
			},
		];
		const relationships: Relationship[] = [
			{
				from: "TEST-INV-1",
				to: "TEST-CONST",
				type: "part_of",
			},
		];
		const doc = makeDoc(nodes, relationships);

		const output = generateConstitution(doc, "TEST");
		assert.match(
			output,
			/## Core Principles/,
			"output should contain Core Principles section",
		);
	});

	it("output contains ### for each principle name", () => {
		const nodes: Node[] = [
			{
				id: "TEST-CONST",
				type: "protocol",
				name: "TestProject Constitution",
			},
			{
				id: "TEST-INV-1",
				type: "invariant",
				name: "Simplicity First",
				description: "Keep all components simple and focused.",
			},
			{
				id: "TEST-INV-2",
				type: "invariant",
				name: "Test Everything",
				description: "All code must have automated tests.",
			},
		];
		const relationships: Relationship[] = [
			{
				from: "TEST-INV-1",
				to: "TEST-CONST",
				type: "part_of",
			},
			{
				from: "TEST-INV-2",
				to: "TEST-CONST",
				type: "part_of",
			},
		];
		const doc = makeDoc(nodes, relationships);

		const output = generateConstitution(doc, "TEST");
		assert.match(
			output,
			/### Simplicity First/,
			"output should contain Simplicity First principle",
		);
		assert.match(
			output,
			/### Test Everything/,
			"output should contain Test Everything principle",
		);
	});

	it("output contains principle descriptions", () => {
		const nodes: Node[] = [
			{
				id: "TEST-CONST",
				type: "protocol",
				name: "TestProject Constitution",
			},
			{
				id: "TEST-INV-1",
				type: "invariant",
				name: "Simplicity First",
				description:
					"Keep all components simple and focused. Avoid unnecessary complexity.",
			},
		];
		const relationships: Relationship[] = [
			{
				from: "TEST-INV-1",
				to: "TEST-CONST",
				type: "part_of",
			},
		];
		const doc = makeDoc(nodes, relationships);

		const output = generateConstitution(doc, "TEST");
		assert.match(
			output,
			/Keep all components simple/,
			"output should contain principle description",
		);
	});

	it("output contains ## Governance", () => {
		const nodes: Node[] = [
			{
				id: "TEST-CONST",
				type: "protocol",
				name: "TestProject Constitution",
			},
			{
				id: "TEST-POL-GOV",
				type: "policy",
				name: "Governance",
				description: "Changes to principles require team consensus.",
			},
		];
		const relationships: Relationship[] = [
			{
				from: "TEST-POL-GOV",
				to: "TEST-CONST",
				type: "part_of",
			},
		];
		const doc = makeDoc(nodes, relationships);

		const output = generateConstitution(doc, "TEST");
		assert.match(
			output,
			/## Governance/,
			"output should contain Governance section",
		);
	});

	it("returns empty string when protocol not found", () => {
		const doc = makeDoc([]);
		const output = generateConstitution(doc, "TEST");
		assert.equal(
			output,
			"",
			"should return empty string when protocol not found",
		);
	});
});

// ============================================================================
// Test generateSpec
// ============================================================================

describe("generateSpec", () => {
	it("output contains # Feature Specification: User Authentication", () => {
		const nodes: Node[] = [
			{
				id: "TEST-SPEC",
				type: "artefact",
				name: "User Authentication",
				lifecycle: { proposed: true },
			},
		];
		const doc = makeDoc(nodes);

		const output = generateSpec(doc, "TEST");
		assert.match(
			output,
			/# Feature Specification: User Authentication/,
			"output should contain feature specification heading",
		);
	});

	it("output contains **Status**: Draft (proposed → Draft)", () => {
		const nodes: Node[] = [
			{
				id: "TEST-SPEC",
				type: "artefact",
				name: "User Authentication",
				lifecycle: { proposed: true },
			},
		];
		const doc = makeDoc(nodes);

		const output = generateSpec(doc, "TEST");
		assert.match(
			output,
			/\*\*Status\*\*:\s*Draft/,
			"output should contain Status: Draft",
		);
	});

	it("output contains ### User Story for each capability", () => {
		const nodes: Node[] = [
			{
				id: "TEST-SPEC",
				type: "artefact",
				name: "User Authentication",
				lifecycle: { proposed: true },
			},
			{
				id: "TEST-US-1",
				type: "capability",
				name: "Login with Email",
				description: [
					"Priority: P1",
					"Acceptance Scenarios:",
					"1. Test scenario",
				],
				context: "Can test by submitting credentials",
			},
			{
				id: "TEST-US-2",
				type: "capability",
				name: "Password Reset",
				description: ["Priority: P2"],
				context: "Can test by requesting reset",
			},
		];
		const relationships: Relationship[] = [
			{
				from: "TEST-US-1",
				to: "TEST-SPEC",
				type: "refines",
			},
			{
				from: "TEST-US-2",
				to: "TEST-SPEC",
				type: "refines",
			},
		];
		const doc = makeDoc(nodes, relationships);

		const output = generateSpec(doc, "TEST");
		assert.match(
			output,
			/### User Story/,
			"output should contain User Story heading",
		);
	});

	it("output contains **FR- for requirements", () => {
		const nodes: Node[] = [
			{
				id: "TEST-SPEC",
				type: "artefact",
				name: "User Authentication",
				lifecycle: { proposed: true },
			},
			{
				id: "TEST-FR-1",
				type: "invariant",
				name: "FR-1",
				description: "System MUST authenticate users via email and password",
				lifecycle: { active: true },
			},
			{
				id: "TEST-FR-2",
				type: "invariant",
				name: "FR-2",
				description: "System MUST hash passwords before storage",
				lifecycle: { active: true },
			},
		];
		const relationships: Relationship[] = [
			{
				from: "TEST-FR-1",
				to: "TEST-SPEC",
				type: "constrained_by",
			},
			{
				from: "TEST-FR-2",
				to: "TEST-SPEC",
				type: "constrained_by",
			},
		];
		const doc = makeDoc(nodes, relationships);

		const output = generateSpec(doc, "TEST");
		assert.match(
			output,
			/\*\*TEST-FR-/,
			"output should contain FR requirement identifiers",
		);
	});

	it("output contains **SC- for success criteria", () => {
		const nodes: Node[] = [
			{
				id: "TEST-SPEC",
				type: "artefact",
				name: "User Authentication",
				lifecycle: { proposed: true },
			},
			{
				id: "TEST-SC-1",
				type: "invariant",
				name: "SC-1",
				description: "Users can complete login in under 3 seconds",
				lifecycle: { active: true },
			},
		];
		const relationships: Relationship[] = [
			{
				from: "TEST-SC-1",
				to: "TEST-SPEC",
				type: "constrained_by",
			},
		];
		const doc = makeDoc(nodes, relationships);

		const output = generateSpec(doc, "TEST");
		assert.match(
			output,
			/\*\*TEST-SC-/,
			"output should contain SC success criteria identifiers",
		);
	});

	it("output contains [NEEDS CLARIFICATION] for proposed FR", () => {
		const nodes: Node[] = [
			{
				id: "TEST-SPEC",
				type: "artefact",
				name: "User Authentication",
				lifecycle: { proposed: true },
			},
			{
				id: "TEST-FR-1",
				type: "invariant",
				name: "FR-1",
				description: "System MUST support password reset",
				lifecycle: { proposed: true },
			},
		];
		const relationships: Relationship[] = [
			{
				from: "TEST-FR-1",
				to: "TEST-SPEC",
				type: "constrained_by",
			},
		];
		const doc = makeDoc(nodes, relationships);

		const output = generateSpec(doc, "TEST");
		assert.match(
			output,
			/\[NEEDS CLARIFICATION\]/,
			"output should contain [NEEDS CLARIFICATION] for proposed FR",
		);
	});

	it("returns empty string when spec not found", () => {
		const doc = makeDoc([]);
		const output = generateSpec(doc, "TEST");
		assert.equal(output, "", "should return empty string when spec not found");
	});
});

// ============================================================================
// Test generatePlan
// ============================================================================

describe("generatePlan", () => {
	it("output contains # Implementation Plan: User Authentication", () => {
		const nodes: Node[] = [
			{
				id: "TEST-PROT-IMPL",
				type: "protocol",
				name: "User Authentication",
			},
		];
		const doc = makeDoc(nodes);

		const output = generatePlan(doc, "TEST");
		assert.match(
			output,
			/# Implementation Plan: User Authentication/,
			"output should contain implementation plan heading",
		);
	});

	it("output contains ## Summary section", () => {
		const nodes: Node[] = [
			{
				id: "TEST-PROT-IMPL",
				type: "protocol",
				name: "User Authentication",
				description:
					"Implement email-based authentication with session management.",
			},
		];
		const doc = makeDoc(nodes);

		const output = generatePlan(doc, "TEST");
		assert.match(output, /## Summary/, "output should contain Summary section");
	});

	it("output contains ## Technical Context section", () => {
		const nodes: Node[] = [
			{
				id: "TEST-PROT-IMPL",
				type: "protocol",
				name: "User Authentication",
			},
		];
		const doc = makeDoc(nodes);

		const output = generatePlan(doc, "TEST");
		assert.match(
			output,
			/## Technical Context/,
			"output should contain Technical Context section",
		);
	});

	it("output contains ## Constitution Check section", () => {
		const nodes: Node[] = [
			{
				id: "TEST-PROT-IMPL",
				type: "protocol",
				name: "User Authentication",
			},
		];
		const doc = makeDoc(nodes);

		const output = generatePlan(doc, "TEST");
		assert.match(
			output,
			/## Constitution Check/,
			"output should contain Constitution Check section",
		);
	});

	it("output contains ## Project Structure section", () => {
		const nodes: Node[] = [
			{
				id: "TEST-PROT-IMPL",
				type: "protocol",
				name: "User Authentication",
			},
		];
		const doc = makeDoc(nodes);

		const output = generatePlan(doc, "TEST");
		assert.match(
			output,
			/## Project Structure/,
			"output should contain Project Structure section",
		);
	});

	it("returns empty string when protocol not found", () => {
		const doc = makeDoc([]);
		const output = generatePlan(doc, "TEST");
		assert.equal(
			output,
			"",
			"should return empty string when protocol not found",
		);
	});
});

// ============================================================================
// Test generateTasks
// ============================================================================

describe("generateTasks", () => {
	it("output contains ## Phase 1 and ## Phase 2", () => {
		const nodes: Node[] = [
			{
				id: "TEST-PROT-IMPL",
				type: "protocol",
				name: "Implementation Protocol",
				subsystem: {
					nodes: [
						{
							id: "CHG-1",
							type: "change",
							name: "Setup",
							subsystem: {
								nodes: [
									{
										id: "CHG-1-1",
										type: "change",
										name: "Create project structure",
										lifecycle: { proposed: true },
									},
								],
								relationships: [],
							},
						},
						{
							id: "CHG-2",
							type: "change",
							name: "Core Auth",
							subsystem: {
								nodes: [
									{
										id: "CHG-2-1",
										type: "change",
										name: "Create User model",
										lifecycle: { proposed: true },
									},
								],
								relationships: [],
							},
						},
					],
					relationships: [
						{
							from: "CHG-2",
							to: "CHG-1",
							type: "must_follow",
						},
					],
				},
			},
		];
		const doc = makeDoc(nodes);

		const output = generateTasks(doc, "TEST");
		assert.match(output, /## Phase 1/, "output should contain Phase 1");
		assert.match(output, /## Phase 2/, "output should contain Phase 2");
	});

	it("output contains - [ ] for incomplete tasks", () => {
		const nodes: Node[] = [
			{
				id: "TEST-PROT-IMPL",
				type: "protocol",
				name: "Implementation Protocol",
				subsystem: {
					nodes: [
						{
							id: "CHG-1",
							type: "change",
							name: "Tasks",
							subsystem: {
								nodes: [
									{
										id: "CHG-1-1",
										type: "change",
										name: "Incomplete task",
										lifecycle: { proposed: true },
									},
								],
								relationships: [],
							},
						},
					],
					relationships: [],
				},
			},
		];
		const doc = makeDoc(nodes);

		const output = generateTasks(doc, "TEST");
		assert.match(output, /- \[ \]/, "output should contain unchecked checkbox");
	});

	it("output contains - [x] for completed tasks", () => {
		const nodes: Node[] = [
			{
				id: "TEST-PROT-IMPL",
				type: "protocol",
				name: "Implementation Protocol",
				subsystem: {
					nodes: [
						{
							id: "CHG-1",
							type: "change",
							name: "Tasks",
							subsystem: {
								nodes: [
									{
										id: "CHG-1-1",
										type: "change",
										name: "Completed task",
										lifecycle: { complete: true },
									},
								],
								relationships: [],
							},
						},
					],
					relationships: [],
				},
			},
		];
		const doc = makeDoc(nodes);

		const output = generateTasks(doc, "TEST");
		assert.match(output, /- \[x\]/, "output should contain checked checkbox");
	});

	it("output contains task descriptions", () => {
		const nodes: Node[] = [
			{
				id: "TEST-PROT-IMPL",
				type: "protocol",
				name: "Implementation Protocol",
				subsystem: {
					nodes: [
						{
							id: "CHG-1",
							type: "change",
							name: "Tasks",
							subsystem: {
								nodes: [
									{
										id: "CHG-1-1",
										type: "change",
										name: "Create project structure",
										lifecycle: { proposed: true },
									},
								],
								relationships: [],
							},
						},
					],
					relationships: [],
				},
			},
		];
		const doc = makeDoc(nodes);

		const output = generateTasks(doc, "TEST");
		assert.match(
			output,
			/Create project structure/,
			"output should contain task description",
		);
	});

	it("returns empty string when protocol not found", () => {
		const doc = makeDoc([]);
		const output = generateTasks(doc, "TEST");
		assert.equal(
			output,
			"",
			"should return empty string when protocol not found",
		);
	});
});

// ============================================================================
// Test generateChecklist
// ============================================================================

describe("generateChecklist", () => {
	it("creates checklist output with title from gate node", () => {
		const nodes: Node[] = [
			{
				id: "TEST-CHK",
				type: "gate",
				name: "Review Checklist: User Authentication",
				description: "Pre-launch review",
				lifecycle: {
					CHK001: true,
					CHK002: false,
				},
			},
		];
		const doc = makeDoc(nodes);

		const output = generateChecklist(doc, "TEST");
		assert.match(
			output,
			/# Checklist: Review Checklist: User Authentication/,
			"output should contain checklist heading",
		);
	});

	it("output includes Purpose and Created metadata", () => {
		const nodes: Node[] = [
			{
				id: "TEST-CHK",
				type: "gate",
				name: "Review Checklist",
				description: "Pre-launch review",
				context: "2025-01-20",
				lifecycle: {},
			},
		];
		const doc = makeDoc(nodes);

		const output = generateChecklist(doc, "TEST");
		assert.match(
			output,
			/\*\*Purpose\*\*:/,
			"output should contain Purpose field",
		);
		assert.match(
			output,
			/\*\*Created\*\*:/,
			"output should contain Created field",
		);
	});

	it("output contains checklist items with correct checkbox states", () => {
		const nodes: Node[] = [
			{
				id: "TEST-CHK",
				type: "gate",
				name: "Review Checklist",
				description: "Pre-launch review",
				lifecycle: {
					"Input validation": true,
					"Rate limiting": false,
					"Unit tests": true,
				},
			},
		];
		const doc = makeDoc(nodes);

		const output = generateChecklist(doc, "TEST");
		assert.match(
			output,
			/- \[x\].*Input validation/,
			"output should contain checked item",
		);
		assert.match(
			output,
			/- \[ \].*Rate limiting/,
			"output should contain unchecked item",
		);
	});

	it("returns empty string when gate not found", () => {
		const doc = makeDoc([]);
		const output = generateChecklist(doc, "TEST");
		assert.equal(output, "", "should return empty string when gate not found");
	});
});
