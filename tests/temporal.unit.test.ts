import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { timeline, nodeHistory, stateAt } from "../src/index.js";
import type { SysProMDocument, Node, Relationship } from "../src/schema.js";

function makeDoc(
	nodes: Node[] = [],
	relationships: Relationship[] = [],
): SysProMDocument {
	return {
		nodes,
		relationships: relationships.length > 0 ? relationships : undefined,
		metadata: { title: "Test Document" },
	};
}

// ---------------------------------------------------------------------------
// timeline tests
// ---------------------------------------------------------------------------

describe("timeline", () => {
	it("returns empty array for empty document", () => {
		const doc = makeDoc();
		const events = timeline(doc);
		assert.equal(events.length, 0);
	});

	it("returns empty array when nodes have only boolean lifecycle values", () => {
		const nodes: Node[] = [
			{
				id: "D1",
				type: "decision",
				name: "Test Decision",
				lifecycle: {
					proposed: true,
					accepted: false,
					implemented: true,
				},
			},
		];
		const doc = makeDoc(nodes);
		const events = timeline(doc);
		assert.equal(events.length, 0);
	});

	it("extracts timestamped events and sorts chronologically", () => {
		const nodes: Node[] = [
			{
				id: "D1",
				type: "decision",
				name: "Test Decision",
				lifecycle: {
					proposed: "2025-06-01",
					accepted: "2025-07-15",
					implemented: false,
					reviewed: true,
				},
			},
		];
		const doc = makeDoc(nodes);
		const events = timeline(doc);

		assert.equal(events.length, 2);
		assert.equal(events[0].state, "proposed");
		assert.equal(events[0].timestamp, "2025-06-01");
		assert.equal(events[1].state, "accepted");
		assert.equal(events[1].timestamp, "2025-07-15");
	});

	it("interleaves and sorts events from multiple nodes", () => {
		const nodes: Node[] = [
			{
				id: "D1",
				type: "decision",
				name: "First Decision",
				lifecycle: {
					proposed: "2025-07-01",
					accepted: "2025-08-01",
				},
			},
			{
				id: "D2",
				type: "decision",
				name: "Second Decision",
				lifecycle: {
					proposed: "2025-06-15",
					accepted: "2025-07-15",
				},
			},
		];
		const doc = makeDoc(nodes);
		const events = timeline(doc);

		assert.equal(events.length, 4);
		// Sorted chronologically: D2 proposed, D1 proposed, D2 accepted, D1 accepted
		assert.equal(events[0].nodeId, "D2");
		assert.equal(events[0].timestamp, "2025-06-15");
		assert.equal(events[1].nodeId, "D1");
		assert.equal(events[1].timestamp, "2025-07-01");
		assert.equal(events[2].nodeId, "D2");
		assert.equal(events[2].timestamp, "2025-07-15");
		assert.equal(events[3].nodeId, "D1");
		assert.equal(events[3].timestamp, "2025-08-01");
	});

	it("includes nodes from subsystems", () => {
		const nodes: Node[] = [
			{
				id: "E1",
				type: "element",
				name: "Parent Element",
				subsystem: {
					nodes: [
						{
							id: "D1",
							type: "decision",
							name: "Nested Decision",
							lifecycle: {
								proposed: "2025-05-01",
							},
						},
					],
				},
			},
		];
		const doc = makeDoc(nodes);
		const events = timeline(doc);

		assert.equal(events.length, 1);
		assert.equal(events[0].nodeId, "D1");
		assert.equal(events[0].nodeName, "Nested Decision");
		assert.equal(events[0].timestamp, "2025-05-01");
	});

	it("preserves node metadata in events", () => {
		const nodes: Node[] = [
			{
				id: "D1",
				type: "decision",
				name: "My Decision",
				lifecycle: {
					proposed: "2025-06-01",
				},
			},
		];
		const doc = makeDoc(nodes);
		const events = timeline(doc);

		assert.equal(events[0].nodeId, "D1");
		assert.equal(events[0].nodeName, "My Decision");
		assert.equal(events[0].nodeType, "decision");
		assert.equal(events[0].state, "proposed");
	});
});

