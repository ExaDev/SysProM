import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
	addNodeOp,
	removeNodeOp,
	updateNodeOp,
	addRelationshipOp,
	removeRelationshipOp,
	updateMetadataOp,
} from "../src/index.js";
import type { SysProMDocument, Node } from "../src/schema.js";

function makeDoc(nodes: Node[] = []): SysProMDocument {
	return { nodes };
}

describe("addNode", () => {
	it("adds to nodes array", () => {
		const doc = makeDoc();
		const newDoc = addNodeOp({
			doc,
			node: { id: "INT1", type: "intent", name: "Test" },
		});
		assert.equal(newDoc.nodes.length, 1);
		assert.equal(newDoc.nodes[0].id, "INT1");
		// Original should be unchanged
		assert.equal(doc.nodes.length, 0);
	});

	it("rejects duplicate ID", () => {
		const doc = makeDoc([{ id: "INT1", type: "intent", name: "Existing" }]);
		assert.throws(
			() =>
				addNodeOp({ doc, node: { id: "INT1", type: "intent", name: "New" } }),
			/already exists/,
		);
	});
});

describe("removeNode", () => {
	it("hard deletes node and relationships when hard: true", () => {
		const doc: SysProMDocument = {
			nodes: [
				{ id: "INT1", type: "intent", name: "A" },
				{ id: "INT2", type: "intent", name: "B" },
			],
			relationships: [{ from: "INT1", to: "INT2", type: "refines" }],
		};
		const result = removeNodeOp({ doc, id: "INT1", hard: true });
		assert.equal(result.doc.nodes.length, 1);
		assert.equal(result.doc.nodes[0].id, "INT2");
		// relationships array is removed entirely when empty
		assert.equal(result.doc.relationships, undefined);
	});

	it("removes from view includes", () => {
		const doc: SysProMDocument = {
			nodes: [
				{ id: "VIEW1", type: "view", name: "View", includes: ["INT1", "INT2"] },
				{ id: "INT1", type: "intent", name: "A" },
				{ id: "INT2", type: "intent", name: "B" },
			],
		};
		const result = removeNodeOp({ doc, id: "INT1" });
		const view = result.doc.nodes.find((n) => n.id === "VIEW1");
		assert.deepEqual(view?.includes, ["INT2"]);
	});

	it("warns about scope references", () => {
		const doc: SysProMDocument = {
			nodes: [
				{ id: "CHG1", type: "change", name: "Change", scope: ["INT1"] },
				{ id: "INT1", type: "intent", name: "Intent" },
			],
		};
		const result = removeNodeOp({ doc, id: "INT1" });
		assert.ok(result.warnings.some((w) => w.includes("scope")));
	});

	it("warns about operation references", () => {
		const doc: SysProMDocument = {
			nodes: [
				{
					id: "CHG1",
					type: "change",
					name: "Change",
					operations: [{ type: "update", target: "INT1" }],
				},
				{ id: "INT1", type: "intent", name: "Intent" },
			],
		};
		const result = removeNodeOp({ doc, id: "INT1" });
		assert.ok(result.warnings.some((w) => w.includes("operations")));
	});

	it("throws for missing node", () => {
		const doc = makeDoc([{ id: "INT1", type: "intent", name: "A" }]);
		assert.throws(() => removeNodeOp({ doc, id: "NONEXISTENT" }), /not found/);
	});
});

describe("updateNode", () => {
	it("updates specified fields", () => {
		const doc = makeDoc([{ id: "INT1", type: "intent", name: "Old" }]);
		const newDoc = updateNodeOp({
			doc,
			id: "INT1",
			fields: {
				name: "New",
				description: "Updated",
			},
		});
		assert.equal(newDoc.nodes[0].name, "New");
		assert.equal(newDoc.nodes[0].description, "Updated");
	});

	it("rejects missing node", () => {
		const doc = makeDoc();
		assert.throws(
			() => updateNodeOp({ doc, id: "MISSING", fields: { name: "New" } }),
			/not found/,
		);
	});

	it("preserves other nodes", () => {
		const doc = makeDoc([
			{ id: "INT1", type: "intent", name: "A" },
			{ id: "INT2", type: "intent", name: "B" },
		]);
		const newDoc = updateNodeOp({
			doc,
			id: "INT1",
			fields: { name: "Updated" },
		});
		assert.equal(newDoc.nodes[1].name, "B");
	});
});

describe("addRelationship", () => {
	it("adds to relationships array", () => {
		const doc = makeDoc([
			{ id: "INT1", type: "intent", name: "A" },
			{ id: "INT2", type: "intent", name: "B" },
		]);
		const newDoc = addRelationshipOp({
			doc,
			rel: {
				from: "INT1",
				to: "INT2",
				type: "refines",
			},
		});
		assert.equal(newDoc.relationships?.length, 1);
		assert.equal(newDoc.relationships?.[0].type, "refines");
	});

	it("throws for missing from node", () => {
		const doc = makeDoc([{ id: "INT2", type: "intent", name: "B" }]);
		assert.throws(
			() =>
				addRelationshipOp({
					doc,
					rel: { from: "INT1", to: "INT2", type: "refines" },
				}),
			/Node not found.*INT1/,
		);
	});

	it("throws for missing to node", () => {
		const doc = makeDoc([{ id: "INT1", type: "intent", name: "A" }]);
		assert.throws(
			() =>
				addRelationshipOp({
					doc,
					rel: { from: "INT1", to: "INT2", type: "refines" },
				}),
			/Node not found.*INT2/,
		);
	});
});

describe("removeRelationship", () => {
	it("removes matching relationship", () => {
		const doc: SysProMDocument = {
			nodes: [
				{ id: "INT1", type: "intent", name: "A" },
				{ id: "INT2", type: "intent", name: "B" },
			],
			relationships: [{ from: "INT1", to: "INT2", type: "refines" }],
		};
		const result = removeRelationshipOp({
			doc,
			from: "INT1",
			type: "refines",
			to: "INT2",
		});
		assert.equal(result.doc.relationships?.length ?? 0, 0);
	});

	it("throws if relationship not found", () => {
		const doc: SysProMDocument = {
			nodes: [
				{ id: "INT1", type: "intent", name: "A" },
				{ id: "INT2", type: "intent", name: "B" },
			],
			relationships: [],
		};
		assert.throws(
			() =>
				removeRelationshipOp({
					doc,
					from: "INT1",
					type: "refines",
					to: "INT2",
				}),
			/not found/,
		);
	});
});

describe("updateMetadata", () => {
	it("merges fields", () => {
		const doc: SysProMDocument = {
			nodes: [],
			metadata: { title: "Old" },
		};
		const newDoc = updateMetadataOp({ doc, fields: { version: "1.0.0" } });
		assert.equal(newDoc.metadata?.title, "Old");
		assert.equal(newDoc.metadata?.version, "1.0.0");
	});

	it("creates metadata if missing", () => {
		const doc = makeDoc();
		const newDoc = updateMetadataOp({ doc, fields: { title: "New" } });
		assert.equal(newDoc.metadata?.title, "New");
	});
});
