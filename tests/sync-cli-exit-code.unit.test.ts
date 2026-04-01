import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
	mkdtempSync,
	readFileSync,
	rmSync,
	utimesSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { canonicalise } from "../src/canonical-json.js";
import { jsonToMarkdownSingle } from "../src/json-to-md.js";
import type { SysProMDocument } from "../src/schema.js";

function runSyncCli(args: string[]): number | null {
	const projectRoot = resolve(import.meta.dirname, "..");
	const tsxCliPath = resolve(
		projectRoot,
		"node_modules",
		"tsx",
		"dist",
		"cli.mjs",
	);
	const result = spawnSync(
		process.execPath,
		[tsxCliPath, `${projectRoot}/src/cli/index.ts`, "sync", ...args],
		{
			cwd: projectRoot,
			encoding: "utf8",
		},
	);
	return result.status;
}

function createTestDoc(): SysProMDocument {
	return {
		metadata: {
			title: "Test Doc",
			doc_type: "sysprom",
			scope: "system",
			status: "active",
			version: 1,
		},
		nodes: [
			{
				id: "INT1",
				type: "intent",
				name: "Test Intent",
				description: "A test intent.",
			},
		],
	};
}

describe("spm sync exit codes", () => {
	let tempDir: string;

	it.beforeEach(() => {
		tempDir = mkdtempSync(join(tmpdir(), "spm-sync-exit-"));
	});

	it.afterEach(() => {
		rmSync(tempDir, { recursive: true, force: true });
	});

	it("returns exit code 0 for in-sync dry-run checks", () => {
		const baseDoc = createTestDoc();
		const jsonPath = join(tempDir, "test.spm.json");
		const mdPath = join(tempDir, "test.spm.md");

		writeFileSync(jsonPath, canonicalise(baseDoc, { indent: "\t" }) + "\n");
		writeFileSync(mdPath, jsonToMarkdownSingle(baseDoc));

		const status = runSyncCli([
			"--input",
			jsonPath,
			"--output",
			mdPath,
			"--dry-run",
			"--report",
		]);

		assert.equal(status, 0);
	});

	it("returns exit code 1 for out-of-sync dry-run checks", () => {
		const baseDoc = createTestDoc();
		const jsonPath = join(tempDir, "test.spm.json");
		const mdPath = join(tempDir, "test.spm.md");

		writeFileSync(jsonPath, canonicalise(baseDoc, { indent: "\t" }) + "\n");
		writeFileSync(mdPath, jsonToMarkdownSingle(baseDoc));

		const earlierTime = new Date(Date.now() - 1000);
		utimesSync(mdPath, earlierTime, earlierTime);

		const modifiedDoc: SysProMDocument = {
			...baseDoc,
			nodes: [
				...baseDoc.nodes,
				{
					id: "INT2",
					type: "intent",
					name: "New Intent",
					description: "Added node.",
				},
			],
		};
		writeFileSync(jsonPath, canonicalise(modifiedDoc, { indent: "\t" }) + "\n");

		const originalMd = readFileSync(mdPath, "utf8");
		const status = runSyncCli([
			"--input",
			jsonPath,
			"--output",
			mdPath,
			"--dry-run",
		]);
		const currentMd = readFileSync(mdPath, "utf8");

		assert.equal(status, 1);
		assert.equal(currentMd, originalMd);
	});

	it("returns exit code 0 when sync resolves and writes changes", () => {
		const baseDoc = createTestDoc();
		const jsonPath = join(tempDir, "test.spm.json");
		const mdPath = join(tempDir, "test.spm.md");

		writeFileSync(jsonPath, canonicalise(baseDoc, { indent: "\t" }) + "\n");
		writeFileSync(mdPath, jsonToMarkdownSingle(baseDoc));

		const earlierTime = new Date(Date.now() - 1000);
		utimesSync(mdPath, earlierTime, earlierTime);

		const modifiedDoc: SysProMDocument = {
			...baseDoc,
			nodes: [
				...baseDoc.nodes,
				{
					id: "INT2",
					type: "intent",
					name: "New Intent",
					description: "Added node.",
				},
			],
		};
		writeFileSync(jsonPath, canonicalise(modifiedDoc, { indent: "\t" }) + "\n");

		const status = runSyncCli(["--input", jsonPath, "--output", mdPath]);
		assert.equal(status, 0);
	});
});
