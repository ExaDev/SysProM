import { Argument, Command, Option } from "commander";
import { NODE_STATUSES } from "../schema.js";
import { run as runJson2md } from "./json2md.js";
import { run as runMd2json } from "./md2json.js";
import { run as runValidate } from "./validate.js";
import { run as runStats } from "./stats.js";
import { run as runRemove } from "./remove.js";
import { run as runAdd } from "./add.js";
import { run as runQuery } from "./query.js";
import { run as runUpdate } from "./update.js";
import { run as runSpeckit } from "./speckit.js";
import { run as runTask } from "./task.js";
import { run as runPlan } from "./plan.js";

const VERSION = "1.0.0";

// Valid values for choices constraints
const NODE_TYPES = [
  "intent", "concept", "capability", "element", "realisation",
  "invariant", "principle", "policy", "protocol",
  "stage", "role", "gate", "mode",
  "artefact", "artefact_flow",
  "decision", "change", "view",
  "milestone", "version",
] as const;

const RELATIONSHIP_TYPES = [
  "refines", "realises", "implements", "depends_on",
  "constrained_by", "affects", "supersedes", "must_preserve",
  "performs", "part_of", "precedes", "must_follow",
  "blocks", "routes_to", "governed_by", "modifies",
  "triggered_by", "applies_to", "produces", "consumes",
  "transforms_into", "selects", "requires", "disables",
] as const;

// Collect repeatable option values into an array
function collect(value: string, previous: string[]): string[] {
  return [...previous, value];
}

export const program = new Command();

program
  .name("sysprom")
  .description(
    "System Provenance Model CLI — record where every part of a system came from",
  )
  .version(VERSION)
  .showHelpAfterError(true);

// ============================================================================
// Conversion commands
// ============================================================================

program
  .command("json2md")
  .description("Convert SysProM JSON to Markdown")
  .argument("<input>", "path to SysProM JSON file")
  .argument("<output>", "output path (.md file or directory)")
  .option("--single-file", "force single-file output even if output has no .md extension")
  .action((input: string, output: string, opts: { singleFile?: boolean }) => {
    const args = [input, output];
    if (opts.singleFile) args.push("--single-file");
    runJson2md(args);
  });

program
  .command("md2json")
  .description("Convert Markdown to SysProM JSON")
  .argument("<input>", "Markdown file or directory to convert")
  .argument("<output>", "output JSON file path")
  .action((input: string, output: string) => {
    runMd2json([input, output]);
  });

// ============================================================================
// Inspection commands
// ============================================================================

program
  .command("validate")
  .description("Validate a SysProM document for structural and semantic correctness")
  .argument("<input>", "SysProM document to validate (JSON, .md, or directory)")
  .action((input: string) => {
    runValidate([input]);
  });

program
  .command("stats")
  .description("Print a summary of nodes, relationships, and subsystems")
  .argument("<input>", "SysProM document to summarise")
  .action((input: string) => {
    runStats([input]);
  });

// ============================================================================
// Query command
// ============================================================================

const query = program
  .command("query")
  .description("Query nodes, relationships, traces, and temporal state");

query
  .command("nodes")
  .description("List nodes, optionally filtered by type or status")
  .argument("<input>", "SysProM document to query")
  .addOption(new Option("--type <type>", "filter by node type").choices([...NODE_TYPES]))
  .addOption(new Option("--status <status>", "filter by node status").choices([...NODE_STATUSES]))
  .option("--json", "output as JSON")
  .action((input: string, opts: { type?: string; status?: string; json?: boolean }) => {
    const args = [input, "nodes"];
    if (opts.type) args.push("--type", opts.type);
    if (opts.status) args.push("--status", opts.status);
    if (opts.json) args.push("--json");
    runQuery(args);
  });

query
  .command("node")
  .description("Show a single node with its incoming and outgoing relationships")
  .argument("<input>", "SysProM document to query")
  .argument("<id>", "node ID to look up")
  .option("--json", "output as JSON")
  .action((input: string, id: string, opts: { json?: boolean }) => {
    const args = [input, "node", id];
    if (opts.json) args.push("--json");
    runQuery(args);
  });

