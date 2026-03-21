#!/usr/bin/env node

import { run as json2md } from "./json2md.js";
import { run as md2json } from "./md2json.js";

const VERSION = "1.0.0";

const HELP = `sysprom — System Provenance Model CLI

Usage: sysprom <command> [options]

Commands:
  json2md <input.json> <output>    Convert SysProM JSON to Markdown
  md2json <input> <output.json>    Convert Markdown to SysProM JSON

Options:
  --help, -h       Show this help message
  --version, -v    Show version

Examples:
  sysprom json2md sysprom.spm.json ./SysProM
  sysprom json2md sysprom.spm.json output.md --single-file
  sysprom md2json ./SysProM output.spm.json
  sysprom md2json input.spm.md output.spm.json
`;

const args = process.argv.slice(2);
const command = args[0];

if (!command || command === "--help" || command === "-h") {
  console.log(HELP);
  process.exit(0);
}

if (command === "--version" || command === "-v") {
  console.log(`sysprom ${VERSION}`);
  process.exit(0);
}

const subArgs = args.slice(1);

switch (command) {
  case "json2md":
    json2md(subArgs);
    break;
  case "md2json":
    md2json(subArgs);
    break;
  default:
    console.error(`Unknown command: ${command}`);
    console.error("Run 'sysprom --help' for usage.");
    process.exit(1);
}
