import { describe, it, beforeEach, afterEach } from "node:test";
import { strict as assert } from "node:assert";
import { mkdtempSync, rmSync, readFileSync, writeFileSync, utimesSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { canonicalise } from "../src/canonical-json.js";
import { jsonToMarkdownSingle } from "../src/json-to-md.js";
import { markdownToJson } from "../src/md-to-json.js";
import { syncCommand } from "../src/cli/commands/sync.js";
import type { SysProMDocument, Node } from "../src/schema.js";

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

describe("spm sync command", () => {
	let tempDir: string;

	beforeEach(() => {
		tempDir = mkdtempSync(join(tmpdir(), "sync-cmd-test-"));
	});

	afterEach(() => {
		rmSync(tempDir, { recursive: true, force: true });
	});

	it("performs bidirectional sync when JSON has changed", () => {
		// Setup: Create base document and write both representations
		const baseDoc = createTestDoc();
		const jsonPath = join(tempDir, "test.spm.json");
		const mdPath = join(tempDir, "test.spm.md");

		writeFileSync(jsonPath, canonicalise(baseDoc, { indent: "\t" }) + "\n");
		const mdContent = jsonToMarkdownSingle(baseDoc);
		writeFileSync(mdPath, mdContent);

		// Set MD to earlier timestamp
		const now = Date.now();
		const earlierTime = new Date(now - 1000);
		utimesSync(mdPath, earlierTime, earlierTime);

		// Modify JSON by adding a node
		const newNode: Node = {
			id: "I2",
			type: "intent",
			name: "New Intent",
			description: "Added after MD was created.",
		};
		const modifiedDoc: SysProMDocument = {
			...baseDoc,
			nodes: [...baseDoc.nodes, newNode],
		};

		writeFileSync(jsonPath, canonicalise(modifiedDoc, { indent: "\t" }) + "\n");

		// Test: sync command should update MD from JSON
		const result = syncCommand({ jsonPath, mdPath });

		// Verify result indicates JSON changed
		assert.equal(result.jsonChanged, true);
		assert.equal(result.mdChanged, false);
		assert.equal(result.conflict, false);

		// Verify MD was updated with new node
		const updatedMd = markdownToJson(mdPath);
		assert.equal(updatedMd.nodes.length, 2);
		assert.equal(updatedMd.nodes[1].id, "I2");
	});

	it("performs bidirectional sync when Markdown has changed", () => {
		// Setup: Create base document and write both representations
		const baseDoc = createTestDoc();
		const jsonPath = join(tempDir, "test.spm.json");
		const mdPath = join(tempDir, "test.spm.md");

		writeFileSync(jsonPath, canonicalise(baseDoc, { indent: "\t" }) + "\n");
		const mdContent = jsonToMarkdownSingle(baseDoc);
		writeFileSync(mdPath, mdContent);

		// Set JSON to earlier timestamp
		const now = Date.now();
		const earlierTime = new Date(now - 1000);
		utimesSync(jsonPath, earlierTime, earlierTime);

		// Modify MD by adding a new node
		const newNode: Node = {
			id: "I2",
			type: "intent",
			name: "New Intent from MD",
			description: "Added after JSON was created.",
		};
		const modifiedMdDoc: SysProMDocument = {
			...baseDoc,
			nodes: [...baseDoc.nodes, newNode],
		};
		const updatedMdContent = jsonToMarkdownSingle(modifiedMdDoc);
		writeFileSync(mdPath, updatedMdContent);

		// Test: sync command should update JSON from MD
		const result = syncCommand({ jsonPath, mdPath });

		// Verify result indicates MD changed
		assert.equal(result.jsonChanged, false);
		assert.equal(result.mdChanged, true);
		assert.equal(result.conflict, false);

		// Verify JSON was updated with new node
		const updatedJson = JSON.parse(readFileSync(jsonPath, "utf8"));
		assert.equal(updatedJson.nodes.length, 2);
		assert.equal(updatedJson.nodes[1].id, "I2");
	});

	it("respects --prefer-json flag for conflicts", () => {
		// Setup: Create conflicting documents
		const baseDoc = createTestDoc();
		const jsonPath = join(tempDir, "test.spm.json");
		const mdPath = join(tempDir, "test.spm.md");

		// Create JSON with one change (title updated)
		const jsonDoc: SysProMDocument = {
			...baseDoc,
			metadata: { ...baseDoc.metadata, title: "Updated in JSON" },
		};
		writeFileSync(jsonPath, canonicalise(jsonDoc, { indent: "\t" }) + "\n");

		// Create MD with different change (new node added)
		const newNode: Node = {
			id: "I2",
			type: "intent",
			name: "Updated in MD",
			description: "A new node.",
		};
		const mdDoc: SysProMDocument = {
			...baseDoc,
			nodes: [...baseDoc.nodes, newNode],
		};
		const mdContent = jsonToMarkdownSingle(mdDoc);
		writeFileSync(mdPath, mdContent);

		// Test: --prefer-json should resolve conflict using JSON as source of truth
		const result = syncCommand({ jsonPath, mdPath, strategy: "json" });

		// Verify conflict was detected and resolved using JSON
		assert.equal(result.conflict, true);
		assert.equal(result.strategy, "json");

		// Verify MD was updated from JSON (title changed, new node not added)
		const resolvedMd = markdownToJson(mdPath);
		assert.ok(resolvedMd.metadata);
		assert.equal(resolvedMd.metadata.title, "Updated in JSON");
		assert.equal(resolvedMd.nodes.length, 1); // Only original node, not the one from MD
	});

	it("respects --prefer-md flag for conflicts", () => {
		// Setup: Create conflicting documents
		const baseDoc = createTestDoc();
		const jsonPath = join(tempDir, "test.spm.json");
		const mdPath = join(tempDir, "test.spm.md");

		// Create JSON with one change (title updated)
		const jsonDoc: SysProMDocument = {
			...baseDoc,
			metadata: { ...baseDoc.metadata, title: "Updated in JSON" },
		};
		writeFileSync(jsonPath, canonicalise(jsonDoc, { indent: "\t" }) + "\n");

		// Create MD with different change (new node added)
		const newNode: Node = {
			id: "I2",
			type: "intent",
			name: "Updated in MD",
			description: "A new node.",
		};
		const mdDoc: SysProMDocument = {
			...baseDoc,
			nodes: [...baseDoc.nodes, newNode],
		};
		const mdContent = jsonToMarkdownSingle(mdDoc);
		writeFileSync(mdPath, mdContent);

		// Test: --prefer-md should resolve conflict using MD as source of truth
		const result = syncCommand({ jsonPath, mdPath, strategy: "md" });

		// Verify conflict was detected and resolved using MD
		assert.equal(result.conflict, true);
		assert.equal(result.strategy, "md");

		// Verify JSON was updated from MD (new node added, title not changed)
		const resolvedJson = JSON.parse(readFileSync(jsonPath, "utf8"));
		assert.equal(resolvedJson.metadata.title, "Test Doc"); // Original title, not the JSON change
		assert.equal(resolvedJson.nodes.length, 2); // Original node plus the one from MD
		assert.equal(resolvedJson.nodes[1].id, "I2");
	});

	it("rejects conflicts with neither --prefer-json nor --prefer-md", () => {
		// Setup: Create conflicting documents
		const baseDoc = createTestDoc();
		const jsonPath = join(tempDir, "test.spm.json");
		const mdPath = join(tempDir, "test.spm.md");

		// Create JSON with one change (title updated)
		const jsonDoc: SysProMDocument = {
			...baseDoc,
			metadata: { ...baseDoc.metadata, title: "Updated in JSON" },
		};
		writeFileSync(jsonPath, canonicalise(jsonDoc, { indent: "\t" }) + "\n");

		// Create MD with different change (new node added)
		const newNode: Node = {
			id: "I2",
			type: "intent",
			name: "Updated in MD",
			description: "A new node.",
		};
		const mdDoc: SysProMDocument = {
			...baseDoc,
			nodes: [...baseDoc.nodes, newNode],
		};
		const mdContent = jsonToMarkdownSingle(mdDoc);
		writeFileSync(mdPath, mdContent);

		// Test: sync without strategy flag should throw on conflict
		assert.throws(
			() => syncCommand({ jsonPath, mdPath, strategy: "report" }),
			/Conflict detected/,
		);
	});

	it("supports --dry-run flag to preview changes without writing", () => {
		// Setup: Create documents with changes
		const baseDoc = createTestDoc();
		const jsonPath = join(tempDir, "test.spm.json");
		const mdPath = join(tempDir, "test.spm.md");

		writeFileSync(jsonPath, canonicalise(baseDoc, { indent: "\t" }) + "\n");
		const mdContent = jsonToMarkdownSingle(baseDoc);
		writeFileSync(mdPath, mdContent);

		// Set MD to earlier timestamp
		const now = Date.now();
		const earlierTime = new Date(now - 1000);
		utimesSync(mdPath, earlierTime, earlierTime);

		// Modify JSON by adding a node
		const modifiedDoc: SysProMDocument = {
			...baseDoc,
			nodes: [
				...baseDoc.nodes,
				{
					id: "I2",
					type: "intent",
					name: "New Intent",
					description: "Added node.",
				},
			],
		};

		writeFileSync(jsonPath, canonicalise(modifiedDoc, { indent: "\t" }) + "\n");

		// Store original MD content for comparison
		const originalMdContent = readFileSync(mdPath, "utf8");

		// Test: --dry-run should preview changes without writing
		const result = syncCommand({ jsonPath, mdPath, dryRun: true });

		// Verify result shows what would change
		assert.equal(result.jsonChanged, true);
		assert.equal(result.mdChanged, false);
		assert.equal(result.conflict, false);

		// Verify MD file was NOT modified (still has original content)
		const currentMdContent = readFileSync(mdPath, "utf8");
		assert.equal(currentMdContent, originalMdContent);
	});
});
