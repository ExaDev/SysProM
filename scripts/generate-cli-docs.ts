#!/usr/bin/env tsx

import { dirname, join } from "node:path";
import { mkdirSync, writeFileSync } from "node:fs";
import { extractDocs, type CommandDoc } from "../src/cli/define-command.js";
import { commands } from "../src/cli/program.js";

const __dirname = dirname(new URL(import.meta.url).pathname);
const projectRoot = join(__dirname, "..");

// ---------------------------------------------------------------------------
// Markdown helpers
// ---------------------------------------------------------------------------

function esc(text: string): string {
	return text.replace(/\|/g, "\\|");
}

function fmtArg(name: string, required: boolean): string {
	return required ? `<${name}>` : `[${name}]`;
}

function hasInputArg(argNames: string[]): boolean {
	return argNames.some((a) => a === "input" || a === "speckit-dir");
}

function renderChoicesAlert(label: string, choices: string[]): string {
	if (choices.length <= 8) {
		return `> [!TIP]\n> Valid ${label}: ${choices.map((c) => `\`${c}\``).join(", ")}\n\n`;
	}
	// Wrap long choice lists
	return `> [!TIP]\n> Valid ${label}:\n> ${choices.map((c) => `\`${c}\``).join(", ")}\n\n`;
}

function renderApiLink(apiLink: string | undefined): string {
	if (!apiLink) return "";
	// Convert operation name to exported operation constant name
	// e.g. "validate" -> "validateOp", "query-nodes" -> "queryNodesOp"
	const operationName = apiLink
		.split("-")
		.map((part, i) =>
			i === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1),
		)
		.join("");
	const exportedName = operationName + "Op";
	// Use TypeDoc module export syntax: src/operations/file!exportedName
	// This works after TypeDoc finishes parsing modules
	return `> [!NOTE]\n> Library function: {@link src/operations/${apiLink}!${exportedName}}\n\n`;
}

function renderInputNote(): string {
	return `> [!TIP]\n> Format is auto-detected from the input path: \`.json\` for JSON, \`.md\` for single-file Markdown, directory for multi-document Markdown.\n\n`;
}

// ---------------------------------------------------------------------------
// Render arguments and options tables
// ---------------------------------------------------------------------------

function renderArgsTable(
	doc: CommandDoc,
	headingLevel: string,
	shownChoices?: Set<string>,
): string {
	if (doc.args.length === 0) return "";
	let out = `${headingLevel} Arguments\n\n`;
	out += "| Argument | Description |\n";
	out += "|----------|-------------|\n";
	for (const arg of doc.args) {
		out += `| \`${fmtArg(arg.name, arg.required)}\` | ${esc(arg.description)} |\n`;
	}
	out += "\n";
	for (const arg of doc.args) {
		if (arg.choices) {
			const key = arg.choices.join(",");
			if (!shownChoices?.has(key)) {
				out += renderChoicesAlert(arg.name, arg.choices);
				shownChoices?.add(key);
			}
		}
	}
	return out;
}

function renderOptsTable(
	doc: CommandDoc,
	headingLevel: string,
	shownChoices?: Set<string>,
): string {
	if (doc.opts.length === 0) return "";
	let out = `${headingLevel} Options\n\n`;
	out += "| Flag | Description | Required |\n";
	out += "|------|-------------|----------|\n";
	for (const opt of doc.opts) {
		out += `| \`${esc(opt.flag)}\` | ${esc(opt.description)} | ${opt.required ? "Yes" : ""} |\n`;
	}
	out += "\n";
	for (const opt of doc.opts) {
		if (opt.choices) {
			const key = opt.choices.join(",");
			if (!shownChoices?.has(key)) {
				const label = opt.flag.replace(/^--/, "").replace(/ <.*/, "");
				out += renderChoicesAlert(label, opt.choices);
				shownChoices?.add(key);
			}
		}
	}
	return out;
}

// ---------------------------------------------------------------------------
// Generate a full command document
// ---------------------------------------------------------------------------

function generateCommandDoc(doc: CommandDoc): string {
	let output = `---
title: ${doc.name}
---

# spm ${doc.name}

${esc(doc.description)}

`;

	if (doc.subcommands && doc.subcommands.length > 0) {
		// Check if any subcommand has an input argument — show note once
		const anyHasInput = doc.subcommands.some((s) =>
			hasInputArg(s.args.map((a) => a.name)),
		);
		if (anyHasInput) {
			output += renderInputNote();
		}

		output += "## Subcommands\n\n";

		// Track choices already shown on this page to avoid repetition
		const shownChoices = new Set<string>();

		for (const sub of doc.subcommands) {
			output += `### spm ${doc.name} ${sub.name}\n\n`;
			output += `${esc(sub.description)}\n\n`;

			// API cross-reference
			output += renderApiLink(sub.apiLink);

			// Usage
			const argsPart = sub.args
				.map((a) => fmtArg(a.name, a.required))
				.join(" ");
			const hasOpts = sub.opts.length > 0;
			const usage = `spm ${doc.name} ${sub.name}${argsPart ? ` ${argsPart}` : ""}${hasOpts ? " [options]" : ""}`;
			output += "```\n" + usage + "\n```\n\n";

			output += renderArgsTable(sub, "####", shownChoices);
			output += renderOptsTable(sub, "####", shownChoices);
		}
	} else {
		// Simple command
		// API cross-reference
		output += renderApiLink(doc.apiLink);

		const argsPart = doc.args.map((a) => fmtArg(a.name, a.required)).join(" ");
		const hasOpts = doc.opts.length > 0;
		const usage = `spm ${doc.name}${argsPart ? ` ${argsPart}` : ""}${hasOpts ? " [options]" : ""}`;

		output += "## Usage\n\n";
		output += "```\n" + usage + "\n```\n\n";

		// Input format note
		if (hasInputArg(doc.args.map((a) => a.name))) {
			output += renderInputNote();
		}

		output += renderArgsTable(doc, "##");
		output += renderOptsTable(doc, "##");
	}

	return output;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const docsCliDir = join(projectRoot, "docs", "cli");
mkdirSync(docsCliDir, { recursive: true });

const commandFiles: { file: string; name: string; description: string }[] = [];

for (const cmd of commands) {
	const doc = extractDocs(cmd);
	const markdown = generateCommandDoc(doc);
	const file = `${doc.name}.md`;
	commandFiles.push({ file, name: doc.name, description: doc.description });
	writeFileSync(join(docsCliDir, file), markdown);
}

// Index page
const childrenYaml = commandFiles.map((cf) => `  - ./${cf.file}`).join("\n");
let indexDoc = `---
title: CLI Reference
children:
${childrenYaml}
---

# CLI Reference

Both \`sysprom\` and \`spm\` are available as commands.

> [!TIP]
> All commands auto-detect document format from the input path: \`.json\` for JSON, \`.md\` for single-file Markdown, directory for multi-document Markdown.

## Commands

| Command | Description |
|---------|-------------|
`;

for (const cf of commandFiles) {
	indexDoc += `| [${cf.name}](${cf.file}) | ${esc(cf.description)} |\n`;
}

indexDoc += "\n";
writeFileSync(join(docsCliDir, "README.md"), indexDoc);

console.log(`Generated ${String(commandFiles.length + 1)} files in docs/cli`);
