import { loadDocument, saveDocument } from "../io.js";
import { addPlanTask, updatePlanTask } from "../mutate.js";
import { textToString } from "../text.js";

// ============================================================================
// Flag parsing helper
// ============================================================================

function parseFlag(args: string[], flag: string): string | undefined {
  const idx = args.indexOf(flag);
  if (idx >= 0 && idx + 1 < args.length) return args[idx + 1];
  return undefined;
}

// ============================================================================
// task list
// ============================================================================

function runList(args: string[]): void {
  if (args.length < 1) {
    console.error(
      "Usage: sysprom task list <input> [--change <id>] [--pending] [--json]",
    );
    process.exit(1);
  }

  const inputPath = args[0];
  const changeFilter = parseFlag(args, "--change");
  const pendingOnly = args.includes("--pending");
  const asJson = args.includes("--json");

  const { doc } = loadDocument(inputPath);

  let changeNodes = doc.nodes.filter((n) => n.type === "change");

  if (changeFilter) {
    changeNodes = changeNodes.filter((n) => n.id === changeFilter);
    if (changeNodes.length === 0) {
      console.error(`Change node not found: ${changeFilter}`);
      process.exit(1);
    }
  }

  type Row = {
    changeId: string;
    index: number;
    description: string;
    done: boolean;
  };
  const rows: Row[] = [];

  for (const node of changeNodes) {
    for (const [i, task] of (node.plan ?? []).entries()) {
      const done = task.done === true;
      if (pendingOnly && done) continue;
      rows.push({
        changeId: node.id,
        index: i,
        description: textToString(task.description),
        done,
      });
    }
  }

  if (asJson) {
    console.log(JSON.stringify(rows, null, 2));
    return;
  }

  const header = `${"Change".padEnd(12)} ${"#".padEnd(4)} ${"Done".padEnd(6)} Description`;
  const divider = `${"-".repeat(12)} ${"-".repeat(4)} ${"-".repeat(6)} ${"-".repeat(30)}`;
  console.log(header);
  console.log(divider);

  for (const row of rows) {
    const doneStr = row.done ? "[x]" : "[ ]";
    console.log(
      `${row.changeId.padEnd(12)} ${String(row.index).padEnd(4)} ${doneStr.padEnd(6)} ${row.description}`,
    );
  }

  console.log(`\n${rows.length} task(s)`);
}

// ============================================================================
// task add
// ============================================================================

function runAdd(args: string[]): void {
  if (args.length < 3) {
    console.error("Usage: sysprom task add <input> <change-id> <description>");
    process.exit(1);
  }

  const { doc, format, path } = loadDocument(args[0]);
  const changeId = args[1];
  const description = args[2];

  try {
    const newDoc = addPlanTask(doc, changeId, description);
    saveDocument(newDoc, format, path);
    const node = newDoc.nodes.find((n) => n.id === changeId)!;
    const newIndex = (node.plan?.length ?? 1) - 1;
    console.log(`Added task ${newIndex} to ${changeId}`);
  } catch (err) {
    console.error((err as Error).message);
    process.exit(1);
  }
}

// ============================================================================
// task done / undone
// ============================================================================

function runSetDone(args: string[], done: boolean): void {
  const verb = done ? "done" : "undone";
  if (args.length < 3) {
    console.error(
      `Usage: sysprom task ${verb} <input> <change-id> <task-index>`,
    );
    process.exit(1);
  }

  const { doc, format, path } = loadDocument(args[0]);
  const changeId = args[1];
  const taskIndex = parseInt(args[2], 10);

  if (isNaN(taskIndex) || taskIndex < 0) {
    console.error(`Invalid task index: ${args[2]}`);
    process.exit(1);
  }

  try {
    const newDoc = updatePlanTask(doc, changeId, taskIndex, done);
    saveDocument(newDoc, format, path);
    console.log(`Marked task ${taskIndex} ${verb} on ${changeId}`);
  } catch (err) {
    console.error((err as Error).message);
    process.exit(1);
  }
}

// ============================================================================
// Dispatcher
// ============================================================================

export function run(args: string[]): void {
  if (args.length < 1) {
    console.error("Usage: sysprom task <list|add|done|undone> [options]");
    process.exit(1);
  }

  const subcommand = args[0];
  const subcommandArgs = args.slice(1);

  switch (subcommand) {
    case "list":
      runList(subcommandArgs);
      break;
    case "add":
      runAdd(subcommandArgs);
      break;
    case "done":
      runSetDone(subcommandArgs, true);
      break;
    case "undone":
      runSetDone(subcommandArgs, false);
      break;
    default:
      console.error(
        `Unknown subcommand: ${subcommand}. Expected: list, add, done, or undone`,
      );
      process.exit(1);
  }
}