query
  .command("rels")
  .description("List relationships, optionally filtered by type, source, or target")
  .argument("<input>", "SysProM document to query")
  .addOption(new Option("--type <type>", "filter by relationship type").choices([...RELATIONSHIP_TYPES]))
  .option("--from <id>", "filter by source node ID")
  .option("--to <id>", "filter by target node ID")
  .option("--json", "output as JSON")
  .action((input: string, opts: { type?: string; from?: string; to?: string; json?: boolean }) => {
    const args = [input, "rels"];
    if (opts.type) args.push("--type", opts.type);
    if (opts.from) args.push("--from", opts.from);
    if (opts.to) args.push("--to", opts.to);
    if (opts.json) args.push("--json");
    runQuery(args);
  });

query
  .command("trace")
  .description("Trace the refinement chain from a node (follows refines, realises, implements)")
  .argument("<input>", "SysProM document to trace through")
  .argument("<id>", "root node ID to start tracing from")
  .option("--json", "output as JSON")
  .action((input: string, id: string, opts: { json?: boolean }) => {
    const args = [input, "trace", id];
    if (opts.json) args.push("--json");
    runQuery(args);
  });

query
  .command("timeline")
  .description("Show all timestamped lifecycle events, sorted chronologically")
  .argument("<input>", "SysProM document to query")
  .option("--node <id>", "show history for a specific node only")
  .option("--json", "output as JSON")
  .action((input: string, opts: { node?: string; json?: boolean }) => {
    const args = [input, "timeline"];
    if (opts.node) args.push("--node", opts.node);
    if (opts.json) args.push("--json");
    runQuery(args);
  });

query
  .command("state-at")
  .description("Show the active lifecycle states of all nodes at a given point in time")
  .argument("<input>", "SysProM document to query")
  .requiredOption("--time <timestamp>", "ISO 8601 timestamp to query against")
  .option("--json", "output as JSON")
  .action((input: string, opts: { time: string; json?: boolean }) => {
    const args = [input, "state-at", "--time", opts.time];
    if (opts.json) args.push("--json");
    runQuery(args);
  });

// ============================================================================
// Mutation commands
// ============================================================================

program
  .command("add")
  .description("Add a node to a SysProM document")
  .argument("<input>", "SysProM document to modify (saved in place)")
  .addArgument(new Argument("<node-type>", "node type to add").choices([...NODE_TYPES]))
  .option("--id <id>", "node ID (auto-generated from type prefix if omitted)")
  .requiredOption("--name <name>", "human-readable node name")
  .option("--description <text>", "node description")
  .addOption(new Option("--status <status>", "lifecycle status").choices([...NODE_STATUSES]))
  .option("--context <text>", "background context (for decisions)")
  .option("--rationale <text>", "reasoning for the choice (for decisions)")
  .option("--scope <id>", "affected node ID, repeatable (for changes)", collect, [])
  .option("--option <id:description>", "decision option, repeatable (e.g. OPT-A:Use framework X)", collect, [])
  .option("--selected <id>", "selected option ID (for decisions)")
  .action(
    (
      input: string,
      nodeType: string,
      opts: {
        id?: string;
        name: string;
        description?: string;
        status?: string;
        context?: string;
        rationale?: string;
        scope: string[];
        option: string[];
        selected?: string;
      },
    ) => {
      const args = [input, nodeType];
      if (opts.id) args.push("--id", opts.id);
      args.push("--name", opts.name);
      if (opts.description) args.push("--description", opts.description);
      if (opts.status) args.push("--status", opts.status);
      if (opts.context) args.push("--context", opts.context);
      if (opts.rationale) args.push("--rationale", opts.rationale);
      for (const s of opts.scope) args.push("--scope", s);
      for (const o of opts.option) args.push("--option", o);
      if (opts.selected) args.push("--selected", opts.selected);
      runAdd(args);
    },
  );

program
  .command("remove")
  .description("Remove a node and all its relationships from a SysProM document")
  .argument("<input>", "SysProM document to modify (saved in place)")
  .argument("<node-id>", "ID of the node to remove")
  .action((input: string, nodeId: string) => {
    runRemove([input, nodeId]);
  });

// ============================================================================
// Update command with subcommands
// ============================================================================

const update = program
  .command("update")
  .description("Update a node, relationship, or metadata");

