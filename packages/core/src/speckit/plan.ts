import type { SysProMDocument, Node, Relationship } from "../schema.js";
import { textToString } from "../text.js";
import { hasLifecycleState } from "../lifecycle-state.js";

// ============================================================================
// Types
// ============================================================================

/** Comprehensive status of all plan components — constitution, spec, plan, tasks, checklist, and next step. */
export interface PlanStatus {
	constitution: { defined: boolean; principleCount: number };
	spec: {
		defined: boolean;
		userStoryCount: number;
		storiesNeedingAcceptanceCriteria: string[];
	};
	plan: { defined: boolean; phaseCount: number };
	tasks: {
		total: number;
		done: number;
		blocked: number;
		blockedTasks: TaskBlockage[];
	};
	checklist: { defined: boolean; total: number; done: number };
	nextStep: string;
}

/** Per-phase progress metrics — task counts and completion percentage. */
export interface PhaseProgress {
	phase: number;
	id: string;
	name: string;
	done: number;
	total: number;
	percent: number;
	blocked: boolean;
	blockageReasons: BlockageReason[];
}

/** A specific issue preventing gate entry — incomplete tasks, missing acceptance criteria, or unlinked requirements. */
export type GateIssue =
	| { kind: "previous_tasks_incomplete"; phase: number; remaining: number }
	| { kind: "user_story_no_change"; storyId: string }
	| { kind: "user_story_no_acceptance_criteria"; storyId: string }
	| { kind: "fr_no_change"; frId: string };

/** Result of a gate check — phase number, readiness flag, and any blocking issues. */
export interface GateResult {
	phase: number;
	ready: boolean;
	issues: GateIssue[];
}

/** Task completion counts — total and done. */
export interface TaskCount {
	total: number;
	done: number;
	blocked: number;
	blockedTasks: TaskBlockage[];
}

/** Why a task is blocked. */
export interface BlockageReason {
	kind: "dependency_unmet" | "gate_not_ready";
	nodeId: string;
}

/** Blockage detail for a specific task. */
export interface TaskBlockage {
	taskId: string;
	reasons: BlockageReason[];
}

// ============================================================================
// Helper functions
// ============================================================================

/**
 * Find a single node by ID, or null if not found.
 * @param doc - The SysProM document.
 * @param id - Node ID to find.
 * @returns The result.
 * @example
 * ```ts
 * const node = findNode(doc, "PLAN-SPEC");
 * ```
 */
function findNode(doc: SysProMDocument, id: string): Node | null {
	return doc.nodes.find((n) => n.id === id) ?? null;
}

/**
 * Find a single node by ID in a subsystem, or null if not found.
 * @param subsystem - The subsystem document.
 * @param id - Node ID to find.
 * @returns The result.
 * @example
 * ```ts
 * const node = findNodeInSubsystem(subsystem, "CH1");
 * ```
 */
function findNodeInSubsystem(
	subsystem: SysProMDocument | undefined,
	id: string,
): Node | null {
	if (!subsystem) return null;
	return subsystem.nodes.find((n) => n.id === id) ?? null;
}

/**
 * Find all nodes of a specific type.
 * @param doc - The SysProM document.
 * @param type - Node type to filter by.
 * @returns The result.
 * @example
 * ```ts
 * const changes = findNodesByType(doc, "change");
 * ```
 */
function findNodesByType(doc: SysProMDocument, type: string): Node[] {
	return doc.nodes.filter((n) => n.type === type);
}

/**
 * Find all nodes of a specific type in a subsystem.
 * @param subsystem - The subsystem document.
 * @param type - Node type to filter by.
 * @returns The result.
 * @example
 * ```ts
 * const gates = findNodesByTypeInSubsystem(subsystem, "gate");
 * ```
 */
function findNodesByTypeInSubsystem(
	subsystem: SysProMDocument | undefined,
	type: string,
): Node[] {
	if (!subsystem) return [];
	return subsystem.nodes.filter((n) => n.type === type);
}