// ---------------------------------------------------------------------------
// nodeHistory tests
// ---------------------------------------------------------------------------

describe("nodeHistory", () => {
	it("returns empty array for non-existent node", () => {
		const nodes: Node[] = [
			{
				id: "D1",
				type: "decision",
				name: "Test Decision",
				lifecycle: {
					proposed: "2025-06-01",
				},
			},
		];
		const doc = makeDoc(nodes);
		const history = nodeHistory(doc, "NONEXISTENT");
		assert.equal(history.length, 0);
	});

	it("returns timestamped events for a specific node, sorted chronologically", () => {
		const nodes: Node[] = [
			{
				id: "D1",
				type: "decision",
				name: "Test Decision",
				lifecycle: {
					proposed: "2025-07-15",
					accepted: "2025-06-01",
					reviewed: "2025-08-10",
				},
			},
		];
		const doc = makeDoc(nodes);
		const history = nodeHistory(doc, "D1");

		assert.equal(history.length, 3);
		assert.equal(history[0].state, "accepted");
		assert.equal(history[0].timestamp, "2025-06-01");
		assert.equal(history[1].state, "proposed");
		assert.equal(history[1].timestamp, "2025-07-15");
		assert.equal(history[2].state, "reviewed");
		assert.equal(history[2].timestamp, "2025-08-10");
	});

	it("skips boolean lifecycle entries", () => {
		const nodes: Node[] = [
			{
				id: "D1",
				type: "decision",
				name: "Test Decision",
				lifecycle: {
					proposed: "2025-06-01",
					accepted: true,
					implemented: false,
					reviewed: "2025-07-01",
				},
			},
		];
		const doc = makeDoc(nodes);
		const history = nodeHistory(doc, "D1");

		assert.equal(history.length, 2);
		assert.ok(history.every((e) => typeof e.timestamp === "string"));
		const states = history.map((e) => e.state);
		assert.ok(!states.includes("accepted"));
		assert.ok(!states.includes("implemented"));
	});

	it("finds node in nested subsystem", () => {
		const nodes: Node[] = [
			{
				id: "E1",
				type: "element",
				name: "Parent Element",
				subsystem: {
					nodes: [
						{
							id: "D1",
							type: "decision",
							name: "Nested Decision",
							lifecycle: {
								proposed: "2025-06-01",
								accepted: "2025-07-01",
							},
						},
					],
				},
			},
		];
		const doc = makeDoc(nodes);
		const history = nodeHistory(doc, "D1");

		assert.equal(history.length, 2);
		assert.equal(history[0].nodeId, "D1");
		assert.equal(history[0].nodeName, "Nested Decision");
	});
});

// ---------------------------------------------------------------------------
// stateAt tests
// ---------------------------------------------------------------------------

