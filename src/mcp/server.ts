#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as z from "zod";
import { loadDocument, saveDocument } from "../io.js";
import { NodeType, RelationshipType } from "../schema.js";
import {
	validateOp,
	statsOp,
	queryNodesOp,
	queryNodeOp,
	queryRelationshipsOp,
	traceFromNodeOp,
	addNodeOp,
	removeNodeOp,
	updateNodeOp,
	addRelationshipOp,
	removeRelationshipOp,
	nextIdOp,
	inferCompletenessOp,
	inferLifecycleOp,
	inferImpactOp,
	impactSummaryOp,
	inferDerivedOp,
} from "../operations/index.js";

// Create MCP server instance
const server = new McpServer({
	name: "sysprom-mcp",
	version: "1.0.0",
});

// Register validate tool
server.registerTool(
	"validate",
	{
		description: "Validate a SysProM document and return any validation issues",
		inputSchema: z.object({
			path: z.string().describe("Path to SysProM file"),
		}),
	},
	({ path }) => {
		const { doc } = loadDocument(path);
		const result = validateOp({ doc });
		return {
			content: [
				{
					type: "text" as const,
					text: JSON.stringify(result, null, 2),
				},
			],
		};
	},
);

// Register stats tool
server.registerTool(
	"stats",
	{
		description: "Get statistics about a SysProM document",
		inputSchema: z.object({
			path: z.string().describe("Path to SysProM file"),
		}),
	},
	({ path }) => {
		const { doc } = loadDocument(path);
		const result = statsOp({ doc });
		return {
			content: [
				{
					type: "text" as const,
					text: JSON.stringify(result, null, 2),
				},
			],
		};
	},
);

// Register query-nodes tool
server.registerTool(
	"query-nodes",
	{
		description: "Query nodes by type, status, or other criteria",
		inputSchema: z.object({
			path: z.string().describe("Path to SysProM file"),
			type: z.string().optional().describe("Filter by node type"),
			status: z.string().optional().describe("Filter by node status"),
		}),
	},
	({ path, type, status }) => {
		const { doc } = loadDocument(path);
		const results = queryNodesOp({
			doc,
			type,
			status,
		});

		return {
			content: [
				{
					type: "text" as const,
					text: JSON.stringify(results, null, 2),
				},
			],
		};
	},
);

// Register query-node tool
server.registerTool(
	"query-node",
	{
		description: "Get a specific node by ID",
		inputSchema: z.object({
			path: z.string().describe("Path to SysProM file"),
			id: z.string().describe("Node ID"),
		}),
	},
	({ path, id }) => {
		const { doc } = loadDocument(path);
		const result = queryNodeOp({ doc, id });
		return {
			content: [
				{
					type: "text" as const,
					text: JSON.stringify(result, null, 2),
				},
			],
		};
	},
);

// Register query-relationships tool
server.registerTool(
	"query-relationships",
	{
		description: "Query relationships by source, target, or type",
		inputSchema: z.object({
			path: z.string().describe("Path to SysProM file"),
			from: z.string().optional().describe("Filter by source node ID"),
			to: z.string().optional().describe("Filter by target node ID"),
			type: z.string().optional().describe("Filter by relationship type"),
		}),
	},
	({ path, from, to, type }) => {
		const { doc } = loadDocument(path);
		const results = queryRelationshipsOp({
			doc,
			from,
			to,
			type,
		});

		return {
			content: [
				{
					type: "text" as const,
					text: JSON.stringify(results, null, 2),
				},
			],
		};
	},
);

// Register trace tool
server.registerTool(
	"trace",
	{
		description: "Trace impacts from a node through the graph",
		inputSchema: z.object({
			path: z.string().describe("Path to SysProM file"),
			from: z.string().describe("Starting node ID"),
		}),
	},
	({ path, from }) => {
		const { doc } = loadDocument(path);
		const result = traceFromNodeOp({ doc, startId: from });
		return {
			content: [
				{
					type: "text" as const,
					text: JSON.stringify(result, null, 2),
				},
			],
		};
	},
);

