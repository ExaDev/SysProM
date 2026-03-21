#!/usr/bin/env tsx

import { dirname, join } from "node:path";
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { Command } from "commander";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");

const { program } = await import(join(projectRoot, "src/cli/program.js"));

// ---------------------------------------------------------------------------
// CLI command → library function mapping for {@link} cross-references
// ---------------------------------------------------------------------------

const API_LINKS: Record<string, string> = {
  validate: "validate",
  stats: "stats",
  add: "addNode",
  remove: "removeNode",
  json2md: "jsonToMarkdown",
  md2json: "markdownToJson",
};

const SUBCOMMAND_API_LINKS: Record<string, Record<string, string>> = {
  query: {
    nodes: "queryNodes",
    node: "queryNode",
    rels: "queryRelationships",
    trace: "traceFromNode",
    timeline: "timeline",
    "state-at": "stateAt",
  },
  update: {
    node: "updateNode",
    "add-rel": "addRelationship",
    "remove-rel": "removeRelationship",
    meta: "updateMetadata",
  },
};

// ---------------------------------------------------------------------------
// Extraction types
// ---------------------------------------------------------------------------

interface ArgInfo {
  name: string;
  description: string;
  required: boolean;
  choices?: string[];
}

interface OptInfo {
  flags: string;
  description: string;
  mandatory: boolean;
  choices?: string[];
}

interface CommandInfo {
  name: string;
  description: string;
  arguments: ArgInfo[];
  options: OptInfo[];
  subcommands?: CommandInfo[];
}

// ---------------------------------------------------------------------------
// Extract metadata from Commander objects
// ---------------------------------------------------------------------------

function extractCommandInfo(cmd: Command): CommandInfo {
  const info: CommandInfo = {
    name: cmd.name(),
    description: cmd.description() || "",
    arguments: [],
    options: [],
  };

  const args = (cmd as Record<string, unknown>).registeredArguments as Array<Record<string, unknown>> | undefined ?? [];
  for (const arg of args) {
    const name = typeof arg.name === "function" ? (arg.name as () => string)() : arg.name as string;
    const description = typeof arg.description === "function" ? (arg.description as () => string)() : (arg.description as string) ?? "";
    const required = typeof arg.required === "function" ? (arg.required as () => boolean)() : arg.required as boolean;
    const choices = arg.argChoices as string[] | undefined;
    info.arguments.push({ name, description, required, choices });
  }

  const opts = (cmd as Record<string, unknown>).options as Array<Record<string, unknown>> | undefined ?? [];
  for (const opt of opts) {
    const flags = (opt.flags as string) ?? "";
    const description = (opt.description as string) ?? "";
    const mandatory = (opt.mandatory as boolean) ?? false;
    const choices = opt.argChoices as string[] | undefined;
    info.options.push({ flags, description, mandatory, choices });
  }

  const subcommands = (cmd as Record<string, unknown>).commands as Command[] | undefined ?? [];
  if (subcommands.length > 0) {
    info.subcommands = subcommands.map(extractCommandInfo);
  }

  return info;
}

// ---------------------------------------------------------------------------
// Markdown helpers
// ---------------------------------------------------------------------------

function esc(text: string): string {
  return text.replace(/\|/g, "\\|");
}

function fmtArg(arg: ArgInfo): string {
  return arg.required ? `<${arg.name}>` : `[${arg.name}]`;
}

function hasInputArg(args: ArgInfo[]): boolean {
  return args.some((a) => a.name === "input" || a.name === "speckit-dir");
}

function renderChoicesAlert(label: string, choices: string[]): string {
  if (choices.length <= 8) {
    return `> [!TIP]\n> Valid ${label}: ${choices.map((c) => `\`${c}\``).join(", ")}\n\n`;
  }
  // Wrap long choice lists
  return `> [!TIP]\n> Valid ${label}:\n> ${choices.map((c) => `\`${c}\``).join(", ")}\n\n`;
}

function renderApiLink(cmdName: string, subcmdName?: string): string {
  const fn = subcmdName
    ? SUBCOMMAND_API_LINKS[cmdName]?.[subcmdName]
    : API_LINKS[cmdName];
  if (!fn) return "";
  return `> [!NOTE]\n> Library function: {@link ${fn}}\n\n`;
}

function renderInputNote(): string {
  return `> [!TIP]\n> Format is auto-detected from the input path: \`.json\` for JSON, \`.md\` for single-file Markdown, directory for multi-document Markdown.\n\n`;
}