/**
 * Find relationships from a source node to nodes of a target type (within a subsystem).
 * @param subsystem - The subsystem document.
 * @param fromId - Source node ID.
 * @param relationType - Relationship type filter.
 * @returns The result.
 * @example
 * ```ts
 * const rels = findRelationshipsFrom(subsystem, "CH1");
 * ```
 */
function findRelationshipsFrom(
	subsystem: SysProMDocument | undefined,
	fromId: string,
	relationType?: string,
): Relationship[] {
	if (!subsystem) return [];
	return (subsystem.relationships ?? []).filter((r) => {
		if (r.from !== fromId) return false;
		if (relationType && r.type !== relationType) return false;
		return true;
	});
}

/**
 * Find relationships to a target node (within a subsystem).
 * @param subsystem - The subsystem document.
 * @param toId - Target node ID.
 * @param relationType - Relationship type filter.
 * @returns The result.
 * @example
 * ```ts
 * const rels = findRelationshipsTo(subsystem, "CH2");
 * ```
 */
function findRelationshipsTo(
	subsystem: SysProMDocument | undefined,
	toId: string,
	relationType?: string,
): Relationship[] {
	if (!subsystem) return [];
	return (subsystem.relationships ?? []).filter((r) => {
		if (r.to !== toId) return false;
		if (relationType && r.type !== relationType) return false;
		return true;
	});
}

/**
 * Detect if a text contains non-placeholder acceptance criteria.
 * Looks for GIVEN/WHEN/THEN patterns (case-insensitive).
 * @param description - Task description text.
 * @returns The result.
 * @example
 * ```ts
 * hasAcceptanceCriteria("Given X When Y Then Z"); // => true
 * ```
 */
function hasAcceptanceCriteria(
	description: string | string[] | undefined,
): boolean {
	if (!description) return false;
	const text = textToString(description).toLowerCase();
	return /\b(given|when|then)\b/.test(text);
}

/**
 * Sort change nodes topologically using must_follow relationships.
 * @param subsystem - The subsystem document.
 * @param changeNodes - Array of change nodes.
 * @returns The result.
 * @example
 * ```ts
 * const sorted = sortChangesByOrder(subsystem, changeNodes);
 * ```
 */
function sortChangesByOrder(
	subsystem: SysProMDocument | undefined,
	changeNodes: Node[],
): Node[] {
	const subsystemToUse = subsystem ?? { nodes: [], relationships: [] };
	const sorted: Node[] = [];
	const processedIds = new Set<string>();

	function addChangeInOrder(changeId: string | null | undefined) {
		if (!changeId || processedIds.has(changeId)) return;
		processedIds.add(changeId);

		const change = findNodeInSubsystem(subsystemToUse, changeId);
		if (change) {
			sorted.push(change);
		}

		// Find changes that must_follow this change (i.e., come after it)
		const followersRels = findRelationshipsTo(
			subsystemToUse,
			changeId,
			"must_follow",
		);
		for (const rel of followersRels) {
			addChangeInOrder(rel.from);
		}
	}

	// Start with changes that don't must_follow any other change (first changes)
	for (const change of changeNodes) {
		const precedingRels = findRelationshipsFrom(
			subsystemToUse,
			change.id,
			"must_follow",
		);
		if (precedingRels.length === 0) {
			addChangeInOrder(change.id);
		}
	}

	// Add any remaining changes not yet processed
	for (const change of changeNodes) {
		if (!processedIds.has(change.id)) {
			addChangeInOrder(change.id);
		}
	}

	return sorted;
}

// ============================================================================
// initDocument
// ============================================================================

/**
 * Scaffold a new SysProMDocument with the standard spec-kit-compatible node
 * structure for a given prefix and name.
 *
 * Creates four skeleton nodes:
 *   - {prefix}-CONST   protocol (constitution)
 *   - {prefix}-SPEC    artefact (specification)
 *   - {prefix}-PROT-IMPL protocol (implementation plan) — with empty subsystem
 *   - {prefix}-CHK     gate (checklist)
 *
 * Relationships wired:
 *   - {prefix}-SPEC  governed_by  {prefix}-CONST
 *   - {prefix}-CHK  governed_by  {prefix}-PROT-IMPL
 *
 * Tasks are not pre-scaffolded; use addTask to add them.
 * @param prefix - Plan prefix.
 * @param name - Name for the new item.
 * @returns The result.
 * @example
 * ```ts
 * const doc = initDocument("PLAN", "My Plan");
 * ```
 */
