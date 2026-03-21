#!/usr/bin/env tsx

import { run as json2md } from "./json2md.js";
import { run as md2json } from "./md2json.js";
import { run as validate } from "./validate.js";
import { run as query } from "./query.js";
import { run as add } from "./add.js";
import { run as remove } from "./remove.js";
import { run as update } from "./update.js";
import { run as stats } from "./stats.js";

const VERSION = "1.0.0";

const HELP = `sysprom — System Provenance Model CLI

Usage: sysprom <command> [options]

Commands:
  json2md <input.json> <output>         Convert SysProM JSON to Markdown
  md2json <input> <output.json>         Convert Markdown to SysProM JSON
  validate <input>                      Validate a SysProM document
  query <input> <type> [filters]        Query nodes and relationships
  add <input> <node-type> [fields]      Add a node
  remove <input> <node-id>              Remove a node
  update <input> <node-id> [fields]     Update a node, relationship, or metadata
  stats <input>                         Print document summary

Options:
  --help, -h       Show this help message
  --version, -v    Show version

Examples:
  sysprom json2md sysprom.spm.json ./SysProM
  sysprom md2json ./SysProM output.spm.json
  sysprom validate sysprom.spm.json
  sysprom stats sysprom.spm.json
  sysprom query sysprom.spm.json nodes --type decision
  sysprom query sysprom.spm.json node D1
  sysprom query sysprom.spm.json trace I1
  sysprom add sysprom.spm.json invariant --id INV23 --name "New Rule"
  sysprom remove sysprom.spm.json INV23
  sysprom update sysprom.spm.json D1 --status deprecated
  sysprom update sysprom.spm.json --add-rel D1 affects EL5
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
  case "validate":
    validate(subArgs);
    break;
  case "query":
    query(subArgs);
    break;
  case "add":
    add(subArgs);
    break;
  case "remove":
    remove(subArgs);
    break;
  case "update":
    update(subArgs);
    break;
  case "stats":
    stats(subArgs);
    break;
  default:
    console.error(`Unknown command: ${command}`);
    console.error("Run 'sysprom --help' for usage.");
    process.exit(1);
}
