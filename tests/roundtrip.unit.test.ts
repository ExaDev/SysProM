import { describe, it, beforeEach, afterEach } from "node:test";
import { strict as assert } from "node:assert";
import { mkdtempSync, rmSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
	jsonToMarkdownSingle,
	jsonToMarkdownMultiDoc,
} from "../src/json-to-md.js";
import {
	markdownSingleToJson,
	markdownMultiDocToJson,
} from "../src/md-to-json.js";
import type { SysProMDocument } from "../src/schema.js";

function fixture(): SysProMDocument {
	return {
		metadata: {
			title: "Round Trip Test",
			doc_type: "sysprom",
			scope: "system",
			status: "active",
			version: 1,
		},
		nodes: [
			{
				id: "I1",
				type: "intent",
				name: "Test Intent",
				description: "Enable testing.",
			},
			{
				id: "CN1",
				type: "concept",
				name: "Test Concept",
				description: "A concept.",
			},
			{
				id: "CP1",
				type: "capability",
				name: "Test Capability",
				description: "A capability.",
			},
			{
				id: "INV1",
				type: "invariant",
				name: "Test Invariant",
				description: "Must hold.",
			},
			{
				id: "PR1",
				type: "principle",
				name: "Test Principle",
				description: "A value.",
			},
			{
				id: "POL1",
				type: "policy",
				name: "Test Policy",
				description: "A rule.",
			},
			{
				id: "EL1",
				type: "element",
				name: "Test Element",
				description: "An element.",
				status: "active",
			},
			{
				id: "R1",
				type: "realisation",
				name: "Test Realisation",
				description: "A realisation.",
				status: "active",
			},
			{
				id: "D1",
				type: "decision",
				name: "Test Decision",
				context: "We need to decide.",
				options: [
					{ id: "O1", description: "Option A" },
					{ id: "O2", description: "Option B" },
				],
				selected: "O2",
				rationale: "B is better.",
				lifecycle: { proposed: true, accepted: true, implemented: false },
			},
			{
				id: "CH1",
				type: "change",
				name: "Test Change",
				description: "A change.",
				scope: ["EL1"],
				operations: [{ type: "add", target: "EL1" }],
				plan: [
					{ description: "Step one", done: true },
					{ description: "Step two", done: false },
				],
				lifecycle: { defined: true, introduced: true, complete: false },
			},
			{
				id: "V1",
				type: "view",
				name: "Domain View",
				includes: ["I1", "CN1", "CP1"],
			},
		],
		relationships: [
			{ from: "CN1", to: "I1", type: "refines" },
			{ from: "CP1", to: "CN1", type: "refines" },
			{ from: "EL1", to: "CP1", type: "realises" },
			{ from: "R1", to: "EL1", type: "implements" },
			{ from: "D1", to: "EL1", type: "affects" },
			{ from: "D1", to: "INV1", type: "must_preserve" },
			{ from: "CH1", to: "D1", type: "affects" },
		],
		external_references: [
			{
				role: "source",
				identifier: "https://example.com",
				node_id: "I1",
				description: "Source.",
			},
		],
	};
}

function assertNodesPresent(
	result: SysProMDocument,
	original: SysProMDocument,
) {
	for (const orig of original.nodes) {
		const found = result.nodes.find((n) => n.id === orig.id);
		assert.ok(found, `Missing node ${orig.id} after round trip`);
		assert.equal(found.name, orig.name, `Node ${orig.id} name mismatch`);
		assert.equal(found.type, orig.type, `Node ${orig.id} type mismatch`);
	}
}

function assertRelationshipsPresent(
	result: SysProMDocument,
	original: SysProMDocument,
) {
	const origRels = original.relationships ?? [];
	const resultRels = result.relationships ?? [];
	for (const orig of origRels) {
		const found = resultRels.find(
			(r) => r.from === orig.from && r.to === orig.to && r.type === orig.type,
		);
		assert.ok(
			found,
			`Missing relationship ${orig.from} -${orig.type}-> ${orig.to} after round trip`,
		);
	}
}

function assertDecisionFields(result: SysProMDocument) {
	const d1 = result.nodes.find((n) => n.id === "D1");
	assert.ok(d1, "D1 missing");
	assert.ok(d1.options, "D1 missing options");
	assert.equal(d1.options.length, 2, "D1 should have 2 options");
	assert.equal(d1.selected, "O2", "D1 selected mismatch");
}

