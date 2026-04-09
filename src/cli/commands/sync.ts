import * as z from "zod";
import {
	readFileSync,
	writeFileSync,
	existsSync,
	mkdirSync,
	statSync,
} from "node:fs";
import { resolve, extname } from "node:path";
import type { CommandDef } from "../define-command.js";
import {
	syncDocumentsOp,
	type BidirectionalSyncResult,
	type ConflictStrategy,
} from "../../operations/index.js";
import { detectChanges } from "../../sync.js";
import { markdownToJson } from "../../md-to-json.js";
import {
	jsonToMarkdownSingle,
	jsonToMarkdownMultiDoc,
} from "../../json-to-md.js";
import { canonicalise } from "../../canonical-json.js";
import { SysProMDocument } from "../../schema.js";

interface SyncCommandInput {
	jsonPath: string;
	mdPath: string;
	strategy?: ConflictStrategy;
	dryRun?: boolean;
}

/**
 * Synchronise JSON and Markdown representations of a SysProM document.
 * @param input - Configuration for sync operation
 * @returns Result of the synchronisation
 * @example
 * const result = syncCommand({ jsonPath: "doc.spm.json", mdPath: "doc.spm.md" });
 */
export function syncCommand(input: SyncCommandInput): BidirectionalSyncResult {
	const { jsonPath, mdPath, strategy = "json", dryRun = false } = input;

	// Read JSON document
	const jsonContent = readFileSync(jsonPath, "utf8");
	const jsonDoc: unknown = JSON.parse(jsonContent);

	if (!SysProMDocument.is(jsonDoc)) {
		throw new Error("JSON file is not a valid SysProM document");
	}

	// Parse Markdown to document, or create empty doc if it doesn't exist yet
	const mdDoc = existsSync(mdPath)
		? markdownToJson(mdPath)
		: { nodes: [], relationships: [] };

	// Detect which side changed
	const changes = detectChanges(jsonPath, mdPath);

	// Perform sync operation
	const result = syncDocumentsOp({
		jsonDoc,
		mdDoc,
		jsonChanged: changes.jsonChanged,
		mdChanged: changes.mdChanged,
		strategy,
	});

	// Track if markdown file existed before sync
	const mdExistedBefore = existsSync(mdPath);

	// Write results if not dry-run
	if (!dryRun) {
		// Write synced document back to both formats
		if (result.jsonChanged || result.mdChanged || result.conflict) {
			// Update JSON
			writeFileSync(
				jsonPath,
				canonicalise(result.synced, { indent: "\t" }) + "\n",
			);

			// Update Markdown
			// If output path is an existing directory or doesn't look like a .md file,
			// write multi-doc output into the directory. Otherwise write single-file MD.
			if (mdExistedBefore && statSync(mdPath).isDirectory()) {
				jsonToMarkdownMultiDoc(result.synced, mdPath);
			} else if (extname(mdPath) === ".md") {
				const mdContent = jsonToMarkdownSingle(result.synced);
				writeFileSync(mdPath, mdContent);
			} else {
				// Treat as directory: ensure it exists and write multi-doc
				mkdirSync(mdPath, { recursive: true });
				jsonToMarkdownMultiDoc(result.synced, mdPath);
			}
		}
	}

	// If markdown file didn't exist before but does now (we created it), mark mdChanged as true
	if (!mdExistedBefore && existsSync(mdPath) && !dryRun) {
		result.mdChanged = true;
	}

	return result;
}

const syncOpts = z
	.object({
		input: z.string().describe("Path to JSON file"),
		output: z.string().describe("Path to Markdown file"),
		preferJson: z
			.boolean()
			.optional()
			.describe("Prefer JSON as source of truth in conflicts"),
		preferMd: z
			.boolean()
			.optional()
			.describe("Prefer Markdown as source of truth in conflicts"),
		dryRun: z
			.boolean()
			.optional()
			.describe("Preview changes without writing files"),
		report: z
			.boolean()
			.optional()
			.describe("Report conflicts without resolving"),
	})
	.strict();

export const syncCommandDef: CommandDef<z.ZodObject, typeof syncOpts> = {
	name: "sync",
	description:
		"Synchronise JSON and Markdown representations with conflict resolution",
	apiLink: "syncDocuments",
	opts: syncOpts,
	action(_args, opts) {
		const jsonPath = resolve(opts.input);
		const mdPath = resolve(opts.output);

		// Determine conflict strategy
		let strategy: ConflictStrategy = "json";
		if (opts.preferMd) strategy = "md";
		if (opts.report) strategy = "report";

		const result = syncCommand({
			jsonPath,
			mdPath,
			strategy,
			dryRun: opts.dryRun ?? false,
		});

		// Output results
		console.log(`Sync complete:`);
		console.log(`  JSON changed: ${String(result.jsonChanged)}`);
		console.log(`  Markdown changed: ${String(result.mdChanged)}`);
		console.log(`  Conflict: ${String(result.conflict)}`);
		if (result.changedNodes.length > 0) {
			console.log(`  Changed nodes: ${result.changedNodes.join(", ")}`);
		}

		const hasDrift = result.jsonChanged || result.mdChanged || result.conflict;
		if ((opts.dryRun || opts.report) && hasDrift) {
			process.exitCode = 1;
		}
	},
};
