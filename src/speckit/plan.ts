import type { SysProMDocument, Node, Relationship } from "../schema.js";
import { textToString } from "../text.js";

// ============================================================================
// Types
// ============================================================================

export interface PlanStatus {
	constitution: { defined: boolean; principleCount: number };
	spec: {
		defined: boolean;
		userStoryCount: number;
		storiesNeedingAcceptanceCriteria: string[];
	};
	plan: { defined: boolean; phaseCount: number };
	tasks: { total: number; done: number };
	checklist: { defined: boolean; total: number; done: number };
	nextStep: string;
}

export interface PhaseProgress {
	phase: number;
	name: string;
	done: number;
	total: number;
	percent: number;
}

export type GateIssue =
	| { kind: "previous_tasks_incomplete"; phase: number; remaining: number }
	| { kind: "user_story_no_change"; storyId: string }
	| { kind: "user_story_no_acceptance_criteria"; storyId: string }
	| { kind: "fr_no_change"; frId: string };

export interface GateResult {
	phase: number;
	ready: boolean;
	issues: GateIssue[];
}

export interface TaskCount {
	total: number;
	done: number;
}

// ============================================================================
// Helper functions
// ============================================================================

/**
 * Find a single node by ID, or null if not found.
 */
function findNode(doc: SysProMDocument, id: string): Node | null {
	return doc.nodes.find((n) => n.id === id) ?? null;
}

/**
 * Find a single node by ID in a subsystem, or null if not found.
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
 */
function findNodesByType(doc: SysProMDocument, type: string): Node[] {
	return doc.nodes.filter((n) => n.type === type);
}

/**
 * Find all nodes of a specific type in a subsystem.
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
			status: "proposed",
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
			plan: [],
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
				plan: [],
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
// isTaskDone
// ============================================================================

/**
 * Check if a change node's task is complete.
 *
 * If no subsystem or no change children in subsystem:
 *   - All items in node.plan must have done === true AND at least one item must exist
 * If subsystem has change children:
 *   - All children must be recursively done AND own plan items (if any) must be done
 */
export function isTaskDone(node: Node): boolean {
	// If the node has a subsystem with change children, check those recursively
	if (node.subsystem) {
		const changeChildren = node.subsystem.nodes.filter(
			(n) => n.type === "change",
		);
		if (changeChildren.length > 0) {
			// All change children must be done, and own plan items must be done
			const allChildrenDone = changeChildren.every((child) =>
				isTaskDone(child),
			);
			const ownPlanDone =
				(node.plan ?? []).length === 0 ||
				(node.plan ?? []).every((item) => item.done === true);
			return allChildrenDone && ownPlanDone;
		}
	}

	// No subsystem or no change children: check own plan
	const planItems = node.plan ?? [];
	if (planItems.length === 0) {
		return false;
	}
	return planItems.every((item) => item.done === true);
}

// ============================================================================
// countTasks
// ============================================================================

/**
 * Count total and completed tasks within a change node.
 *
 * Sums plan[] items from this node and recursively from all change nodes in
 * subsystem (and their subsystems).
 */
export function countTasks(node: Node): TaskCount {
	let total = 0;
	let done = 0;

	// Count own plan items
	const ownPlan = node.plan ?? [];
	total += ownPlan.length;
	done += ownPlan.filter((item) => item.done === true).length;

	// Recursively count from change children in subsystem
	if (node.subsystem) {
		const changeChildren = node.subsystem.nodes.filter(
			(n) => n.type === "change",
		);
		for (const child of changeChildren) {
			const childCount = countTasks(child);
			total += childCount.total;
			done += childCount.done;
		}
	}

	return { total, done };
}

// ============================================================================
// planStatus
// ============================================================================

/**
 * Inspect a document and return workflow completeness for a given prefix.
 * Never throws — missing nodes are reported as "not defined".
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

	// Count tasks using the helper
	let totalTasks = 0;
	let doneTasks = 0;
	const changeNodes = (protImpl?.subsystem?.nodes ?? []).filter(
		(n) => n.type === "change",
	);
	for (const change of changeNodes) {
		const taskCount = countTasks(change);
		totalTasks += taskCount.total;
		doneTasks += taskCount.done;
	}

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

		// Count tasks for this change node
		const taskCount = countTasks(task);

		const percent =
			taskCount.total === 0
				? 0
				: Math.round((taskCount.done / taskCount.total) * 100);

		result.push({
			phase: taskNum,
			name: task.name,
			done: taskCount.done,
			total: taskCount.total,
			percent,
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
 *   - Each capability ({prefix}-US-*) has a change node that implements it
 *   - Each capability has non-placeholder acceptance criteria
 *   - Each invariant ({prefix}-FR-*) has a change node that implements it
 *
 * Additionally for phase N > 1:
 *   - All tasks in phase N-1 must be done
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
