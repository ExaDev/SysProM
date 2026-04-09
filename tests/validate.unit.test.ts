import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validateOp } from "../src/index.js";
import type { SysProMDocument, Node } from "../src/schema.js";

function makeDoc(
	nodes: Node[] = [],
	relationships: SysProMDocument["relationships"] = [],
): SysProMDocument {
	return { nodes, relationships };
}

describe("validate", () => {
	it("valid document returns { valid: true, issues: [] }", () => {
		const doc = makeDoc([{ id: "INT1", type: "intent", name: "Test" }]);
		const result = validateOp({ doc });
		assert.equal(result.valid, true);
		assert.deepEqual(result.issues, []);
	});

	it("duplicate node IDs detected", () => {
		const doc = makeDoc([
			{ id: "INT1", type: "intent", name: "First" },
			{ id: "INT1", type: "intent", name: "Duplicate" },
		]);
		const result = validateOp({ doc });
		assert.equal(result.valid, false);
		assert.ok(result.issues.some((i) => i.includes("Duplicate node ID")));
	});

	it("missing relationship targets detected", () => {
		const doc = makeDoc(
			[{ id: "INT1", type: "intent", name: "A" }],
			[{ from: "INT1", to: "INT2", type: "refines" }],
		);
		const result = validateOp({ doc });
		assert.equal(result.valid, false);
		assert.ok(result.issues.some((i) => i.includes("unknown target")));
	});

	it("decisions affecting domain nodes without must_preserve detected", () => {
		const doc = makeDoc(
			[
				{
					id: "DEC1",
					type: "decision",
					name: "Dec",
					options: [{ id: "a", description: "A" }],
					selected: "a",
				},
				{ id: "INT1", type: "intent", name: "Intent" },
			],
			[{ from: "DEC1", to: "INT1", type: "affects" }],
		);
		const result = validateOp({ doc });
		assert.equal(result.valid, false);
		assert.ok(result.issues.some((i) => i.includes("must_preserve")));
	});

	it("changes without decision references detected", () => {
		const doc = makeDoc([
			{ id: "CHG1", type: "change", name: "Change", scope: ["INT1"] },
			{ id: "INT1", type: "intent", name: "Intent" },
		]);
		const result = validateOp({ doc });
		assert.equal(result.valid, false);
		assert.ok(
			result.issues.some((i) => i.includes("does not reference any decision")),
		);
	});

	it("decisions without options detected", () => {
		const doc = makeDoc([
			{ id: "DEC1", type: "decision", name: "Dec", selected: "a" },
		]);
		const result = validateOp({ doc });
		assert.equal(result.valid, false);
		assert.ok(result.issues.some((i) => i.includes("has no options")));
	});

	it("decisions without selected detected (when decided)", () => {
		const doc = makeDoc([
			{
				id: "DEC1",
				type: "decision",
				name: "Dec",
				options: [{ id: "a", description: "A" }],
				lifecycle: { accepted: true },
			},
		]);
		const result = validateOp({ doc });
		assert.equal(result.valid, false);
		assert.ok(result.issues.some((i) => i.includes("has no selected")));
	});

	it("undecided decisions without selected allowed", () => {
		const doc = makeDoc([
			{
				id: "DEC1",
				type: "decision",
				name: "Dec",
				options: [{ id: "a", description: "A" }],
				// No lifecycle state means undecided (like proposed)
			},
		]);
		const result = validateOp({ doc });
		assert.equal(result.valid, true);
		assert.ok(!result.issues.some((i) => i.includes("has no selected")));
	});

	it("realises accepts capability → stage", () => {
		const doc = makeDoc(
			[
				{ id: "CAP1", type: "capability", name: "C" },
				{ id: "STG1", type: "stage", name: "S" },
			],
			[{ from: "CAP1", to: "STG1", type: "realises" }],
		);
		const result = validateOp({ doc });
		assert.equal(result.valid, true);
		assert.deepEqual(result.issues, []);
	});

	it("realises accepts artefact → concept", () => {
		const doc = makeDoc(
			[
				{ id: "ART1", type: "artefact", name: "A" },
				{ id: "CON1", type: "concept", name: "C" },
			],
			[{ from: "ART1", to: "CON1", type: "realises" }],
		);
		const result = validateOp({ doc });
		assert.equal(result.valid, true);
		assert.deepEqual(result.issues, []);
	});

	it("governed_by accepts artefact → invariant", () => {
		const doc = makeDoc(
			[
				{ id: "ART1", type: "artefact", name: "A" },
				{ id: "INV1", type: "invariant", name: "I" },
			],
			[{ from: "ART1", to: "INV1", type: "governed_by" }],
		);
		const result = validateOp({ doc });
		assert.equal(result.valid, true);
		assert.deepEqual(result.issues, []);
	});

	it("produces accepts concept → concept", () => {
		const doc = makeDoc(
			[
				{ id: "CON1", type: "concept", name: "Supersession" },
				{ id: "CON2", type: "concept", name: "Kill Switch" },
			],
			[{ from: "CON1", to: "CON2", type: "produces" }],
		);
		const result = validateOp({ doc });
		assert.equal(result.valid, true);
		assert.deepEqual(result.issues, []);
	});

	it("produces accepts capability → artefact", () => {
		const doc = makeDoc(
			[
				{ id: "CAP1", type: "capability", name: "Retrieval" },
				{ id: "ART1", type: "artefact", name: "Knowledge Brief" },
			],
			[{ from: "CAP1", to: "ART1", type: "produces" }],
		);
		const result = validateOp({ doc });
		assert.equal(result.valid, true);
		assert.deepEqual(result.issues, []);
	});

	it("part_of accepts protocol → protocol", () => {
		const doc = makeDoc(
			[
				{ id: "PROT1", type: "protocol", name: "Workbench Lifecycle" },
				{ id: "PROT2", type: "protocol", name: "Publish Workflow" },
			],
			[{ from: "PROT2", to: "PROT1", type: "part_of" }],
		);
		const result = validateOp({ doc });
		assert.equal(result.valid, true);
		assert.deepEqual(result.issues, []);
	});

	it("validates a product-system provenance chain from intent to implementation", () => {
		const doc = makeDoc(
			[
				{ id: "INT1", type: "intent", name: "Trustworthy published knowledge" },
				{ id: "CON1", type: "concept", name: "Publish Boundary" },
				{ id: "CAP1", type: "capability", name: "Governed Publishing" },
				{ id: "PROT1", type: "protocol", name: "Workbench Lifecycle" },
				{ id: "ELEM1", type: "element", name: "Publishing Service" },
				{
					id: "REAL1",
					type: "realisation",
					name: "publishKnowledge()",
					external_references: [
						{
							role: "source",
							identifier: "packages/workbench/src/publish.ts",
						},
					],
				},
				{ id: "ART1", type: "artefact", name: "Publish API Contract" },
				{
					id: "DEC1",
					type: "decision",
					name: "Require explicit publish action",
					options: [
						{ id: "OPT1", description: "Explicit publish boundary" },
						{ id: "OPT2", description: "Implicit auto-publish" },
					],
					selected: "OPT1",
				},
				{
					id: "INV1",
					type: "invariant",
					name: "Consumer reads published data only",
				},
				{ id: "CHG1", type: "change", name: "Implement publish boundary" },
			],
			[
				{ from: "INT1", to: "CON1", type: "refines" },
				{ from: "CON1", to: "CAP1", type: "refines" },
				{ from: "CAP1", to: "PROT1", type: "part_of" },
				{ from: "PROT1", to: "ELEM1", type: "depends_on" },
				{ from: "ELEM1", to: "REAL1", type: "realises" },
				{ from: "CAP1", to: "ART1", type: "produces" },
				{ from: "DEC1", to: "CAP1", type: "affects" },
				{ from: "DEC1", to: "INV1", type: "must_preserve" },
				{ from: "INV1", to: "CON1", type: "constrained_by" },
				{ from: "CHG1", to: "DEC1", type: "implements" },
				{ from: "CHG1", to: "REAL1", type: "modifies" },
			],
		);
		const result = validateOp({ doc });
		assert.equal(result.valid, true);
		assert.deepEqual(result.issues, []);
	});
});
