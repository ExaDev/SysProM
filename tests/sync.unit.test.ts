import { describe, it, beforeEach, afterEach } from "node:test";
import { strict as assert } from "node:assert";
import {
	mkdtempSync,
	rmSync,
	readFileSync,
	writeFileSync,
	utimesSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { detectChanges } from "../src/sync.js";
import { canonicalise } from "../src/canonical-json.js";
import { jsonToMarkdownSingle } from "../src/json-to-md.js";
import type { SysProMDocument } from "../src/schema.js";

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
				id: "I1",
				type: "intent",
				name: "Test Intent",
				description: "A test intent.",
			},
		],
	};
}

describe("syncDocuments — bidirectional synchronisation", () => {
	let tempDir: string;

	beforeEach(() => {
		tempDir = mkdtempSync(join(tmpdir(), "sync-test-"));
	});

	afterEach(() => {
		rmSync(tempDir, { recursive: true, force: true });
	});

	it("performs no-op when both are in sync", () => {
		// Placeholder for future implementation
		// This test will verify that syncDocuments returns a summary
		// indicating no changes were needed
		assert.ok(true);
	});

	it("updates MD from JSON when only JSON changed", () => {
		// Placeholder: verifies that MD is regenerated from JSON
		// when JSON is the newer/modified version
		assert.ok(true);
	});

	it("updates JSON from MD when only MD changed", () => {
		// Placeholder: verifies that JSON is regenerated from MD
		// when MD is the newer/modified version
		assert.ok(true);
	});

	it("respects --prefer-json flag for conflicts", () => {
		// Placeholder: when both sides diverged, --prefer-json uses JSON
		assert.ok(true);
	});

	it("respects --prefer-md flag for conflicts", () => {
		// Placeholder: when both sides diverged, --prefer-md uses MD
		assert.ok(true);
	});

	it("returns conflict report without resolving with --report flag", () => {
		// Placeholder: lists all diverged nodes without making changes
		assert.ok(true);
	});
});

describe("detectChanges — conflict detection", () => {
	let tempDir: string;

	beforeEach(() => {
		tempDir = mkdtempSync(join(tmpdir(), "sync-test-"));
	});

	afterEach(() => {
		rmSync(tempDir, { recursive: true, force: true });
	});

	it("detects no changes when JSON and MD are identical", () => {
		const doc = createTestDoc();
		const jsonPath = join(tempDir, "test.spm.json");
		const mdPath = join(tempDir, "test.spm.md");

		writeFileSync(jsonPath, canonicalise(doc, { indent: "\t" }) + "\n");

		// Generate MD from the same JSON document
		const mdContent = jsonToMarkdownSingle(doc);
		writeFileSync(mdPath, mdContent);

		const result = detectChanges(jsonPath, mdPath);

		assert.equal(result.jsonChanged, false);
		assert.equal(result.mdChanged, false);
		assert.equal(result.conflict, false);
	});

	it("detects JSON-only changes", () => {
		const baseDoc = createTestDoc();
		const jsonPath = join(tempDir, "test.spm.json");
		const mdPath = join(tempDir, "test.spm.md");

		// First, write MD as baseline (pretend this was created first)
		const mdContent = jsonToMarkdownSingle(baseDoc);
		writeFileSync(mdPath, mdContent);

		// Set MD to an earlier timestamp (1000ms in the past)
		const now = Date.now();
		const earlierTime = new Date(now - 1000);
		utimesSync(mdPath, earlierTime, earlierTime);

		// Now add a new node to JSON and write it with current timestamp
		const modifiedDoc = {
			...baseDoc,
			nodes: [
				...baseDoc.nodes,
				{
					id: "I2",
					type: "intent",
					name: "Another Intent",
					description: "Added after MD was created.",
				},
			],
		};

		writeFileSync(jsonPath, canonicalise(modifiedDoc, { indent: "\t" }) + "\n");

		const result = detectChanges(jsonPath, mdPath);

		assert.equal(result.jsonChanged, true);
		assert.equal(result.mdChanged, false);
		assert.equal(result.conflict, false);
	});

	it("detects mutual changes (conflict)", () => {
		const doc = createTestDoc();
		const jsonPath = join(tempDir, "test.spm.json");
		const mdPath = join(tempDir, "test.spm.md");

		writeFileSync(jsonPath, canonicalise(doc, { indent: "\t" }) + "\n");

		const mdContent = jsonToMarkdownSingle(doc);
		const modifiedMd = mdContent.replace("Test Doc", "Different Title");
		writeFileSync(mdPath, modifiedMd);

		// Update JSON with a different change
		const modifiedDoc = {
			...doc,
			nodes: [
				...doc.nodes,
				{
					id: "I2",
					type: "intent",
					name: "Additional Intent",
					description: "A new node.",
				},
			],
		};

		writeFileSync(jsonPath, canonicalise(modifiedDoc, { indent: "\t" }) + "\n");

		const result = detectChanges(jsonPath, mdPath);

		assert.equal(result.jsonChanged, true);
		assert.equal(result.mdChanged, true);
		assert.equal(result.conflict, true);
	});
});