export function initDocument(prefix: string, name: string): SysProMDocument {
	const nodes: Node[] = [
		{
			id: `${prefix}-CONST`,
			type: "protocol",
			name: `${name} Constitution`,
			description: "[Constitution content needed]",
		},
		{
			id: `${prefix}-SPEC`,
			type: "artefact",
			name: `${name} Specification`,
			lifecycle: { proposed: true },
		},
		{
			id: `${prefix}-PROT-IMPL`,
			type: "protocol",
			name: `${name} Implementation Plan`,
			subsystem: {
				nodes: [],
				relationships: [],
			},
		},
		{
			id: `${prefix}-CHK`,
			type: "gate",
			name: `${name} Checklist`,
			lifecycle: {},
		},
	];

	const relationships: Relationship[] = [
		{
			from: `${prefix}-SPEC`,
			to: `${prefix}-CONST`,
			type: "governed_by",
		},
		{
			from: `${prefix}-CHK`,
			to: `${prefix}-PROT-IMPL`,
			type: "governed_by",
		},
	];

	return {
		metadata: {
			title: name,
			doc_type: "speckit",
		},
		nodes,
		relationships,
	};
}

// ============================================================================
// addTask
// ============================================================================

/**
 * Immutably add a new task (change node) to PROT-IMPL.subsystem or to a parent
 * change node's subsystem.
 *
 * - If parentId is not provided: adds CHG-{N} to PROT-IMPL.subsystem
 *   (where N = count of existing change nodes + 1)
 * - If parentId is provided: recursively finds parent change node, adds {parentId}-{M}
 *   to parent's subsystem (creating subsystem if needed, where M = count of existing
 *   change children + 1)
 *
 * Wires must_follow to previous sibling change node at the same level.
 * Default name: "Task N".
 * @param doc - The SysProM document.
 * @param prefix - Plan prefix.
 * @param name - Name for the new item.
 * @param parentId - Optional parent change node ID for nesting.
 * @returns The updated document with the new task added.
 * @example
 * ```ts
 * const updated = addTask(doc, "PLAN", "Implement auth");
 * ```
 */
export function addTask(
	doc: SysProMDocument,
	prefix: string,
	name?: string,
	parentId?: string,
): SysProMDocument {
	const protImpl = findNode(doc, `${prefix}-PROT-IMPL`);
	if (!protImpl) {
		throw new Error(`Node ${prefix}-PROT-IMPL not found`);
	}

	if (!parentId) {
		// Add to PROT-IMPL.subsystem as a top-level task
		const subsystem = protImpl.subsystem ?? { nodes: [], relationships: [] };
		const existingChanges = subsystem.nodes.filter((n) => n.type === "change");
		const taskNum = existingChanges.length + 1;
		const taskName = name ?? `Task ${String(taskNum)}`;
		const changeId = `CHG-${String(taskNum)}`;

		const newChange: Node = {
			id: changeId,
			type: "change",
			name: taskName,
			lifecycle: { proposed: true },
		};

		// Build new relationships
		const newRels: Relationship[] = [];

		// If not the first task, add must_follow from previous task
		if (taskNum > 1) {
			const prevTaskId = `CHG-${String(taskNum - 1)}`;
			newRels.push({
				from: changeId,
				to: prevTaskId,
				type: "must_follow",
			});
		}

		// Merge into subsystem
		const updatedSubsystem: SysProMDocument = {
			...(subsystem.metadata ? { metadata: subsystem.metadata } : {}),
			nodes: [...subsystem.nodes, newChange],
			relationships: [...(subsystem.relationships ?? []), ...newRels],
			...(subsystem.external_references
				? { external_references: subsystem.external_references }
				: {}),
		};

		// Update the protocol node
		const updatedProtImpl: Node = {
			...protImpl,
			subsystem: updatedSubsystem,
		};

		// Update the document
		const updatedNodes = doc.nodes.map((n) =>
			n.id === protImpl.id ? updatedProtImpl : n,
		);

		return {
			...doc,
			nodes: updatedNodes,
		};
	} else {
		// Add to parent change node's subsystem
		return addTaskToParent(doc, protImpl, prefix, parentId, name);
	}
}