describe("stateAt", () => {
	it("returns empty array for empty document", () => {
		const doc = makeDoc();
		const states = stateAt(doc, "2025-07-01");
		assert.equal(states.length, 0);
	});

	it("includes states with date <= query timestamp", () => {
		const nodes: Node[] = [
			{
				id: "D1",
				type: "decision",
				name: "Test Decision",
				lifecycle: {
					proposed: "2025-06-01",
					accepted: "2025-07-01",
					reviewed: "2025-08-01",
				},
			},
		];
		const doc = makeDoc(nodes);
		const states = stateAt(doc, "2025-07-15");

		assert.equal(states.length, 1);
		assert.equal(states[0].nodeId, "D1");
		assert.equal(states[0].activeStates.length, 2);
		assert.ok(states[0].activeStates.includes("proposed"));
		assert.ok(states[0].activeStates.includes("accepted"));
	});

	it("excludes states with date > query timestamp", () => {
		const nodes: Node[] = [
			{
				id: "D1",
				type: "decision",
				name: "Test Decision",
				lifecycle: {
					proposed: "2025-06-01",
					accepted: "2025-07-01",
					reviewed: "2025-08-01",
				},
			},
		];
		const doc = makeDoc(nodes);
		const states = stateAt(doc, "2025-07-15");

		const state = states[0];
		assert.ok(!state.activeStates.includes("reviewed"));
	});

	it("includes boolean true states (undated but active)", () => {
		const nodes: Node[] = [
			{
				id: "D1",
				type: "decision",
				name: "Test Decision",
				lifecycle: {
					proposed: "2025-06-01",
					accepted: true,
					implemented: false,
				},
			},
		];
		const doc = makeDoc(nodes);
		const states = stateAt(doc, "2025-07-01");

		assert.equal(states.length, 1);
		const state = states[0];
		assert.equal(state.activeStates.length, 2);
		assert.ok(state.activeStates.includes("proposed"));
		assert.ok(state.activeStates.includes("accepted"));
	});

	it("excludes boolean false states", () => {
		const nodes: Node[] = [
			{
				id: "D1",
				type: "decision",
				name: "Test Decision",
				lifecycle: {
					proposed: true,
					accepted: false,
					reviewed: true,
				},
			},
		];
		const doc = makeDoc(nodes);
		const states = stateAt(doc, "2025-07-01");

		assert.equal(states.length, 1);
		const state = states[0];
		assert.equal(state.activeStates.length, 2);
		assert.ok(state.activeStates.includes("proposed"));
		assert.ok(state.activeStates.includes("reviewed"));
		assert.ok(!state.activeStates.includes("accepted"));
	});

	it("excludes nodes with no active states", () => {
		const nodes: Node[] = [
			{
				id: "D1",
				type: "decision",
				name: "Test Decision",
				lifecycle: {
					proposed: false,
					accepted: false,
				},
			},
			{
				id: "D2",
				type: "decision",
				name: "Active Decision",
				lifecycle: {
					proposed: true,
				},
			},
		];
		const doc = makeDoc(nodes);
		const states = stateAt(doc, "2025-07-01");

		assert.equal(states.length, 1);
		assert.equal(states[0].nodeId, "D2");
	});

	it("handles nodes without lifecycle gracefully", () => {
		const nodes: Node[] = [
			{
				id: "I1",
				type: "intent",
				name: "Test Intent",
			},
		];
		const doc = makeDoc(nodes);
		const states = stateAt(doc, "2025-07-01");

		assert.equal(states.length, 0);
	});

	it("sorts active states alphabetically", () => {
		const nodes: Node[] = [
			{
				id: "D1",
				type: "decision",
				name: "Test Decision",
				lifecycle: {
					reviewed: true,
					proposed: true,
					accepted: true,
				},
			},
		];
		const doc = makeDoc(nodes);
		const states = stateAt(doc, "2025-07-01");

		assert.equal(states[0].activeStates.length, 3);
		assert.deepEqual(states[0].activeStates, [
			"accepted",
			"proposed",
			"reviewed",
		]);
	});

	it("sorts result by nodeId", () => {
		const nodes: Node[] = [
			{
				id: "Z1",
				type: "decision",
				name: "Z Decision",
				lifecycle: { proposed: true },
			},
			{
				id: "A1",
				type: "decision",
				name: "A Decision",
				lifecycle: { proposed: true },
			},
			{
				id: "M1",
				type: "decision",
				name: "M Decision",
				lifecycle: { proposed: true },
			},
		];
		const doc = makeDoc(nodes);
		const states = stateAt(doc, "2025-07-01");

		assert.equal(states.length, 3);
		assert.equal(states[0].nodeId, "A1");
		assert.equal(states[1].nodeId, "M1");
		assert.equal(states[2].nodeId, "Z1");
	});

	it("includes states from subsystems", () => {
		const nodes: Node[] = [
			{
				id: "E1",
				type: "element",
				name: "Parent Element",
				subsystem: {
					nodes: [
						{
							id: "D1",
							type: "decision",
							name: "Nested Decision",
							lifecycle: {
								proposed: "2025-06-01",
							},
						},
					],
				},
			},
		];
		const doc = makeDoc(nodes);
		const states = stateAt(doc, "2025-07-01");

		assert.equal(states.length, 1);
		assert.equal(states[0].nodeId, "D1");
		assert.equal(states[0].activeStates[0], "proposed");
	});

	it("handles exact date match as inclusive", () => {
		const nodes: Node[] = [
			{
				id: "D1",
				type: "decision",
				name: "Test Decision",
				lifecycle: {
					proposed: "2025-06-01",
					accepted: "2025-07-01",
				},
			},
		];
		const doc = makeDoc(nodes);
		const states = stateAt(doc, "2025-07-01");

		const state = states[0];
		assert.ok(state.activeStates.includes("accepted"));
	});
});

