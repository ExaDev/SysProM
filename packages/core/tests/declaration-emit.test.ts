import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));

// Regression test for the declaration-emit bug where mutually-recursive Zod
// schemas (SysProMDocumentSchema and NodeSchema) caused tsc to serialise the
// recursive fields as elided-any in the emitted .d.ts. The fix declares
// SysProMDocument and Node as explicit named recursive interfaces and annotates
// the schema consts as z.ZodType<NamedType>. This test guards against future
// regression by asserting the built dist/schema.d.ts contains no elision
// markers.
describe("declaration emit", () => {
	it("dist/schema.d.ts contains no elided types", () => {
		const dts = join(here, "..", "dist", "schema.d.ts");
		if (!existsSync(dts)) {
			// Build has not run; skip rather than fail, so `pnpm test` (which does
			// not build) is not blocked. CI runs build then test.
			return;
		}
		const source = readFileSync(dts, "utf8");
		const marker = "elided";
		const matches = source.match(new RegExp(`/\\*${marker}\\*/`, "g"));
		assert.equal(
			matches,
			null,
			`dist/schema.d.ts must not contain elision markers (found ${matches?.length ?? 0}). Mutually-recursive schemas must be declared as named interfaces.`,
		);
	});
});
