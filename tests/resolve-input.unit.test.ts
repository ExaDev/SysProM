import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { resolveInput } from "../src/cli/shared.js";

const TMP = join(import.meta.dirname, ".tmp-resolve");

function setup() {
	mkdirSync(TMP, { recursive: true });
}
function teardown() {
	rmSync(TMP, { recursive: true, force: true });
}

describe("resolveInput", () => {
	beforeEach(setup);
	afterEach(teardown);

	it("returns explicit path unchanged", () => {
		const p = join(TMP, "foo.spm.json");
		assert.equal(resolveInput(p), p);
	});

	it("finds .spm.json in directory", () => {
		writeFileSync(join(TMP, ".spm.json"), "{}");
		assert.equal(resolveInput(undefined, TMP), join(TMP, ".spm.json"));
	});

	it("finds .spm.md in directory", () => {
		writeFileSync(join(TMP, ".spm.md"), "");
		assert.equal(resolveInput(undefined, TMP), join(TMP, ".spm.md"));
	});

	it("finds .spm/ directory", () => {
		mkdirSync(join(TMP, ".spm"));
		assert.equal(resolveInput(undefined, TMP), join(TMP, ".spm"));
	});

	it("prefers .spm.json over .spm.md", () => {
		writeFileSync(join(TMP, ".spm.json"), "{}");
		writeFileSync(join(TMP, ".spm.md"), "");
		assert.equal(resolveInput(undefined, TMP), join(TMP, ".spm.json"));
	});

	it("prefers .spm.md over .spm/", () => {
		writeFileSync(join(TMP, ".spm.md"), "");
		mkdirSync(join(TMP, ".spm"));
		assert.equal(resolveInput(undefined, TMP), join(TMP, ".spm.md"));
	});

	it("prefers exact over glob", () => {
		writeFileSync(join(TMP, ".spm.json"), "{}");
		writeFileSync(join(TMP, "project.spm.json"), "{}");
		assert.equal(resolveInput(undefined, TMP), join(TMP, ".spm.json"));
	});

	it("finds glob match *.spm.json", () => {
		writeFileSync(join(TMP, "project.spm.json"), "{}");
		assert.equal(
			resolveInput(undefined, TMP),
			join(TMP, "project.spm.json"),
		);
	});

	it("finds glob match *.spm.md", () => {
		writeFileSync(join(TMP, "project.spm.md"), "");
		assert.equal(
			resolveInput(undefined, TMP),
			join(TMP, "project.spm.md"),
		);
	});

	it("finds glob match *.spm/ directory", () => {
		mkdirSync(join(TMP, "project.spm"));
		assert.equal(
			resolveInput(undefined, TMP),
			join(TMP, "project.spm"),
		);
	});

	it("prefers *.spm.json over *.spm.md", () => {
		writeFileSync(join(TMP, "project.spm.json"), "{}");
		writeFileSync(join(TMP, "project.spm.md"), "");
		assert.equal(
			resolveInput(undefined, TMP),
			join(TMP, "project.spm.json"),
		);
	});

	it("errors on multiple *.spm.json matches", () => {
		writeFileSync(join(TMP, "a.spm.json"), "{}");
		writeFileSync(join(TMP, "b.spm.json"), "{}");
		assert.throws(
			() => resolveInput(undefined, TMP),
			/Multiple SysProM documents found/,
		);
	});

	it("errors on multiple *.spm/ directories", () => {
		mkdirSync(join(TMP, "a.spm"));
		mkdirSync(join(TMP, "b.spm"));
		assert.throws(
			() => resolveInput(undefined, TMP),
			/Multiple SysProM documents found/,
		);
	});

	it("errors when nothing found", () => {
		assert.throws(
			() => resolveInput(undefined, TMP),
			/No SysProM document found/,
		);
	});
});
