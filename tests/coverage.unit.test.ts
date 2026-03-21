import { describe, it, beforeEach, afterEach } from "node:test";
import { strict as assert } from "node:assert";
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { jsonToMarkdownSingle, jsonToMarkdownMultiDoc, jsonToMarkdown } from "../src/json-to-md.js";
import { markdownSingleToJson, markdownMultiDocToJson, markdownToJson } from "../src/md-to-json.js";
import { sysproMDocument, node, text, relationship, externalReference, metadata, toJSONSchema } from "../src/schema.js";
import { canonicalise } from "../src/canonical-json.js";
import { textToString, textToLines, textToMarkdown, markdownToText } from "../src/text.js";
import type { SysProMDocument } from "../src/schema.js";

// ---------------------------------------------------------------------------
// schema.ts — .is() type guards
// ---------------------------------------------------------------------------

describe("schema .is() type guards", () => {
  it("sysproMDocument.is() returns true for valid doc", () => {
    assert.ok(sysproMDocument.is({ nodes: [{ id: "I1", type: "intent", name: "T" }] }));
  });

  it("sysproMDocument.is() returns false for invalid doc", () => {
    assert.ok(!sysproMDocument.is({}));
    assert.ok(!sysproMDocument.is("string"));
    assert.ok(!sysproMDocument.is(null));
  });

  it("node.is() returns true for valid node", () => {
    assert.ok(node.is({ id: "I1", type: "intent", name: "T" }));
  });

  it("node.is() returns false for invalid node", () => {
    assert.ok(!node.is({ id: "I1" }));
    assert.ok(!node.is(42));
  });

  it("text.is() works for string and array", () => {
    assert.ok(text.is("hello"));
    assert.ok(text.is(["a", "b"]));
    assert.ok(!text.is(42));
  });

  it("relationship.is() works", () => {
    assert.ok(relationship.is({ from: "A", to: "B", type: "refines" }));
    assert.ok(!relationship.is({ from: "A" }));
  });

  it("externalReference.is() works", () => {
    assert.ok(externalReference.is({ role: "input", identifier: "x" }));
    assert.ok(!externalReference.is({}));
  });

  it("metadata.is() works", () => {
    assert.ok(metadata.is({ title: "T" }));
    assert.ok(metadata.is({}));
  });
});

// ---------------------------------------------------------------------------
// schema.ts — toJSONSchema
// ---------------------------------------------------------------------------

describe("toJSONSchema", () => {
  it("returns an object with $schema and $id", () => {
    const schema = toJSONSchema();
    assert.equal(schema.$schema, "https://json-schema.org/draft/2020-12/schema");
    assert.equal(schema.$id, "https://sysprom.org/schema.json");
  });
});

// ---------------------------------------------------------------------------
// canonical-json.ts
// ---------------------------------------------------------------------------

describe("canonical-json", () => {
  it("sorts keys", () => {
    assert.equal(canonicalise({ b: 1, a: 2 }), '{"a":2,"b":1}');
  });

  it("handles null", () => {
    assert.equal(canonicalise(null), "null");
  });

  it("handles booleans", () => {
    assert.equal(canonicalise(true), "true");
    assert.equal(canonicalise(false), "false");
  });

  it("handles numbers", () => {
    assert.equal(canonicalise(42), "42");
    assert.equal(canonicalise(3.14), "3.14");
  });

  it("handles -0 as 0", () => {
    assert.equal(canonicalise(-0), "0");
  });

  it("throws on non-finite numbers", () => {
    assert.throws(() => canonicalise(Infinity));
    assert.throws(() => canonicalise(NaN));
  });

  it("handles strings with escapes", () => {
    assert.equal(canonicalise("a\nb"), '"a\\nb"');
    assert.equal(canonicalise("a\tb"), '"a\\tb"');
    assert.equal(canonicalise('a"b'), '"a\\"b"');
    assert.equal(canonicalise("a\\b"), '"a\\\\b"');
  });

  it("escapes control characters", () => {
    assert.equal(canonicalise("\x00"), '"\\u0000"');
    assert.equal(canonicalise("\x1f"), '"\\u001f"');
  });

  it("handles arrays", () => {
    assert.equal(canonicalise([1, 2, 3]), "[1,2,3]");
    assert.equal(canonicalise([]), "[]");
  });

  it("handles nested objects", () => {
    assert.equal(canonicalise({ a: { c: 1, b: 2 } }), '{"a":{"b":2,"c":1}}');
  });

  it("omits undefined values", () => {
    assert.equal(canonicalise({ a: 1, b: undefined }), '{"a":1}');
  });

  it("throws on unserialisable types", () => {
    assert.throws(() => canonicalise(Symbol("x")));
  });

  it("pretty-prints with indent option", () => {
    const result = canonicalise({ b: 1, a: 2 }, { indent: "\t" });
    assert.ok(result.includes("\t"));
    assert.ok(result.includes('"a": 2'));
  });

  it("pretty-prints empty objects and arrays", () => {
    assert.equal(canonicalise({}, { indent: "\t" }), "{}");
    assert.equal(canonicalise([], { indent: "\t" }), "[]");
  });
});

// ---------------------------------------------------------------------------
// text.ts
// ---------------------------------------------------------------------------

describe("text utilities", () => {
  it("textToString joins array", () => {
    assert.equal(textToString(["a", "b"]), "a\nb");
  });

  it("textToString passes through string", () => {
    assert.equal(textToString("hello"), "hello");
  });

  it("textToLines splits string", () => {
    assert.deepEqual(textToLines("hello"), ["hello"]);
  });

  it("textToLines passes through array", () => {
    assert.deepEqual(textToLines(["a", "b"]), ["a", "b"]);
  });

  it("textToMarkdown joins array", () => {
    assert.equal(textToMarkdown(["a", "b"]), "a\nb");
  });

  it("markdownToText returns string for single line", () => {
    assert.equal(markdownToText("hello"), "hello");
  });

  it("markdownToText returns array for multiple lines", () => {
    assert.deepEqual(markdownToText("a\nb"), ["a", "b"]);
  });
});

