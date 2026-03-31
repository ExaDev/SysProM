import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { removeNodeOp, removeRelationshipOp } from "../src/index.js";
import type { SysProMDocument } from "../src/schema.js";

describe("CHG32 Phase 2: Soft/Hard Delete and Chain Repair", () => {
	describe("Soft delete (default)", () => {
		it("preserves node with status retired (soft delete by default)", () => {
			const doc: SysProMDocument = {
				nodes: [
					{ id: "INT1", type: "intent", name: "Intent" },
					{ id: "INT2", type: "intent", name: "Intent 2" },
				],
				relationships: [{ from: "INT1", to: "INT2", type: "refines" }],
			};
			// Default behavior is soft delete
			const result = removeNodeOp({ doc, id: "INT1" });
			const retired = result.doc.nodes.find((n) => n.id === "INT1");
			assert.ok(retired, "node should exist after soft delete");
			assert.equal(retired.status, "retired", "node should be marked retired");
		});

		it("preserves relationships in soft delete", () => {
			const doc: SysProMDocument = {
				nodes: [
					{ id: "INT1", type: "intent", name: "A" },
					{ id: "INT2", type: "intent", name: "B" },
				],
				relationships: [{ from: "INT1", to: "INT2", type: "refines" }],
			};
			const result = removeNodeOp({ doc, id: "INT1" });
			// Relationships should still exist
			assert.equal(result.doc.relationships?.length, 1);
		});

		it("still cleans up scope and operations in soft delete", () => {
			const doc: SysProMDocument = {
				nodes: [
					{ id: "INT1", type: "intent", name: "Intent" },
					{
						id: "CHG1",
						type: "change",
						name: "Change",
						scope: ["INT1"],
					},
				],
			};
			const result = removeNodeOp({ doc, id: "INT1" });
			const retired = result.doc.nodes.find((n) => n.id === "INT1");
			assert.equal(retired!.status, "retired");
			const change = result.doc.nodes.find((n) => n.id === "CHG1");
			assert.equal(change?.scope, undefined);
		});
	});

	describe("Hard delete with --hard flag", () => {
		it("physically removes node when hard: true", () => {
			const doc: SysProMDocument = {
				nodes: [
					{ id: "INT1", type: "intent", name: "Intent" },
					{ id: "INT2", type: "intent", name: "Intent 2" },
				],
			};
			const result = removeNodeOp({ doc, id: "INT1", hard: true });
			assert.equal(result.doc.nodes.length, 1);
			assert.equal(result.doc.nodes[0].id, "INT2");
		});

		it("removes all relationships in hard delete", () => {
			const doc: SysProMDocument = {
				nodes: [
					{ id: "INT1", type: "intent", name: "A" },
					{ id: "INT2", type: "intent", name: "B" },
				],
				relationships: [{ from: "INT1", to: "INT2", type: "refines" }],
			};
			const result = removeNodeOp({ doc, id: "INT1", hard: true });
			assert.equal(result.doc.relationships?.length ?? 0, 0);
		});
	});

	describe("Recursive guard for subsystems", () => {
		it("refuses hard delete of node with subsystem without recursive: true", () => {
			const doc: SysProMDocument = {
				nodes: [
					{
						id: "ELEM1",
						type: "element",
						name: "Element with subsystem",
						subsystem: {
							nodes: [{ id: "ELEM2", type: "element", name: "Child" }],
						},
					},
				],
			};
			assert.throws(
				() => removeNodeOp({ doc, id: "ELEM1", hard: true }),
				/recursive|subsystem/i,
				"should require --recursive for nodes with subsystems",
			);
		});

		it("allows hard delete with recursive: true on subsystem nodes", () => {
			const doc: SysProMDocument = {
				nodes: [
					{
						id: "ELEM1",
						type: "element",
						name: "Element with subsystem",
						subsystem: {
							nodes: [{ id: "ELEM2", type: "element", name: "Child" }],
						},
					},
				],
			};
			const result = removeNodeOp({
				doc,
				id: "ELEM1",
				hard: true,
				recursive: true,
			});
			assert.equal(result.doc.nodes.length, 0);
		});

		it("soft delete does not require recursive guard", () => {
			const doc: SysProMDocument = {
				nodes: [
					{
						id: "ELEM1",
						type: "element",
						name: "Element with subsystem",
						subsystem: {
							nodes: [{ id: "ELEM2", type: "element", name: "Child" }],
						},
					},
				],
			};
			// Soft delete (no hard flag) should succeed
			const result = removeNodeOp({ doc, id: "ELEM1" });
			const retired = result.doc.nodes.find((n) => n.id === "ELEM1");
			assert.equal(retired!.status, "retired");
		});
	});

	describe("Must_follow chain repair with --repair flag", () => {
		it("repairs must_follow chain: A→B→C becomes A→C when removing B with repair: true", () => {
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
			const result = removeNodeOp({
				doc,
				id: "STG2",
				hard: true,
				repair: true,
			});
			// Should have STG1→STG3 repaired relationship
			const rels = result.doc.relationships ?? [];
			const repaired = rels.find(
				(r) => r.from === "STG1" && r.to === "STG3" && r.type === "must_follow",
			);
			assert.ok(repaired, "should have repaired STG1→STG3");
		});

		it("removes broken chain endpoints without repair", () => {
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
			const result = removeNodeOp({
				doc,
				id: "STG2",
				hard: true,
				repair: false,
			});
			// Without repair, both relationships removed
			assert.equal(result.doc.relationships?.length ?? 0, 0);
		});

		it("handles multiple incoming chains to removed node", () => {
			const doc: SysProMDocument = {
				nodes: [
					{ id: "STG1", type: "stage", name: "Stage 1" },
					{ id: "STG2", type: "stage", name: "Stage 2" },
					{ id: "STG3", type: "stage", name: "Stage 3" },
					{ id: "STG4", type: "stage", name: "Stage 4" },
				],
				relationships: [
					{ from: "STG1", to: "STG2", type: "must_follow" },
					{ from: "STG3", to: "STG2", type: "must_follow" }, // Note: not must_follow chain
					{ from: "STG2", to: "STG4", type: "must_follow" },
				],
			};
			const result = removeNodeOp({
				doc,
				id: "STG2",
				hard: true,
				repair: true,
			});
			const rels = result.doc.relationships ?? [];
			// Should repair STG1→STG4
			const s1ToS4 = rels.find((r) => r.from === "STG1" && r.to === "STG4");
			assert.ok(s1ToS4);
			// Should also repair STG3→STG4 (both incoming chains to STG2 should be repaired)
			const s3ToS4 = rels.find((r) => r.from === "STG3" && r.to === "STG4");
			assert.ok(s3ToS4);
		});
	});

	describe("removeRelationship with chain repair", () => {
		it("repairs must_follow chain when removing middle relationship with repair: true", () => {
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
			const result = removeRelationshipOp({
				doc,
				from: "STG1",
				type: "must_follow",
				to: "STG2",
				repair: true,
			});
			const rels = result.doc.relationships ?? [];
			// Should have STG1→STG3 added and STG1→STG2 removed
			assert.equal(rels.length, 2);
			const s1ToS3 = rels.find((r) => r.from === "STG1" && r.to === "STG3");
			assert.ok(s1ToS3, "should have added STG1→STG3");
			const s1ToS2 = rels.find((r) => r.from === "STG1" && r.to === "STG2");
			assert.equal(s1ToS2, undefined, "STG1→STG2 should be removed");
		});

		it("preserves remaining chain relationships", () => {
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
			const result = removeRelationshipOp({
				doc,
				from: "STG1",
				type: "must_follow",
				to: "STG2",
				repair: true,
			});
			const rels = result.doc.relationships ?? [];
			// STG2→STG3 should still exist
			const s2ToS3 = rels.find((r) => r.from === "STG2" && r.to === "STG3");
			assert.ok(s2ToS3, "STG2→STG3 should remain");
		});
	});

	describe("Error reporting for repair scenarios", () => {
		it("returns impact summary when hard deleting", () => {
			const doc: SysProMDocument = {
				nodes: [
					{ id: "INT1", type: "intent", name: "Intent" },
					{ id: "INT2", type: "intent", name: "Intent 2" },
				],
				relationships: [{ from: "INT1", to: "INT2", type: "refines" }],
			};
			const result = removeNodeOp({ doc, id: "INT1", hard: true });
			assert.ok(result.warnings, "should have warnings/impact info");
		});

		it("reports chains repaired in warnings", () => {
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
			const result = removeNodeOp({
				doc,
				id: "STG2",
				hard: true,
				repair: true,
			});
			assert.ok(
				result.warnings.some(
					(w) =>
						w.toLowerCase().includes("repair") ||
						w.toLowerCase().includes("chain"),
				),
				"should warn about chain repairs",
			);
		});
	});
});