function assertChangeFields(result: SysProMDocument) {
	const ch1 = result.nodes.find((n) => n.id === "CH1");
	assert.ok(ch1, "CH1 missing");
	assert.ok(ch1.scope, "CH1 missing scope");
	assert.ok(ch1.scope.includes("EL1"), "CH1 scope should include EL1");
	assert.ok(ch1.plan, "CH1 missing plan");
	assert.equal(ch1.plan.length, 2, "CH1 should have 2 plan items");
	assert.equal(ch1.plan[0].done, true, "CH1 plan[0] should be done");
	assert.equal(ch1.plan[1].done, false, "CH1 plan[1] should not be done");
}

function assertLifecycle(result: SysProMDocument) {
	const d1 = result.nodes.find((n) => n.id === "D1");
	assert.ok(d1?.lifecycle, "D1 missing lifecycle");
	assert.equal(d1.lifecycle.proposed, true);
	assert.equal(d1.lifecycle.accepted, true);
	assert.equal(d1.lifecycle.implemented, false);
}

// ---------------------------------------------------------------------------
// Single-file round trip
// ---------------------------------------------------------------------------

describe("round trip: single file", () => {
	it("JSON → MD → JSON preserves all nodes", () => {
		const original = fixture();
		const md = jsonToMarkdownSingle(original);
		const result = markdownSingleToJson(md);
		assertNodesPresent(result, original);
	});

	it("JSON → MD → JSON preserves relationships from table", () => {
		const original = fixture();
		const md = jsonToMarkdownSingle(original);
		const result = markdownSingleToJson(md);
		assertRelationshipsPresent(result, original);
	});

	it("JSON → MD → JSON preserves decision fields", () => {
		const original = fixture();
		const md = jsonToMarkdownSingle(original);
		const result = markdownSingleToJson(md);
		assertDecisionFields(result);
	});

	it("JSON → MD → JSON preserves change fields", () => {
		const original = fixture();
		const md = jsonToMarkdownSingle(original);
		const result = markdownSingleToJson(md);
		assertChangeFields(result);
	});

	it("JSON → MD → JSON preserves lifecycle checkboxes", () => {
		const original = fixture();
		const md = jsonToMarkdownSingle(original);
		const result = markdownSingleToJson(md);
		assertLifecycle(result);
	});

	it("JSON → MD → JSON preserves view includes", () => {
		const original = fixture();
		const md = jsonToMarkdownSingle(original);
		const result = markdownSingleToJson(md);
		const v1 = result.nodes.find((n) => n.id === "V1");
		assert.ok(v1?.includes, "V1 missing includes");
		assert.deepEqual(v1.includes, ["I1", "CN1", "CP1"]);
	});

	it("JSON → MD → JSON preserves metadata", () => {
		const original = fixture();
		const md = jsonToMarkdownSingle(original);
		const result = markdownSingleToJson(md);
		assert.equal(result.metadata?.title, "Round Trip Test");
		assert.equal(result.metadata?.doc_type, "sysprom");
	});

	it("round-trips lifecycle date values", () => {
		const original: SysProMDocument = {
			metadata: { title: "Lifecycle Date Test" },
			nodes: [
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
			],
		};
		const md = jsonToMarkdownSingle(original);
		const result = markdownSingleToJson(md);

		const d1 = result.nodes.find((n) => n.id === "D1");
		assert.ok(d1?.lifecycle, "D1 missing lifecycle");
		// Date values should be preserved as strings
		assert.equal(d1.lifecycle.proposed, "2025-06-01");
		assert.equal(d1.lifecycle.accepted, "2025-07-15");
		// Boolean values should remain booleans
		assert.equal(d1.lifecycle.implemented, false);
		assert.equal(d1.lifecycle.reviewed, true);
	});
});

// ---------------------------------------------------------------------------
// Multi-doc round trip
// ---------------------------------------------------------------------------

