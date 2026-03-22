import * as z from "zod";
import { dirname } from "node:path";
import { defineOperation } from "./define-operation.js";
import { SysProMDocument, Node } from "../schema.js";
import { parseSpecKitFeature } from "../speckit/parse.js";
import { generateSpecKitProject } from "../speckit/generate.js";
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
	const oldNodes = new Map((oldDoc.nodes ?? []).map((n) => [n.id, n]));
	const newNodes = new Map((newDoc.nodes ?? []).map((n) => [n.id, n]));

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

export type SyncResult = z.infer<typeof SyncResult>;
export const SyncResult = z.object({
	doc: SysProMDocument,
	added: z.number(),
	modified: z.number(),
	removed: z.number(),
});

export const speckitSyncOp = defineOperation({
	name: "speckitSync",
	description: "Synchronise a SysProM document with a Spec-Kit directory",
	input: z.object({
		doc: SysProMDocument,
		speckitDir: z.string().describe("Path to Spec-Kit directory"),
		prefix: z
			.string()
			.optional()
			.describe("ID prefix (defaults to directory name)"),
	}),
	output: SyncResult,
	fn: ({ doc: syspromDoc, speckitDir, prefix }) => {
		// Determine the prefix: use flag if provided, otherwise use directory name
		let idPrefix = prefix;
		if (!idPrefix) {
			const dirName = speckitDir.split("/").pop() || "FEAT";
			idPrefix = dirName;
		}

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

		// Merge: Spec-Kit wins for content (description, status), SysProM wins for structure
		const mergedNodes = new Map((syspromDoc.nodes ?? []).map((n) => [n.id, n]));
		const specKitNodes = new Map(
			(specKitDoc.nodes ?? []).map((n) => [n.id, n]),
		);

		for (const [id, specKitNode] of specKitNodes) {
			const syspromNode = mergedNodes.get(id);
			if (!syspromNode) {
				// Add new node from Spec-Kit
				mergedNodes.set(id, specKitNode);
			} else {
				// Merge: Spec-Kit content wins, SysProM structure wins
				const merged: Node = {
					...syspromNode,
					description: specKitNode.description ?? syspromNode.description,
					status: specKitNode.status ?? syspromNode.status,
					context: specKitNode.context ?? syspromNode.context,
					options: specKitNode.options ?? syspromNode.options,
					selected: specKitNode.selected ?? syspromNode.selected,
					rationale: specKitNode.rationale ?? syspromNode.rationale,
					scope: specKitNode.scope ?? syspromNode.scope,
					operations: specKitNode.operations ?? syspromNode.operations,
					plan: specKitNode.plan ?? syspromNode.plan,
				};
				mergedNodes.set(id, merged);
			}
		}

		// Remove nodes that were deleted in Spec-Kit
		for (const node of diff.removed) {
			mergedNodes.delete(node.id);
		}

		// Update merged document
		const mergedDoc: SysProMDocument = {
			...syspromDoc,
			nodes: Array.from(mergedNodes.values()),
			relationships: syspromDoc.relationships, // Keep original relationships
		};

		// Re-generate Spec-Kit files from merged document
		generateSpecKitProject(mergedDoc, speckitDir, idPrefix);

		return {
			doc: mergedDoc,
			added: diff.added.length,
			modified: diff.modified.length,
			removed: diff.removed.length,
		};
	},
});
