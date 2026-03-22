import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync, rmSync, existsSync } from "node:fs";
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

	// .sysprom.* support
	it("finds .sysprom.json in directory", () => {
		writeFileSync(join(TMP, ".sysprom.json"), "{}");
		assert.equal(resolveInput(undefined, TMP), join(TMP, ".sysprom.json"));
	});

	it("finds .sysprom.md in directory", () => {
		writeFileSync(join(TMP, ".sysprom.md"), "");
		assert.equal(resolveInput(undefined, TMP), join(TMP, ".sysprom.md"));
	});

	it("finds .sysprom/ directory", () => {
		mkdirSync(join(TMP, ".sysprom"));
		assert.equal(resolveInput(undefined, TMP), join(TMP, ".sysprom"));
	});

	it("prefers .spm.json over .sysprom.json", () => {
		writeFileSync(join(TMP, ".spm.json"), "{}");
		writeFileSync(join(TMP, ".sysprom.json"), "{}");
		assert.equal(resolveInput(undefined, TMP), join(TMP, ".spm.json"));
	});

	it("finds glob match *.sysprom.json", () => {
		writeFileSync(join(TMP, "project.sysprom.json"), "{}");
		assert.equal(
			resolveInput(undefined, TMP),
			join(TMP, "project.sysprom.json"),
		);
	});

	// Case-insensitive matching
	it("finds .SPM.json (case-insensitive)", () => {
		writeFileSync(join(TMP, ".SPM.json"), "{}");
		assert.equal(resolveInput(undefined, TMP), join(TMP, ".SPM.json"));
	});

	it("finds .SysProM.json (case-insensitive)", () => {
		writeFileSync(join(TMP, ".SysProM.json"), "{}");
		assert.equal(
			resolveInput(undefined, TMP),
			join(TMP, ".SysProM.json"),
		);
	});

	it("finds Project.SPM.JSON (case-insensitive glob)", () => {
		writeFileSync(join(TMP, "Project.SPM.JSON"), "{}");
		assert.equal(
			resolveInput(undefined, TMP),
			join(TMP, "Project.SPM.JSON"),
		);
	});

	it("finds .SYSPROM/ directory (case-insensitive)", () => {
		mkdirSync(join(TMP, ".SYSPROM"));
		assert.equal(resolveInput(undefined, TMP), join(TMP, ".SYSPROM"));
	});

	// Ambiguous case variants (only testable on case-sensitive filesystems)
	const caseSensitiveFs = (() => {
		const probeDir = join(import.meta.dirname, ".tmp-case-probe");
		mkdirSync(probeDir, { recursive: true });
		const probe = join(probeDir, "__CaSe__");
		writeFileSync(probe, "");
		const result = !existsSync(join(probeDir, "__case__"));
		rmSync(probeDir, { recursive: true, force: true });
		return result;
	})();

	it("errors on case-variant exact matches (.spm.json vs .SPM.json)", {
		skip: !caseSensitiveFs && "case-insensitive filesystem",
	}, () => {
		writeFileSync(join(TMP, ".spm.json"), "{}");
		writeFileSync(join(TMP, ".SPM.json"), "{}");
		assert.throws(
			() => resolveInput(undefined, TMP),
			/Multiple SysProM documents found/,
		);
	});

	it("errors on case-variant glob matches (a.spm.json vs A.SPM.JSON)", {
		skip: !caseSensitiveFs && "case-insensitive filesystem",
	}, () => {
		writeFileSync(join(TMP, "a.spm.json"), "{}");
		writeFileSync(join(TMP, "A.SPM.JSON"), "{}");
		assert.throws(
			() => resolveInput(undefined, TMP),
			/Multiple SysProM documents found/,
		);
	});
});
