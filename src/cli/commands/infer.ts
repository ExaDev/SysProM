import pc from "picocolors";
import * as z from "zod";
import type { CommandDef } from "../define-command.js";
import { readOpts, loadDoc } from "../shared.js";
import {
	inferCompletenessOp,
	inferLifecycleOp,
	inferImpactOp,
	inferDerivedOp,
} from "../../operations/index.js";
import type { CompletenessResult } from "../../operations/infer-completeness.js";
import type { LifecycleResult } from "../../operations/infer-lifecycle.js";
import type { ImpactNode } from "../../operations/infer-impact.js";
import type { DerivedRelationship } from "../../operations/infer-derived.js";

// ---------------------------------------------------------------------------
// Presentation helpers
// ---------------------------------------------------------------------------

function printCompletenessNode(r: CompletenessResult): void {
	const scoreColour =
		r.score === 1 ? pc.green : r.score >= 0.5 ? pc.yellow : pc.red;
	console.log(
		`${pc.cyan(r.id.padEnd(12))} ${pc.dim(r.type.padEnd(16))} ${pc.bold(r.name)} ${scoreColour(`[${(r.score * 100).toFixed(0)}%]`)}`,
	);
	for (const issue of r.issues) {
		console.log(`  ${pc.dim("•")} ${pc.red(issue)}`);
	}
}

function printLifecycleNode(r: LifecycleResult): void {
	const phaseColours: Record<string, (s: string) => string> = {
		early: pc.blue,
		middle: pc.yellow,
		late: pc.green,
		terminal: pc.red,
		unknown: pc.dim,
	};
	const colour = phaseColours[r.inferredPhase] ?? pc.dim;
	console.log(
		`${pc.cyan(r.id.padEnd(12))} ${pc.dim(r.type.padEnd(16))} ${pc.bold(r.name)} ${colour(`[${r.inferredPhase}]`)} ${pc.dim(r.inferredState)}`,
	);
}

function printImpactNode(r: ImpactNode): void {
	const typeColours: Record<string, (s: string) => string> = {
		direct: pc.red,
		transitive: pc.yellow,
		potential: pc.blue,
	};
	const colour = typeColours[r.impactType] ?? pc.dim;
	const nodeName = r.node ? r.node.name : "(unknown)";
	const indent = "  ".repeat(r.distance);
	console.log(
		`${indent}${pc.cyan(r.id)} ${pc.dim(`(${String(r.distance)})`)} ${colour(`[${r.impactType}]`)} ${pc.bold(nodeName)}`,
	);
}

function printDerivedRelationship(r: DerivedRelationship): void {
	const typeColours: Record<string, (s: string) => string> = {
		transitive: pc.yellow,
		composite: pc.blue,
		inverse: pc.green,
	};
	const colour = typeColours[r.derivationType] ?? pc.dim;
	console.log(
		`${pc.cyan(r.from.padEnd(12))} ${colour(r.type.padEnd(20))} ${pc.cyan(r.to)} ${pc.dim(`[${r.derivationType}]`)}`,
	);
}

// ---------------------------------------------------------------------------
// Arg/opt schemas
// ---------------------------------------------------------------------------

const impactArgs = z.object({
	id: z.string().describe("node ID to start impact analysis from"),
	direction: z
		.enum(["outgoing", "incoming", "bidirectional"])
		.optional()
		.describe(
			"traversal direction: outgoing (default) | incoming | bidirectional",
		),
	maxDepth: z
		.number()
		.int()
		.positive()
		.optional()
		.describe("maximum traversal depth"),
	filter: z
		.string()
		.optional()
		.describe("comma-separated list of relationship types to follow"),
});

// ---------------------------------------------------------------------------
// Subcommands
// ---------------------------------------------------------------------------

const completenessSubcommand: CommandDef = {
	name: "completeness",
	description: inferCompletenessOp.def.description,
	apiLink: inferCompletenessOp.def.name,
	opts: readOpts,
	action(_rawArgs: unknown, rawOpts: unknown) {
		const opts = readOpts.parse(rawOpts);
		const { doc } = loadDoc(opts.path);
		const result = inferCompletenessOp({ doc });

		if (opts.json) {
			console.log(JSON.stringify(result, null, 2));
		} else {
			console.log(
				pc.bold("\nCompleteness Analysis\n") +
					pc.dim(
						`Average score: ${(result.averageScore * 100).toFixed(1)}% | `,
					) +
					pc.green(`${String(result.completeNodes)} complete`) +
					pc.dim(" | ") +
					pc.red(`${String(result.incompleteNodes)} incomplete`) +
					"\n",
			);

			// Show incomplete nodes first
			const incomplete = result.nodes.filter((n) => n.score < 1);
			const complete = result.nodes.filter((n) => n.score === 1);

			if (incomplete.length > 0) {
				console.log(pc.dim("Incomplete nodes:"));
				for (const n of incomplete) printCompletenessNode(n);
				console.log();
			}

			console.log(pc.dim(`${String(complete.length)} fully complete nodes`));
		}
	},
};

