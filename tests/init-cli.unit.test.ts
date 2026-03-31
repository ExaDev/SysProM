import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
	mkdtempSync,
	rmSync,
	existsSync,
	readFileSync,
	mkdirSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { execSync } from "node:child_process";

// Helper to run CLI via tsx (works from source)
function runInit(
	pathArg: string,
	format: string,
): { stdout: string; stderr: string } {
	const projectRoot = resolve(import.meta.dirname, "..");
	const cmd = `npx tsx ${projectRoot}/src/cli/index.ts init --path "${pathArg}" --format ${format}`;
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

describe("init command path resolution", () => {
	let tempDir: string;

	it.before(() => {
		tempDir = mkdtempSync(join(tmpdir(), "spm-init-test-"));
	});

	it.after(() => {
		rmSync(tempDir, { recursive: true, force: true });
	});

	it("should not double .SysProM.json suffix when path already includes it", () => {
		const subDir = join(tempDir, "test1");
		mkdirSync(subDir);
		const outputPath = join(subDir, ".SysProM.json");
		const doubledPath = `${outputPath}.SysProM.json`;

		runInit(outputPath, "json");

		// Should create .SysProM.json, not .SysProM.json.SysProM.json
		assert.ok(existsSync(outputPath), `Expected ${outputPath} to exist`);
		assert.ok(
			!existsSync(doubledPath),
			`Should not create doubled path ${doubledPath}`,
		);

		// Verify it's valid JSON
		const content = readFileSync(outputPath, "utf-8");
		const doc = JSON.parse(content);
		assert.equal(doc.metadata?.doc_type, "sysprom");
	});

	it("should append .SysProM.json suffix when path is a directory", () => {
		const subDir = join(tempDir, "subdir1");
		mkdirSync(subDir);
		const expectedPath = join(subDir, ".SysProM.json");

		runInit(subDir, "json");

		assert.ok(existsSync(expectedPath), `Expected ${expectedPath} to exist`);
	});

	it("should append .SysProM.json suffix when path has no extension", () => {
		const baseName = join(tempDir, "mydoc");
		const expectedPath = `${baseName}.SysProM.json`;
		runInit(baseName, "json");

		assert.ok(existsSync(expectedPath), `Expected ${expectedPath} to exist`);
	});

	it("should handle explicit .SysProM.md path without doubling", () => {
		const outputPath = join(tempDir, ".SysProM.md");
		runInit(outputPath, "md");

		assert.ok(existsSync(outputPath), `Expected ${outputPath} to exist`);
		assert.ok(
			!existsSync(`${outputPath}.SysProM.md`),
			`Should not create ${outputPath}.SysProM.md`,
		);
	});

	it("should handle explicit .SysProM directory path without doubling", () => {
		const outputPath = join(tempDir, ".SysProM");
		runInit(outputPath, "dir");

		// For dir format, it should create the directory
		assert.ok(
			existsSync(outputPath),
			`Expected ${outputPath} directory to exist`,
		);
	});
});
