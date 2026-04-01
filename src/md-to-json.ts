import * as z from "zod";
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, basename } from "node:path";
import {
	type SysProMDocument,
	type Node,
	type Relationship,
	type ExternalReference,
	type Text,
	NODE_FILE_MAP,
	NODE_LABEL_TO_TYPE,
	RELATIONSHIP_TYPE_LABELS,
	RELATIONSHIP_LABEL_TO_TYPE,
	NodeType,
	RelationshipType,
	ExternalReferenceRole,
} from "./schema.js";
/** Strip markdown link syntax `[text](url)` → `text`. */

/**
 * Strip markdown link syntax `[text](url)` → `text`.
 * @param s - Markdown text potentially containing links
 * @returns Text with markdown links removed
 * @example
 * // stripMarkdownLink('[Hello](https://example.com)') // 'Hello'
 */
function stripMarkdownLink(s: string): string {
	return s.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
}

const LABEL_TO_TYPE: Record<string, string> = Object.fromEntries(
	Object.entries(NODE_LABEL_TO_TYPE).map(([k, v]) => [k.toLowerCase(), v]),
);

const operationType = z.enum(["add", "update", "remove", "link"]);

function parseNodeType(s: string): NodeType {
	const result = NodeType.safeParse(s);
	if (!result.success)
		throw new Error(
			`Unknown node type: "${s}". Valid types: ${NodeType.options.join(", ")}`,
		);
	return result.data;
}

function parseRelType(s: string): RelationshipType {
	const result = RelationshipType.safeParse(s);
	if (!result.success)
		throw new Error(
			`Unknown relationship type: "${s}". Valid types: ${RelationshipType.options.join(", ")}`,
		);
	return result.data;
}

function parseExtRefRole(s: string): ExternalReferenceRole {
	const result = ExternalReferenceRole.safeParse(s);
	if (!result.success)
		throw new Error(
			`Unknown external reference role: "${s}". Valid roles: ${ExternalReferenceRole.options.join(", ")}`,
		);
	return result.data;
}

// ---------------------------------------------------------------------------
// Text helpers
// ---------------------------------------------------------------------------

function parseText(raw: string): Text {
	const lines = raw.split("\n");
	return lines.length === 1 ? lines[0] : lines;
}

// ---------------------------------------------------------------------------
// Front matter
// ---------------------------------------------------------------------------

type FrontMatter = Record<string, unknown>;

/**
 * Separate $schema from front matter so it becomes a top-level document key.
 * @param front - The front matter object
 * @returns An object with extracted schema and remaining metadata
 * @example
 * ```ts
 * const { schema, metadata } = extractSchema({ $schema: "...", foo: "bar" });
 * ```
 */
function extractSchema(front: FrontMatter): {
	schema: string | undefined;
	metadata: FrontMatter;
} {
	const schema = typeof front.$schema === "string" ? front.$schema : undefined;
	const metadata = { ...front };
	delete metadata.$schema;
	return { schema, metadata };
}

function parseFrontMatter(content: string): {
	front: FrontMatter;
	body: string;
} {
	if (!content.startsWith("---\n")) return { front: {}, body: content };
	const end = content.indexOf("\n---\n", 4);
	if (end === -1) return { front: {}, body: content };

	const yaml = content.slice(4, end);
	const front: FrontMatter = {};
	for (const line of yaml.split("\n")) {
		const match = /^([\w$]+):\s*(.+)$/.exec(line);
		if (!match) continue;
		const [, key, raw] = match;
		if (raw.startsWith('"') && raw.endsWith('"')) {
			front[key] = raw.slice(1, -1);
		} else if (/^\d+$/.test(raw)) {
			front[key] = Number.parseInt(raw, 10);
		} else {
			front[key] = raw;
		}
	}
	return { front, body: content.slice(end + 5) };
}

// ---------------------------------------------------------------------------
// Markdown section parsing
// ---------------------------------------------------------------------------

interface Section {
	level: number;
	heading: string;
	body: string;
	children: Section[];
}

