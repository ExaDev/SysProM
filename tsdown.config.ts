import { defineConfig } from "tsdown";

/**
 * Build the published `sysprom` package.
 *
 * `@sysprom/core` is inlined (alwaysBundle) so the published package has no
 * runtime dependency on it; the real runtime deps and Node builtins stay
 * external. CLI/MCP entries get a shebang via onSuccess.
 */
export default defineConfig({
	entry: ["src/index.ts", "src/cli/index.ts", "src/mcp/index.ts"],
	format: "esm",
	outDir: "dist",
	clean: true,
	dts: true,
	deps: {
		neverBundle: [
			"zod",
			"commander",
			"picocolors",
			"@modelcontextprotocol/sdk",
		],
		alwaysBundle: [/^@sysprom\/core/],
	},
});