// ---------------------------------------------------------------------------
// Render arguments and options tables
// ---------------------------------------------------------------------------

function renderArgsTable(args: ArgInfo[], headingLevel: string, shownChoices?: Set<string>): string {
  if (args.length === 0) return "";
  let out = `${headingLevel} Arguments\n\n`;
  out += "| Argument | Description |\n";
  out += "|----------|-------------|\n";
  for (const arg of args) {
    out += `| \`${fmtArg(arg)}\` | ${esc(arg.description)} |\n`;
  }
  out += "\n";
  for (const arg of args) {
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

function renderOptsTable(opts: OptInfo[], headingLevel: string, shownChoices?: Set<string>): string {
  if (opts.length === 0) return "";
  let out = `${headingLevel} Options\n\n`;
  out += "| Flag | Description | Required |\n";
  out += "|------|-------------|----------|\n";
  for (const opt of opts) {
    out += `| \`${esc(opt.flags)}\` | ${esc(opt.description)} | ${opt.mandatory ? "Yes" : "" } |\n`;
  }
  out += "\n";
  for (const opt of opts) {
    if (opt.choices) {
      const key = opt.choices.join(",");
      if (!shownChoices?.has(key)) {
        const label = opt.flags.replace(/^--/, "").replace(/ <.*/, "");
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

function generateCommandDoc(info: CommandInfo): string {
  let doc = `---
title: ${info.name}
---

# spm ${info.name}

${esc(info.description)}

`;

  if (info.subcommands && info.subcommands.length > 0) {
    // Check if any subcommand has an input argument — show note once
    const anyHasInput = info.subcommands.some((s) => hasInputArg(s.arguments));
    if (anyHasInput) {
      doc += renderInputNote();
    }

    doc += "## Subcommands\n\n";

    // Track choices already shown on this page to avoid repetition
    const shownChoices = new Set<string>();

    for (const sub of info.subcommands) {
      doc += `### spm ${info.name} ${sub.name}\n\n`;
      doc += `${esc(sub.description)}\n\n`;

      // API cross-reference
      doc += renderApiLink(info.name, sub.name);

      // Usage
      const argsPart = sub.arguments.map(fmtArg).join(" ");
      const hasOpts = sub.options.length > 0;
      const usage = `spm ${info.name} ${sub.name}${argsPart ? ` ${argsPart}` : ""}${hasOpts ? " [options]" : ""}`;
      doc += "```\n" + usage + "\n```\n\n";

      doc += renderArgsTable(sub.arguments, "####", shownChoices);
      doc += renderOptsTable(sub.options, "####", shownChoices);
    }
  } else {
    // Simple command
    // API cross-reference
    doc += renderApiLink(info.name);

    const argsPart = info.arguments.map(fmtArg).join(" ");
    const hasOpts = info.options.length > 0;
    const usage = `spm ${info.name}${argsPart ? ` ${argsPart}` : ""}${hasOpts ? " [options]" : ""}`;

    doc += "## Usage\n\n";
    doc += "```\n" + usage + "\n```\n\n";

    // Input format note
    if (hasInputArg(info.arguments)) {
      doc += renderInputNote();
    }

    doc += renderArgsTable(info.arguments, "##");
    doc += renderOptsTable(info.options, "##");
  }

  return doc;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const docsCliDir = join(projectRoot, "docs", "cli");
mkdirSync(docsCliDir, { recursive: true });

const commandFiles: Array<{ file: string; info: CommandInfo }> = [];
const topLevelCmds = (program as Record<string, unknown>).commands as Command[] ?? [];

for (const cmd of topLevelCmds) {
  const info = extractCommandInfo(cmd);
  const doc = generateCommandDoc(info);
  const file = `${info.name}.md`;
  commandFiles.push({ file, info });
  writeFileSync(join(docsCliDir, file), doc);
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

for (const { file, info } of commandFiles) {
  const name = file.replace(".md", "");
  indexDoc += `| [${name}](${file}) | ${esc(info.description)} |\n`;
}

indexDoc += "\n";
writeFileSync(join(docsCliDir, "README.md"), indexDoc);

console.log(`Generated ${commandFiles.length + 1} files in docs/cli`);
