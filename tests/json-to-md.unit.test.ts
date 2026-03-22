import { describe, it, beforeEach, afterEach } from "node:test";
import { strict as assert } from "node:assert";
import { mkdtempSync, rmSync, readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { jsonToMarkdownSingle, jsonToMarkdownMultiDoc } from "../src/json-to-md.js";
import type { SysProMDocument } from "../src/schema.js";

function minimal(): SysProMDocument {
  return {
    metadata: { title: "Test System", doc_type: "sysprom", scope: "system", status: "active", version: 1 },
    nodes: [
      { id: "I1", type: "intent", name: "Test Intent", description: "A test intent." },
    ],
  };
}

function full(): SysProMDocument {
  return {
    $schema: "https://sysprom.org/schema.json",
    metadata: { title: "Full System", doc_type: "sysprom", scope: "system", status: "active", version: 1 },
    nodes: [
      { id: "I1", type: "intent", name: "Test Intent", description: "Enable testing." },
      { id: "CN1", type: "concept", name: "Test Concept", description: "A concept." },
      { id: "CP1", type: "capability", name: "Test Capability", description: "A capability." },
      { id: "INV1", type: "invariant", name: "Test Invariant", description: "Must hold." },
      { id: "PR1", type: "principle", name: "Test Principle", description: "A principle." },
      { id: "POL1", type: "policy", name: "Test Policy", description: "A policy." },
      { id: "EL1", type: "element", name: "Test Element", description: "An element.", status: "active" },
      { id: "R1", type: "realisation", name: "Test Realisation", description: "A realisation.", status: "active" },
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
        lifecycle: { proposed: true, accepted: true, implemented: false, superseded: false },
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
      { id: "V1", type: "view", name: "Domain View", includes: ["I1", "CN1", "CP1"] },
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
      { role: "source", identifier: "https://example.com", node_id: "I1", description: "Source material." },
    ],
  };
}

function withSubsystem(): SysProMDocument {
  return {
    metadata: { title: "Parent System", doc_type: "sysprom" },
    nodes: [
      { id: "I1", type: "intent", name: "Parent Intent", description: "Parent." },
      {
        id: "EL1",
        type: "element",
        name: "Child Feature",
        status: "active",
        subsystem: {
          nodes: [
            { id: "I1", type: "intent", name: "Child Intent", description: "Child." },
            { id: "INV1", type: "invariant", name: "Child Rule", description: "Must hold in child." },
          ],
          relationships: [{ from: "INV1", to: "I1", type: "constrained_by" }],
        },
      },
    ],
  };
}

function withMultilineDescriptions(): SysProMDocument {
  return {
    metadata: { title: "Multiline Test" },
    nodes: [
      {
        id: "I1",
        type: "intent",
        name: "Multiline Intent",
        description: ["First line.", "Second line.", "Third line."],
      },
      {
        id: "D1",
        type: "decision",
        name: "Multiline Decision",
        context: ["Context line one.", "Context line two."],
        options: [{ id: "O1", description: "Only option" }],
        selected: "O1",
        rationale: ["Rationale line one.", "Rationale line two."],
        lifecycle: { proposed: true, accepted: true },
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// Single-file tests
// ---------------------------------------------------------------------------

describe("json-to-md single file", () => {
  it("produces valid markdown from minimal document", () => {
    const md = jsonToMarkdownSingle(minimal());
    assert.ok(md.includes("# Test System"));
    assert.ok(md.includes("## Intent"));
    assert.ok(md.includes("### I1 — Test Intent"));
    assert.ok(md.includes("A test intent."));
  });

  it("includes front matter", () => {
    const md = jsonToMarkdownSingle(minimal());
    assert.ok(md.startsWith("---\n"));
    assert.ok(md.includes('title: "Test System"'));
    assert.ok(md.includes('doc_type: "sysprom"'));
  });

  it("renders all node type sections", () => {
    const md = jsonToMarkdownSingle(full());
    assert.ok(md.includes("## Intent"));
    assert.ok(md.includes("## Concepts"));
    assert.ok(md.includes("## Capabilities"));
    assert.ok(md.includes("## Invariants"));
    assert.ok(md.includes("## Principles"));
    assert.ok(md.includes("## Policies"));
    assert.ok(md.includes("## Elements"));
    assert.ok(md.includes("## Realisations"));
    assert.ok(md.includes("## Decisions"));
    assert.ok(md.includes("## Changes"));
    assert.ok(md.includes("## Views"));
  });

  it("renders decision fields", () => {
    const md = jsonToMarkdownSingle(full());
    assert.ok(md.includes("Context: We need to decide."));
    assert.ok(md.includes("- O1: Option A"));
    assert.ok(md.includes("- O2: Option B"));
    assert.ok(md.includes("Chosen: O2"));
    assert.ok(md.includes("Rationale: B is better."));
  });

  it("renders decision lifecycle as checkboxes", () => {
    const md = jsonToMarkdownSingle(full());
    assert.ok(md.includes("- [x] proposed"));
    assert.ok(md.includes("- [x] accepted"));
    assert.ok(md.includes("- [ ] implemented"));
  });

  it("renders date lifecycle values as checked", () => {
    const doc = full();
    const node = doc.nodes.find((n) => n.id === "CH1")!;
    // Replace boolean lifecycle with date strings
    node.lifecycle = { defined: "2026-03-21", introduced: "2026-03-21", complete: false };
    const md = jsonToMarkdownSingle(doc);
    assert.ok(md.includes("- [x] defined (2026-03-21)"), "date lifecycle should render as checked");
    assert.ok(md.includes("- [x] introduced (2026-03-21)"), "date lifecycle should render as checked");
    assert.ok(md.includes("- [ ] complete"), "false lifecycle should render as unchecked");
  });

  it("renders lifecycle states in protocol order, not alphabetical", () => {
    const doc = full();
    const decision = doc.nodes.find((n) => n.id === "D1")!;
    // Keys in alphabetical order (as JSON.stringify would produce)
    decision.lifecycle = { accepted: true, implemented: false, proposed: true, superseded: false };
    const md = jsonToMarkdownSingle(doc);
    const lifecycleSection = md.slice(md.indexOf("- [x] proposed"));
    const proposedIdx = lifecycleSection.indexOf("- [x] proposed");
    const acceptedIdx = lifecycleSection.indexOf("- [x] accepted");
    const implementedIdx = lifecycleSection.indexOf("- [ ] implemented");
    const supersededIdx = lifecycleSection.indexOf("- [ ] superseded");
    assert.ok(proposedIdx < acceptedIdx, "proposed should come before accepted");
    assert.ok(acceptedIdx < implementedIdx, "accepted should come before implemented");
    assert.ok(implementedIdx < supersededIdx, "implemented should come before superseded");
  });

  it("renders change fields", () => {
    const md = jsonToMarkdownSingle(full());
    assert.ok(md.includes("Scope:"));
    assert.ok(md.includes("- EL1"));
    assert.ok(md.includes("Operations:"));
    assert.ok(md.includes("- add EL1"));
    assert.ok(md.includes("- [x] Step one"));
    assert.ok(md.includes("- [ ] Step two"));
  });

  it("renders relationships", () => {
    const md = jsonToMarkdownSingle(full());
    assert.ok(md.includes("## Relationships"));
    assert.ok(md.includes("| CN1 | refines | I1 |"));
  });

  it("renders external references", () => {
    const md = jsonToMarkdownSingle(full());
    assert.ok(md.includes("## External References"));
    assert.ok(md.includes("source: https://example.com"));
  });

  it("renders view includes", () => {
    const md = jsonToMarkdownSingle(full());
    assert.ok(md.includes("Includes:"));
    assert.ok(md.includes("- I1"));
    assert.ok(md.includes("- CN1"));
  });

  it("renders multiline descriptions as separate lines", () => {
    const md = jsonToMarkdownSingle(withMultilineDescriptions());
    assert.ok(md.includes("First line.\nSecond line.\nThird line."));
  });

  it("renders multiline context and rationale", () => {
    const md = jsonToMarkdownSingle(withMultilineDescriptions());
    assert.ok(md.includes("Context: Context line one.\nContext line two."));
    assert.ok(md.includes("Rationale: Rationale line one.\nRationale line two."));
  });

  it("renders subsystem nodes inline", () => {
    const md = jsonToMarkdownSingle(withSubsystem());
    assert.ok(md.includes("Child Intent"));
    assert.ok(md.includes("Child Rule"));
  });
});

// ---------------------------------------------------------------------------
// Multi-doc tests
// ---------------------------------------------------------------------------

describe("json-to-md multi-doc", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "sysprom-test-"));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("creates README.md", () => {
    jsonToMarkdownMultiDoc(minimal(), tmpDir);
    assert.ok(existsSync(join(tmpDir, "README.md")));
  });

  it("creates document files for present node types", () => {
    jsonToMarkdownMultiDoc(full(), tmpDir);
    assert.ok(existsSync(join(tmpDir, "README.md")));
    assert.ok(existsSync(join(tmpDir, "INTENT.md")));
    assert.ok(existsSync(join(tmpDir, "INVARIANTS.md")));
    assert.ok(existsSync(join(tmpDir, "STATE.md")));
    assert.ok(existsSync(join(tmpDir, "DECISIONS.md")));
    assert.ok(existsSync(join(tmpDir, "CHANGES.md")));
  });

  it("does not create files for absent node types", () => {
    jsonToMarkdownMultiDoc(minimal(), tmpDir);
    assert.ok(!existsSync(join(tmpDir, "INVARIANTS.md")));
    assert.ok(!existsSync(join(tmpDir, "STATE.md")));
    assert.ok(!existsSync(join(tmpDir, "DECISIONS.md")));
    assert.ok(!existsSync(join(tmpDir, "CHANGES.md")));
  });

  it("README contains navigation links", () => {
    jsonToMarkdownMultiDoc(full(), tmpDir);
    const readme = readFileSync(join(tmpDir, "README.md"), "utf8");
    assert.ok(readme.includes("[INTENT.md](./INTENT.md)"));
    assert.ok(readme.includes("[INVARIANTS.md](./INVARIANTS.md)"));
    assert.ok(readme.includes("[STATE.md](./STATE.md)"));
    assert.ok(readme.includes("[DECISIONS.md](./DECISIONS.md)"));
    assert.ok(readme.includes("[CHANGES.md](./CHANGES.md)"));
  });

  it("README contains document roles table", () => {
    jsonToMarkdownMultiDoc(full(), tmpDir);
    const readme = readFileSync(join(tmpDir, "README.md"), "utf8");
    assert.ok(readme.includes("| Document | Role |"));
    assert.ok(readme.includes("| INTENT.md"));
  });

  it("INTENT.md contains concepts and capabilities", () => {
    jsonToMarkdownMultiDoc(full(), tmpDir);
    const intent = readFileSync(join(tmpDir, "INTENT.md"), "utf8");
    assert.ok(intent.includes("## Intent"));
    assert.ok(intent.includes("## Concepts"));
    assert.ok(intent.includes("### CN1 — Test Concept"));
    assert.ok(intent.includes("## Capabilities"));
    assert.ok(intent.includes("### CP1 — Test Capability"));
  });

  it("INVARIANTS.md contains invariants and policies", () => {
    jsonToMarkdownMultiDoc(full(), tmpDir);
    const inv = readFileSync(join(tmpDir, "INVARIANTS.md"), "utf8");
    assert.ok(inv.includes("### INV1 — Test Invariant"));
    assert.ok(inv.includes("### PR1 — Test Principle"));
    assert.ok(inv.includes("### POL1 — Test Policy"));
  });

  it("STATE.md contains elements and realisations", () => {
    jsonToMarkdownMultiDoc(full(), tmpDir);
    const state = readFileSync(join(tmpDir, "STATE.md"), "utf8");
    assert.ok(state.includes("### EL1 — Test Element"));
    assert.ok(state.includes("### R1 — Test Realisation"));
  });

  it("DECISIONS.md contains decision with full fields", () => {
    jsonToMarkdownMultiDoc(full(), tmpDir);
    const dec = readFileSync(join(tmpDir, "DECISIONS.md"), "utf8");
    assert.ok(dec.includes("### D1 — Test Decision"));
    assert.ok(dec.includes("Context:"));
    assert.ok(dec.includes("Chosen: O2"));
    assert.ok(dec.includes("- [x] proposed"));
  });

  it("CHANGES.md contains change with plan", () => {
    jsonToMarkdownMultiDoc(full(), tmpDir);
    const chg = readFileSync(join(tmpDir, "CHANGES.md"), "utf8");
    assert.ok(chg.includes("### CH1 — Test Change"));
    assert.ok(chg.includes("- [x] Step one"));
    assert.ok(chg.includes("- [ ] Step two"));
  });

  it("renders node relationships in the correct file", () => {
    jsonToMarkdownMultiDoc(full(), tmpDir);
    const intent = readFileSync(join(tmpDir, "INTENT.md"), "utf8");
    assert.ok(intent.includes("Refines: I1"));
    const state = readFileSync(join(tmpDir, "STATE.md"), "utf8");
    assert.ok(state.includes("Realises: CP1"));
  });

  it("README contains external references", () => {
    jsonToMarkdownMultiDoc(full(), tmpDir);
    const readme = readFileSync(join(tmpDir, "README.md"), "utf8");
    assert.ok(readme.includes("source: https://example.com"));
  });

  it("README contains views", () => {
    jsonToMarkdownMultiDoc(full(), tmpDir);
    const readme = readFileSync(join(tmpDir, "README.md"), "utf8");
    assert.ok(readme.includes("### V1 — Domain View"));
    assert.ok(readme.includes("- I1"));
  });

  it("creates subsystem folders", () => {
    jsonToMarkdownMultiDoc(withSubsystem(), tmpDir);
    const dirs = readdirSync(tmpDir);
    const subDir = dirs.find((d) => d.startsWith("EL1-"));
    assert.ok(subDir, "Expected a subsystem folder starting with EL1-");
    assert.ok(existsSync(join(tmpDir, subDir, "README.md")));
    assert.ok(existsSync(join(tmpDir, subDir, "INTENT.md")));
    assert.ok(existsSync(join(tmpDir, subDir, "INVARIANTS.md")));
  });

  it("subsystem README contains correct title", () => {
    jsonToMarkdownMultiDoc(withSubsystem(), tmpDir);
    const dirs = readdirSync(tmpDir);
    const subDir = dirs.find((d) => d.startsWith("EL1-"))!;
    const readme = readFileSync(join(tmpDir, subDir, "README.md"), "utf8");
    assert.ok(readme.includes("# EL1 — Child Feature"));
  });

  it("subsystem INTENT.md contains child nodes", () => {
    jsonToMarkdownMultiDoc(withSubsystem(), tmpDir);
    const dirs = readdirSync(tmpDir);
    const subDir = dirs.find((d) => d.startsWith("EL1-"))!;
    const intent = readFileSync(join(tmpDir, subDir, "INTENT.md"), "utf8");
    assert.ok(intent.includes("### I1 — Child Intent"));
  });
});

// ---------------------------------------------------------------------------
// sysprom.spm.json conversion
// ---------------------------------------------------------------------------

describe("json-to-md with sysprom.spm.json", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "sysprom-full-"));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("converts sysprom.spm.json to single file without error", async () => {
    const doc = JSON.parse(readFileSync("sysprom.spm.json", "utf8"));
    const md = jsonToMarkdownSingle(doc);
    assert.ok(md.length > 1000, "Expected substantial markdown output");
    assert.ok(md.includes("# SysProM"));
  });

  it("converts sysprom.spm.json to multi-doc without error", async () => {
    const doc = JSON.parse(readFileSync("sysprom.spm.json", "utf8"));
    jsonToMarkdownMultiDoc(doc, tmpDir);
    assert.ok(existsSync(join(tmpDir, "README.md")));
    assert.ok(existsSync(join(tmpDir, "INTENT.md")));
    assert.ok(existsSync(join(tmpDir, "INVARIANTS.md")));
    assert.ok(existsSync(join(tmpDir, "STATE.md")));
    assert.ok(existsSync(join(tmpDir, "DECISIONS.md")));
    assert.ok(existsSync(join(tmpDir, "CHANGES.md")));
  });

  it("multi-doc output contains all decisions", async () => {
    const doc = JSON.parse(readFileSync("sysprom.spm.json", "utf8"));
    jsonToMarkdownMultiDoc(doc, tmpDir);
    const dec = readFileSync(join(tmpDir, "DECISIONS.md"), "utf8");
    for (const d of doc.nodes.filter((n: { type: string }) => n.type === "decision")) {
      assert.ok(dec.includes(`${d.id} — ${d.name}`), `Missing decision ${d.id}`);
    }
  });

  it("multi-doc output contains all invariants", async () => {
    const doc = JSON.parse(readFileSync("sysprom.spm.json", "utf8"));
    jsonToMarkdownMultiDoc(doc, tmpDir);
    const inv = readFileSync(join(tmpDir, "INVARIANTS.md"), "utf8");
    for (const n of doc.nodes.filter((n: { type: string }) => n.type === "invariant")) {
      assert.ok(inv.includes(`${n.id} — ${n.name}`), `Missing invariant ${n.id}`);
    }
  });

  it("creates subsystem files or folders for nodes with subsystems", async () => {
    const doc = JSON.parse(readFileSync("sysprom.spm.json", "utf8"));
    const subsystemNodes = doc.nodes.filter((n: { subsystem?: unknown }) => n.subsystem);
    jsonToMarkdownMultiDoc(doc, tmpDir);

    // Collect all files/dirs recursively
    function allEntries(dir: string): string[] {
      const results: string[] = [];
      for (const entry of readdirSync(dir)) {
        results.push(entry);
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) {
          results.push(...allEntries(full).map((e) => join(entry, e)));
        }
      }
      return results;
    }
    const entries = allEntries(tmpDir);

    for (const n of subsystemNodes) {
      const found = entries.some((e: string) => {
        const base = e.split("/").pop() ?? e;
        return base.startsWith(`${n.id}-`);
      });
      assert.ok(found, `Expected subsystem file or folder for ${n.id}`);
    }
  });
});
