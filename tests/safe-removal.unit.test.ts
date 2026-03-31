import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { removeNodeOp } from "../src/index.js";
import type { SysProMDocument } from "../src/schema.js";

describe("CHG32: Safe Graph Removal", () => {
	describe("RemovalImpact detection", () => {
		it("detects when removing a node breaks must_follow chains", () => {
			const doc: SysProMDocument = {
				nodes: [
					{ id: "STG1", type: "stage", name: "Stage 1" },
					{ id: "STG2", type: "stage", name: "Stage 2" },
					{ id: "STG3", type: "stage", name: "Stage 3" },
				],
				relationships: [
					{ from: "STG1", to: "STG2", type: "must_follow" },
					{ from: "STG2", to: "STG3", type: "must_follow" },
				],
			};
			const result = removeNodeOp({ doc, id: "STG2" });
			// Should have warnings about chain break
			assert.ok(result.warnings, "should report removal impact");
		});

		it("preserves relationships when soft deleting node", () => {
			const doc: SysProMDocument = {
				nodes: [
					{ id: "INT1", type: "intent", name: "Intent" },
					{ id: "CON1", type: "concept", name: "Concept" },
				],
				relationships: [{ from: "INT1", to: "CON1", type: "refines" }],
			};
			const result = removeNodeOp({ doc, id: "INT1" });
			assert.equal(
				result.doc.relationships?.length,
				1,
				"relationships should be preserved in soft delete",
			);
		});

		it("detects scope references to removed node", () => {
			const doc: SysProMDocument = {
				nodes: [
					{ id: "INT1", type: "intent", name: "Intent" },
					{ id: "CHG1", type: "change", name: "Change", scope: ["INT1"] },
				],
			};
			const result = removeNodeOp({ doc, id: "INT1" });
			assert.ok(
				result.warnings.some((w) => w.includes("scope")),
				"should warn about scope references",
			);
		});

		it("detects operation target references to removed node", () => {
			const doc: SysProMDocument = {
				nodes: [
					{ id: "INT1", type: "intent", name: "Intent" },
					{
						id: "CHG1",
						type: "change",
						name: "Change",
						operations: [{ type: "update", target: "INT1" }],
					},
				],
			};
			const result = removeNodeOp({ doc, id: "INT1" });
			assert.ok(
				result.warnings.some((w) => w.includes("operation")),
				"should warn about operation references",
			);
		});
	});

	describe("Scope and operation cleanup", () => {
		it("cleans up scope references when removing node", () => {
			const doc: SysProMDocument = {
				nodes: [
					{ id: "INT1", type: "intent", name: "Intent" },
					{
						id: "CHG1",
						type: "change",
						name: "Change",
						scope: ["INT1", "INT2"],
					},
				],
			};
			const result = removeNodeOp({ doc, id: "INT1" });
			const change = result.doc.nodes.find((n) => n.id === "CHG1");
			assert.ok(
				!change?.scope?.includes("INT1"),
				"scope should not include removed node",
			);
		});

		it("removes operation targets pointing to removed node", () => {
			const doc: SysProMDocument = {
				nodes: [
					{ id: "INT1", type: "intent", name: "Intent" },
					{ id: "INT2", type: "intent", name: "Intent 2" },
					{
						id: "CHG1",
						type: "change",
						name: "Change",
						operations: [
							{ type: "update", target: "INT1" },
							{ type: "update", target: "INT2" },
						],
					},
				],
			};
			const result = removeNodeOp({ doc, id: "INT1" });
			const change = result.doc.nodes.find((n) => n.id === "CHG1");
			assert.equal(
				change?.operations?.length,
				1,
				"should remove one operation",
			);
			assert.equal(change?.operations?.[0].target, "INT2");
		});

		it("removes empty scope array after cleanup", () => {
			const doc: SysProMDocument = {
				nodes: [
					{ id: "INT1", type: "intent", name: "Intent" },
					{ id: "CHG1", type: "change", name: "Change", scope: ["INT1"] },
				],
			};
			const result = removeNodeOp({ doc, id: "INT1" });
			const change = result.doc.nodes.find((n) => n.id === "CHG1");
			assert.equal(
				change?.scope,
				undefined,
				"scope should be undefined when empty",
			);
		});

		it("removes empty operations array after cleanup", () => {
			const doc: SysProMDocument = {
				nodes: [
					{ id: "INT1", type: "intent", name: "Intent" },
					{
						id: "CHG1",
						type: "change",
						name: "Change",
						operations: [{ type: "update", target: "INT1" }],
					},
				],
			};
			const result = removeNodeOp({ doc, id: "INT1" });
			const change = result.doc.nodes.find((n) => n.id === "CHG1");
			assert.equal(
				change?.operations,
				undefined,
				"operations should be undefined when empty",
			);
		});
	});

	describe("View includes cleanup", () => {
		it("removes node from view includes", () => {
			const doc: SysProMDocument = {
				nodes: [
					{
						id: "VIEW1",
						type: "view",
						name: "View",
						includes: ["INT1", "INT2"],
					},
					{ id: "INT1", type: "intent", name: "Intent 1" },
					{ id: "INT2", type: "intent", name: "Intent 2" },
				],
			};
			const result = removeNodeOp({ doc, id: "INT1" });
			const view = result.doc.nodes.find((n) => n.id === "VIEW1");
			assert.deepEqual(view?.includes, ["INT2"]);
		});

		it("removes empty includes array", () => {
			const doc: SysProMDocument = {
				nodes: [
					{ id: "VIEW1", type: "view", name: "View", includes: ["INT1"] },
					{ id: "INT1", type: "intent", name: "Intent" },
				],
			};
			const result = removeNodeOp({ doc, id: "INT1" });
			const view = result.doc.nodes.find((n) => n.id === "VIEW1");
			assert.equal(view?.includes, undefined);
		});
	});

	describe("External reference cleanup", () => {
		it("removes external references to removed node", () => {
			const doc: SysProMDocument = {
				nodes: [{ id: "INT1", type: "intent", name: "Intent" }],
				external_references: [
					{
						identifier: "http://example.com",
						role: "source",
						node_id: "INT1",
					},
				],
			};
			const result = removeNodeOp({ doc, id: "INT1" });
			assert.equal(result.doc.external_references?.length ?? 0, 0);
		});
	});

	describe("Relationship preservation", () => {
		it("preserves relationships in soft delete", () => {
			const doc: SysProMDocument = {
				nodes: [
					{ id: "INT1", type: "intent", name: "A" },
					{ id: "INT2", type: "intent", name: "B" },
					{ id: "INT3", type: "intent", name: "C" },
				],
				relationships: [
					{ from: "INT1", to: "INT2", type: "refines" },
					{ from: "INT2", to: "INT3", type: "depends_on" },
				],
			};
			const result = removeNodeOp({ doc, id: "INT2" });
			// Relationships should be preserved in soft delete
			assert.equal(
				result.doc.relationships?.length,
				2,
				"relationships should be preserved",
			);
		});
	});

	describe("Chain detection", () => {
		it("detects must_follow chains that would be broken", () => {
			const doc: SysProMDocument = {
				nodes: [
					{ id: "STG1", type: "stage", name: "Stage 1" },
					{ id: "STG2", type: "stage", name: "Stage 2" },
					{ id: "STG3", type: "stage", name: "Stage 3" },
				],
				relationships: [
					{ from: "STG1", to: "STG2", type: "must_follow" },
					{ from: "STG2", to: "STG3", type: "must_follow" },
				],
			};
			const result = removeNodeOp({ doc, id: "STG2" });
			assert.ok(result.warnings, "should report chain break");
		});
	});

	describe("Complex cleanup scenarios", () => {
		it("handles node with multiple types of references", () => {
			const doc: SysProMDocument = {
				nodes: [
					{ id: "INT1", type: "intent", name: "Intent" },
					{
						id: "CHG1",
						type: "change",
						name: "Change",
						scope: ["INT1"],
						operations: [{ type: "update", target: "INT1" }],
					},
					{ id: "VIEW1", type: "view", name: "View", includes: ["INT1"] },
				],
				relationships: [{ from: "INT1", to: "CHG1", type: "affects" }],
				external_references: [
					{ identifier: "http://example.com", role: "source", node_id: "INT1" },
				],
			};
			const result = removeNodeOp({ doc, id: "INT1" });

			// Check all cleanup occurred
			const change = result.doc.nodes.find((n) => n.id === "CHG1");
			assert.equal(change?.scope, undefined, "scope should be cleaned");
			assert.equal(
				change?.operations,
				undefined,
				"operations should be cleaned",
			);

			const view = result.doc.nodes.find((n) => n.id === "VIEW1");
			assert.equal(view?.includes, undefined, "includes should be cleaned");

			assert.equal(
				result.doc.external_references?.length ?? 0,
				0,
				"external references should be cleaned",
			);

			assert.equal(
				result.doc.relationships?.length ?? 0,
				1,
				"relationships preserved in soft delete",
			);
		});

		it("preserves other scopes while cleaning up reference", () => {
			const doc: SysProMDocument = {
				nodes: [
					{ id: "INT1", type: "intent", name: "Intent 1" },
					{ id: "INT2", type: "intent", name: "Intent 2" },
					{
						id: "CHG1",
						type: "change",
						name: "Change",
						scope: ["INT1", "INT2"],
					},
				],
			};
			const result = removeNodeOp({ doc, id: "INT1" });
			const change = result.doc.nodes.find((n) => n.id === "CHG1");
			assert.deepEqual(change?.scope, ["INT2"], "scope should retain INT2");
		});

		it("preserves other operations while cleaning up target", () => {
			const doc: SysProMDocument = {
				nodes: [
					{ id: "INT1", type: "intent", name: "Intent 1" },
					{ id: "INT2", type: "intent", name: "Intent 2" },
					{
						id: "CHG1",
						type: "change",
						name: "Change",
						operations: [
							{ type: "update", target: "INT1" },
							{ type: "add", target: "INT2" },
						],
					},
				],
			};
			const result = removeNodeOp({ doc, id: "INT1" });
			const change = result.doc.nodes.find((n) => n.id === "CHG1");
			assert.equal(change?.operations?.length, 1);
			assert.equal(change?.operations?.[0].target, "INT2");
		});
	});
});
