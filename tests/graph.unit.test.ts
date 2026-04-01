import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
	graphOp,
	graphRefinementOp,
	graphDecisionOp,
	graphDependencyOp,
} from "../src/operations/index.js";
import type { SysProMDocument } from "../src/schema.js";

function makeDoc(
	nodes: SysProMDocument["nodes"] = [],
	relationships?: SysProMDocument["relationships"],
): SysProMDocument {
	return { nodes, relationships };
}

const sampleDoc: SysProMDocument = {
	nodes: [
		{ id: "INT1", type: "intent", name: "Record provenance" },
		{ id: "CON1", type: "concept", name: "Graph model" },
		{ id: "CAP1", type: "capability", name: "Serialise to JSON" },
		{ id: "ELEM1", type: "element", name: "Schema module" },
		{ id: "REAL1", type: "realisation", name: "Zod schemas" },
		{ id: "INV1", type: "invariant", name: "Round-trip lossless" },
		{ id: "DEC1", type: "decision", name: "Choose Zod" },
		{ id: "CHG1", type: "change", name: "Add diagram support" },
	],
	relationships: [
		{ from: "INT1", to: "CON1", type: "refines" },
		{ from: "CON1", to: "CAP1", type: "refines" },
		{ from: "CAP1", to: "ELEM1", type: "realises" },
		{ from: "ELEM1", to: "REAL1", type: "implements" },
		{ from: "ELEM1", to: "INV1", type: "constrained_by" },
		{ from: "DEC1", to: "INV1", type: "must_preserve" },
		{ from: "DEC1", to: "ELEM1", type: "affects" },
		{ from: "ELEM1", to: "CAP1", type: "depends_on" },
		{ from: "CHG1", to: "ELEM1", type: "affects" },
	],
};