describe("round trip: multi-doc", () => {
	let tmpDir: string;

	beforeEach(() => {
		tmpDir = mkdtempSync(join(tmpdir(), "sysprom-rt-"));
	});

	afterEach(() => {
		rmSync(tmpDir, { recursive: true, force: true });
	});

	it("JSON → MD → JSON preserves all nodes", () => {
		const original = fixture();
		jsonToMarkdownMultiDoc(original, tmpDir);
		const result = markdownMultiDocToJson(tmpDir);
		assertNodesPresent(result, original);
	});

	it("JSON → MD → JSON preserves relationships from inline lists", () => {
		const original = fixture();
		jsonToMarkdownMultiDoc(original, tmpDir);
		const result = markdownMultiDocToJson(tmpDir);
		assertRelationshipsPresent(result, original);
	});

	it("JSON → MD → JSON preserves decision fields", () => {
		const original = fixture();
		jsonToMarkdownMultiDoc(original, tmpDir);
		const result = markdownMultiDocToJson(tmpDir);
		assertDecisionFields(result);
	});

	it("JSON → MD → JSON preserves change fields", () => {
		const original = fixture();
		jsonToMarkdownMultiDoc(original, tmpDir);
		const result = markdownMultiDocToJson(tmpDir);
		assertChangeFields(result);
	});

	it("JSON → MD → JSON preserves lifecycle checkboxes", () => {
		const original = fixture();
		jsonToMarkdownMultiDoc(original, tmpDir);
		const result = markdownMultiDocToJson(tmpDir);
		assertLifecycle(result);
	});

	it("JSON → MD → JSON preserves view includes", () => {
		const original = fixture();
		jsonToMarkdownMultiDoc(original, tmpDir);
		const result = markdownMultiDocToJson(tmpDir);
		const v1 = result.nodes.find((n) => n.id === "V1");
		assert.ok(v1?.includes, "V1 missing includes");
		assert.deepEqual(v1.includes, ["I1", "CN1", "CP1"]);
	});

	it("JSON → MD → JSON preserves metadata", () => {
		const original = fixture();
		jsonToMarkdownMultiDoc(original, tmpDir);
		const result = markdownMultiDocToJson(tmpDir);
		assert.equal(result.metadata?.title, "Round Trip Test");
		assert.equal(result.metadata?.doc_type, "sysprom");
	});

	it("JSON → MD → JSON preserves external references", () => {
		const original = fixture();
		jsonToMarkdownMultiDoc(original, tmpDir);
		const result = markdownMultiDocToJson(tmpDir);
		assert.ok(result.external_references, "Missing external references");
		assert.ok(result.external_references.length > 0, "No external references");
		const ref = result.external_references.find(
			(r) => r.identifier === "https://example.com",
		);
		assert.ok(ref, "Missing source reference");
		assert.equal(ref.role, "source");
	});
});

// ---------------------------------------------------------------------------
// Multi-line text round trip (context, rationale as arrays)
// ---------------------------------------------------------------------------

describe("round trip: multi-line text fields", () => {
	function multiLineFixture(): SysProMDocument {
		return {
			metadata: { title: "Multi-Line Test" },
			nodes: [
				{
					id: "D1",
					type: "decision",
					name: "Test Decision",
					context: [
						"The model needs to represent systems, workflows, and history.",
						"Mixing these concerns makes the graph hard to query and reason about.",
					],
					options: [
						{ id: "O1", description: "Option A" },
						{ id: "O2", description: "Option B" },
					],
					selected: "O2",
					rationale: [
						"Grouping into families enforces separation of concerns.",
						"Domain structure should not be tangled with process mechanics or evolution history.",
					],
				},
			],
		};
	}

	it("single-file: preserves multi-line context array", () => {
		const original = multiLineFixture();
		const md = jsonToMarkdownSingle(original);
		const result = markdownSingleToJson(md);
		const d1 = result.nodes.find((n) => n.id === "D1");
		assert.ok(d1, "D1 missing");
		assert.deepEqual(d1.context, [
			"The model needs to represent systems, workflows, and history.",
			"Mixing these concerns makes the graph hard to query and reason about.",
		]);
	});

	it("single-file: preserves multi-line rationale array", () => {
		const original = multiLineFixture();
		const md = jsonToMarkdownSingle(original);
		const result = markdownSingleToJson(md);
		const d1 = result.nodes.find((n) => n.id === "D1");
		assert.ok(d1, "D1 missing");
		assert.deepEqual(d1.rationale, [
			"Grouping into families enforces separation of concerns.",
			"Domain structure should not be tangled with process mechanics or evolution history.",
		]);
	});

	it("multi-doc: preserves multi-line context array", () => {
		const original = multiLineFixture();
		const tmpDir = mkdtempSync(join(tmpdir(), "sysprom-ml-"));
		try {
			jsonToMarkdownMultiDoc(original, tmpDir);
			const result = markdownMultiDocToJson(tmpDir);
			const d1 = result.nodes.find((n) => n.id === "D1");
			assert.ok(d1, "D1 missing");
			assert.deepEqual(d1.context, [
				"The model needs to represent systems, workflows, and history.",
				"Mixing these concerns makes the graph hard to query and reason about.",
			]);
		} finally {
			rmSync(tmpDir, { recursive: true, force: true });
		}
	});

	it("multi-doc: preserves multi-line rationale array", () => {
		const original = multiLineFixture();
		const tmpDir = mkdtempSync(join(tmpdir(), "sysprom-ml-"));
		try {
			jsonToMarkdownMultiDoc(original, tmpDir);
			const result = markdownMultiDocToJson(tmpDir);
			const d1 = result.nodes.find((n) => n.id === "D1");
			assert.ok(d1, "D1 missing");
			assert.deepEqual(d1.rationale, [
				"Grouping into families enforces separation of concerns.",
				"Domain structure should not be tangled with process mechanics or evolution history.",
			]);
		} finally {
			rmSync(tmpDir, { recursive: true, force: true });
		}
	});
});

