import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { type SysProMDocument } from "@sysprom/core";
import {
	jsonToMarkdownSingle,
	renderMultiDoc,
	type ConvertOptions,
} from "@sysprom/core";

export type { ConvertOptions };
export { jsonToMarkdownSingle };

type DiagramLayout = "LR" | "TD" | "RL" | "BT";

interface MultiDocOptions {
	embedDiagrams?: boolean;
	diagramLinks?: boolean;
	labelMode?: "friendly" | "compact";
	relationshipLayout?: DiagramLayout;
	refinementLayout?: DiagramLayout;
	decisionLayout?: DiagramLayout;
	dependencyLayout?: DiagramLayout;
}

/**
 * Convert a SysProM document to a multi-document Markdown folder. Thin fs
 * wrapper over the pure `renderMultiDoc` from `@sysprom/core`: builds the file
 * map in memory, then creates the output directory and writes each entry.
 * Behaviour is identical to the previous inline implementation.
 * @param doc - The SysProM document to convert.
 * @param outDir - Output directory path.
 * @param options - Rendering options (diagrams, label mode, layouts).
 * @example
 * ```ts
 * jsonToMarkdownMultiDoc(doc, "./SysProM");
 * ```
 */
export function jsonToMarkdownMultiDoc(
	doc: SysProMDocument,
	outDir: string,
	options?: MultiDocOptions,
): void {
	mkdirSync(outDir, { recursive: true });

	const files = renderMultiDoc(doc, options);
	for (const [relPath, content] of Object.entries(files)) {
		const fullPath = join(outDir, ...relPath.split("/"));
		// Ensure parent directories exist for nested subsystem/grouping paths.
		const parent = fullPath.slice(0, fullPath.lastIndexOf("/"));
		if (parent && parent !== outDir) {
			mkdirSync(parent, { recursive: true });
		}
		writeFileSync(fullPath, content);
	}
}

/**
 * Convert a SysProM document to Markdown, writing to the specified output path.
 * @param doc - The SysProM document to convert.
 * @param output - Output file or directory path.
 * @param options - Conversion options specifying single-file or multi-doc form.
 * @example
 * ```ts
 * jsonToMarkdown(doc, "output.spm.md", { form: "single-file" });
 * ```
 */
export function jsonToMarkdown(
	doc: SysProMDocument,
	output: string,
	options: ConvertOptions,
): void {
	if (options.form === "single-file") {
		writeFileSync(
			output,
			jsonToMarkdownSingle(doc, {
				embedDiagrams: options.embedDiagrams,
				diagramLinks: options.diagramLinks,
				labelMode: options.labelMode,
				relationshipLayout: options.relationshipLayout,
				refinementLayout: options.refinementLayout,
				decisionLayout: options.decisionLayout,
				dependencyLayout: options.dependencyLayout,
			}),
		);
	} else {
		jsonToMarkdownMultiDoc(doc, output, {
			embedDiagrams: options.embedDiagrams,
			diagramLinks: options.diagramLinks,
			labelMode: options.labelMode,
			relationshipLayout: options.relationshipLayout,
			refinementLayout: options.refinementLayout,
			decisionLayout: options.decisionLayout,
			dependencyLayout: options.dependencyLayout,
		});
	}
}
