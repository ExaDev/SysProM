import { describe, it, beforeEach, afterEach } from "node:test";
import { strict as assert } from "node:assert";
import {
	mkdtempSync,
	rmSync,
	readFileSync,
	writeFileSync,
	existsSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { canonicalise } from "../src/canonical-json.js";
import { syncCommand } from "../src/cli/commands/sync.js";

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
				id: "INT1",
				type: "intent",
				name: "Test Intent",
				description: "A test intent.",
			},
		],
	};
}

describe("spm sync command (directory output)", () => {
	let tempDir: string;

	beforeEach(() => {
		tempDir = mkdtempSync(join(tmpdir(), "sync-cmd-dir-"));
	});

	afterEach(() => {
		rmSync(tempDir, { recursive: true, force: true });
	});

	it("writes multi-doc Markdown when output is a directory path (non-existent)", () => {
		const doc = createTestDoc();
		const jsonPath = join(tempDir, "doc.spm.json");
		const outDir = join(tempDir, "out-md");

		writeFileSync(jsonPath, canonicalise(doc, { indent: "\t" }) + "\n");

		// Ensure outDir does not exist beforehand
		assert.equal(existsSync(outDir), false);

		const result = syncCommand({ jsonPath, mdPath: outDir, strategy: "json" });

		// Expect markdown changed (written)
		assert.equal(result.mdChanged, true);

		// Directory should now exist and contain INTENT.md
		const intentPath = join(outDir, "INTENT.md");
		assert.equal(existsSync(intentPath), true);

		const content = readFileSync(intentPath, "utf8");
		assert.ok(content.includes("INT1"));
	});

	it("writes single-file Markdown when output ends with .md", () => {
		const doc = createTestDoc();
		const jsonPath = join(tempDir, "doc2.spm.json");
		const outFile = join(tempDir, "out.md");

		writeFileSync(jsonPath, canonicalise(doc, { indent: "\t" }) + "\n");

		const result = syncCommand({ jsonPath, mdPath: outFile, strategy: "json" });

		// Expect markdown changed (written)
		assert.equal(result.mdChanged, true);

		assert.equal(existsSync(outFile), true);
		const content = readFileSync(outFile, "utf8");
		assert.ok(content.includes("INT1"));
	});
});
