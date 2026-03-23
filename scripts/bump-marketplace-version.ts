#!/usr/bin/env tsx

import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";

const version = process.argv[2];
if (!version) {
	console.error("Usage: bump-marketplace-version.ts <version>");
	process.exit(1);
}

const root = join(dirname(new URL(import.meta.url).pathname), "..");
const claudePluginDir = join(root, ".claude-plugin");

// Bump plugin.json version (authoritative source with strict: true)
const pluginPath = join(claudePluginDir, "plugin.json");
const plugin = JSON.parse(readFileSync(pluginPath, "utf8")) as {
	version: string;
};
plugin.version = version;
writeFileSync(pluginPath, JSON.stringify(plugin, null, 2) + "\n");
console.log(`Bumped plugin.json to ${version}`);
