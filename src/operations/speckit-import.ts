import * as z from "zod";
import { dirname } from "node:path";
import { defineOperation } from "./define-operation.js";
import { SysProMDocument } from "../schema.js";
import { parseSpecKitFeature } from "../speckit/parse.js";
import { detectSpecKitProject } from "../speckit/project.js";

export const speckitImportOp = defineOperation({
	name: "speckitImport",
	description: "Import a Spec-Kit feature directory into a SysProM document",
	input: z.object({
		speckitDir: z.string().describe("Path to Spec-Kit feature directory"),
		prefix: z
			.string()
			.optional()
			.describe("ID prefix (defaults to directory name)"),
	}),
	output: SysProMDocument,
	fn: ({ speckitDir, prefix }) => {
		// Determine the prefix: use flag if provided, otherwise use directory name
		let idPrefix = prefix;
		if (!idPrefix) {
			// Extract the feature directory name (e.g., "001-feature-name")
			const dirName = speckitDir.split("/").pop() || "FEAT";
			idPrefix = dirName;
		}

		// Find constitution file by detecting the project from parent directories
		let constitutionPath: string | undefined;
		let searchDir = dirname(speckitDir);
		for (let i = 0; i < 5; i++) {
			// Search up to 5 levels
			const project = detectSpecKitProject(searchDir);
			if (project.constitutionPath) {
				constitutionPath = project.constitutionPath;
				break;
			}
			const parent = dirname(searchDir);
			if (parent === searchDir) break; // reached root
			searchDir = parent;
		}

		// Parse Spec-Kit feature
		return parseSpecKitFeature(speckitDir, idPrefix, constitutionPath);
	},
});
