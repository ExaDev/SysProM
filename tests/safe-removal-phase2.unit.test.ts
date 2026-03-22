import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { removeNodeOp, removeRelationshipOp } from "../src/index.js";
import type { SysProMDocument, Relationship } from "../src/schema.js";

describe("CH32 Phase 2: Soft/Hard Delete and Chain Repair", () => {
	describe("Soft delete (default)", () => {
		it("preserves node with status retired (soft delete by default)", () => {
			const doc: SysProMDocument = {
				nodes: [
					{ id: "I1", type: "intent", name: "Intent" },
					{ id: "I2", type: "intent", name: "Intent 2" },
				],
				relationships: [{ from: "I1", to: "I2", type: "refines" }],
			};
			// Default behavior is soft delete
			const result = removeNodeOp({ doc, id: "I1" });
			const retired = result.doc.nodes.find((n) => n.id === "I1");
			assert.ok(retired, "node should exist after soft delete");
			assert.equal(retired!.status, "retired", "node should be marked retired");
		});

		it("preserves relationships in soft delete", () => {
			const doc: SysProMDocument = {
				nodes: [
					{ id: "I1", type: "intent", name: "A" },
					{ id: "I2", type: "intent", name: "B" },
				],
				relationships: [{ from: "I1", to: "I2", type: "refines" }],
			};
			const result = removeNodeOp({ doc, id: "I1" });
			// Relationships should still exist
			assert.equal(result.doc.relationships?.length, 1);
		});

		it("still cleans up scope and operations in soft delete", () => {
			const doc: SysProMDocument = {
				nodes: [
					{ id: "I1", type: "intent", name: "Intent" },
					{
						id: "C1",
						type: "change",
						name: "Change",
						scope: ["I1"],
					},
				],
			};
			const result = removeNodeOp({ doc, id: "I1" });
			const retired = result.doc.nodes.find((n) => n.id === "I1");
			assert.equal(retired!.status, "retired");
			const change = result.doc.nodes.find((n) => n.id === "C1");
			assert.equal(change?.scope, undefined);
		});
	});

	describe("Hard delete with --hard flag", () => {
		it("physically removes node when hard: true", () => {
			const doc: SysProMDocument = {
				nodes: [
					{ id: "I1", type: "intent", name: "Intent" },
					{ id: "I2", type: "intent", name: "Intent 2" },
				],
			};
			const result = removeNodeOp({ doc, id: "I1", hard: true });
			assert.equal(result.doc.nodes.length, 1);
			assert.equal(result.doc.nodes[0].id, "I2");
		});

		it("removes all relationships in hard delete", () => {
			const doc: SysProMDocument = {
				nodes: [
					{ id: "I1", type: "intent", name: "A" },
					{ id: "I2", type: "intent", name: "B" },
				],
				relationships: [{ from: "I1", to: "I2", type: "refines" }],
			};
			const result = removeNodeOp({ doc, id: "I1", hard: true });
			assert.equal(result.doc.relationships?.length ?? 0, 0);
		});
	});

	describe("Recursive guard for subsystems", () => {
		it("refuses hard delete of node with subsystem without recursive: true", () => {
			const doc: SysProMDocument = {
				nodes: [
					{
						id: "E1",
						type: "element",
						name: "Element with subsystem",
						subsystem: {
							nodes: [{ id: "E1a", type: "element", name: "Child" }],
						},
					},
				],
			};
			assert.throws(
				() => removeNodeOp({ doc, id: "E1", hard: true }),
				/recursive|subsystem/i,
				"should require --recursive for nodes with subsystems",
			);
		});

		it("allows hard delete with recursive: true on subsystem nodes", () => {
			const doc: SysProMDocument = {
				nodes: [
					{
						id: "E1",
						type: "element",
						name: "Element with subsystem",
						subsystem: {
							nodes: [{ id: "E1a", type: "element", name: "Child" }],
						},
					},
				],
			};
			const result = removeNodeOp({
				doc,
				id: "E1",
				hard: true,
				recursive: true,
			});
			assert.equal(result.doc.nodes.length, 0);
		});

		it("soft delete does not require recursive guard", () => {
			const doc: SysProMDocument = {
				nodes: [
					{
						id: "E1",
						type: "element",
						name: "Element with subsystem",
						subsystem: {
							nodes: [{ id: "E1a", type: "element", name: "Child" }],
						},
					},
				],
			};
			// Soft delete (no hard flag) should succeed
			const result = removeNodeOp({ doc, id: "E1" });
			const retired = result.doc.nodes.find((n) => n.id === "E1");
			assert.equal(retired!.status, "retired");
		});
	});

	describe("Must_follow chain repair with --repair flag", () => {
		it("repairs must_follow chain: A→B→C becomes A→C when removing B with repair: true", () => {
			const doc: SysProMDocument = {
				nodes: [
					{ id: "S1", type: "stage", name: "Stage 1" },
					{ id: "S2", type: "stage", name: "Stage 2" },
					{ id: "S3", type: "stage", name: "Stage 3" },
				],
				relationships: [
					{ from: "S1", to: "S2", type: "must_follow" },
					{ from: "S2", to: "S3", type: "must_follow" },
				],
			};
			const result = removeNodeOp({
				doc,
				id: "S2",
				hard: true,
				repair: true,
			});
			// Should have S1→S3 repaired relationship
			const rels = result.doc.relationships ?? [];
			const repaired = rels.find(
				(r) => r.from === "S1" && r.to === "S3" && r.type === "must_follow",
			);
			assert.ok(repaired, "should have repaired S1→S3");
		});

		it("removes broken chain endpoints without repair", () => {
			const doc: SysProMDocument = {
				nodes: [
					{ id: "S1", type: "stage", name: "Stage 1" },
					{ id: "S2", type: "stage", name: "Stage 2" },
					{ id: "S3", type: "stage", name: "Stage 3" },
				],
				relationships: [
					{ from: "S1", to: "S2", type: "must_follow" },
					{ from: "S2", to: "S3", type: "must_follow" },
				],
			};
			const result = removeNodeOp({
				doc,
				id: "S2",
				hard: true,
				repair: false,
			});
			// Without repair, both relationships removed
			assert.equal(result.doc.relationships?.length ?? 0, 0);
		});

		it("handles multiple incoming chains to removed node", () => {
			const doc: SysProMDocument = {
				nodes: [
					{ id: "S1", type: "stage", name: "Stage 1" },
					{ id: "S2", type: "stage", name: "Stage 2" },
					{ id: "S3", type: "stage", name: "Stage 3" },
					{ id: "S4", type: "stage", name: "Stage 4" },
				],
				relationships: [
					{ from: "S1", to: "S2", type: "must_follow" },
					{ from: "S3", to: "S2", type: "must_follow" }, // Note: not must_follow chain
					{ from: "S2", to: "S4", type: "must_follow" },
				],
			};
			const result = removeNodeOp({
				doc,
				id: "S2",
				hard: true,
				repair: true,
			});
			const rels = result.doc.relationships ?? [];
			// Should repair S1→S4
			const s1ToS4 = rels.find((r) => r.from === "S1" && r.to === "S4");
			assert.ok(s1ToS4);
			// Should also repair S3→S4 (both incoming chains to S2 should be repaired)
			const s3ToS4 = rels.find((r) => r.from === "S3" && r.to === "S4");
			assert.ok(s3ToS4);
		});
	});

	describe("removeRelationship with chain repair", () => {
		it("repairs must_follow chain when removing middle relationship with repair: true", () => {
			const doc: SysProMDocument = {
				nodes: [
					{ id: "S1", type: "stage", name: "Stage 1" },
					{ id: "S2", type: "stage", name: "Stage 2" },
					{ id: "S3", type: "stage", name: "Stage 3" },
				],
				relationships: [
					{ from: "S1", to: "S2", type: "must_follow" },
					{ from: "S2", to: "S3", type: "must_follow" },
				],
			};
			const result = removeRelationshipOp({
				doc,
				from: "S1",
				type: "must_follow",
				to: "S2",
				repair: true,
			});
			const rels = (result.doc.relationships ?? []) as Relationship[];
			// Should have S1→S3 added and S1→S2 removed
			assert.equal(rels.length, 2);
			const s1ToS3 = rels.find((r) => r.from === "S1" && r.to === "S3");
			assert.ok(s1ToS3, "should have added S1→S3");
			const s1ToS2 = rels.find((r) => r.from === "S1" && r.to === "S2");
			assert.equal(s1ToS2, undefined, "S1→S2 should be removed");
		});

		it("preserves remaining chain relationships", () => {
			const doc: SysProMDocument = {
				nodes: [
					{ id: "S1", type: "stage", name: "Stage 1" },
					{ id: "S2", type: "stage", name: "Stage 2" },
					{ id: "S3", type: "stage", name: "Stage 3" },
				],
				relationships: [
					{ from: "S1", to: "S2", type: "must_follow" },
					{ from: "S2", to: "S3", type: "must_follow" },
				],
			};
			const result = removeRelationshipOp({
				doc,
				from: "S1",
				type: "must_follow",
				to: "S2",
				repair: true,
			});
			const rels = (result.doc.relationships ?? []) as Relationship[];
			// S2→S3 should still exist
			const s2ToS3 = rels.find((r) => r.from === "S2" && r.to === "S3");
			assert.ok(s2ToS3, "S2→S3 should remain");
		});
	});

	describe("Error reporting for repair scenarios", () => {
		it("returns impact summary when hard deleting", () => {
			const doc: SysProMDocument = {
				nodes: [
					{ id: "I1", type: "intent", name: "Intent" },
					{ id: "I2", type: "intent", name: "Intent 2" },
				],
				relationships: [{ from: "I1", to: "I2", type: "refines" }],
			};
			const result = removeNodeOp({ doc, id: "I1", hard: true });
			assert.ok(result.warnings, "should have warnings/impact info");
		});

		it("reports chains repaired in warnings", () => {
			const doc: SysProMDocument = {
				nodes: [
					{ id: "S1", type: "stage", name: "Stage 1" },
					{ id: "S2", type: "stage", name: "Stage 2" },
					{ id: "S3", type: "stage", name: "Stage 3" },
				],
				relationships: [
					{ from: "S1", to: "S2", type: "must_follow" },
					{ from: "S2", to: "S3", type: "must_follow" },
				],
			};
			const result = removeNodeOp({
				doc,
				id: "S2",
				hard: true,
				repair: true,
			});
			assert.ok(
				result.warnings.some((w) =>
					w.toLowerCase().includes("repair") || w.toLowerCase().includes("chain"),
				),
				"should warn about chain repairs",
			);
		});
	});
});
