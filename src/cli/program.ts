import { Command } from "commander";
import packageJson from "../../package.json" with { type: "json" };
import { buildCommander } from "./define-command.js";
import type { CommandDef } from "./define-command.js";
import { validateCommand } from "./commands/validate.js";
import { statsCommand } from "./commands/stats.js";
import { json2mdCommand } from "./commands/json2md.js";
import { md2jsonCommand } from "./commands/md2json.js";
import { removeCommand } from "./commands/remove.js";
import { addCommand } from "./commands/add.js";
import { initCommand } from "./commands/init.js";
import { searchCommand } from "./commands/search.js";
import { checkCommand } from "./commands/check.js";
import { graphCommand } from "./commands/graph.js";
import { renameCommand } from "./commands/rename.js";
import { queryCommand } from "./commands/query.js";
import { updateCommand } from "./commands/update.js";
import { speckitCommand } from "./commands/speckit.js";
import { taskCommand } from "./commands/task.js";
import { planCommand } from "./commands/plan.js";
import { syncCommandDef } from "./commands/sync.js";

export const program = new Command();

program
	.name("sysprom")
	.description(
		"System Provenance Model CLI — record where every part of a system came from",
	)
	.version(packageJson.version)
	.showHelpAfterError(true);

export const commands: CommandDef[] = [
	validateCommand,
	statsCommand,
	json2mdCommand,
	md2jsonCommand,
	queryCommand,
	addCommand,
	removeCommand,
	updateCommand,
	initCommand,
	searchCommand,
	checkCommand,
	graphCommand,
	renameCommand,
	speckitCommand,
	taskCommand,
	planCommand,
	syncCommandDef,
];

for (const cmd of commands) {
	buildCommander(cmd, program);
}

program
	.command("mcp")
	.description("Start the SysProM MCP server (stdio transport)")
	.action(async () => {
		await import("../mcp/server.js");
	});
