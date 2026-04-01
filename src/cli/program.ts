import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Command } from "commander";
import { buildCommander } from "./define-command.js";
import type { CommandDef } from "./define-command.js";

let cachedVersion: string | undefined;

function getVersion(): string {
	if (cachedVersion === undefined) {
		const __dirname = dirname(fileURLToPath(import.meta.url));
		// Works from both src/cli/ (../../) and dist/src/cli/ (../../../)
		const candidates = [
			resolve(__dirname, "../../package.json"),
			resolve(__dirname, "../../../package.json"),
		];
		const pkgPath = candidates.find(
			(p) => existsSync(p) && !p.includes("/dist/"),
		);
		if (!pkgPath) throw new Error("Could not find sysprom package.json");
		const pkg: unknown = JSON.parse(readFileSync(pkgPath, "utf8"));
		if (
			typeof pkg !== "object" ||
			pkg === null ||
			!("version" in pkg) ||
			typeof pkg.version !== "string"
		) {
			throw new Error("Invalid package.json: missing version field");
		}
		cachedVersion = pkg.version;
	}
	return cachedVersion;
}
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
import { planCommand } from "./commands/plan.js";
import { syncCommandDef } from "./commands/sync.js";
import { inferCommand } from "./commands/infer.js";

export const program = new Command();

program
	.name("sysprom")
	.description(
		"System Provenance Model CLI — record where every part of a system came from",
	)
	.option("-V, --version", "output the version number")
	.on("option:version", () => {
		console.log(getVersion());
		process.exit(0);
	})
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
	planCommand,
	syncCommandDef,
	inferCommand,
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