/**
 * Helper function to recursively add a task to a parent change node's subsystem.
 * @param doc - The SysProM document.
 * @param protImpl - Implementation protocol node.
 * @param prefix - Plan prefix.
 * @param parentId - ID of the parent change node to nest under.
 * @param name - Human-readable task name.
 * @returns The updated document with the nested task added.
 * @example
 * ```ts
 * const updated = addTaskToParent(doc, protImpl, "PLAN", "CH1");
 * ```
 */
function addTaskToParent(
	doc: SysProMDocument,
	protImpl: Node,
	prefix: string,
	parentId: string,
	name?: string,
): SysProMDocument {
	// Find the parent change node in the subsystem tree
	function findParentAndAddTask(subsystem: SysProMDocument | undefined): {
		found: boolean;
		updatedSubsystem: SysProMDocument | undefined;
	} {
		if (!subsystem) {
			return { found: false, updatedSubsystem: undefined };
		}

		// Check if parent exists at this level
		const parentNode = subsystem.nodes.find((n) => n.id === parentId);
		if (parentNode?.type === "change") {
			// Found the parent, add task to its subsystem
			const parentSubsystem = parentNode.subsystem ?? {
				nodes: [],
				relationships: [],
			};
			const existingChildren = parentSubsystem.nodes.filter(
				(n) => n.type === "change",
			);
			const childNum = existingChildren.length + 1;
			const childName = name ?? `Task ${String(childNum)}`;
			const changeId = `${parentId}-${String(childNum)}`;

			const newChange: Node = {
				id: changeId,
				type: "change",
				name: childName,
				lifecycle: { proposed: true },
			};

			// Build new relationships for child
			const newRels: Relationship[] = [];

			// If not the first child, add must_follow from previous child
			if (childNum > 1) {
				const prevChildId = `${parentId}-${String(childNum - 1)}`;
				newRels.push({
					from: changeId,
					to: prevChildId,
					type: "must_follow",
				});
			}

			// Update parent's subsystem
			const updatedParentSubsystem: SysProMDocument = {
				...(parentSubsystem.metadata
					? { metadata: parentSubsystem.metadata }
					: {}),
				nodes: [...parentSubsystem.nodes, newChange],
				relationships: [...(parentSubsystem.relationships ?? []), ...newRels],
				...(parentSubsystem.external_references
					? { external_references: parentSubsystem.external_references }
					: {}),
			};

			// Update parent node
			const updatedParent: Node = {
				...parentNode,
				subsystem: updatedParentSubsystem,
			};

			// Update subsystem nodes
			const updatedNodes = subsystem.nodes.map((n) =>
				n.id === parentId ? updatedParent : n,
			);

			return {
				found: true,
				updatedSubsystem: {
					...(subsystem.metadata ? { metadata: subsystem.metadata } : {}),
					nodes: updatedNodes,
					relationships: subsystem.relationships ?? undefined,
					...(subsystem.external_references
						? { external_references: subsystem.external_references }
						: {}),
				},
			};
		}

		// Recursively search in child subsystems
		const updatesAndNodes: { updated: boolean; nodes: Node[] } = {
			updated: false,
			nodes: [],
		};

		for (const n of subsystem.nodes) {
			if (n.type === "change" && n.subsystem) {
				const { found, updatedSubsystem: childUpdated } = findParentAndAddTask(
					n.subsystem,
				);
				if (found) {
					updatesAndNodes.updated = true;
					updatesAndNodes.nodes.push({
						...n,
						subsystem: childUpdated,
					});
				} else {
					updatesAndNodes.nodes.push(n);
				}
			} else {
				updatesAndNodes.nodes.push(n);
			}
		}

		return updatesAndNodes.updated
			? {
					found: true,
					updatedSubsystem: {
						...(subsystem.metadata ? { metadata: subsystem.metadata } : {}),
						nodes: updatesAndNodes.nodes,
						relationships: subsystem.relationships ?? undefined,
						...(subsystem.external_references
							? { external_references: subsystem.external_references }
							: {}),
					},
				}
			: { found: false, updatedSubsystem: subsystem };
	}

	const { found, updatedSubsystem } = findParentAndAddTask(protImpl.subsystem);

	if (!found) {
		throw new Error(`Parent change node ${parentId} not found`);
	}

	// Update the protocol node
	const updatedProtImpl: Node = {
		...protImpl,
		subsystem: updatedSubsystem,
	};

	// Update the document
	const updatedNodes = doc.nodes.map((n) =>
		n.id === protImpl.id ? updatedProtImpl : n,
	);

	return {
		...doc,
		nodes: updatedNodes,
	};
}

