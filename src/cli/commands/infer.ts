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

function getScoreColour(score: number): (s: string) => string {
	if (score === 1) return pc.green;
	if (score >= 0.5) return pc.yellow;
	return pc.red;
}

function printCompletenessNode(r: CompletenessResult): void {
	const scoreColour = getScoreColour(r.score);
	const scoreText = `[${(r.score * 100).toFixed(0)}%]`;
	console.log(
		`${pc.cyan(r.id.padEnd(12))} ${pc.dim(r.type.padEnd(16))} ${pc.bold(r.name)} ${scoreColour(scoreText)}`,
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
	const phaseLabel = colour(`[${r.inferredPhase}]`);
	console.log(
		`${pc.cyan(r.id.padEnd(12))} ${pc.dim(r.type.padEnd(16))} ${pc.bold(r.name)} ${phaseLabel} ${pc.dim(r.inferredState)}`,
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
	const distanceLabel = pc.dim(`(${String(r.distance)})`);
	const typeLabel = colour(`[${r.impactType}]`);
	console.log(
		`${indent}${pc.cyan(r.id)} ${distanceLabel} ${typeLabel} ${pc.bold(nodeName)}`,
	);
}

function printDerivedRelationship(r: DerivedRelationship): void {
	const typeColours: Record<string, (s: string) => string> = {
		transitive: pc.yellow,
		composite: pc.blue,
		inverse: pc.green,
	};
	const colour = typeColours[r.derivationType] ?? pc.dim;
	const derivationLabel = pc.dim(`[${r.derivationType}]`);
	console.log(
		`${pc.cyan(r.from.padEnd(12))} ${colour(r.type.padEnd(20))} ${pc.cyan(r.to)} ${derivationLabel}`,
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
			const avgScore = (result.averageScore * 100).toFixed(1);
			const completeText = pc.green(`${String(result.completeNodes)} complete`);
			const incompleteText = pc.red(
				`${String(result.incompleteNodes)} incomplete`,
			);
			const scorePrefix = pc.dim(`Average score: ${avgScore}% | `);
			const separator = pc.dim(" | ");
			const summary = scorePrefix + completeText + separator + incompleteText;
			console.log(pc.bold("\nCompleteness Analysis\n") + summary + "\n");

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
			const { early, middle, late, terminal, unknown } = result.summary;
			const summary = pc.dim(
				`Early: ${String(early)} | Middle: ${String(middle)} | Late: ${String(late)} | Terminal: ${String(terminal)} | Unknown: ${String(unknown)}`,
			);
			console.log(pc.bold("\nLifecycle Analysis\n") + summary + "\n");

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
			const title = `\nImpact Analysis from ${args.id}${directionLabel}${depthLabel}${filterLabel}\n`;

			const { direct, transitive, potential, total } = result.summary;
			const summary = pc.dim(
				`Direct: ${String(direct)} | Transitive: ${String(transitive)} | Potential: ${String(potential)} | Total: ${String(total)}`,
			);

			console.log(pc.bold(title) + summary + "\n");

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
			const { transitive, composite, inverse, total } = result.summary;
			const summary = pc.dim(
				`Transitive: ${String(transitive)} | Composite: ${String(composite)} | Inverse: ${String(inverse)} | Total: ${String(total)}`,
			);
			console.log(pc.bold("\nDerived Relationships\n") + summary + "\n");

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
		const completeScore = (completeness.averageScore * 100).toFixed(1);
		const completeText = pc.green(
			`${String(completeness.completeNodes)} complete`,
		);
		const incompleteText = pc.red(
			`${String(completeness.incompleteNodes)} incomplete`,
		);
		console.log(
			pc.dim(`Average score: ${completeScore}% | `) +
				completeText +
				pc.dim(" | ") +
				incompleteText,
		);

		// Lifecycle
		console.log(pc.bold("\n=== Lifecycle ===\n"));
		const lifecycle = inferLifecycleOp({ doc });
		const { early, middle, late, terminal, unknown } = lifecycle.summary;
		console.log(
			pc.dim(
				`Early: ${String(early)} | Middle: ${String(middle)} | Late: ${String(late)} | Terminal: ${String(terminal)} | Unknown: ${String(unknown)}`,
			),
		);

		// Derived
		console.log(pc.bold("\n=== Derived Relationships ===\n"));
		const derived = inferDerivedOp({ doc });
		const { transitive, composite, inverse, total } = derived.summary;
		console.log(
			pc.dim(
				`Transitive: ${String(transitive)} | Composite: ${String(composite)} | Inverse: ${String(inverse)} | Total: ${String(total)}`,
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
