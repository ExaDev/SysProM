import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { addRelationshipOp, validateOp } from "../src/index.js";
import type { SysProMDocument } from "../src/schema.js";

describe("CH33: Graph Mutation Safety Guards", () => {
	describe("Duplicate relationship detection", () => {
		it("rejects duplicate relationship in addRelationship", () => {
			const doc: SysProMDocument = {
				nodes: [
					{ id: "I1", type: "intent", name: "A" },
					{ id: "I2", type: "intent", name: "B" },
				],
				relationships: [{ from: "I1", to: "I2", type: "refines" }],
			};
			assert.throws(
				() =>
					addRelationshipOp({
						doc,
						rel: { from: "I1", to: "I2", type: "refines" },
					}),
				/duplicate|already exists/i,
			);
		});

		it("allows same from/to with different type", () => {
			const doc: SysProMDocument = {
				nodes: [
					{ id: "I1", type: "intent", name: "A" },
					{ id: "I2", type: "intent", name: "B" },
				],
				relationships: [{ from: "I1", to: "I2", type: "refines" }],
			};
			const newDoc = addRelationshipOp({
				doc,
				rel: { from: "I1", to: "I2", type: "depends_on" },
			});
			assert.equal(newDoc.relationships?.length, 2);
		});

		it("flags duplicate relationship in validate", () => {
			const doc: SysProMDocument = {
				nodes: [
					{ id: "I1", type: "intent", name: "A" },
					{ id: "I2", type: "intent", name: "B" },
				],
				relationships: [
					{ from: "I1", to: "I2", type: "refines" },
					{ from: "I1", to: "I2", type: "refines" },
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
					{ id: "S1", type: "stage", name: "Stage" },
					{ id: "D1", type: "decision", name: "Decision" },
				],
			};
			assert.throws(
				() =>
					addRelationshipOp({
						doc,
						rel: { from: "S1", to: "D1", type: "refines" },
					}),
				/invalid|endpoint|type/i,
			);
		});

		it("allows valid endpoint type combinations", () => {
			const doc: SysProMDocument = {
				nodes: [
					{ id: "I1", type: "intent", name: "Intent" },
					{ id: "CN1", type: "concept", name: "Concept" },
				],
			};
			const newDoc = addRelationshipOp({
				doc,
				rel: { from: "I1", to: "CN1", type: "refines" },
			});
			assert.equal(newDoc.relationships?.length, 1);
		});

		it("flags invalid endpoint types in validate", () => {
			const doc: SysProMDocument = {
				nodes: [
					{ id: "S1", type: "stage", name: "Stage" },
					{ id: "D1", type: "decision", name: "Decision" },
				],
				relationships: [
					{ from: "S1", to: "D1", type: "refines" },
				],
			};
			const result = validateOp({ doc });
			const hasTypeIssue = result.issues.some((issue) =>
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
					{ id: "I1", type: "intent", name: "Intent" },
					{ id: "CN1", type: "concept", name: "Concept", status: "retired" },
				],
				relationships: [
					{ from: "I1", to: "CN1", type: "depends_on" },
				],
			};
			const result = validateOp({ doc });
			const hasRetirementIssue = result.issues.some((issue) =>
				issue.toLowerCase().includes("retired"),
			);
			assert.ok(hasRetirementIssue, "validate should flag operational rels to retired nodes");
		});

		it("allows supersedes relationships to retired nodes", () => {
			const doc: SysProMDocument = {
				nodes: [
					{ id: "I1", type: "intent", name: "Intent" },
					{ id: "CN1", type: "concept", name: "Concept", status: "retired" },
				],
				relationships: [
					{ from: "I1", to: "CN1", type: "supersedes" },
				],
			};
			const result = validateOp({ doc });
			const hasRetirementIssue = result.issues.some((issue) =>
				issue.toLowerCase().includes("retired"),
			);
			assert.equal(hasRetirementIssue, false, "supersedes to retired nodes should be allowed");
		});
	});
});