describe("graphOp", () => {
	describe("Mermaid output", () => {
		it("produces valid Mermaid with classDefs and subgraphs", () => {
			const result = graphOp({ doc: sampleDoc, format: "mermaid" });
			assert.ok(result.startsWith("graph TD"));
			assert.match(result, /classDef intent/);
			assert.match(result, /classDef state/);
			assert.match(result, /classDef invariant/);
			assert.match(result, /classDef decision/);
			assert.match(result, /classDef change/);
			assert.match(result, /subgraph intent/);
			assert.match(result, /subgraph state/);
			assert.match(result, /subgraph invariant \["Invariants"\]/);
		});

		it("uses correct shapes per node type", () => {
			const result = graphOp({ doc: sampleDoc, format: "mermaid" });
			assert.match(result, /INT1\(\[/);
			assert.match(result, /ELEM1\[/);
			assert.match(result, /DEC1\{\{/);
			assert.match(result, /INV1\[\/.*\/\]/);
		});

		it("applies colour classes to nodes", () => {
			const result = graphOp({ doc: sampleDoc, format: "mermaid" });
			assert.match(result, /:::intent/);
			assert.match(result, /:::state/);
			assert.match(result, /:::invariant/);
			assert.match(result, /:::decision/);
			assert.match(result, /:::change/);
		});

		it("renders relationships as edges", () => {
			const result = graphOp({ doc: sampleDoc, format: "mermaid" });
			assert.match(result, /INT1 -->\|refines\| CON1/);
			assert.match(result, /CAP1 -->\|realises\| ELEM1/);
			assert.match(result, /ELEM1 -->\|implements\| REAL1/);
		});

		it("respects layout option", () => {
			const result = graphOp({
				doc: sampleDoc,
				format: "mermaid",
				layout: "LR",
			});
			assert.ok(result.startsWith("graph LR"));
		});

		it("respects cluster=false option", () => {
			const result = graphOp({
				doc: sampleDoc,
				format: "mermaid",
				cluster: false,
			});
			assert.doesNotMatch(result, /subgraph intent/);
		});

		it("filters by nodeTypes", () => {
			const result = graphOp({
				doc: sampleDoc,
				format: "mermaid",
				nodeTypes: ["decision", "invariant"],
				cluster: false,
			});
			assert.match(result, /DEC1/);
			assert.match(result, /INV1/);
			assert.doesNotMatch(result, /INT1[^_]/);
		});

		it("filters by nodeIds", () => {
			const result = graphOp({
				doc: sampleDoc,
				format: "mermaid",
				nodeIds: ["INT1", "CON1"],
				cluster: false,
			});
			assert.match(result, /INT1/);
			assert.match(result, /CON1/);
			assert.doesNotMatch(result, /DEC1/);
		});

		it("filters by relTypes", () => {
			const result = graphOp({
				doc: sampleDoc,
				format: "mermaid",
				relTypes: ["refines"],
				cluster: false,
			});
			assert.match(result, /refines/);
			assert.doesNotMatch(result, /realises/);
		});

		it("connectedOnly excludes isolated nodes", () => {
			const docWithIsolated: SysProMDocument = {
				nodes: [
					{ id: "INT1", type: "intent", name: "Connected" },
					{ id: "INT2", type: "intent", name: "Isolated" },
					{ id: "CON1", type: "concept", name: "Target" },
				],
				relationships: [{ from: "INT1", to: "CON1", type: "refines" }],
			};
			const result = graphOp({
				doc: docWithIsolated,
				format: "mermaid",
				connectedOnly: true,
				cluster: false,
			});
			assert.match(result, /INT1/);
			assert.match(result, /CON1/);
			assert.doesNotMatch(result, /INT2/);
		});

		it("backward-compatible typeFilter filters rels", () => {
			const result = graphOp({
				doc: sampleDoc,
				format: "mermaid",
				typeFilter: "refines",
				cluster: false,
			});
			assert.match(result, /refines/);
		});

		it("handles empty document", () => {
			const result = graphOp({ doc: makeDoc(), format: "mermaid" });
			assert.ok(result.startsWith("graph TD"));
			assert.match(result, /classDef/);
		});

		it("handles document with nodes but no relationships", () => {
			const doc = makeDoc([{ id: "INT1", type: "intent", name: "Only node" }]);
			const result = graphOp({ doc, format: "mermaid" });
			assert.match(result, /INT1/);
			assert.doesNotMatch(result, /-->/);
		});
	});

	describe("DOT output", () => {
		it("produces valid DOT with digraph header", () => {
			const result = graphOp({ doc: sampleDoc, format: "dot" });
			assert.ok(result.startsWith("digraph SysProM {"));
			assert.match(result, /rankdir=LR/);
			assert.ok(result.endsWith("}"));
		});

		it("includes colour and shape attributes on nodes", () => {
			const result = graphOp({ doc: sampleDoc, format: "dot" });
			assert.match(result, /style=filled/);
			assert.match(result, /fillcolor/);
			assert.match(result, /shape=diamond/);
		});

		it("includes cluster subgraphs when cluster=true", () => {
			const result = graphOp({ doc: sampleDoc, format: "dot", cluster: true });
			assert.match(result, /subgraph cluster_intent/);
			assert.match(result, /subgraph cluster_state/);
		});

		it("includes relationships as edges", () => {
			const result = graphOp({ doc: sampleDoc, format: "dot" });
			assert.match(result, /"INT1" -> "CON1"/);
			assert.match(result, /"DEC1" -> "INV1"/);
		});

		it("handles empty document", () => {
			const result = graphOp({ doc: makeDoc(), format: "dot" });
			assert.match(result, /digraph SysProM/);
		});
	});
});

describe("graphRefinementOp", () => {
	it("shows refines/realises/implements relationships", () => {
		const result = graphRefinementOp({ doc: sampleDoc, format: "mermaid" });
		assert.match(result, /refines/);
		assert.match(result, /realises/);
		assert.match(result, /implements/);
		assert.doesNotMatch(result, /must_preserve/);
		assert.doesNotMatch(result, /affects/);
	});

	it("restricts to seedIds when provided", () => {
		const result = graphRefinementOp({
			doc: sampleDoc,
			format: "mermaid",
			seedIds: ["CON1"],
		});
		assert.match(result, /CON1/);
		assert.match(result, /INT1/);
		assert.match(result, /CAP1/);
	});

	it("produces DOT output", () => {
		const result = graphRefinementOp({ doc: sampleDoc, format: "dot" });
		assert.match(result, /digraph RefinementChain/);
		assert.match(result, /"INT1" -> "CON1"/);
	});

	it("returns minimal output for doc with no refinement rels", () => {
		const doc: SysProMDocument = {
			nodes: [
				{ id: "INT1", type: "intent", name: "A" },
				{ id: "DEC1", type: "decision", name: "B" },
			],
			relationships: [{ from: "DEC1", to: "INT1", type: "affects" }],
		};
		const result = graphRefinementOp({ doc, format: "mermaid" });
		assert.doesNotMatch(result, /-->/);
	});
});

describe("graphDecisionOp", () => {
	it("shows decisions with must_preserve and affects links", () => {
		const result = graphDecisionOp({ doc: sampleDoc, format: "mermaid" });
		assert.match(result, /DEC1/);
		assert.match(result, /must_preserve/);
		assert.match(result, /affects/);
		assert.match(result, /INV1/);
	});

	it("uses dashed lines for must_preserve", () => {
		const result = graphDecisionOp({ doc: sampleDoc, format: "mermaid" });
		assert.match(result, /-\.->\|must_preserve\|/);
	});

	it("restricts to specific decision seedIds", () => {
		const doc: SysProMDocument = {
			nodes: [
				{ id: "DEC1", type: "decision", name: "Decision 1" },
				{ id: "DEC2", type: "decision", name: "Decision 2" },
				{ id: "INV1", type: "invariant", name: "Rule" },
			],
			relationships: [
				{ from: "DEC1", to: "INV1", type: "must_preserve" },
				{ from: "DEC2", to: "INV1", type: "must_preserve" },
			],
		};
		const result = graphDecisionOp({
			doc,
			format: "mermaid",
			seedIds: ["DEC1"],
		});
		assert.match(result, /DEC1/);
		assert.doesNotMatch(result, /DEC2/);
	});

	it("produces DOT output", () => {
		const result = graphDecisionOp({ doc: sampleDoc, format: "dot" });
		assert.match(result, /digraph DecisionMap/);
		assert.match(result, /style=dashed/);
	});

	it("returns minimal output for doc with no decisions", () => {
		const doc: SysProMDocument = {
			nodes: [{ id: "INT1", type: "intent", name: "No decisions" }],
		};
		const result = graphDecisionOp({ doc, format: "mermaid" });
		assert.doesNotMatch(result, /-->/);
	});
});

describe("graphDependencyOp", () => {
	it("shows depends_on, constrained_by, and requires relationships", () => {
		const result = graphDependencyOp({ doc: sampleDoc, format: "mermaid" });
		assert.match(result, /depends_on/);
		assert.match(result, /constrained_by/);
		assert.doesNotMatch(result, /refines/);
	});

	it("restricts to seedIds when provided", () => {
		const result = graphDependencyOp({
			doc: sampleDoc,
			format: "mermaid",
			seedIds: ["ELEM1"],
		});
		assert.match(result, /ELEM1/);
		assert.match(result, /CAP1/);
		assert.match(result, /INV1/);
	});

	it("produces DOT output", () => {
		const result = graphDependencyOp({ doc: sampleDoc, format: "dot" });
		assert.match(result, /digraph Dependencies/);
		assert.match(result, /"ELEM1" -> "CAP1"/);
	});

	it("handles blocks relationship direction", () => {
		const doc: SysProMDocument = {
			nodes: [
				{ id: "ELEM1", type: "element", name: "A" },
				{ id: "ELEM2", type: "element", name: "B" },
			],
			relationships: [{ from: "ELEM1", to: "ELEM2", type: "blocks" }],
		};
		const result = graphDependencyOp({ doc, format: "mermaid" });
		assert.match(result, /ELEM2.*blocked.*ELEM1/);
	});

	it("returns minimal output for doc with no dependency rels", () => {
		const doc: SysProMDocument = {
			nodes: [{ id: "INT1", type: "intent", name: "A" }],
			relationships: [{ from: "INT1", to: "INT1", type: "refines" }],
		};
		const result = graphDependencyOp({ doc, format: "mermaid" });
		assert.doesNotMatch(result, /-->/);
	});
});
