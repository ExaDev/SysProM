import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
	mkdtempSync,
	rmSync,
	writeFileSync,
	readFileSync,
	existsSync,
	mkdirSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { execSync } from "node:child_process";

function runCli(cmdSuffix: string): { stdout: string; stderr: string } {
	const projectRoot = resolve(import.meta.dirname, "..");
	const cmd = `npx tsx ${projectRoot}/src/cli/index.ts ${cmdSuffix}`;
	try {
		const stdout = execSync(cmd, {
			cwd: projectRoot,
			encoding: "utf-8",
			stdio: "pipe",
		});
		return { stdout, stderr: "" };
	} catch (err: unknown) {
		const e = err as { stdout?: string; stderr?: string };
		return { stdout: e.stdout ?? "", stderr: e.stderr ?? "" };
	}
}

const sampleDoc = {
	nodes: [
		{ id: "INT1", type: "intent", name: "Record provenance" },
		{ id: "CON1", type: "concept", name: "Graph model" },
		{ id: "ELEM1", type: "element", name: "Schema module" },
		{ id: "DEC1", type: "decision", name: "Choose Zod" },
	],
	relationships: [
		{ from: "INT1", to: "CON1", type: "refines" },
		{ from: "CON1", to: "ELEM1", type: "realises" },
		{ from: "DEC1", to: "ELEM1", type: "affects" },
	],
};

describe("CLI: json2md --embed-diagrams", () => {
	let tmpDir: string;
	let inputPath: string;

	it.before(() => {
		tmpDir = mkdtempSync(join(tmpdir(), "spm-cli-json2md-"));
		inputPath = join(tmpDir, "sample.SysProM.json");
		writeFileSync(inputPath, JSON.stringify(sampleDoc, null, 2), "utf-8");
	});

	it.after(() => {
		rmSync(tmpDir, { recursive: true, force: true });
	});

	it("embeds diagrams in single-file output", () => {
		const outFile = join(tmpDir, "out.md");
		const { stdout } = runCli(
			`json2md --input "${inputPath}" --output "${outFile}" --embed-diagrams --single-file`,
		);
		// command should report path
		assert.match(stdout, /Written to/);
		const content = readFileSync(outFile, "utf-8");
		assert.match(content, /## Diagrams/);
		assert.match(content, /```mermaid/);
	});

	it("writes DIAGRAMS.md in multi-doc mode when embedding diagrams", () => {
		const outDir = join(tmpDir, "outdir");
		mkdirSync(outDir);
		runCli(
			`json2md --input "${inputPath}" --output "${outDir}" --embed-diagrams`,
		);
		const diagramsPath = join(outDir, "DIAGRAMS.md");
		assert.ok(existsSync(diagramsPath), "Expected DIAGRAMS.md to exist");
		const content = readFileSync(diagramsPath, "utf-8");
		assert.match(content, /## Relationship Graph/);
		assert.match(content, /```mermaid/);
	});

	it("embeds diagrams with friendly labels by default", () => {
		const outDir = join(tmpDir, "outdir2");
		mkdirSync(outDir);
		runCli(
			`json2md --input "${inputPath}" --output "${outDir}" --embed-diagrams`,
		);
		const diagramsPath = join(outDir, "DIAGRAMS.md");
		const content = readFileSync(diagramsPath, "utf-8");
		// friendly mode should include the node name alongside the ID
		assert.match(content, /INT1: Record provenance/);
		// default relationship diagram layout is TD
		assert.match(content, /graph TD/);
	});

	it("respects --label-mode compact for embedded diagrams", () => {
		const outDir = join(tmpDir, "outdir3");
		mkdirSync(outDir);
		runCli(
			`json2md --input "${inputPath}" --output "${outDir}" --embed-diagrams --label-mode compact`,
		);
		const diagramsPath = join(outDir, "DIAGRAMS.md");
		const content = readFileSync(diagramsPath, "utf-8");
		// compact mode should NOT include the friendly label
		assert.doesNotMatch(content, /INT1: Record provenance/);
		// ensure the diagram still exists
		assert.match(content, /## Relationship Graph/);
	});

	it("uses per-diagram layout defaults (TD for relationships/refinement/decision, LR for dependencies)", () => {
		// Create a doc that includes a dependency relationship so the dependency
		// diagram will be generated and we can assert its layout default.
		const depDoc = {
			...sampleDoc,
			relationships: [
				...sampleDoc.relationships,
				{ from: "ELEM1", to: "CON1", type: "depends_on" },
			],
		};
		const depInput = join(tmpDir, "sample-with-deps.SysProM.json");
		writeFileSync(depInput, JSON.stringify(depDoc, null, 2), "utf-8");

		const outDir = join(tmpDir, "outdir4");
		mkdirSync(outDir);
		runCli(
			`json2md --input "${depInput}" --output "${outDir}" --embed-diagrams`,
		);
		const diagramsPath = join(outDir, "DIAGRAMS.md");
		const content = readFileSync(diagramsPath, "utf-8");
		// Relationship graph and refinement/decision diagrams should default to TD
		assert.match(content, /graph TD/);
		// Dependency graph should default to LR when dependencies exist
		assert.match(content, /graph LR/);
	});

	it("overrides per-diagram layouts via CLI flags", () => {
		// Force dependency graph to TD and relationship graph to LR via flags
		const depDoc = {
			...sampleDoc,
			relationships: [
				...sampleDoc.relationships,
				{ from: "ELEM1", to: "CON1", type: "depends_on" },
			],
		};
		const depInput = join(tmpDir, "sample-with-deps-2.SysProM.json");
		writeFileSync(depInput, JSON.stringify(depDoc, null, 2), "utf-8");

		const outDir = join(tmpDir, "outdir5");
		mkdirSync(outDir);
		runCli(
			`json2md --input "${depInput}" --output "${outDir}" --embed-diagrams --dependency-layout TD --relationship-layout LR`,
		);
		const diagramsPath = join(outDir, "DIAGRAMS.md");
		const content = readFileSync(diagramsPath, "utf-8");
		// Dependency graph should now be TD due to override
		assert.match(content, /## Dependency Graph[\s\S]*graph TD/);
		// Relationship graph should be LR due to override
		assert.match(content, /## Relationship Graph[\s\S]*graph LR/);
	});
});
