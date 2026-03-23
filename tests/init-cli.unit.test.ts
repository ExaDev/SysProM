import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
	mkdirSync,
	rmSync,
	existsSync,
	readFileSync,
	readdirSync,
} from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";

const TMP = join(import.meta.dirname, ".tmp-init");
const ROOT = join(import.meta.dirname, "..");

function spm(args: string): string {
	return execSync(`pnpm tsx src/cli/index.ts ${args}`, {
		cwd: ROOT,
		encoding: "utf8",
		stdio: ["pipe", "pipe", "pipe"],
	});
}

describe("spm init", () => {
	beforeEach(() => mkdirSync(TMP, { recursive: true }));
	afterEach(() => {
		rmSync(TMP, { recursive: true, force: true });
	});

	it("creates .spm.json in existing directory (default format)", () => {
		spm(`init ${TMP}`);
		const target = join(TMP, ".spm.json");
		assert.ok(existsSync(target), ".spm.json should exist");
		const doc = JSON.parse(readFileSync(target, "utf8"));
		assert.equal(doc.metadata.doc_type, "sysprom");
	});

	it("defaults to current directory when no path specified", () => {
		// Run init without path argument from TMP directory
		execSync(`pnpm tsx ${join(ROOT, "src/cli/index.ts")} init`, {
			cwd: TMP,
			encoding: "utf8",
		});
		const target = join(TMP, ".spm.json");
		assert.ok(existsSync(target), ".spm.json should exist in cwd");
		const doc = JSON.parse(readFileSync(target, "utf8"));
		assert.equal(doc.metadata.doc_type, "sysprom");
	});

	it("creates named .spm/ for non-existent path (default format)", () => {
		const target = join(TMP, "myproject");
		spm(`init ${target}`);
		const dir = `${target}.spm`;
		assert.ok(existsSync(dir), "myproject.spm/ should exist");
		assert.ok(readdirSync(dir).length > 0, "directory should have content");
	});

	it("creates named .spm.json with --format json for non-existent path", () => {
		const target = join(TMP, "myproject");
		spm(`init ${target} --format json`);
		assert.ok(existsSync(`${target}.spm.json`));
	});

	it("creates named .spm.md with --format md for non-existent path", () => {
		const target = join(TMP, "myproject");
		spm(`init ${target} --format md`);
		assert.ok(existsSync(`${target}.spm.md`));
	});

	it("creates .spm/ inside existing dir with --format dir", () => {
		const sub = join(TMP, "existing");
		mkdirSync(sub);
		spm(`init ${sub} --format dir`);
		assert.ok(existsSync(join(sub, ".spm")));
	});

	it("creates .spm.md inside existing dir with --format md", () => {
		const sub = join(TMP, "existing");
		mkdirSync(sub);
		spm(`init ${sub} --format md`);
		assert.ok(existsSync(join(sub, ".spm.md")));
	});

	it("errors if target already exists", () => {
		spm(`init ${TMP}`);
		assert.throws(() => spm(`init ${TMP}`), /already exists/i);
	});

	it("respects --title and --scope", () => {
		spm(`init ${TMP} --title "My Project" --scope application`);
		const doc = JSON.parse(readFileSync(join(TMP, ".spm.json"), "utf8"));
		assert.equal(doc.metadata.title, "My Project");
		assert.equal(doc.metadata.scope, "application");
	});
});
