import * as z from "zod";
import { dirname } from "node:path";
import { defineOperation } from "./define-operation.js";
import { SysProMDocument, Node } from "../schema.js";
import { parseSpecKitFeature } from "../speckit/parse.js";
import { detectSpecKitProject } from "../speckit/project.js";

interface NodeDiff {
	added: Node[];
	modified: { old: Node; new: Node }[];
	removed: Node[];
}

function compareDocuments(
	oldDoc: SysProMDocument,
	newDoc: SysProMDocument,
): NodeDiff {
	const oldNodes = new Map(oldDoc.nodes.map((n) => [n.id, n]));
	const newNodes = new Map(newDoc.nodes.map((n) => [n.id, n]));

	const added: Node[] = [];
	const modified: { old: Node; new: Node }[] = [];
	const removed: Node[] = [];

	// Find added and modified
	for (const [id, newNode] of newNodes) {
		const oldNode = oldNodes.get(id);
		if (!oldNode) {
			added.push(newNode);
		} else if (JSON.stringify(oldNode) !== JSON.stringify(newNode)) {
			modified.push({ old: oldNode, new: newNode });
		}
	}

	// Find removed
	for (const [id, oldNode] of oldNodes) {
		if (!newNodes.has(id)) {
			removed.push(oldNode);
		}
	}

	return { added, modified, removed };
}

export type DiffResult = z.infer<typeof DiffResult>;
export const DiffResult = z.object({
	added: z.array(
		z.object({
			id: z.string(),
			name: z.string(),
		}),
	),
	modified: z.array(
		z.object({
			id: z.string(),
			oldName: z.string(),
			newName: z.string(),
		}),
	),
	removed: z.array(
		z.object({
			id: z.string(),
			name: z.string(),
		}),
	),
});

export const speckitDiffOp = defineOperation({
	name: "speckitDiff",
	description:
		"Show differences between a SysProM document and a Spec-Kit directory",
	input: z.object({
		doc: SysProMDocument,
		speckitDir: z.string().describe("Path to Spec-Kit directory"),
		prefix: z
			.string()
			.optional()
			.describe("ID prefix (defaults to directory name)"),
	}),
	output: DiffResult,
	fn: ({ doc: syspromDoc, speckitDir, prefix }) => {
		// Determine the prefix: use flag if provided, otherwise use directory name
		const idPrefix = prefix ?? speckitDir.split("/").pop() ?? "FEAT";

		// Find constitution file
		let constitutionPath: string | undefined;
		let searchDir = dirname(speckitDir);
		for (let i = 0; i < 5; i++) {
			const project = detectSpecKitProject(searchDir);
			if (project.constitutionPath) {
				constitutionPath = project.constitutionPath;
				break;
			}
			const parent = dirname(searchDir);
			if (parent === searchDir) break;
			searchDir = parent;
		}

		// Parse Spec-Kit feature
		const specKitDoc = parseSpecKitFeature(
			speckitDir,
			idPrefix,
			constitutionPath,
		);

		// Compare documents
		const diff = compareDocuments(syspromDoc, specKitDoc);

		return {
			added: diff.added.map((n) => ({ id: n.id, name: n.name })),
			modified: diff.modified.map(({ old, new: newNode }) => ({
				id: old.id,
				oldName: old.name,
				newName: newNode.name,
			})),
			removed: diff.removed.map((n) => ({ id: n.id, name: n.name })),
		};
	},
});
