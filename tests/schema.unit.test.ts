import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import * as z from "zod";
import schema from "../schema.json" with { type: "json" };
import spmDocument from "../.SysProM.json" with { type: "json" };

type JSONSchema = Parameters<typeof z.fromJSONSchema>[0];

function isJSONSchema(value: unknown): value is JSONSchema {
	return typeof value === "object" && value !== null && "type" in value;
}

if (!isJSONSchema(schema)) {
	throw new Error("schema.json is not a valid JSONSchema object");
}

const SysProM = z.fromJSONSchema(schema);

function valid(data: unknown) {
	const result = SysProM.safeParse(data);
	if (!result.success) {
		console.error(result.error.issues);
	}
	assert.ok(result.success, "Expected data to be valid");
}

function invalid(data: unknown) {
	const result = SysProM.safeParse(data);
	assert.ok(!result.success, "Expected data to be invalid");
}

describe("schema structure", () => {
	it("rejects empty object", () => {
		invalid({});
	});

	it("accepts minimal valid document (single node)", () => {
		valid({
			nodes: [{ id: "INT1", type: "intent", name: "Test" }],
		});
	});

	it("rejects node without id", () => {
		invalid({
			nodes: [{ type: "intent", name: "Test" }],
		});
	});

	it("rejects node without type", () => {
		invalid({
			nodes: [{ id: "INT1", name: "Test" }],
		});
	});

	it("rejects node without name", () => {
		invalid({
			nodes: [{ id: "INT1", type: "intent" }],
		});
	});
});

describe("metadata", () => {
	it("accepts full metadata", () => {
		valid({
			metadata: {
				title: "My System",
				doc_type: "sysprom",
				scope: "system",
				status: "active",
				version: 1,
			},
			nodes: [{ id: "INT1", type: "intent", name: "Test" }],
		});
	});

	it("accepts doc_type other than sysprom (for subsystems)", () => {
		valid({
			metadata: {
				title: "Sync Feature",
				doc_type: "feature",
				scope: "feature",
			},
			nodes: [{ id: "INT1", type: "intent", name: "Test" }],
		});
	});

	it("accepts string version", () => {
		valid({
			metadata: { version: "2.1.0" },
			nodes: [{ id: "INT1", type: "intent", name: "Test" }],
		});
	});

	it("accepts integer version", () => {
		valid({
			metadata: { version: 3 },
			nodes: [{ id: "INT1", type: "intent", name: "Test" }],
		});
	});

	it("accepts additional metadata fields (extensibility)", () => {
		valid({
			metadata: { title: "Test", custom_field: "hello" },
			nodes: [{ id: "INT1", type: "intent", name: "Test" }],
		});
	});
});

describe("node types", () => {
	const coreTypes = [
		"intent",
		"concept",
		"capability",
		"element",
		"realisation",
		"invariant",
		"principle",
		"policy",
		"protocol",
		"stage",
		"role",
		"gate",
		"mode",
		"artefact",
		"artefact_flow",
		"decision",
		"change",
		"view",
		"milestone",
		"version",
	];

	for (const type of coreTypes) {
		it(`accepts core node type: ${type}`, () => {
			valid({
				nodes: [{ id: "N1", type, name: "Test" }],
			});
		});
	}

	it("rejects unknown node types", () => {
		invalid({
			nodes: [{ id: "N1", type: "custom_widget", name: "Test" }],
		});
	});
});

describe("node lifecycle", () => {
	it("accepts status field", () => {
		valid({
			nodes: [{ id: "N1", type: "intent", name: "Test", status: "active" }],
		});
	});

	it("accepts lifecycle boolean map", () => {
		valid({
			nodes: [
				{
					id: "DEC1",
					type: "decision",
					name: "Test",
					lifecycle: {
						proposed: true,
						accepted: true,
						implemented: false,
					},
				},
			],
		});
	});

	it("rejects unknown status values", () => {
		invalid({
			nodes: [
				{ id: "N1", type: "intent", name: "Test", status: "custom_status" },
			],
		});
	});
});

describe("decision nodes", () => {
	it("accepts full decision with context, options, selected, rationale", () => {
		valid({
			nodes: [
				{
					id: "DEC1",
					type: "decision",
					name: "Choose approach",
					context: "We need to pick an algorithm",
					options: [
						{ id: "O1", description: "Option A" },
						{ id: "O2", description: "Option B" },
					],
					selected: "O2",
					rationale: "Option B handles edge cases better",
				},
			],
		});
	});

	it("accepts decision without optional fields", () => {
		valid({
			nodes: [{ id: "DEC1", type: "decision", name: "Choose approach" }],
		});
	});
});

