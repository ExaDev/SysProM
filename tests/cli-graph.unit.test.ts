import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
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
		{ from: "DEC1", to: "ELEM1", type: "selects" },
	],
};

describe("CLI: graph command", () => {
	let tmpDir: string;
	let inputPath: string;

	it.before(() => {
		tmpDir = mkdtempSync(join(tmpdir(), "spm-cli-graph-"));
		inputPath = join(tmpDir, "sample.SysProM.json");
		writeFileSync(inputPath, JSON.stringify(sampleDoc, null, 2), "utf-8");
	});

	it.after(() => {
		rmSync(tmpDir, { recursive: true, force: true });
	});

	it("prints mermaid output with classDefs and edges", () => {
		const { stdout } = runCli(`graph --path "${inputPath}" --format mermaid`);
		assert.ok(stdout.includes("graph"), "Expected mermaid graph header");
		assert.match(stdout, /classDef/);
		assert.match(stdout, /INT1/);
		assert.match(stdout, /-->/);
	});

	it("supports --label-mode compact and renders compact node labels", () => {
		const { stdout } = runCli(
			`graph --path "${inputPath}" --format mermaid --label-mode compact --no-cluster`,
		);
		// compact mode should not include the node name
		assert.doesNotMatch(stdout, /INT1: Record provenance/);
		assert.match(stdout, /INT1\]/);
	});

	it("supports --no-cluster and omits subgraph blocks", () => {
		const { stdout } = runCli(
			`graph --path "${inputPath}" --format mermaid --no-cluster`,
		);
		assert.doesNotMatch(stdout, /subgraph/);
	});

	it("honours backward-compatible --type filter for relationships", () => {
		const { stdout } = runCli(
			`graph --path "${inputPath}" --format mermaid --type refines --no-cluster`,
		);
		assert.match(stdout, /refines/);
		assert.doesNotMatch(stdout, /realises/);
	});
});