// ---------------------------------------------------------------------------
// Full ISO timestamp tests (with time component)
// ---------------------------------------------------------------------------

describe("full ISO timestamps", () => {
	it("timeline sorts full ISO timestamps correctly", () => {
		const nodes: Node[] = [
			{
				id: "D1",
				type: "decision",
				name: "First",
				lifecycle: {
					proposed: "2025-06-10T09:15:00Z",
					accepted: "2025-06-10T14:30:00Z",
				},
			},
		];
		const doc = makeDoc(nodes);
		const events = timeline(doc);

		assert.equal(events.length, 2);
		assert.equal(events[0].state, "proposed");
		assert.equal(events[0].timestamp, "2025-06-10T09:15:00Z");
		assert.equal(events[1].state, "accepted");
		assert.equal(events[1].timestamp, "2025-06-10T14:30:00Z");
	});

	it("timeline interleaves date-only and full timestamps", () => {
		const nodes: Node[] = [
			{
				id: "D1",
				type: "decision",
				name: "First",
				lifecycle: { proposed: "2025-06-10" },
			},
			{
				id: "D2",
				type: "decision",
				name: "Second",
				lifecycle: { proposed: "2025-06-10T08:00:00Z" },
			},
		];
		const doc = makeDoc(nodes);
		const events = timeline(doc);

		assert.equal(events.length, 2);
		// Date-only "2025-06-10" sorts before "2025-06-10T08:00:00Z" lexicographically
		assert.equal(events[0].nodeId, "D1");
		assert.equal(events[1].nodeId, "D2");
	});

	it("stateAt works with full ISO timestamps", () => {
		const nodes: Node[] = [
			{
				id: "D1",
				type: "decision",
				name: "First",
				lifecycle: {
					proposed: "2025-06-10T09:00:00Z",
					accepted: "2025-06-10T15:00:00Z",
				},
			},
		];
		const doc = makeDoc(nodes);

		// Query at noon — proposed should be active, accepted should not
		const states = stateAt(doc, "2025-06-10T12:00:00Z");
		assert.equal(states.length, 1);
		assert.ok(states[0].activeStates.includes("proposed"));
		assert.ok(!states[0].activeStates.includes("accepted"));
	});

	it("nodeHistory preserves full ISO timestamps", () => {
		const nodes: Node[] = [
			{
				id: "D1",
				type: "decision",
				name: "First",
				lifecycle: {
					proposed: "2025-06-10T09:15:30Z",
					accepted: "2025-06-22T14:30:00+01:00",
				},
			},
		];
		const doc = makeDoc(nodes);
		const events = nodeHistory(doc, "D1");

		assert.equal(events.length, 2);
		assert.equal(events[0].timestamp, "2025-06-10T09:15:30Z");
		assert.equal(events[1].timestamp, "2025-06-22T14:30:00+01:00");
	});
});