update
  .command("node")
  .description("Update fields on an existing node")
  .argument("<input>", "SysProM document to modify (saved in place)")
  .argument("<node-id>", "ID of the node to update")
  .option("--description <text>", "update description")
  .addOption(new Option("--status <status>", "update lifecycle status").choices([...NODE_STATUSES]))
  .option("--context <text>", "update context")
  .option("--rationale <text>", "update rationale")
  .option("--lifecycle <key=val>", "set lifecycle state, repeatable (e.g. implemented=true)", collect, [])
  .action(
    (
      input: string,
      nodeId: string,
      opts: {
        description?: string;
        status?: string;
        context?: string;
        rationale?: string;
        lifecycle: string[];
      },
    ) => {
      const args = [input, nodeId];
      if (opts.description) args.push("--description", opts.description);
      if (opts.status) args.push("--status", opts.status);
      if (opts.context) args.push("--context", opts.context);
      if (opts.rationale) args.push("--rationale", opts.rationale);
      for (const v of opts.lifecycle) args.push("--lifecycle", v);
      runUpdate(args);
    },
  );

update
  .command("add-rel")
  .description("Add a typed relationship between two nodes")
  .argument("<input>", "SysProM document to modify (saved in place)")
  .argument("<from>", "source node ID")
  .addArgument(new Argument("<type>", "relationship type").choices([...RELATIONSHIP_TYPES]))
  .argument("<to>", "target node ID")
  .action((input: string, from: string, type: string, to: string) => {
    runUpdate([input, "--add-rel", from, type, to]);
  });

update
  .command("remove-rel")
  .description("Remove a relationship matching from, type, and to")
  .argument("<input>", "SysProM document to modify (saved in place)")
  .argument("<from>", "source node ID")
  .addArgument(new Argument("<type>", "relationship type").choices([...RELATIONSHIP_TYPES]))
  .argument("<to>", "target node ID")
  .action((input: string, from: string, type: string, to: string) => {
    runUpdate([input, "--remove-rel", from, type, to]);
  });

update
  .command("meta")
  .description("Update document-level metadata fields")
  .argument("<input>", "SysProM document to modify (saved in place)")
  .option("--meta <key=value>", "metadata field to set, repeatable (e.g. version=2)", collect, [])
  .action((input: string, opts: { meta: string[] }) => {
    const args = [input];
    for (const v of opts.meta) args.push("--meta", v);
    runUpdate(args);
  });

// ============================================================================
// Spec-Kit commands
// ============================================================================

const speckit = program
  .command("speckit")
  .description("Spec-Kit interoperability — import, export, sync, and diff");

speckit
  .command("import")
  .description("Import a Spec-Kit feature directory into a SysProM document")
  .argument("<speckit-dir>", "path to the Spec-Kit feature directory")
  .argument("<output>", "output SysProM document path")
  .option("--prefix <prefix>", "feature ID prefix (e.g. FEAT)")
  .action((speckitDir: string, output: string, opts: { prefix?: string }) => {
    const args = [speckitDir, output];
    if (opts.prefix) args.push("--prefix", opts.prefix);
    runSpeckit(["import", ...args]);
  });

speckit
  .command("export")
  .description("Export a SysProM document to a Spec-Kit feature directory")
  .argument("<input>", "SysProM document to export")
  .argument("<speckit-dir>", "output Spec-Kit feature directory")
  .requiredOption("--prefix <prefix>", "feature ID prefix (required)")
  .action((input: string, speckitDir: string, opts: { prefix: string }) => {
    runSpeckit(["export", input, speckitDir, "--prefix", opts.prefix]);
  });

speckit
  .command("sync")
  .description("Synchronise a SysProM document with its Spec-Kit feature directory")
  .argument("<input>", "SysProM document to synchronise")
  .argument("<speckit-dir>", "Spec-Kit feature directory")
  .option("--prefix <prefix>", "feature ID prefix")
  .action((input: string, speckitDir: string, opts: { prefix?: string }) => {
    const args = [input, speckitDir];
    if (opts.prefix) args.push("--prefix", opts.prefix);
    runSpeckit(["sync", ...args]);
  });

speckit
  .command("diff")
  .description("Show differences between a SysProM document and its Spec-Kit feature")
  .argument("<input>", "SysProM document to compare")
  .argument("<speckit-dir>", "Spec-Kit feature directory to compare against")
  .option("--prefix <prefix>", "feature ID prefix")
  .action((input: string, speckitDir: string, opts: { prefix?: string }) => {
    const args = [input, speckitDir];
    if (opts.prefix) args.push("--prefix", opts.prefix);
    runSpeckit(["diff", ...args]);
  });

// ============================================================================
// Task commands
// ============================================================================