// ============================================================================
// setTaskLifecycle
// ============================================================================

type TaskLifecycleAction = "start" | "complete" | "reopen";

/**
 * Set lifecycle state on a task (change node) within a plan implementation protocol.
 *
 * - start: marks introduced + in_progress true
 * - complete: marks complete true and clears in_progress
 * - reopen: clears complete and marks in_progress true
 */
export function setTaskLifecycle(
	doc: SysProMDocument,
	prefix: string,
	taskId: string,
	action: TaskLifecycleAction,
): SysProMDocument {
	const protImpl = findNode(doc, `${prefix}-PROT-IMPL`);
	if (!protImpl?.subsystem) {
		throw new Error(`Node ${prefix}-PROT-IMPL not found`);
	}

	function updateInSubsystem(subsystem: SysProMDocument): {
		found: boolean;
		updated: SysProMDocument;
	} {
		let found = false;
		const updatedNodes = subsystem.nodes.map((node) => {
			if (node.id === taskId) {
				if (node.type !== "change") {
					throw new Error(`Task node ${taskId} is not a change node`);
				}
				found = true;
				const lifecycle = { ...(node.lifecycle ?? {}) };
				if (action === "start") {
					lifecycle.introduced = lifecycle.introduced ?? true;
					lifecycle.in_progress = true;
				} else if (action === "complete") {
					lifecycle.complete = true;
					delete lifecycle.in_progress;
				} else {
					delete lifecycle.complete;
					lifecycle.in_progress = true;
				}
				return {
					...node,
					lifecycle,
				};
			}

			if (!node.subsystem) {
				return node;
			}

			const child = updateInSubsystem(node.subsystem);
			if (child.found) {
				found = true;
				return {
					...node,
					subsystem: child.updated,
				};
			}
			return node;
		});

		return {
			found,
			updated: {
				...(subsystem.metadata ? { metadata: subsystem.metadata } : {}),
				nodes: updatedNodes,
				...(subsystem.relationships
					? { relationships: subsystem.relationships }
					: {}),
				...(subsystem.external_references
					? { external_references: subsystem.external_references }
					: {}),
			},
		};
	}

	const updated = updateInSubsystem(protImpl.subsystem);
	if (!updated.found) {
		throw new Error(`Task ${taskId} not found in ${prefix}-PROT-IMPL`);
	}

	const updatedNodes = doc.nodes.map((node) =>
		node.id === protImpl.id
			? { ...protImpl, subsystem: updated.updated }
			: node,
	);
	return {
		...doc,
		nodes: updatedNodes,
	};
}

// ============================================================================
// isTaskDone
// ============================================================================

/**
 * Check if a task change node is complete.
 * @param node - The change node to evaluate.
 * @returns Whether the task lifecycle includes complete.
 * @example
 * ```ts
 * isTaskDone(changeNode); // => true when lifecycle.complete is reached
 * ```
 */
export function isTaskDone(node: Node): boolean {
	return hasLifecycleState(node, "complete");
}

function isGateReady(node: Node): boolean {
	if (node.type !== "gate") return false;
	const lifecycle = node.lifecycle ?? {};
	const values = Object.values(lifecycle);
	if (values.length === 0) return false;
	return values.every((value) => value === true || typeof value === "string");
}

function collectNodes(subsystem: SysProMDocument | undefined): Node[] {
	if (!subsystem) return [];
	const nodes: Node[] = [];
	for (const node of subsystem.nodes) {
		nodes.push(node);
		if (node.subsystem) {
			nodes.push(...collectNodes(node.subsystem));
		}
	}
	return nodes;
}