describe("change nodes", () => {
	it("accepts full change with scope, operations, plan, propagation", () => {
		valid({
			nodes: [
				{
					id: "CHG1",
					type: "change",
					name: "Add feature",
					scope: ["ELEM1", "ELEM2"],
					operations: [
						{ type: "add", target: "ELEM3", description: "Add new element" },
						{ type: "update", target: "ELEM1" },
						{ type: "remove", target: "ELEM2" },
						{ type: "link", description: "Link ELEM3 to CAP1" },
					],
					plan: [
						{ description: "Design interface", done: true },
						{ description: "Implement", done: false },
						{ description: "Test" },
					],
					propagation: {
						concept: true,
						structure: true,
						realisation: false,
						adoption: false,
					},
				},
			],
		});
	});
});

describe("view nodes", () => {
	it("accepts view with includes", () => {
		valid({
			nodes: [
				{
					id: "VIEW1",
					type: "view",
					name: "Domain View",
					includes: ["INT1", "CON1", "CAP1", "ELEM1", "REAL1"],
				},
			],
		});
	});
});

describe("artefact flow nodes", () => {
	it("accepts artefact_flow with input and output", () => {
		valid({
			nodes: [
				{
					id: "FLOW1",
					type: "artefact_flow",
					name: "Request to Plan",
					input: "ART1",
					output: "ART2",
				},
			],
		});
	});
});

describe("relationships", () => {
	const coreRelationshipTypes = [
		"refines",
		"realises",
		"implements",
		"depends_on",
		"constrained_by",
		"affects",
		"supersedes",
		"must_preserve",
		"performs",
		"part_of",
		"precedes",
		"must_follow",
		"blocks",
		"routes_to",
		"governed_by",
		"modifies",
		"triggered_by",
		"applies_to",
		"produces",
		"consumes",
		"transforms_into",
		"selects",
		"requires",
		"disables",
	];

	for (const type of coreRelationshipTypes) {
		it(`accepts core relationship type: ${type}`, () => {
			valid({
				nodes: [
					{ id: "A", type: "element", name: "A" },
					{ id: "B", type: "element", name: "B" },
				],
				relationships: [{ from: "A", to: "B", type }],
			});
		});
	}

	it("rejects unknown relationship types", () => {
		invalid({
			nodes: [
				{ id: "A", type: "element", name: "A" },
				{ id: "B", type: "element", name: "B" },
			],
			relationships: [{ from: "A", to: "B", type: "custom_rel" }],
		});
	});

	it("accepts relationship with description", () => {
		valid({
			nodes: [
				{ id: "A", type: "element", name: "A" },
				{ id: "B", type: "element", name: "B" },
			],
			relationships: [
				{
					from: "A",
					to: "B",
					type: "depends_on",
					description: "A needs B for processing",
				},
			],
		});
	});

	it("accepts additional properties on relationships (extensibility)", () => {
		valid({
			nodes: [
				{ id: "A", type: "element", name: "A" },
				{ id: "B", type: "element", name: "B" },
			],
			relationships: [{ from: "A", to: "B", type: "depends_on", weight: 0.8 }],
		});
	});

	it("rejects relationship without from", () => {
		invalid({
			nodes: [{ id: "A", type: "element", name: "A" }],
			relationships: [{ to: "A", type: "refines" }],
		});
	});

	it("rejects relationship without to", () => {
		invalid({
			nodes: [{ id: "A", type: "element", name: "A" }],
			relationships: [{ from: "A", type: "refines" }],
		});
	});

	it("rejects relationship without type", () => {
		invalid({
			nodes: [{ id: "A", type: "element", name: "A" }],
			relationships: [{ from: "A", to: "A" }],
		});
	});
});