const lifecycleSubcommand: CommandDef = {
	name: "lifecycle",
	description: inferLifecycleOp.def.description,
	apiLink: inferLifecycleOp.def.name,
	opts: readOpts,
	action(_rawArgs: unknown, rawOpts: unknown) {
		const opts = readOpts.parse(rawOpts);
		const { doc } = loadDoc(opts.path);
		const result = inferLifecycleOp({ doc });

		if (opts.json) {
			console.log(JSON.stringify(result, null, 2));
		} else {
			console.log(
				pc.bold("\nLifecycle Analysis\n") +
					pc.dim(
						`Early: ${String(result.summary.early)} | Middle: ${String(result.summary.middle)} | Late: ${String(result.summary.late)} | Terminal: ${String(result.summary.terminal)} | Unknown: ${String(result.summary.unknown)}`,
					) +
					"\n",
			);

			for (const n of result.nodes) printLifecycleNode(n);
		}
	},
};

const impactSubcommand: CommandDef = {
	name: "impact",
	description: inferImpactOp.def.description,
	apiLink: inferImpactOp.def.name,
	args: impactArgs,
	opts: readOpts,
	action(rawArgs: unknown, rawOpts: unknown) {
		const args = impactArgs.parse(rawArgs);
		const opts = readOpts.parse(rawOpts);
		const { doc } = loadDoc(opts.path);

		// Parse relationship filter if provided
		const relationshipFilter = args.filter
			? args.filter.split(",").map((s) => s.trim())
			: undefined;

		const result = inferImpactOp({
			doc,
			startId: args.id,
			direction: args.direction,
			maxDepth: args.maxDepth,
			relationshipFilter,
		});

		if (opts.json) {
			console.log(JSON.stringify(result, null, 2));
		} else {
			const directionLabel = args.direction ? ` (${args.direction})` : "";
			const depthLabel = args.maxDepth
				? ` [depth: ${String(args.maxDepth)}]`
				: "";
			const filterLabel = args.filter ? ` [filter: ${args.filter}]` : "";

			console.log(
				pc.bold(
					`\nImpact Analysis from ${args.id}${directionLabel}${depthLabel}${filterLabel}\n`,
				) +
					pc.dim(
						`Direct: ${String(result.summary.direct)} | Transitive: ${String(result.summary.transitive)} | Potential: ${String(result.summary.potential)} | Total: ${String(result.summary.total)}`,
					) +
					"\n",
			);

			if (result.impactedNodes.length === 0) {
				console.log(pc.dim("No impacted nodes found"));
			} else {
				for (const n of result.impactedNodes) printImpactNode(n);
			}
		}
	},
};

const derivedSubcommand: CommandDef = {
	name: "derived",
	description: inferDerivedOp.def.description,
	apiLink: inferDerivedOp.def.name,
	opts: readOpts,
	action(_rawArgs: unknown, rawOpts: unknown) {
		const opts = readOpts.parse(rawOpts);
		const { doc } = loadDoc(opts.path);
		const result = inferDerivedOp({ doc });

		if (opts.json) {
			console.log(JSON.stringify(result, null, 2));
		} else {
			console.log(
				pc.bold("\nDerived Relationships\n") +
					pc.dim(
						`Transitive: ${String(result.summary.transitive)} | Composite: ${String(result.summary.composite)} | Inverse: ${String(result.summary.inverse)} | Total: ${String(result.summary.total)}`,
					) +
					"\n",
			);

			if (result.derivedRelationships.length === 0) {
				console.log(pc.dim("No derived relationships found"));
			} else {
				for (const r of result.derivedRelationships)
					printDerivedRelationship(r);
			}
		}
	},
};

const allSubcommand: CommandDef = {
	name: "all",
	description: "Run all inference analyses",
	opts: readOpts,
	action(_rawArgs: unknown, rawOpts: unknown) {
		const opts = readOpts.parse(rawOpts);
		const { doc } = loadDoc(opts.path);

		// Completeness
		console.log(pc.bold("\n=== Completeness ===\n"));
		const completeness = inferCompletenessOp({ doc });
		console.log(
			pc.dim(
				`Average score: ${(completeness.averageScore * 100).toFixed(1)}% | `,
			) +
				pc.green(`${String(completeness.completeNodes)} complete`) +
				pc.dim(" | ") +
				pc.red(`${String(completeness.incompleteNodes)} incomplete`),
		);

		// Lifecycle
		console.log(pc.bold("\n=== Lifecycle ===\n"));
		const lifecycle = inferLifecycleOp({ doc });
		console.log(
			pc.dim(
				`Early: ${String(lifecycle.summary.early)} | Middle: ${String(lifecycle.summary.middle)} | Late: ${String(lifecycle.summary.late)} | Terminal: ${String(lifecycle.summary.terminal)} | Unknown: ${String(lifecycle.summary.unknown)}`,
			),
		);

		// Derived
		console.log(pc.bold("\n=== Derived Relationships ===\n"));
		const derived = inferDerivedOp({ doc });
		console.log(
			pc.dim(
				`Transitive: ${String(derived.summary.transitive)} | Composite: ${String(derived.summary.composite)} | Inverse: ${String(derived.summary.inverse)} | Total: ${String(derived.summary.total)}`,
			),
		);

		if (opts.json) {
			console.log(
				JSON.stringify(
					{
						completeness,
						lifecycle,
						derived,
					},
					null,
					2,
				),
			);
		}
	},
};

// ---------------------------------------------------------------------------
// Main command
// ---------------------------------------------------------------------------

export const inferCommand: CommandDef = {
	name: "infer",
	description:
		"Infer completeness, lifecycle, impact, and derived relationships",
	subcommands: [
		completenessSubcommand,
		lifecycleSubcommand,
		impactSubcommand,
		derivedSubcommand,
		allSubcommand,
	],
};