function taskBlockageReasons(
	doc: SysProMDocument,
	subsystem: SysProMDocument | undefined,
	taskNode: Node,
): BlockageReason[] {
	if (taskNode.type !== "change") return [];
	const relationships = subsystem?.relationships ?? [];
	const scopedNodeMap = new Map((subsystem?.nodes ?? []).map((n) => [n.id, n]));
	const globalNodeMap = new Map(doc.nodes.map((n) => [n.id, n]));
	const reasons: BlockageReason[] = [];

	for (const rel of relationships) {
		if (rel.from !== taskNode.id || rel.type !== "depends_on") continue;
		const dependency = scopedNodeMap.get(rel.to) ?? globalNodeMap.get(rel.to);
		const dependencyComplete =
			dependency?.type === "change" && isTaskDone(dependency);
		if (!dependencyComplete) {
			reasons.push({ kind: "dependency_unmet", nodeId: rel.to });
		}
	}

	for (const rel of relationships) {
		if (rel.from !== taskNode.id || rel.type !== "constrained_by") continue;
		const gate = scopedNodeMap.get(rel.to) ?? globalNodeMap.get(rel.to);
		if (!gate || !isGateReady(gate)) {
			reasons.push({ kind: "gate_not_ready", nodeId: rel.to });
		}
	}

	return reasons;
}

// ============================================================================
// countTasks
// ============================================================================

/**
 * Count total and completed tasks within a change node.
 *
 * Sums plan[] items from this node and recursively from all change nodes in
 * subsystem (and their subsystems).
 * @param node - The node to check.
 * @returns The result.
 * @example
 * ```ts
 * const { total, done } = countTasks(changeNode);
 * ```
 */
export function countTasks(node: Node): TaskCount {
	if (node.type !== "change") {
		return { total: 0, done: 0, blocked: 0, blockedTasks: [] };
	}
	const localDoc: SysProMDocument = {
		nodes: [node, ...collectNodes(node.subsystem)],
		relationships: [],
	};
	return countTasksInSubsystem(localDoc, {
		nodes: [node],
		relationships: [],
	});
}

function countTasksInSubsystem(
	doc: SysProMDocument,
	subsystem: SysProMDocument | undefined,
): TaskCount {
	let total = 0;
	let done = 0;
	let blocked = 0;
	const blockedTasks: TaskBlockage[] = [];

	if (!subsystem) {
		return { total, done, blocked, blockedTasks };
	}

	for (const node of subsystem.nodes) {
		if (node.type !== "change") continue;
		const childChanges = (node.subsystem?.nodes ?? []).filter(
			(child) => child.type === "change",
		);
		if (childChanges.length > 0) {
			const childCounts = countTasksInSubsystem(doc, node.subsystem);
			total += childCounts.total;
			done += childCounts.done;
			blocked += childCounts.blocked;
			blockedTasks.push(...childCounts.blockedTasks);
			continue;
		}

		total += 1;
		if (isTaskDone(node)) {
			done += 1;
		}

		const reasons = taskBlockageReasons(doc, subsystem, node);
		if (reasons.length > 0) {
			blocked += 1;
			blockedTasks.push({ taskId: node.id, reasons });
		}
	}

	return { total, done, blocked, blockedTasks };
}

// ============================================================================
// planStatus
// ============================================================================

/**
 * Inspect a document and return workflow completeness for a given prefix.
 * Never throws — missing nodes are reported as "not defined".
 * @param doc - The SysProM document.
 * @param prefix - ID prefix identifying the plan (e.g. "PLAN").
 * @returns Comprehensive status of all plan components.
 * @example
 * ```ts
 * const status = planStatus(doc, "PLAN");
 * ```
 */