describe("external references", () => {
	it("accepts external reference at graph level", () => {
		valid({
			nodes: [{ id: "DEC1", type: "decision", name: "Test" }],
			external_references: [
				{
					role: "context",
					identifier: "https://example.com/research.pdf",
					node_id: "DEC1",
					description: "Research that informed this decision",
				},
			],
		});
	});

	it("accepts external reference inline on a node", () => {
		valid({
			nodes: [
				{
					id: "DEC1",
					type: "decision",
					name: "Test",
					external_references: [
						{
							role: "evidence",
							identifier: "doi:10.1234/example",
						},
					],
				},
			],
		});
	});

	it("accepts internalised content", () => {
		valid({
			nodes: [
				{
					id: "DEC1",
					type: "decision",
					name: "Test",
					external_references: [
						{
							role: "input",
							identifier: "design-notes-2026-03",
							internalised:
								"The key finding was that existing systems lack process modelling.",
						},
					],
				},
			],
		});
	});

	it("accepts all core reference roles", () => {
		const roles = [
			"input",
			"output",
			"context",
			"evidence",
			"source",
			"standard",
			"prior_art",
		];
		for (const role of roles) {
			valid({
				nodes: [{ id: "N1", type: "intent", name: "Test" }],
				external_references: [
					{ role, identifier: "https://example.com", node_id: "N1" },
				],
			});
		}
	});

	it("rejects unknown roles", () => {
		invalid({
			nodes: [{ id: "N1", type: "intent", name: "Test" }],
			external_references: [
				{
					role: "custom_role",
					identifier: "https://example.com",
					node_id: "N1",
				},
			],
		});
	});
});

describe("recursive composition (subsystem)", () => {
	it("accepts a node with a nested subsystem", () => {
		valid({
			nodes: [
				{
					id: "F1",
					type: "element",
					name: "Sync Feature",
					subsystem: {
						nodes: [
							{ id: "INT1", type: "intent", name: "Synchronised Access" },
							{ id: "INV1", type: "invariant", name: "Requires Remote" },
						],
						relationships: [{ from: "INV1", to: "INT1", type: "constrained_by" }],
					},
				},
			],
		});
	});

	it("accepts deeply nested subsystems", () => {
		valid({
			nodes: [
				{
					id: "SYS",
					type: "element",
					name: "Root",
					subsystem: {
						nodes: [
							{
								id: "SUB1",
								type: "element",
								name: "Level 1",
								subsystem: {
									nodes: [
										{
											id: "SUB2",
											type: "element",
											name: "Level 2",
											subsystem: {
												nodes: [{ id: "LEAF", type: "intent", name: "Leaf" }],
											},
										},
									],
								},
							},
						],
					},
				},
			],
		});
	});
});

describe("node extensibility", () => {
	it("accepts additional properties on nodes", () => {
		valid({
			nodes: [
				{
					id: "N1",
					type: "element",
					name: "Test",
					custom_field: "hello",
					priority: 5,
					tags: ["important", "v2"],
				},
			],
		});
	});
});

describe("sysprom.spm.json", () => {
	it("validates against the schema", () => {
		const result = SysProM.safeParse(spmDocument);
		if (!result.success) {
			console.error(result.error.issues);
		}
		assert.ok(
			result.success,
			"sysprom.spm.json should be a valid SysProM document",
		);
	});

	it("contains all expected node families", () => {
		const types = new Set(spmDocument.nodes.map((n) => n.type));
		for (const expected of [
			"intent",
			"concept",
			"capability",
			"principle",
			"invariant",
			"policy",
			"element",
			"realisation",
			"decision",
			"change",
			"view",
		]) {
			assert.ok(types.has(expected), `Missing node type: ${expected}`);
		}
	});

	it("has unique node IDs", () => {
		const ids = spmDocument.nodes.map((n) => n.id);
		const unique = new Set(ids);
		assert.equal(ids.length, unique.size, "Duplicate node IDs found");
	});

	it("relationships reference valid node IDs", () => {
		const ids = new Set(spmDocument.nodes.map((n) => n.id));
		for (const rel of spmDocument.relationships) {
			assert.ok(
				ids.has(rel.from),
				`Relationship references unknown source: ${rel.from}`,
			);
			assert.ok(
				ids.has(rel.to),
				`Relationship references unknown target: ${rel.to}`,
			);
		}
	});

	it("every decision has options and a selected option", () => {
		const decisions = spmDocument.nodes.filter((n) => n.type === "decision");
		for (const d of decisions) {
			assert.ok(
				d.options && d.options.length > 0,
				`Decision ${d.id} has no options`,
			);
			assert.ok(d.selected, `Decision ${d.id} has no selected option`);
		}
	});

	it("every change references at least one decision via relationships", () => {
		const changeIds = new Set(
			spmDocument.nodes.filter((n) => n.type === "change").map((n) => n.id),
		);
		const decisionIds = new Set(
			spmDocument.nodes.filter((n) => n.type === "decision").map((n) => n.id),
		);
		for (const chId of changeIds) {
			const targets = spmDocument.relationships
				.filter((r) => r.from === chId)
				.map((r) => r.to);
			const linksToDecision = targets.some((t) => decisionIds.has(t));
			assert.ok(
				linksToDecision,
				`Change ${chId} does not reference any decision`,
			);
		}
	});

	it("decisions affecting domain nodes have must_preserve relationships", () => {
		const DOMAIN_TYPES = new Set([
			"intent",
			"concept",
			"capability",
			"element",
			"invariant",
		]);
		const nodeTypes = new Map(spmDocument.nodes.map((n) => [n.id, n.type]));

		for (const node of spmDocument.nodes.filter((n) => n.type === "decision")) {
			const affects = spmDocument.relationships.filter(
				(r) => r.from === node.id && r.type === "affects",
			);
			const affectsDomain = affects.some((r) =>
				DOMAIN_TYPES.has(nodeTypes.get(r.to) ?? ""),
			);

			if (!affectsDomain) continue;

			const preserves = spmDocument.relationships.filter(
				(r) => r.from === node.id && r.type === "must_preserve",
			);
			assert.ok(
				preserves.length > 0,
				`Decision ${node.id} affects domain nodes but has no must_preserve relationship`,
			);
		}
	});
});