// ---------------------------------------------------------------------------
// $schema round trip
// ---------------------------------------------------------------------------

describe("round trip: $schema preservation", () => {
	it("single-file: preserves $schema through round-trip", () => {
		const original: SysProMDocument = {
			$schema: "./schema.json",
			metadata: { title: "Schema Test" },
			nodes: [{ id: "I1", type: "intent", name: "Test", description: "Test." }],
		};
		const md = jsonToMarkdownSingle(original);
		const result = markdownSingleToJson(md);
		assert.equal(result.$schema, "./schema.json");
	});

	it("multi-doc: preserves $schema through round-trip", () => {
		const original: SysProMDocument = {
			$schema: "./schema.json",
			metadata: { title: "Schema Test" },
			nodes: [{ id: "I1", type: "intent", name: "Test", description: "Test." }],
		};
		const tmpDir = mkdtempSync(join(tmpdir(), "sysprom-schema-"));
		try {
			jsonToMarkdownMultiDoc(original, tmpDir);
			const result = markdownMultiDocToJson(tmpDir);
			assert.equal(result.$schema, "./schema.json");
		} finally {
			rmSync(tmpDir, { recursive: true, force: true });
		}
	});
});

// ---------------------------------------------------------------------------
// Subsystem round trip
// ---------------------------------------------------------------------------

describe("round trip: subsystems", () => {
	let tmpDir: string;

	beforeEach(() => {
		tmpDir = mkdtempSync(join(tmpdir(), "sysprom-sub-rt-"));
	});

	afterEach(() => {
		rmSync(tmpDir, { recursive: true, force: true });
	});

	it("JSON → MD → JSON preserves subsystem nodes", () => {
		const original: SysProMDocument = {
			metadata: { title: "Parent" },
			nodes: [
				{
					id: "I1",
					type: "intent",
					name: "Parent Intent",
					description: "Parent.",
				},
				{
					id: "EL1",
					type: "element",
					name: "Child Feature",
					status: "active",
					subsystem: {
						nodes: [
							{
								id: "I1",
								type: "intent",
								name: "Child Intent",
								description: "Child.",
							},
							{
								id: "INV1",
								type: "invariant",
								name: "Child Rule",
								description: "Must hold.",
							},
						],
					},
				},
			],
		};

		jsonToMarkdownMultiDoc(original, tmpDir);
		const result = markdownMultiDocToJson(tmpDir);

		const el1 = result.nodes.find((n) => n.id === "EL1");
		assert.ok(el1?.subsystem, "EL1 missing subsystem after round trip");
		assert.ok(el1.subsystem.nodes.length > 0, "Subsystem should have nodes");

		const childIntent = el1.subsystem.nodes.find((n) => n.id === "I1");
		assert.ok(childIntent, "Child I1 missing from subsystem");
		assert.equal(childIntent.name, "Child Intent");
	});
});