export function planStatus(doc: SysProMDocument, prefix: string): PlanStatus {
	const constitution = findNode(doc, `${prefix}-CONST`);
	const spec = findNode(doc, `${prefix}-SPEC`);
	const protImpl = findNode(doc, `${prefix}-PROT-IMPL`);
	const checklist = findNode(doc, `${prefix}-CHK`);

	const userStories = findNodesByType(doc, "capability").filter((n) =>
		n.id.startsWith(`${prefix}-US-`),
	);
	const storiesNeedingAcceptanceCriteria = userStories
		.filter((us) => !hasAcceptanceCriteria(us.description))
		.map((us) => us.id);

	// Count phases (top-level change nodes)
	const phaseCount = (protImpl?.subsystem?.nodes ?? []).filter(
		(n) => n.type === "change",
	).length;

	const taskCounts = countTasksInSubsystem(doc, protImpl?.subsystem);
	const totalTasks = taskCounts.total;
	const doneTasks = taskCounts.done;
	const blockedTasks = taskCounts.blocked;

	// Checklist stats
	const checklistLifecycle = checklist?.lifecycle ?? {};
	const checklistItemCount = Object.keys(checklistLifecycle).length;
	const checklistDoneCount = Object.values(checklistLifecycle).filter(
		(v) => !!v, // Counts `true` and date strings (truthy values) as done
	).length;

	// Determine nextStep
	let nextStep: string;
	if (!constitution) {
		nextStep = `Define the constitution: run \`spm plan init\``;
	} else if (!spec) {
		nextStep = `Define the specification: add a ${prefix}-SPEC artefact node`;
	} else if (userStories.length === 0) {
		nextStep = `Add user stories: run \`spm add ${prefix} capability --id US-001 ...\``;
	} else if (storiesNeedingAcceptanceCriteria.length > 0) {
		nextStep = `Fill in acceptance criteria for: ${storiesNeedingAcceptanceCriteria.join(", ")}`;
	} else if (!protImpl) {
		nextStep = `Define the implementation plan: run \`spm add ${prefix} protocol --id PROT-IMPL ...\``;
	} else if (phaseCount === 0) {
		nextStep = `Add tasks: run \`spm plan add-task <doc> --prefix ${prefix}\``;
	} else if (totalTasks === 0) {
		nextStep = `Add tasks to the change nodes`;
	} else if (doneTasks < totalTasks) {
		const remaining = totalTasks - doneTasks;
		nextStep = `Complete remaining tasks (${String(remaining)} of ${String(totalTasks)} remaining)`;
	} else if (!checklist) {
		nextStep = `Add a checklist gate node: ${prefix}-CHK`;
	} else if (checklistDoneCount < checklistItemCount) {
		const remaining = checklistItemCount - checklistDoneCount;
		nextStep = `Complete the checklist (${String(remaining)} of ${String(checklistItemCount)} items remaining)`;
	} else {
		nextStep = `All steps complete`;
	}

	return {
		constitution: {
			defined: constitution !== null,
			principleCount: constitution
				? findNodesByType(doc, "principle").filter((p) =>
						(doc.relationships ?? []).some(
							(r) =>
								r.from === p.id &&
								r.to === constitution.id &&
								r.type === "part_of",
						),
					).length
				: 0,
		},
		spec: {
			defined: spec !== null,
			userStoryCount: userStories.length,
			storiesNeedingAcceptanceCriteria,
		},
		plan: {
			defined: protImpl !== null,
			phaseCount,
		},
		tasks: {
			total: totalTasks,
			done: doneTasks,
			blocked: blockedTasks,
			blockedTasks: taskCounts.blockedTasks,
		},
		checklist: {
			defined: checklist !== null,
			total: checklistItemCount,
			done: checklistDoneCount,
		},
		nextStep,
	};
}

// ============================================================================
// planProgress
// ============================================================================

/**
 * Return per-task completion data.
 * Tasks (change nodes) are discovered from PROT-IMPL.subsystem, sorted topologically.
 * @param doc - The SysProM document.
 * @param prefix - ID prefix identifying the plan (e.g. "PLAN").
 * @returns Per-phase progress with task counts and percentages.
 * @example
 * ```ts
 * const phases = planProgress(doc, "PLAN");
 * ```
 */
