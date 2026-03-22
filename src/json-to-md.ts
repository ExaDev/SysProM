import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
	type SysProMDocument,
	type Node,
	type Relationship,
	type ExternalReference,
	type Text,
	NODE_FILE_MAP,
	NODE_TYPE_LABELS,
	NodeType,
	RelationshipType,
	RELATIONSHIP_TYPE_LABELS,
} from "./schema.js";

// ---------------------------------------------------------------------------
// Text helpers
// ---------------------------------------------------------------------------

function renderText(value: Text): string {
	return Array.isArray(value) ? value.join("\n") : value;
}

function renderFrontMatter(fields: Record<string, unknown>): string {
	const lines = ["---"];
	for (const [key, value] of Object.entries(fields)) {
		if (value === undefined) continue;
		if (typeof value === "number") {
			lines.push(`${key}: ${String(value)}`);
		} else {
			lines.push(`${key}: ${JSON.stringify(value)}`);
		}
	}
	lines.push("---");
	return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Relationship lookups
// ---------------------------------------------------------------------------

type RelIndex = Map<string, Relationship[]>;

function indexRelationshipsFrom(rels: Relationship[]): RelIndex {
	const idx: RelIndex = new Map();
	for (const r of rels) {
		const list = idx.get(r.from);
		if (list) list.push(r);
		else idx.set(r.from, [r]);
	}
	return idx;
}

// ---------------------------------------------------------------------------
// Node rendering
// ---------------------------------------------------------------------------

// Canonical lifecycle stage orderings from PROT1 (decision), PROT2 (change), PROT3 (node).
// Keys not in any ordering are appended at the end in their original order.
const LIFECYCLE_ORDER: readonly string[] = [
	"proposed",
	"accepted",
	"active",
	"adopted",
	"implemented",
	"defined",
	"introduced",
	"in_progress",
	"complete",
	"consolidated",
	"experimental",
	"deprecated",
	"retired",
	"superseded",
	"abandoned",
	"deferred",
];

function renderLifecycle(
	lifecycle: Record<string, boolean | string>,
): string[] {
	const entries = Object.entries(lifecycle);
	entries.sort(([a], [b]) => {
		const ai = LIFECYCLE_ORDER.indexOf(a);
		const bi = LIFECYCLE_ORDER.indexOf(b);
		// Unknown keys sort after known ones, preserving relative order
		if (ai === -1 && bi === -1) return 0;
		if (ai === -1) return 1;
		if (bi === -1) return -1;
		return ai - bi;
	});
	return entries.map(([state, done]) => {
		const checkbox = done ? "x" : " ";
		const label = state.replace(/_/g, " ");
		if (typeof done === "string") {
			return `- [${checkbox}] ${label} (${done})`;
		}
		return `- [${checkbox}] ${label}`;
	});
}

function renderNodeRelationships(nodeId: string, fromIdx: RelIndex): string[] {
	const rels = fromIdx.get(nodeId);
	if (!rels || rels.length === 0) return [];

	const grouped = new Map<string, string[]>();
	for (const r of rels) {
		const list = grouped.get(r.type);
		if (list) list.push(r.to);
		else grouped.set(r.type, [r.to]);
	}

	const lines: string[] = [];
	for (const [type, targets] of grouped) {
		const label = RelationshipType.is(type)
			? RELATIONSHIP_TYPE_LABELS[type]
			: type;
		if (targets.length === 1) {
			lines.push(`- ${label}: ${targets[0]}`);
		} else {
			lines.push(`- ${label}:`);
			for (const t of targets) {
				lines.push(`  - ${t}`);
			}
		}
	}
	return lines;
}

function renderExternalReferences(refs: ExternalReference[]): string[] {
	if (refs.length === 0) return [];
	const lines = ["", "#### External References", ""];
	for (const ref of refs) {
		lines.push(`- ${ref.role}: ${ref.identifier}`);
		if (ref.description) {
			lines.push(`  - ${renderText(ref.description)}`);
		}
		if (ref.internalised) {
			lines.push(`  - Internalised: ${renderText(ref.internalised)}`);
		}
	}
	return lines;
}

function renderNode(
	n: Node,
	headingLevel: number,
	fromIdx: RelIndex,
): string[] {
	const prefix = "#".repeat(headingLevel);
	const lines: string[] = [];

	lines.push(`${prefix} ${n.id} — ${n.name}`);
	lines.push("");

	if (n.description) {
		lines.push(renderText(n.description));
		lines.push("");
	}

	const rels = renderNodeRelationships(n.id, fromIdx);
	if (rels.length > 0) {
		lines.push(...rels);
		lines.push("");
	}

	if (n.status) {
		lines.push(`- Status: ${n.status}`);
		lines.push("");
	}

	// Decision fields
	if (n.context) {
		lines.push(`Context: ${renderText(n.context)}`);
		lines.push("");
	}
	if (n.options && n.options.length > 0) {
		lines.push("Options:");
		for (const o of n.options) {
			lines.push(`- ${o.id}: ${renderText(o.description)}`);
		}
		lines.push("");
	}
	if (n.selected) {
		lines.push(`Chosen: ${n.selected}`);
		lines.push("");
	}
	if (n.rationale) {
		lines.push(`Rationale: ${renderText(n.rationale)}`);
		lines.push("");
	}

	// Change fields
	if (n.scope && n.scope.length > 0) {
		lines.push("Scope:");
		for (const s of n.scope) {
			lines.push(`- ${s}`);
		}
		lines.push("");
	}
	if (n.operations && n.operations.length > 0) {
		lines.push("Operations:");
		for (const op of n.operations) {
			const parts: string[] = [op.type];
			if (op.target) parts.push(op.target);
			if (op.description) parts.push(`— ${renderText(op.description)}`);
			lines.push(`- ${parts.join(" ")}`);
		}
		lines.push("");
	}
	if (n.plan && n.plan.length > 0) {
		lines.push(`${"#".repeat(headingLevel + 1)} Plan`);
		lines.push("");
		for (const t of n.plan) {
			lines.push(`- [${t.done ? "x" : " "}] ${renderText(t.description)}`);
		}
		lines.push("");
	}

	// Lifecycle
	if (n.lifecycle) {
		lines.push(`${"#".repeat(headingLevel + 1)} Lifecycle`);
		lines.push("");
		lines.push(...renderLifecycle(n.lifecycle));
		lines.push("");
	}

	// Propagation
	if (n.propagation) {
		lines.push(`${"#".repeat(headingLevel + 1)} Propagation`);
		lines.push("");
		lines.push(...renderLifecycle(n.propagation));
		lines.push("");
	}

	// View includes
	if (n.includes && n.includes.length > 0) {
		lines.push("Includes:");
		for (const inc of n.includes) {
			lines.push(`- ${inc}`);
		}
		lines.push("");
	}

	// Artefact flow
	if (n.input) {
		lines.push(`- Input: ${n.input}`);
	}
	if (n.output) {
		lines.push(`- Output: ${n.output}`);
	}
	if (n.input || n.output) {
		lines.push("");
	}

	// Inline external references
	if (n.external_references && n.external_references.length > 0) {
		lines.push(...renderExternalReferences(n.external_references));
		lines.push("");
	}

	// Subsystem note
	if (n.subsystem) {
		lines.push(`${"#".repeat(headingLevel + 1)} Subsystem`);
		lines.push("");
		const subNodes = n.subsystem.nodes;
		const subRels = n.subsystem.relationships ?? [];
		const subIdx = indexRelationshipsFrom(subRels);
		for (const sub of subNodes) {
			lines.push(...renderNode(sub, headingLevel + 2, subIdx));
		}
	}

	return lines;
}

// ---------------------------------------------------------------------------
// File generators
// ---------------------------------------------------------------------------

function renderNodesGrouped(
	nodes: Node[],
	types: string[],
	fromIdx: RelIndex,
	headingLevel: number,
): string[] {
	const lines: string[] = [];
	for (const type of types) {
		const matching = nodes.filter((n) => n.type === type);
		if (matching.length === 0) continue;

		const label = NodeType.is(type) ? NODE_TYPE_LABELS[type] : type;
		lines.push(`${"#".repeat(headingLevel)} ${label}`);
		lines.push("");

		for (const n of matching) {
			lines.push(...renderNode(n, headingLevel + 1, fromIdx));
		}
	}
	return lines;
}

function generateReadme(doc: SysProMDocument, fromIdx: RelIndex): string {
	const lines: string[] = [];
	const title = doc.metadata?.title ?? "SysProM";

	lines.push(
		renderFrontMatter({
			title,
			doc_type: doc.metadata?.doc_type ?? "sysprom",
			scope: doc.metadata?.scope,
			status: doc.metadata?.status,
			version: doc.metadata?.version,
		}),
	);
	lines.push("");
	lines.push(`# ${title}`);
	lines.push("");

	// Intent description
	const intent = doc.nodes.find((n) => n.type === "intent");
	if (intent?.description) {
		lines.push(renderText(intent.description));
		lines.push("");
	}

	// Determine which files will exist based on present node types
	const presentFiles: { file: string; label: string; role: string }[] = [];
	const fileDescriptions: Record<string, { label: string; role: string }> = {
		INTENT: {
			label: "Understand why this exists",
			role: "Enduring purpose, concepts, capabilities",
		},
		INVARIANTS: {
			label: "Understand what must always hold",
			role: "Rules that must hold across all valid states",
		},
		STATE: {
			label: "Understand what currently exists",
			role: "Current structure and active elements",
		},
		DECISIONS: {
			label: "Understand why things are the way they are",
			role: "Choices and rationale",
		},
		CHANGES: {
			label: "Understand how it has evolved",
			role: "Evolution over time",
		},
	};

	for (const [fileName, types] of Object.entries(NODE_FILE_MAP)) {
		if (doc.nodes.some((n) => types.includes(n.type))) {
			const desc = fileDescriptions[fileName];
			presentFiles.push({ file: fileName, ...desc });
		}
	}

	// Navigation — only link to files that exist
	if (presentFiles.length > 0) {
		lines.push("## Navigation");
		lines.push("");
		for (const { file, label } of presentFiles) {
			lines.push(`### ${label}`);
			lines.push(`See: [${file}.md](./${file}.md)`);
			lines.push("");
		}

		// Document roles table — only include present files
		lines.push("## Document Roles");
		lines.push("");
		lines.push("| Document | Role |");
		lines.push("|----------|------|");
		for (const { file, role } of presentFiles) {
			lines.push(`| ${file}.md | ${role} |`);
		}
		lines.push("");
	}

	// Views
	const views = doc.nodes.filter((n) => n.type === "view");
	if (views.length > 0) {
		lines.push(...renderNodesGrouped(doc.nodes, ["view"], fromIdx, 2));
	}

	// Graph-level external references
	if (doc.external_references && doc.external_references.length > 0) {
		lines.push("## External References");
		lines.push("");
		for (const ref of doc.external_references) {
			const parts = [`- ${ref.role}: ${ref.identifier}`];
			if (ref.node_id) parts.push(`  - Node: ${ref.node_id}`);
			if (ref.description) parts.push(`  - ${renderText(ref.description)}`);
			lines.push(...parts);
		}
		lines.push("");
	}

	return lines.join("\n") + "\n";
}

function generateDocFile(
	doc: SysProMDocument,
	fileName: string,
	types: string[],
	fromIdx: RelIndex,
): string {
	const lines: string[] = [];

	lines.push(
		renderFrontMatter({
			title: fileName.replace(".md", ""),
			doc_type: fileName.replace(".md", "").toLowerCase(),
		}),
	);
	lines.push("");
	lines.push(`# ${fileName.replace(".md", "")}`);
	lines.push("");
	lines.push(...renderNodesGrouped(doc.nodes, types, fromIdx, 2));

	return lines.join("\n") + "\n";
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Options for controlling JSON-to-Markdown conversion. */
export interface ConvertOptions {
	form: "single-file" | "multi-doc";
}

/**
 * Convert a SysProM document to a single Markdown string.
 *
 * @param doc - The SysProM document to convert.
 * @returns The Markdown representation.
 */
export function jsonToMarkdownSingle(doc: SysProMDocument): string {
	const fromIdx = indexRelationshipsFrom(doc.relationships ?? []);
	const lines: string[] = [];
	const title = doc.metadata?.title ?? "SysProM";

	lines.push(
		renderFrontMatter({
			title,
			doc_type: doc.metadata?.doc_type ?? "sysprom",
			scope: doc.metadata?.scope,
			status: doc.metadata?.status,
			version: doc.metadata?.version,
		}),
	);
	lines.push("");
	lines.push(`# ${title}`);
	lines.push("");

	const allTypes = [
		...NODE_FILE_MAP.INTENT,
		...NODE_FILE_MAP.INVARIANTS,
		...NODE_FILE_MAP.STATE,
		...NODE_FILE_MAP.DECISIONS,
		...NODE_FILE_MAP.CHANGES,
		"view",
		"milestone",
		"version",
	];

	lines.push(...renderNodesGrouped(doc.nodes, allTypes, fromIdx, 2));

	// Relationships summary
	if (doc.relationships && doc.relationships.length > 0) {
		lines.push("## Relationships");
		lines.push("");
		lines.push("| From | Type | To |");
		lines.push("|------|------|----|");
		for (const r of doc.relationships) {
			lines.push(`| ${r.from} | ${r.type} | ${r.to} |`);
		}
		lines.push("");
	}

	// External references
	if (doc.external_references && doc.external_references.length > 0) {
		lines.push("## External References");
		lines.push("");
		for (const ref of doc.external_references) {
			lines.push(`- ${ref.role}: ${ref.identifier}`);
			if (ref.node_id) lines.push(`  - Node: ${ref.node_id}`);
			if (ref.description) lines.push(`  - ${renderText(ref.description)}`);
		}
		lines.push("");
	}

	return lines.join("\n") + "\n";
}

/**
 * Convert a SysProM document to a multi-document Markdown folder.
 *
 * @param doc - The SysProM document to convert.
 * @param outDir - Output directory path.
 */
export function jsonToMarkdownMultiDoc(
	doc: SysProMDocument,
	outDir: string,
): void {
	mkdirSync(outDir, { recursive: true });

	const fromIdx = indexRelationshipsFrom(doc.relationships ?? []);

	writeFileSync(join(outDir, "README.md"), generateReadme(doc, fromIdx));

	for (const [fileName, types] of Object.entries(NODE_FILE_MAP)) {
		const hasNodes = doc.nodes.some((n) => types.includes(n.type));
		if (!hasNodes) continue;
		writeFileSync(
			join(outDir, `${fileName}.md`),
			generateDocFile(doc, fileName, types, fromIdx),
		);
	}

	// Subsystem folders or single files
	const subsystemNodes = doc.nodes.filter((n) => n.subsystem);

	// Count subsystems per type to decide automatic grouping
	const typeCounts = new Map<string, number>();
	for (const n of subsystemNodes) {
		typeCounts.set(n.type, (typeCounts.get(n.type) ?? 0) + 1);
	}

	for (const n of subsystemNodes) {
		const subsystem = n.subsystem;
		if (!subsystem) continue;
		const subDoc: SysProMDocument = {
			...subsystem,
			metadata: {
				title: `${n.id} — ${n.name}`,
				doc_type: n.type,
				scope: n.type,
				status: n.status,
			},
		};

		// Count how many distinct file types would be produced
		const fileCounts = Object.values(NODE_FILE_MAP).filter((types) =>
			subDoc.nodes.some((sn) => types.includes(sn.type)),
		).length;

		const slug = `${n.id}-${n.name
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/-$/, "")}`;

		// Auto-group when 2+ subsystems share the same type
		let parentDir = outDir;
		if ((typeCounts.get(n.type) ?? 0) >= 2 && NodeType.is(n.type)) {
			const groupLabel = NODE_TYPE_LABELS[n.type]
				.toLowerCase()
				.replace(/ /g, "-");
			parentDir = join(outDir, groupLabel);
			mkdirSync(parentDir, { recursive: true });
		}

		if (fileCounts <= 1) {
			const singleContent = jsonToMarkdownSingle(subDoc);
			const lineCount = singleContent.split("\n").length;
			if (lineCount <= 100) {
				writeFileSync(join(parentDir, `${slug}.spm.md`), singleContent);
			} else {
				jsonToMarkdownMultiDoc(subDoc, join(parentDir, slug));
			}
		} else {
			jsonToMarkdownMultiDoc(subDoc, join(parentDir, slug));
		}
	}
}

/**
 * Convert a SysProM document to Markdown, writing to the specified output path.
 *
 * @param doc - The SysProM document to convert.
 * @param output - Output file or directory path.
 * @param options - Conversion options specifying single-file or multi-doc form.
 */
export function jsonToMarkdown(
	doc: SysProMDocument,
	output: string,
	options: ConvertOptions,
): void {
	if (options.form === "single-file") {
		writeFileSync(output, jsonToMarkdownSingle(doc));
	} else {
		jsonToMarkdownMultiDoc(doc, output);
	}
}