function parseSections(body: string): Section[] {
	const lines = body.split("\n");
	const all: Section[] = [];

	// First pass: find all headings and their body text (until next heading of any level)
	for (let i = 0; i < lines.length; i++) {
		const hMatch = /^(#{1,6})\s+(.+)$/.exec(lines[i]);
		if (hMatch) {
			const level = hMatch[1].length;
			const heading = hMatch[2];
			const bodyLines: string[] = [];
			for (let j = i + 1; j < lines.length; j++) {
				if (/^#{1,6}\s/.exec(lines[j])) break;
				bodyLines.push(lines[j]);
			}
			all.push({
				level,
				heading,
				body: bodyLines.join("\n").trim(),
				children: [],
			});
		}
	}

	// Second pass: build tree
	const root: Section[] = [];
	const stack: Section[] = [];

	for (const section of all) {
		while (stack.length > 0 && stack[stack.length - 1].level >= section.level) {
			stack.pop();
		}
		if (stack.length > 0) {
			stack[stack.length - 1].children.push(section);
		} else {
			root.push(section);
		}
		stack.push(section);
	}

	return root;
}

// ---------------------------------------------------------------------------
// Node parsing from sections
// ---------------------------------------------------------------------------

function parseNodeId(heading: string): { id: string; name: string } | null {
	const match = /^(\S+)\s+—\s+(.+)$/.exec(heading);
	if (!match) return null;
	return { id: match[1], name: match[2] };
}

function parseLifecycle(
	section: Section,
): Record<string, boolean | string> | undefined {
	const lifecycle: Record<string, boolean | string> = {};
	let found = false;
	for (const line of section.body.split("\n")) {
		const m = /^- \[([ x])\] (.+)$/.exec(line);
		if (m) {
			const isChecked = m[1] === "x";
			const text = m[2];

			// Check if the text ends with a parenthesised date
			const dateMatch = /(.+?)\s*\((\d{4}-\d{2}-\d{2}(?:T[^)]+)?)\)$/.exec(
				text,
			);

			const key = dateMatch
				? dateMatch[1].replace(/ /g, "_")
				: text.replace(/ /g, "_");

			// If a date is found, use the date string as the value regardless of checkbox state
			if (dateMatch) {
				lifecycle[key] = dateMatch[2];
			} else {
				// Otherwise, use boolean value
				lifecycle[key] = isChecked;
			}

			found = true;
		}
	}
	return found ? lifecycle : undefined;
}

const RELATIONSHIP_LABELS = Object.values(RELATIONSHIP_TYPE_LABELS);

function isRelationshipLabel(line: string): boolean {
	return RELATIONSHIP_LABELS.some((label) => line.startsWith(`- ${label}:`));
}

function parseListItems(body: string, prefix: string): string[] {
	const items: string[] = [];
	let collecting = false;
	for (const line of body.split("\n")) {
		if (line.startsWith(`${prefix}:`)) {
			collecting = true;
			const inline = line.slice(prefix.length + 1).trim();
			if (inline) {
				items.push(stripMarkdownLink(inline));
				collecting = false;
			}
			continue;
		}
		if (collecting && line.startsWith("  - ")) {
			items.push(stripMarkdownLink(line.slice(4)));
		} else if (
			collecting &&
			line.startsWith("- ") &&
			!isRelationshipLabel(line)
		) {
			items.push(stripMarkdownLink(line.slice(2)));
		} else if (collecting) {
			collecting = false;
		}
	}
	return items;
}

function parseSingleValue(body: string, prefix: string): string | undefined {
	const lines = body.split("\n");
	for (let i = 0; i < lines.length; i++) {
		if (lines[i].startsWith(`${prefix}: `)) {
			const firstLine = lines[i].slice(prefix.length + 2);
			const continuationLines = [firstLine];
			for (let j = i + 1; j < lines.length; j++) {
				const next = lines[j];
				if (next === "") break;
				if (next.startsWith("- ") || next.startsWith("#")) break;
				if (/^[A-Z][a-z]+: /.test(next)) break;
				continuationLines.push(next);
			}
			return continuationLines.join("\n");
		}
	}
	return undefined;
}

function parseRelationshipsFromBody(
	body: string,
	nodeId: string,
): Relationship[] {
	const rels: Relationship[] = [];
	for (const [label, type] of Object.entries(RELATIONSHIP_LABEL_TO_TYPE)) {
		const relType = parseRelType(type);
		const items = parseListItems(body, `- ${label}`);
		if (items.length === 0) {
			const val = parseSingleValue(body, `- ${label}`);
			if (val) {
				rels.push({ from: nodeId, to: stripMarkdownLink(val), type: relType });
			}
		} else {
			for (const target of items) {
				rels.push({ from: nodeId, to: target, type: relType });
			}
		}
	}
	return rels;
}

function parseNodeFromSection(
	section: Section,
): { node: Node; rels: Relationship[] } | null {
	const parsed = parseNodeId(section.heading);
	if (!parsed) return null;

	const { id, name } = parsed;
	const body = section.body;
	const node: Node = { id, type: parseNodeType("intent"), name }; // type overwritten by caller

	// Description is the first paragraph(s) before any list or sub-heading content
	const descLines: string[] = [];
	for (const line of body.split("\n")) {
		if (
			line.startsWith("- ") ||
			line.startsWith("Context:") ||
			line.startsWith("Options:") ||
			line.startsWith("Chosen:") ||
			line.startsWith("Rationale:") ||
			line.startsWith("Scope:") ||
			line.startsWith("Operations:") ||
			line.startsWith("Includes:") ||
			line === ""
		) {
			if (descLines.length > 0) break;
			if (line === "") continue;
			break;
		}
		descLines.push(line);
	}
	if (descLines.length > 0) {
		node.description = parseText(descLines.join("\n"));
	}

	// Decision fields
	const context = parseSingleValue(body, "Context");
	if (context) node.context = parseText(context);

	const chosen = parseSingleValue(body, "Chosen");
	if (chosen) node.selected = chosen;

	const rationale = parseSingleValue(body, "Rationale");
	if (rationale) node.rationale = parseText(rationale);

	// Options
	const optionLines = parseListItems(body, "Options");
	if (optionLines.length > 0) {
		node.options = optionLines.map((line) => {
			const m = /^(\S+):\s+(.+)$/.exec(line);
			return m
				? { id: m[1], description: m[2] }
				: { id: line, description: line };
		});
	}

	// Change fields
	const scopeItems = parseListItems(body, "Scope");
	if (scopeItems.length > 0) node.scope = scopeItems;

	const opLines = parseListItems(body, "Operations");
	if (opLines.length > 0) {
		node.operations = opLines.map((line) => {
			const parts = line.split(" ");
			const rawType = parts[0];
			const parsed = operationType.safeParse(rawType);
			if (!parsed.success) {
				throw new Error(
					`Unknown operation type: "${rawType}". Valid types: ${operationType.options.join(", ")}`,
				);
			}
			const type = parsed.data;
			const rest = parts.slice(1);
			const dashIdx = rest.indexOf("—");
			if (dashIdx >= 0) {
				return {
					type,
					target: rest.slice(0, dashIdx).join(" ") || undefined,
					description: rest.slice(dashIdx + 1).join(" "),
				};
			}
			return { type, target: rest.join(" ") || undefined };
		});
	}

	// View includes
	const includes = parseListItems(body, "Includes");
	if (includes.length > 0) node.includes = includes;

	// Lifecycle and propagation from child sections
	for (const child of section.children) {
		if (child.heading === "Lifecycle") {
			node.lifecycle = parseLifecycle(child);
		}
		if (child.heading === "Propagation") {
			const parsed = parseLifecycle(child);
			// Propagation values are always boolean — coerce any date strings to true.
			if (parsed) {
				const booleanOnly: Record<string, boolean> = {};
				for (const [k, v] of Object.entries(parsed)) {
					booleanOnly[k] = !!v;
				}
				node.propagation = booleanOnly;
			}
		}
	}

	// Relationships
	const rels = parseRelationshipsFromBody(body, id);

	return { node, rels };
}

// ---------------------------------------------------------------------------
// File-level parsing
// ---------------------------------------------------------------------------

function findTypeSections(sections: Section[]): Section[] {
	// Type sections (## Intent, ## Concepts, etc.) may be at root level
	// or nested under a top-level # heading. Flatten to find them.
	const result: Section[] = [];
	for (const s of sections) {
		if (LABEL_TO_TYPE[s.heading.toLowerCase()]) {
			result.push(s);
		}
		for (const child of s.children) {
			if (LABEL_TO_TYPE[child.heading.toLowerCase()]) {
				result.push(child);
			}
		}
	}
	return result;
}

function parseDocFile(
	content: string,
	types: string[],
): { nodes: Node[]; rels: Relationship[] } {
	const { body } = parseFrontMatter(content);
	const sections = parseSections(body);
	const typeSections = findTypeSections(sections);
	const nodes: Node[] = [];
	const rels: Relationship[] = [];

	for (const typeSection of typeSections) {
		const type =
			LABEL_TO_TYPE[typeSection.heading.toLowerCase()] ??
			types.find((t) => typeSection.heading.toLowerCase() === t);

		for (const child of typeSection.children) {
			const result = parseNodeFromSection(child);
			if (result) {
				result.node.type = parseNodeType(type);
				nodes.push(result.node);
				rels.push(...result.rels);
			}
		}
	}
	return { nodes, rels };
}

// ---------------------------------------------------------------------------
// External references from README
// ---------------------------------------------------------------------------

function parseExternalReferences(body: string): ExternalReference[] {
	const refs: ExternalReference[] = [];
	const lines = body.split("\n");
	let inSection = false;

	for (let i = 0; i < lines.length; i++) {
		if (/^##\s+External References/.exec(lines[i])) {
			inSection = true;
			continue;
		}
		if (inSection && /^##\s/.exec(lines[i])) break;
		if (inSection && lines[i].startsWith("- ")) {
			const m = /^- (\w+): (.+)$/.exec(lines[i]);
			if (m) {
				const ref: ExternalReference = {
					role: parseExtRefRole(m[1]),
					identifier: m[2],
				};
				// Check for indented sub-items
				for (
					let j = i + 1;
					j < lines.length && lines[j].startsWith("  - ");
					j++
				) {
					const sub = lines[j].slice(4);
					if (sub.startsWith("Node: ")) ref.node_id = sub.slice(6);
					else ref.description = sub;
					i = j;
				}
				refs.push(ref);
			}
		}
	}
	return refs;
}

// ---------------------------------------------------------------------------
// Relationship table from single file
// ---------------------------------------------------------------------------

function parseRelationshipTable(body: string): Relationship[] {
	const rels: Relationship[] = [];
	const lines = body.split("\n");
	let inTable = false;

	for (const line of lines) {
		if (line.startsWith("| From |")) {
			inTable = true;
			continue;
		}
		if (inTable && line.startsWith("|---")) continue;
		if (inTable && line.startsWith("|")) {
			const cells = line
				.split("|")
				.map((c) => c.trim())
				.filter(Boolean);
			if (cells.length >= 3) {
				rels.push({
					from: cells[0],
					to: cells[2],
					type: parseRelType(cells[1]),
				});
			}
		} else if (inTable) {
			inTable = false;
		}
	}
	return rels;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Parse a single Markdown file into a SysProM document.
 * @param content - The Markdown content to parse.
 * @returns The parsed SysProM document.
 * @example
 * ```ts
 * const doc = markdownSingleToJson(readFileSync("doc.spm.md", "utf8"));
 * ```
 */
export function markdownSingleToJson(content: string): SysProMDocument {
	const { front, body } = parseFrontMatter(content);
	const allTypes = [
		...NODE_FILE_MAP.INTENT,
		...NODE_FILE_MAP.INVARIANTS,
		...NODE_FILE_MAP.STATE,
		...NODE_FILE_MAP.DECISIONS,
		...NODE_FILE_MAP.CHANGES,
		"view",
		"milestone",
	];

	const { nodes, rels } = parseDocFile(content, allTypes);
	const tableRels = parseRelationshipTable(body);
	const extRefs = parseExternalReferences(body);

	const { schema, metadata: metaFront } = extractSchema(front);

	const doc: SysProMDocument = {
		...(schema ? { $schema: schema } : {}),
		metadata: Object.keys(metaFront).length > 0 ? metaFront : undefined,
		nodes,
		relationships:
			[...rels, ...tableRels].length > 0 ? [...rels, ...tableRels] : undefined,
		external_references: extRefs.length > 0 ? extRefs : undefined,
	};

	if (metaFront.title && typeof metaFront.title === "string") {
		doc.metadata = { ...metaFront };
	}

	return doc;
}

/**
 * Parse a multi-document Markdown folder into a SysProM document.
 * @param dir - Path to the directory containing Markdown files.
 * @returns The parsed SysProM document.
 * @example
 * ```ts
 * const doc = markdownMultiDocToJson("./SysProM");
 * ```
 */
export function markdownMultiDocToJson(dir: string): SysProMDocument {
	const readmeContent = readFileSync(join(dir, "README.md"), "utf8");
	const { front, body } = parseFrontMatter(readmeContent);

	const nodes: Node[] = [];
	const rels: Relationship[] = [];

	// Parse each document file
	for (const [fileName, types] of Object.entries(NODE_FILE_MAP)) {
		const filePath = join(dir, `${fileName}.md`);
		if (!existsSync(filePath)) continue;
		const content = readFileSync(filePath, "utf8");
		const result = parseDocFile(content, types);
		nodes.push(...result.nodes);
		rels.push(...result.rels);
	}

	// Parse views, milestones, versions from README
	const readmeSections = parseSections(body);
	const readmeTypeSections = findTypeSections(readmeSections);
	for (const typeSection of readmeTypeSections) {
		const type = LABEL_TO_TYPE[typeSection.heading.toLowerCase()];
		if (!type) continue;
		for (const child of typeSection.children) {
			const result = parseNodeFromSection(child);
			if (result) {
				result.node.type = parseNodeType(type);
				nodes.push(result.node);
				rels.push(...result.rels);
			}
		}
	}

	// External references from README
	const extRefs = parseExternalReferences(body);

	// Subsystem folders and .spm.md files (including inside grouping directories)
	function scanForSubsystems(scanDir: string): void {
		for (const entry of readdirSync(scanDir)) {
			const entryPath = join(scanDir, entry);

			if (
				statSync(entryPath).isDirectory() &&
				existsSync(join(entryPath, "README.md"))
			) {
				// Folder-based subsystem
				const idPrefix = entry.split("-")[0];
				const parentNode = nodes.find((n) => n.id === idPrefix);
				if (parentNode) {
					parentNode.subsystem = markdownMultiDocToJson(entryPath);
				}
			} else if (entry.endsWith(".spm.md")) {
				// Single-file subsystem
				const fileIdPrefix = basename(entry, ".spm.md").split("-")[0];
				const parentNode = nodes.find((n) => n.id === fileIdPrefix);
				if (parentNode) {
					parentNode.subsystem = markdownSingleToJson(
						readFileSync(entryPath, "utf8"),
					);
				}
			} else if (
				statSync(entryPath).isDirectory() &&
				!existsSync(join(entryPath, "README.md"))
			) {
				// Grouping directory (no README = not a subsystem, just organisational)
				scanForSubsystems(entryPath);
			}
		}
	}
	scanForSubsystems(dir);

	const { schema, metadata: metaFront } = extractSchema(front);

	const doc: SysProMDocument = {
		...(schema ? { $schema: schema } : {}),
		metadata: Object.keys(metaFront).length > 0 ? metaFront : undefined,
		nodes,
		relationships: rels.length > 0 ? rels : undefined,
		external_references: extRefs.length > 0 ? extRefs : undefined,
	};

	return doc;
}

/**
 * Parse Markdown into a SysProM document, auto-detecting single-file or multi-doc format.
 * @param input - File path or directory path to parse.
 * @returns The parsed SysProM document.
 * @example
 * ```ts
 * const doc = markdownToJson("./SysProM");
 * ```
 */
export function markdownToJson(input: string): SysProMDocument {
	if (statSync(input).isDirectory()) {
		return markdownMultiDocToJson(input);
	}
	return markdownSingleToJson(readFileSync(input, "utf8"));
}