export function planProgress(
	doc: SysProMDocument,
	prefix: string,
): PhaseProgress[] {
	const protImpl = findNode(doc, `${prefix}-PROT-IMPL`);
	if (!protImpl) {
		return [];
	}

	const subsystem = protImpl.subsystem;
	const taskNodes = findNodesByTypeInSubsystem(subsystem, "change");
	const sortedTasks = sortChangesByOrder(subsystem, taskNodes);

	const result: PhaseProgress[] = [];

	for (let i = 0; i < sortedTasks.length; i++) {
		const task = sortedTasks[i];
		const taskNum = i + 1;

		const taskCount = countTasksInSubsystem(doc, {
			nodes: [task],
			relationships: task.subsystem?.relationships ?? [],
		});
		const reasons = taskBlockageReasons(doc, subsystem, task);

		const percent =
			taskCount.total === 0
				? 0
				: Math.round((taskCount.done / taskCount.total) * 100);

		result.push({
			phase: taskNum,
			id: task.id,
			name: task.name,
			done: taskCount.done,
			total: taskCount.total,
			percent,
			blocked: reasons.length > 0,
			blockageReasons: reasons,
		});
	}

	return result;
}

// ============================================================================
// checkGate
// ============================================================================

/**
 * Validate readiness to enter the given phase (1-indexed).
 *
 * Always checks:
 *   - Each capability ({prefix}-US-*) has a change node that implements it.
 *   - Each capability has non-placeholder acceptance criteria.
 *   - Each invariant ({prefix}-FR-*) has a change node that implements it.
 *
 * Additionally for phase N > 1:
 *   - All tasks in phase N-1 must be done.
 * @param doc - The SysProM document.
 * @param prefix - Plan prefix.
 * @param phase - Phase number (1-indexed).
 * @returns Gate check result with readiness flag and issues.
 * @example
 * ```ts
 * const result = checkGate(doc, "PLAN", 2);
 * ```
 */
export function checkGate(
	doc: SysProMDocument,
	prefix: string,
	phase: number,
): GateResult {
	if (phase < 1) {
		throw new Error("Phase must be >= 1");
	}

	const protImpl = findNode(doc, `${prefix}-PROT-IMPL`);
	const subsystem = protImpl?.subsystem;

	const issues: GateIssue[] = [];

	// For phase N > 1, check that all tasks in phase N-1 are done
	if (phase > 1) {
		const taskNodes = findNodesByTypeInSubsystem(subsystem, "change");
		const sortedTasks = sortChangesByOrder(subsystem, taskNodes);
		if (phase - 1 <= sortedTasks.length) {
			const prevTask = sortedTasks[phase - 2]; // 0-indexed
			const taskCount = countTasks(prevTask);
			const remaining = taskCount.total - taskCount.done;

			if (remaining > 0) {
				issues.push({
					kind: "previous_tasks_incomplete",
					phase: phase - 1,
					remaining,
				});
			}
		}
	}

	// Check user stories
	const userStories = findNodesByType(doc, "capability").filter((n) =>
		n.id.startsWith(`${prefix}-US-`),
	);

	for (const us of userStories) {
		// Check if there's a change implementing it
		const hasChange = (doc.relationships ?? []).some(
			(r) =>
				r.type === "implements" &&
				r.to === us.id &&
				r.from.startsWith(`${prefix}-CHG-`),
		);
		if (!hasChange) {
			issues.push({
				kind: "user_story_no_change",
				storyId: us.id,
			});
		}

		// Check if it has acceptance criteria
		if (!hasAcceptanceCriteria(us.description)) {
			issues.push({
				kind: "user_story_no_acceptance_criteria",
				storyId: us.id,
			});
		}
	}

	// Check functional requirements
	const frs = findNodesByType(doc, "invariant").filter((n) =>
		n.id.startsWith(`${prefix}-FR-`),
	);

	for (const fr of frs) {
		// Check if there's a change implementing it
		const hasChange = (doc.relationships ?? []).some(
			(r) =>
				r.type === "implements" &&
				r.to === fr.id &&
				r.from.startsWith(`${prefix}-CHG-`),
		);
		if (!hasChange) {
			issues.push({
				kind: "fr_no_change",
				frId: fr.id,
			});
		}
	}

	return {
		phase,
		ready: issues.length === 0,
		issues,
	};
}