// Register add-node tool
server.registerTool(
	"add-node",
	{
		description: "Add a new node to the SysProM document",
		inputSchema: z.object({
			path: z.string().describe("Path to SysProM file"),
			type: z.string().describe("Node type"),
			id: z.string().optional().describe("Node ID (auto-generated if omitted)"),
			name: z.string().describe("Node name"),
			description: z.string().optional().describe("Node description"),
		}),
	},
	({ path, type, id, name, description }) => {
		const loaded = loadDocument(path);
		const nodeType = NodeType.safeParse(type);
		if (!nodeType.success) {
			throw new Error(
				`Invalid node type: "${type}". Valid types: ${NodeType.options.join(", ")}`,
			);
		}
		const nodeId = id ?? nextIdOp({ doc: loaded.doc, type: nodeType.data });
		const updated = addNodeOp({
			doc: loaded.doc,
			node: {
				id: nodeId,
				type: nodeType.data,
				name,
				...(description && { description }),
			},
		});
		saveDocument(updated, loaded.format, loaded.path);

		return {
			content: [
				{
					type: "text" as const,
					text: JSON.stringify(
						{
							message: "Node added",
							id: nodeId,
							nodeCount: updated.nodes.length,
						},
						null,
						2,
					),
				},
			],
		};
	},
);

// Register remove-node tool
server.registerTool(
	"remove-node",
	{
		description: "Remove a node from the SysProM document",
		inputSchema: z.object({
			path: z.string().describe("Path to SysProM file"),
			id: z.string().describe("Node ID"),
		}),
	},
	({ path, id }) => {
		const loaded = loadDocument(path);
		const result = removeNodeOp({ doc: loaded.doc, id });
		saveDocument(result.doc, loaded.format, loaded.path);
		return {
			content: [
				{
					type: "text" as const,
					text: JSON.stringify(
						{
							message: `Node ${id} removed`,
							nodeCount: result.doc.nodes.length,
							warnings: result.warnings,
						},
						null,
						2,
					),
				},
			],
		};
	},
);

// Register update-node tool
server.registerTool(
	"update-node",
	{
		description: "Update node properties",
		inputSchema: z.object({
			path: z.string().describe("Path to SysProM file"),
			id: z.string().describe("Node ID"),
			fields: z.record(z.string(), z.unknown()).describe("Fields to update"),
		}),
	},
	({ path, id, fields }) => {
		const loaded = loadDocument(path);
		// Validate fields are valid node property updates
		const validFields = Object.entries(fields).reduce<Record<string, unknown>>(
			(acc, [key, value]) => {
				// Allow common node fields; unknown fields are silently ignored
				if (
					[
						"name",
						"description",
						"status",
						"context",
						"options",
						"selected",
						"rationale",
						"scope",
						"operations",
						"plan",
						"propagation",
						"includes",
						"input",
						"output",
						"external_references",
					].includes(key)
				) {
					acc[key] = value;
				}
				return acc;
			},
			{},
		);
		const updated = updateNodeOp({
			doc: loaded.doc,
			id,
			fields: validFields,
		});
		saveDocument(updated, loaded.format, loaded.path);
		const node = updated.nodes.find((n) => n.id === id);
		return {
			content: [
				{
					type: "text" as const,
					text: JSON.stringify({ message: "Node updated", node }, null, 2),
				},
			],
		};
	},
);

// Register add-relationship tool
server.registerTool(
	"add-relationship",
	{
		description: "Add a relationship between two nodes",
		inputSchema: z.object({
			path: z.string().describe("Path to SysProM file"),
			from: z.string().describe("Source node ID"),
			to: z.string().describe("Target node ID"),
			type: z.string().describe("Relationship type"),
		}),
	},
	({ path, from, to, type }) => {
		const loaded = loadDocument(path);
		const relType = RelationshipType.safeParse(type);
		if (!relType.success) {
			throw new Error(
				`Invalid relationship type: "${type}". Valid types: ${RelationshipType.options.join(", ")}`,
			);
		}
		const updated = addRelationshipOp({
			doc: loaded.doc,
			rel: {
				from,
				to,
				type: relType.data,
			},
		});
		saveDocument(updated, loaded.format, loaded.path);
		return {
			content: [
				{
					type: "text" as const,
					text: JSON.stringify(
						{
							message: "Relationship added",
							relationshipCount: (updated.relationships ?? []).length,
						},
						null,
						2,
					),
				},
			],
		};
	},
);