const task = program
  .command("task")
  .description("Manage tasks on change node plans");

task
  .command("list")
  .description("List tasks across change nodes, optionally filtered")
  .argument("<input>", "SysProM document to read")
  .option("--change <id>", "show tasks for a specific change node only")
  .option("--pending", "show only incomplete tasks")
  .option("--json", "output as JSON")
  .action((input: string, opts: { change?: string; pending?: boolean; json?: boolean }) => {
    const args = [input];
    if (opts.change) args.push("--change", opts.change);
    if (opts.pending) args.push("--pending");
    if (opts.json) args.push("--json");
    runTask(["list", ...args]);
  });

task
  .command("add")
  .description("Add a task to a change node's plan")
  .argument("<input>", "SysProM document to modify (saved in place)")
  .argument("<change-id>", "ID of the change node")
  .argument("<description>", "task description")
  .action((input: string, changeId: string, description: string) => {
    runTask(["add", input, changeId, description]);
  });

task
  .command("done")
  .description("Mark a task as complete")
  .argument("<input>", "SysProM document to modify (saved in place)")
  .argument("<change-id>", "ID of the change node")
  .argument("<task-index>", "zero-based index of the task in the plan")
  .action((input: string, changeId: string, taskIndex: string) => {
    runTask(["done", input, changeId, taskIndex]);
  });

task
  .command("undone")
  .description("Mark a task as incomplete")
  .argument("<input>", "SysProM document to modify (saved in place)")
  .argument("<change-id>", "ID of the change node")
  .argument("<task-index>", "zero-based index of the task in the plan")
  .action((input: string, changeId: string, taskIndex: string) => {
    runTask(["undone", input, changeId, taskIndex]);
  });

// ============================================================================
// Plan commands
// ============================================================================

const plan = program
  .command("plan")
  .description("Plan management — initialise, track progress, and check gates");

plan
  .command("init")
  .description("Initialise a new plan document")
  .argument("<output>", "output file path for the new plan")
  .requiredOption("--prefix <prefix>", "plan ID prefix (required)")
  .option("--name <name>", "plan name (defaults to prefix)")
  .action((output: string, opts: { prefix: string; name?: string }) => {
    const args = [output, "--prefix", opts.prefix];
    if (opts.name) args.push("--name", opts.name);
    runPlan(["init", ...args]);
  });

plan
  .command("add-task")
  .description("Add a task to a plan")
  .argument("<input>", "plan document to modify (saved in place)")
  .requiredOption("--prefix <prefix>", "plan ID prefix (required)")
  .option("--name <name>", "task name")
  .option("--parent <parent-id>", "parent task ID for nesting")
  .action((input: string, opts: { prefix: string; name?: string; parent?: string }) => {
    const args = [input, "--prefix", opts.prefix];
    if (opts.name) args.push("--name", opts.name);
    if (opts.parent) args.push("--parent", opts.parent);
    runPlan(["add-task", ...args]);
  });

plan
  .command("status")
  .description("Show the overall status of a plan")
  .argument("<input>", "plan document to read")
  .requiredOption("--prefix <prefix>", "plan ID prefix (required)")
  .option("--json", "output as JSON")
  .action((input: string, opts: { prefix: string; json?: boolean }) => {
    const args = [input, "--prefix", opts.prefix];
    if (opts.json) args.push("--json");
    runPlan(["status", ...args]);
  });

plan
  .command("progress")
  .description("Show per-phase progress of a plan")
  .argument("<input>", "plan document to read")
  .requiredOption("--prefix <prefix>", "plan ID prefix (required)")
  .option("--json", "output as JSON")
  .action((input: string, opts: { prefix: string; json?: boolean }) => {
    const args = [input, "--prefix", opts.prefix];
    if (opts.json) args.push("--json");
    runPlan(["progress", ...args]);
  });

plan
  .command("gate")
  .description("Check whether a phase gate's criteria are met")
  .argument("<input>", "plan document to check")
  .requiredOption("--prefix <prefix>", "plan ID prefix (required)")
  .requiredOption("--phase <n>", "phase number to check")
  .option("--json", "output as JSON")
  .action((input: string, opts: { prefix: string; phase: string; json?: boolean }) => {
    const args = [input, "--prefix", opts.prefix, "--phase", opts.phase];
    if (opts.json) args.push("--json");
    runPlan(["gate", ...args]);
  });