// ---------------------------------------------------------------------------
// json-to-md — artefact flow, inline external refs, jsonToMarkdown wrapper
// ---------------------------------------------------------------------------

describe("json-to-md edge cases", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "sysprom-cov-"));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("renders artefact_flow with input and output", () => {
    const doc: SysProMDocument = {
      nodes: [
        { id: "AF1", type: "artefact_flow", name: "Flow", input: "ART1", output: "ART2" },
      ],
    };
    const md = jsonToMarkdownSingle(doc);
    assert.ok(md.includes("- Input: ART1"));
    assert.ok(md.includes("- Output: ART2"));
  });

  it("renders inline external references on nodes", () => {
    const doc: SysProMDocument = {
      nodes: [
        {
          id: "D1",
          type: "decision",
          name: "Dec",
          external_references: [
            { role: "evidence", identifier: "https://example.com/paper.pdf", description: "A paper." },
            { role: "input", identifier: "notes.md", internalised: "Key finding here." },
          ],
        },
      ],
    };
    const md = jsonToMarkdownSingle(doc);
    assert.ok(md.includes("External References"));
    assert.ok(md.includes("evidence: https://example.com/paper.pdf"));
    assert.ok(md.includes("Internalised: Key finding here."));
  });

  it("jsonToMarkdown writes single file", () => {
    const outPath = join(tmpDir, "test.md");
    jsonToMarkdown(
      { nodes: [{ id: "I1", type: "intent", name: "T" }] },
      outPath,
      { form: "single-file" },
    );
    assert.ok(readFileSync(outPath, "utf8").includes("# "));
  });

  it("jsonToMarkdown writes multi-doc", () => {
    const outDir = join(tmpDir, "multi");
    jsonToMarkdown(
      { nodes: [{ id: "I1", type: "intent", name: "T", description: "D." }] },
      outDir,
      { form: "multi-doc" },
    );
    assert.ok(readFileSync(join(outDir, "README.md"), "utf8").includes("# "));
  });
});

// ---------------------------------------------------------------------------
// md-to-json — markdownToJson wrapper, operations with descriptions, propagation
// ---------------------------------------------------------------------------

describe("md-to-json edge cases", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "sysprom-cov2-"));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("markdownToJson dispatches to single-file for .md path", () => {
    const mdPath = join(tmpDir, "test.md");
    writeFileSync(mdPath, "---\ntitle: \"T\"\n---\n\n# T\n\n## Intent\n\n### I1 — Test\n\nDesc.\n");
    const doc = markdownToJson(mdPath);
    assert.ok(doc.nodes.length > 0);
  });

  it("markdownToJson dispatches to multi-doc for directory", () => {
    jsonToMarkdownMultiDoc(
      { metadata: { title: "T" }, nodes: [{ id: "I1", type: "intent", name: "T", description: "D." }] },
      tmpDir,
    );
    const doc = markdownToJson(tmpDir);
    assert.ok(doc.nodes.length > 0);
  });

  it("parses operations with descriptions (dash separator)", () => {
    const doc: SysProMDocument = {
      nodes: [
        {
          id: "CH1",
          type: "change",
          name: "C",
          operations: [
            { type: "update", target: "EL1", description: "Updated docs" },
          ],
          lifecycle: { defined: true },
        },
      ],
    };
    const md = jsonToMarkdownSingle(doc);
    const result = markdownSingleToJson(md);
    const ch1 = result.nodes.find((n) => n.id === "CH1");
    assert.ok(ch1?.operations);
    assert.equal(ch1.operations[0].type, "update");
  });

  it("round-trips propagation", () => {
    const doc: SysProMDocument = {
      nodes: [
        {
          id: "CH1",
          type: "change",
          name: "C",
          propagation: { concept: true, structure: false, realisation: false },
          lifecycle: { defined: true },
        },
      ],
    };
    const md = jsonToMarkdownSingle(doc);
    const result = markdownSingleToJson(md);
    const ch1 = result.nodes.find((n) => n.id === "CH1");
    assert.ok(ch1?.propagation);
    assert.equal(ch1.propagation.concept, true);
    assert.equal(ch1.propagation.structure, false);
  });

  it("round-trips artefact_flow input/output", () => {
    const doc: SysProMDocument = {
      nodes: [
        { id: "AF1", type: "artefact_flow", name: "Flow", input: "A1", output: "A2" },
      ],
    };
    const md = jsonToMarkdownSingle(doc);
    const result = markdownSingleToJson(md);
    const af = result.nodes.find((n) => n.id === "AF1");
    assert.equal(af?.input, "A1");
    assert.equal(af?.output, "A2");
  });

  it("parses relationship with single value (- Refines: X)", () => {
    const doc: SysProMDocument = {
      nodes: [
        { id: "CP1", type: "capability", name: "Cap" },
        { id: "CN1", type: "concept", name: "Con" },
      ],
      relationships: [{ from: "CP1", to: "CN1", type: "refines" }],
    };
    jsonToMarkdownMultiDoc(doc, tmpDir);
    const result = markdownMultiDocToJson(tmpDir);
    const rels = result.relationships ?? [];
    const found = rels.find((r) => r.from === "CP1" && r.to === "CN1" && r.type === "refines");
    assert.ok(found, "Expected refines relationship");
  });
});
