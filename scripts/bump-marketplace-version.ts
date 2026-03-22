#!/usr/bin/env tsx

import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";

const version = process.argv[2];
if (!version) {
	console.error("Usage: bump-marketplace-version.ts <version>");
	process.exit(1);
}

const root = join(dirname(new URL(import.meta.url).pathname), "..");
const path = join(root, ".claude-plugin", "marketplace.json");

const manifest = JSON.parse(readFileSync(path, "utf8")) as {
	plugins: { version: string }[];
};
for (const plugin of manifest.plugins) {
	plugin.version = version;
}

writeFileSync(path, JSON.stringify(manifest, null, 2) + "\n");
console.log(`Bumped ${String(manifest.plugins.length)} plugin(s) to ${version}`);
