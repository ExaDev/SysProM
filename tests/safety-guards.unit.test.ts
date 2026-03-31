import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { addRelationshipOp, validateOp } from "../src/index.js";
import type { SysProMDocument } from "../src/schema.js";

describe("CHG33: Graph Mutation Safety Guards", () => {
	describe("Duplicate relationship detection", () => {
		it("rejects duplicate relationship in addRelationship", () => {
			const doc: SysProMDocument = {
				nodes: [
					{ id: "INT1", type: "intent", name: "A" },
					{ id: "INT2", type: "intent", name: "B" },
				],
				relationships: [{ from: "INT1", to: "INT2", type: "refines" }],
			};
			assert.throws(
				() =>
					addRelationshipOp({
						doc,
						rel: { from: "INT1", to: "INT2", type: "refines" },
					}),
				/duplicate|already exists/i,
			);
		});

		it("allows same from/to with different type", () => {
			const doc: SysProMDocument = {
				nodes: [
					{ id: "INT1", type: "intent", name: "A" },
					{ id: "INT2", type: "intent", name: "B" },
				],
				relationships: [{ from: "INT1", to: "INT2", type: "refines" }],
			};
			const newDoc = addRelationshipOp({
				doc,
				rel: { from: "INT1", to: "INT2", type: "depends_on" },
			});
			assert.equal(newDoc.relationships?.length, 2);
		});

		it("flags duplicate relationship in validate", () => {
			const doc: SysProMDocument = {
				nodes: [
					{ id: "INT1", type: "intent", name: "A" },
					{ id: "INT2", type: "intent", name: "B" },
				],
				relationships: [
					{ from: "INT1", to: "INT2", type: "refines" },
					{ from: "INT1", to: "INT2", type: "refines" },
				],
			};
			const result = validateOp({ doc });
			const hasDupIssue = result.issues.some((issue) =>
				issue.toLowerCase().includes("duplicate"),
			);
			assert.ok(hasDupIssue, "validate should flag duplicate relationships");
		});
	});

	describe("Endpoint type validation", () => {
		it("rejects relationship with invalid endpoint types", () => {
			const doc: SysProMDocument = {
				nodes: [
					{ id: "STG1", type: "stage", name: "Stage" },
					{ id: "DEC1", type: "decision", name: "Decision" },
				],
			};
			assert.throws(
				() =>
					addRelationshipOp({
						doc,
						rel: { from: "STG1", to: "DEC1", type: "refines" },
					}),
				/invalid|endpoint|type/i,
			);
		});

		it("allows valid endpoint type combinations", () => {
			const doc: SysProMDocument = {
				nodes: [
					{ id: "INT1", type: "intent", name: "Intent" },
					{ id: "CON1", type: "concept", name: "Concept" },
				],
			};
			const newDoc = addRelationshipOp({
				doc,
				rel: { from: "INT1", to: "CON1", type: "refines" },
			});
			assert.equal(newDoc.relationships?.length, 1);
		});

		it("allows broadened system-provenance endpoint combinations", () => {
			const doc: SysProMDocument = {
				nodes: [
					{ id: "ROLE1", type: "role", name: "Steward" },
					{ id: "CON1", type: "concept", name: "Conflict Resolution" },
					{ id: "PROT1", type: "protocol", name: "Publish Workflow" },
					{ id: "CAP1", type: "capability", name: "Retrieval" },
					{ id: "ART1", type: "artefact", name: "Knowledge Brief" },
					{ id: "INV1", type: "invariant", name: "Publish Boundary" },
				],
			};
			const withConcept = addRelationshipOp({
				doc,
				rel: { from: "ROLE1", to: "CON1", type: "performs" },
			});
			const withProtocol = addRelationshipOp({
				doc: withConcept,
				rel: { from: "ROLE1", to: "PROT1", type: "performs" },
			});
			const withArtefact = addRelationshipOp({
				doc: withProtocol,
				rel: { from: "CAP1", to: "ART1", type: "produces" },
			});
			const newDoc = addRelationshipOp({
				doc: withArtefact,
				rel: { from: "INV1", to: "CON1", type: "applies_to" },
			});
			assert.equal(newDoc.relationships?.length, 4);
		});

		it("flags invalid endpoint types in validate", () => {
			const doc: SysProMDocument = {
				nodes: [
					{ id: "STG1", type: "stage", name: "Stage" },
					{ id: "DEC1", type: "decision", name: "Decision" },
				],
				relationships: [{ from: "STG1", to: "DEC1", type: "refines" }],
			};
			const result = validateOp({ doc });
			const hasTypeIssue = result.issues.some(
				(issue) =>
					issue.toLowerCase().includes("endpoint") ||
					issue.toLowerCase().includes("type"),
			);
			assert.ok(hasTypeIssue, "validate should flag invalid endpoint types");
		});
	});

	describe("Retirement impact", () => {
		it("flags operational relationships to retired nodes", () => {
			const doc: SysProMDocument = {
				nodes: [
					{ id: "INT1", type: "intent", name: "Intent" },
					{ id: "CON1", type: "concept", name: "Concept", status: "retired" },
				],
				relationships: [{ from: "INT1", to: "CON1", type: "depends_on" }],
			};
			const result = validateOp({ doc });
			const hasRetirementIssue = result.issues.some((issue) =>
				issue.toLowerCase().includes("retired"),
			);
			assert.ok(
				hasRetirementIssue,
				"validate should flag operational rels to retired nodes",
			);
		});

		it("allows supersedes relationships to retired nodes", () => {
			const doc: SysProMDocument = {
				nodes: [
					{ id: "INT1", type: "intent", name: "Intent" },
					{ id: "CON1", type: "concept", name: "Concept", status: "retired" },
				],
				relationships: [{ from: "INT1", to: "CON1", type: "supersedes" }],
			};
			const result = validateOp({ doc });
			const hasRetirementIssue = result.issues.some((issue) =>
				issue.toLowerCase().includes("retired"),
			);
			assert.equal(
				hasRetirementIssue,
				false,
				"supersedes to retired nodes should be allowed",
			);
		});
	});
});
