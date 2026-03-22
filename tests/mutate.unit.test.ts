import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
	addNode,
	removeNode,
	updateNode,
	addRelationship,
	removeRelationship,
	updateMetadata,
} from "../src/index.js";
import type { SysProMDocument, Node } from "../src/schema.js";

function makeDoc(nodes: Node[] = []): SysProMDocument {
	return { nodes };
}

describe("addNode", () => {
	it("adds to nodes array", () => {
		const doc = makeDoc();
		const newDoc = addNode(doc, { id: "I1", type: "intent", name: "Test" });
		assert.equal(newDoc.nodes.length, 1);
		assert.equal(newDoc.nodes[0].id, "I1");
		// Original should be unchanged
		assert.equal(doc.nodes.length, 0);
	});

	it("rejects duplicate ID", () => {
		const doc = makeDoc([{ id: "I1", type: "intent", name: "Existing" }]);
		assert.throws(
			() => addNode(doc, { id: "I1", type: "concept", name: "New" }),
			/already exists/,
		);
	});
});

describe("removeNode", () => {
	it("removes node and relationships", () => {
		const doc: SysProMDocument = {
			nodes: [
				{ id: "I1", type: "intent", name: "A" },
				{ id: "I2", type: "intent", name: "B" },
			],
			relationships: [{ from: "I1", to: "I2", type: "refines" }],
		};
		const result = removeNode(doc, "I1");
		assert.equal(result.doc.nodes.length, 1);
		assert.equal(result.doc.nodes[0].id, "I2");
		// relationships array is removed entirely when empty
		assert.equal(result.doc.relationships, undefined);
	});

	it("removes from view includes", () => {
		const doc: SysProMDocument = {
			nodes: [
				{ id: "V1", type: "view", name: "View", includes: ["I1", "I2"] },
				{ id: "I1", type: "intent", name: "A" },
				{ id: "I2", type: "intent", name: "B" },
			],
		};
		const result = removeNode(doc, "I1");
		const view = result.doc.nodes.find((n) => n.id === "V1");
		assert.deepEqual(view?.includes, ["I2"]);
	});

	it("warns about scope references", () => {
		const doc: SysProMDocument = {
			nodes: [
				{ id: "C1", type: "change", name: "Change", scope: ["I1"] },
				{ id: "I1", type: "intent", name: "Intent" },
			],
		};
		const result = removeNode(doc, "I1");
		assert.ok(result.warnings.some((w) => w.includes("scope")));
	});

	it("warns about operation references", () => {
		const doc: SysProMDocument = {
			nodes: [
				{
					id: "C1",
					type: "change",
					name: "Change",
					operations: [{ type: "update", target: "I1" }],
				},
				{ id: "I1", type: "intent", name: "Intent" },
			],
		};
		const result = removeNode(doc, "I1");
		assert.ok(result.warnings.some((w) => w.includes("operations")));
	});

	it("throws for missing node", () => {
		const doc = makeDoc([{ id: "I1", type: "intent", name: "A" }]);
		assert.throws(() => removeNode(doc, "NONEXISTENT"), /not found/);
	});
});

describe("updateNode", () => {
	it("updates specified fields", () => {
		const doc = makeDoc([{ id: "I1", type: "intent", name: "Old" }]);
		const newDoc = updateNode(doc, "I1", {
			name: "New",
			description: "Updated",
		});
		assert.equal(newDoc.nodes[0].name, "New");
		assert.equal(newDoc.nodes[0].description, "Updated");
	});

	it("rejects missing node", () => {
		const doc = makeDoc();
		assert.throws(
			() => updateNode(doc, "MISSING", { name: "New" }),
			/not found/,
		);
	});

	it("preserves other nodes", () => {
		const doc = makeDoc([
			{ id: "I1", type: "intent", name: "A" },
			{ id: "I2", type: "intent", name: "B" },
		]);
		const newDoc = updateNode(doc, "I1", { name: "Updated" });
		assert.equal(newDoc.nodes[1].name, "B");
	});
});

describe("addRelationship", () => {
	it("adds to relationships array", () => {
		const doc = makeDoc([
			{ id: "I1", type: "intent", name: "A" },
			{ id: "I2", type: "intent", name: "B" },
		]);
		const newDoc = addRelationship(doc, {
			from: "I1",
			to: "I2",
			type: "refines",
		});
		assert.equal(newDoc.relationships?.length, 1);
		assert.equal(newDoc.relationships?.[0].type, "refines");
	});

	it("throws for missing from node", () => {
		const doc = makeDoc([{ id: "I2", type: "intent", name: "B" }]);
		assert.throws(
			() => addRelationship(doc, { from: "I1", to: "I2", type: "refines" }),
			/Node not found.*I1/,
		);
	});

	it("throws for missing to node", () => {
		const doc = makeDoc([{ id: "I1", type: "intent", name: "A" }]);
		assert.throws(
			() => addRelationship(doc, { from: "I1", to: "I2", type: "refines" }),
			/Node not found.*I2/,
		);
	});
});

describe("removeRelationship", () => {
	it("removes matching relationship", () => {
		const doc: SysProMDocument = {
			nodes: [
				{ id: "I1", type: "intent", name: "A" },
				{ id: "I2", type: "intent", name: "B" },
			],
			relationships: [{ from: "I1", to: "I2", type: "refines" }],
		};
		const newDoc = removeRelationship(doc, "I1", "refines", "I2");
		assert.equal(newDoc.relationships?.length ?? 0, 0);
	});

	it("throws if relationship not found", () => {
		const doc: SysProMDocument = {
			nodes: [
				{ id: "I1", type: "intent", name: "A" },
				{ id: "I2", type: "intent", name: "B" },
			],
			relationships: [],
		};
		assert.throws(
			() => removeRelationship(doc, "I1", "refines", "I2"),
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
		const newDoc = updateMetadata(doc, { version: "1.0.0" });
		assert.equal(newDoc.metadata?.title, "Old");
		assert.equal(newDoc.metadata?.version, "1.0.0");
	});

	it("creates metadata if missing", () => {
		const doc = makeDoc();
		const newDoc = updateMetadata(doc, { title: "New" });
		assert.equal(newDoc.metadata?.title, "New");
	});
});
