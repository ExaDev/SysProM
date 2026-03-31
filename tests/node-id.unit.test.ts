import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { Node } from "../src/schema.js";

describe("Node ID prefix validation", () => {
	it("accepts conforming numeric ID", () => {
		const result = Node.safeParse({
			id: "DEC1",
			type: "decision",
			name: "Test",
		});
		assert.ok(
			result.success,
			`Expected valid: ${JSON.stringify(result.error?.issues)}`,
		);
	});

	it("accepts conforming ID with descriptive suffix", () => {
		const result = Node.safeParse({
			id: "INV28-CONF1",
			type: "invariant",
			name: "Test",
		});
		assert.ok(result.success);
	});

	it("accepts conforming ID with multi-segment suffix", () => {
		const result = Node.safeParse({
			id: "STG1-DEC-PROPOSED",
			type: "stage",
			name: "Test",
		});
		assert.ok(result.success);
	});

	it("accepts conforming ID with underscore in suffix segment", () => {
		const result = Node.safeParse({
			id: "CON4-DEPENDS_ON",
			type: "concept",
			name: "Test",
		});
		assert.ok(result.success);
	});

	it("rejects ID with wrong prefix for type", () => {
		const result = Node.safeParse({
			id: "CHG1",
			type: "decision",
			name: "Test",
		});
		assert.ok(!result.success, "Should reject wrong prefix");
	});

	it("rejects ID without numeric component", () => {
		const result = Node.safeParse({
			id: "D-FOO",
			type: "decision",
			name: "Test",
		});
		assert.ok(!result.success, "Should reject missing number");
	});

	it("rejects ID with lowercase suffix", () => {
		const result = Node.safeParse({
			id: "DEC1-foo",
			type: "decision",
			name: "Test",
		});
		assert.ok(!result.success, "Should reject lowercase suffix");
	});

	it("rejects old-style descriptive ID", () => {
		const result = Node.safeParse({
			id: "NT-INTENT",
			type: "concept",
			name: "Test",
		});
		assert.ok(!result.success, "Should reject non-conforming ID");
	});

	it("rejects bare short ID for prefixed type", () => {
		const result = Node.safeParse({ id: "G1", type: "gate", name: "Test" });
		assert.ok(!result.success, "Should reject G1 for gate (needs GATE prefix)");
	});
});