// Register remove-relationship tool
server.registerTool(
	"remove-relationship",
	{
		description: "Remove a relationship between two nodes",
		inputSchema: z.object({
			path: z.string().describe("Path to SysProM file"),
			from: z.string().describe("Source node ID"),
			to: z.string().describe("Target node ID"),
			type: z.string().describe("Relationship type"),
		}),
	},
	({ path, from, to, type }) => {
		const loaded = loadDocument(path);
		const relType = RelationshipType.safeParse(type);
		if (!relType.success) {
			throw new Error(
				`Invalid relationship type: "${type}". Valid types: ${RelationshipType.options.join(", ")}`,
			);
		}
		const result = removeRelationshipOp({
			doc: loaded.doc,
			from,
			to,
			type: relType.data,
		});
		saveDocument(result.doc, loaded.format, loaded.path);
		return {
			content: [
				{
					type: "text" as const,
					text: JSON.stringify(
						{
							message: "Relationship removed",
							relationshipCount: (result.doc.relationships ?? []).length,
						},
						null,
						2,
					),
				},
			],
		};
	},
);

// Register infer-completeness tool
server.registerTool(
	"infer-completeness",
	{
		description:
			"Infer completeness of nodes based on expected refinement relationships",
		inputSchema: z.object({
			path: z.string().describe("Path to SysProM file"),
		}),
	},
	({ path }) => {
		const { doc } = loadDocument(path);
		const result = inferCompletenessOp({ doc });
		return {
			content: [
				{
					type: "text" as const,
					text: JSON.stringify(result, null, 2),
				},
			],
		};
	},
);

// Register infer-lifecycle tool
server.registerTool(
	"infer-lifecycle",
	{
		description:
			"Infer lifecycle state for nodes based on status and lifecycle fields",
		inputSchema: z.object({
			path: z.string().describe("Path to SysProM file"),
		}),
	},
	({ path }) => {
		const { doc } = loadDocument(path);
		const result = inferLifecycleOp({ doc });
		return {
			content: [
				{
					type: "text" as const,
					text: JSON.stringify(result, null, 2),
				},
			],
		};
	},
);

// Register infer-impact tool
server.registerTool(
	"infer-impact",
	{
		description:
			"Infer impact from a node through the graph following impact relationships (CHG40 with bidirectional traversal)",
		inputSchema: z.object({
			path: z.string().describe("Path to SysProM file"),
			startId: z.string().describe("Node ID to start impact analysis from"),
			direction: z
				.enum(["outgoing", "incoming", "bidirectional"])
				.optional()
				.describe("Traversal direction (default: outgoing)"),
			maxDepth: z
				.number()
				.int()
				.positive()
				.optional()
				.describe("Maximum traversal depth"),
			relationshipFilter: z
				.array(z.string())
				.optional()
				.describe("Relationship types to follow"),
		}),
	},
	({ path, startId, direction, maxDepth, relationshipFilter }) => {
		const { doc } = loadDocument(path);
		const result = inferImpactOp({
			doc,
			startId,
			direction,
			maxDepth,
			relationshipFilter,
		});
		return {
			content: [
				{
					type: "text" as const,
					text: JSON.stringify(result, null, 2),
				},
			],
		};
	},
);

// Register infer-impact-summary tool (CHG40 hotspot analysis)
server.registerTool(
	"infer-impact-summary",
	{
		description:
			"Analyse document for impact hotspots — nodes with high incoming/outgoing impact (CHG40)",
		inputSchema: z.object({
			path: z.string().describe("Path to SysProM file"),
		}),
	},
	({ path }) => {
		const { doc } = loadDocument(path);
		const result = impactSummaryOp({ doc });
		return {
			content: [
				{
					type: "text" as const,
					text: JSON.stringify(result, null, 2),
				},
			],
		};
	},
);

// Register infer-derived tool
server.registerTool(
	"infer-derived",
	{
		description:
			"Infer derived relationships from transitive closure, inverses, and composites",
		inputSchema: z.object({
			path: z.string().describe("Path to SysProM file"),
		}),
	},
	({ path }) => {
		const { doc } = loadDocument(path);
		const result = inferDerivedOp({ doc });
		return {
			content: [
				{
					type: "text" as const,
					text: JSON.stringify(result, null, 2),
				},
			],
		};
	},
);

// Start server
async function main(): Promise<void> {
	const transport = new StdioServerTransport();
	await server.connect(transport);
	console.error("SysProM MCP server running...");
}

main().catch((error: unknown) => {
	const message = error instanceof Error ? error.message : String(error);
	console.error("Server error:", message);
	process.exit(1);
});