describe("full document", () => {
	it("accepts a realistic SysProM document", () => {
		valid({
			$schema: "https://sysprom.org/schema.json",
			metadata: {
				title: "Document Workspace",
				doc_type: "sysprom",
				scope: "system",
				status: "active",
				version: 1,
			},
			nodes: [
				{
					id: "INT1",
					type: "intent",
					name: "Document Workspace",
					description:
						"Enable users to ingest, transform, store, and access documents.",
				},
				{ id: "CON1", type: "concept", name: "Document Transformation" },
				{ id: "CAP1", type: "capability", name: "Convert Document" },
				{
					id: "INV1",
					type: "invariant",
					name: "Stable Document Identity",
					description: "A document retains identity regardless of storage.",
				},
				{
					id: "INV2",
					type: "invariant",
					name: "Placement-Agnostic Conversion",
				},
				{ id: "ELEM1", type: "element", name: "Transformation Engine" },
				{
					id: "REAL1",
					type: "realisation",
					name: "Local Conversion",
					status: "active",
				},
				{
					id: "REAL2",
					type: "realisation",
					name: "Remote Conversion",
					status: "active",
				},
				{
					id: "DEC1",
					type: "decision",
					name: "Select Local Conversion as Default",
					context: "Need to choose a default conversion strategy",
					options: [
						{ id: "O1", description: "Local only" },
						{ id: "O2", description: "Remote only" },
						{ id: "O3", description: "Local default, remote available" },
					],
					selected: "O3",
					rationale: "Keeps offline capability while allowing remote fallback",
					lifecycle: {
						proposed: true,
						accepted: true,
						implemented: true,
						adopted: false,
					},
				},
				{
					id: "CHG1",
					type: "change",
					name: "Introduce Remote Conversion",
					scope: ["ELEM1", "REAL2"],
					operations: [{ type: "add", target: "REAL2" }],
					plan: [
						{ description: "Define conversion contract", done: true },
						{ description: "Implement remote service", done: false },
						{ description: "Validate parity", done: false },
					],
					propagation: { concept: true, structure: true, realisation: false },
					lifecycle: {
						defined: true,
						introduced: true,
						in_progress: false,
						complete: false,
					},
				},
				{
					id: "VIEW1",
					type: "view",
					name: "Domain View",
					includes: ["INT1", "CON1", "CAP1", "INV1", "INV2", "ELEM1", "REAL1", "REAL2"],
				},
			],
			relationships: [
				{ from: "CON1", to: "INT1", type: "refines" },
				{ from: "CAP1", to: "CON1", type: "refines" },
				{ from: "ELEM1", to: "CAP1", type: "realises" },
				{ from: "REAL1", to: "ELEM1", type: "implements" },
				{ from: "REAL2", to: "ELEM1", type: "implements" },
				{ from: "DEC1", to: "ELEM1", type: "affects" },
				{ from: "DEC1", to: "REAL1", type: "selects" },
				{ from: "DEC1", to: "INV2", type: "must_preserve" },
				{ from: "CHG1", to: "DEC1", type: "affects" },
			],
			external_references: [
				{
					role: "prior_art",
					identifier: "https://github.com/github/spec-kit",
					node_id: "INT1",
					description: "Spec Kit was evaluated during design",
				},
			],
		});
	});
});
