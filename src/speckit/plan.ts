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

// ============================================================================
// Helper functions
// ============================================================================

/**
 * Find a single node by ID, or null if not found.
 */
function findNode(doc: SysProMDocument, id: string): Node | null {
  return doc.nodes?.find((n) => n.id === id) ?? null;
}

/**
 * Find a single node by ID in a subsystem, or null if not found.
 */
function findNodeInSubsystem(
  subsystem: SysProMDocument | undefined,
  id: string,
): Node | null {
  if (!subsystem) return null;
  return subsystem.nodes?.find((n) => n.id === id) ?? null;
}

/**
 * Find all nodes of a specific type.
 */
function findNodesByType(doc: SysProMDocument, type: string): Node[] {
  return doc.nodes?.filter((n) => n.type === type) ?? [];
}

/**
 * Find all nodes of a specific type in a subsystem.
 */
function findNodesByTypeInSubsystem(
  subsystem: SysProMDocument | undefined,
  type: string,
): Node[] {
  if (!subsystem) return [];
  return subsystem.nodes?.filter((n) => n.type === type) ?? [];
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
function hasAcceptanceCriteria(description: string | string[] | undefined): boolean {
  if (!description) return false;
  const text = textToString(description).toLowerCase();
  return /\b(given|when|then)\b/.test(text);
}

/**
 * Sort phase nodes topologically using must_follow relationships.
 */
function sortPhasesByOrder(
  subsystem: SysProMDocument | undefined,
  phaseNodes: Node[],
): Node[] {
  const subsystemToUse = subsystem || { nodes: [], relationships: [] };
  const sorted: Node[] = [];
  const processedIds = new Set<string>();

  function addPhaseInOrder(phaseId: string | null | undefined) {
    if (!phaseId || processedIds.has(phaseId)) return;
    processedIds.add(phaseId);

    const phase = findNodeInSubsystem(subsystemToUse, phaseId);
    if (phase) {
      sorted.push(phase);
    }

    // Find phases that must_follow this phase (i.e., come after it)
    const followersRels = findRelationshipsTo(
      subsystemToUse,
      phaseId,
      "must_follow",
    );
    for (const rel of followersRels) {
      addPhaseInOrder(rel.from);
    }
  }

  // Start with phases that don't must_follow any other phase (first phases)
  for (const phase of phaseNodes) {
    const precedingRels = findRelationshipsFrom(
      subsystemToUse,
      phase.id,
      "must_follow",
    );
    if (precedingRels.length === 0) {
      addPhaseInOrder(phase.id);
    }
  }

  // Add any remaining phases not yet processed
  for (const phase of phaseNodes) {
    if (!processedIds.has(phase.id)) {
      addPhaseInOrder(phase.id);
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
 * Phases are not pre-scaffolded; use addPhase to add them.
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
// addPhase
// ============================================================================

/**
 * Immutably add a new phase (stage + change node) to PROT-IMPL.subsystem.
 * Auto-numbers the phase (PH-1, PH-2, ...). Wires must_follow to the previous phase.
 * Default name: "Phase N".
 */
export function addPhase(
  doc: SysProMDocument,
  prefix: string,
  name?: string,
): SysProMDocument {
  const protImpl = findNode(doc, `${prefix}-PROT-IMPL`);
  if (!protImpl) {
    throw new Error(`Node ${prefix}-PROT-IMPL not found`);
  }

  const subsystem = protImpl.subsystem || { nodes: [], relationships: [] };
  const existingPhases = (subsystem.nodes ?? []).filter(
    (n) => n.type === "stage",
  );
  const phaseNum = existingPhases.length + 1;
  const phaseName = name || `Phase ${phaseNum}`;

  // Create new stage and change nodes
  const stageId = `PH-${phaseNum}`;
  const changeId = `CHG-PH${phaseNum}`;

  const newStage: Node = {
    id: stageId,
    type: "stage",
    name: phaseName,
  };

  const newChange: Node = {
    id: changeId,
    type: "change",
    name: `${phaseName} Tasks`,
    plan: [],
  };

  // Build new relationships
  const newRels: Relationship[] = [
    {
      from: changeId,
      to: stageId,
      type: "part_of",
    },
  ];

  // If not the first phase, add must_follow from previous phase
  if (phaseNum > 1) {
    const prevPhaseId = `PH-${phaseNum - 1}`;
    newRels.push({
      from: stageId,
      to: prevPhaseId,
      type: "must_follow",
    });
  }

  // Merge into subsystem
  const updatedSubsystem: SysProMDocument = {
    ...(subsystem.metadata ? { metadata: subsystem.metadata } : {}),
    nodes: [...(subsystem.nodes ?? []), newStage, newChange],
    relationships: [
      ...(subsystem.relationships ?? []),
      ...newRels,
    ],
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
  const updatedNodes = (doc.nodes ?? []).map((n) =>
    n.id === protImpl.id ? updatedProtImpl : n,
  );

  return {
    ...doc,
    nodes: updatedNodes,
  };
}

// ============================================================================
// planStatus
// ============================================================================

/**
 * Inspect a document and return workflow completeness for a given prefix.
 * Never throws — missing nodes are reported as "not defined".
 */
export function planStatus(
  doc: SysProMDocument,
  prefix: string,
): PlanStatus {
  const constitution = findNode(doc, `${prefix}-CONST`);
  const spec = findNode(doc, `${prefix}-SPEC`);
  const protImpl = findNode(doc, `${prefix}-PROT-IMPL`);
  const checklist = findNode(doc, `${prefix}-CHK`);

  const userStories = findNodesByType(doc, "capability").filter(
    (n) => n.id.startsWith(`${prefix}-US-`),
  );
  const storiesNeedingAcceptanceCriteria = userStories
    .filter((us) => !hasAcceptanceCriteria(us.description))
    .map((us) => us.id);

  // Count phases
  const phaseCount = (protImpl?.subsystem?.nodes ?? []).filter(
    (n) => n.type === "stage",
  ).length;

  // Count tasks
  const changeNodes = (protImpl?.subsystem?.nodes ?? []).filter(
    (n) => n.type === "change",
  );
  let totalTasks = 0;
  let doneTasks = 0;
  for (const change of changeNodes) {
    const tasks = change.plan ?? [];
    totalTasks += tasks.length;
    doneTasks += tasks.filter((t) => t.done === true).length;
  }

  // Checklist stats
  const checklistLifecycle = checklist?.lifecycle ?? {};
  const checklistItemCount = Object.keys(checklistLifecycle).length;
  const checklistDoneCount = Object.values(checklistLifecycle).filter(
    (v) => v === true,
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
    nextStep = `Add phases: run \`spm plan add-phase <doc> --prefix ${prefix}\``;
  } else if (totalTasks === 0) {
    nextStep = `Add tasks to the phase change nodes`;
  } else if (doneTasks < totalTasks) {
    const remaining = totalTasks - doneTasks;
    nextStep = `Complete remaining tasks (${remaining} of ${totalTasks} remaining)`;
  } else if (!checklist) {
    nextStep = `Add a checklist gate node: ${prefix}-CHK`;
  } else if (checklistDoneCount < checklistItemCount) {
    const remaining = checklistItemCount - checklistDoneCount;
    nextStep = `Complete the checklist (${remaining} of ${checklistItemCount} items remaining)`;
  } else {
    nextStep = `All steps complete`;
  }

  return {
    constitution: {
      defined: constitution !== null,
      principleCount: constitution
        ? findNodesByType(doc, "principle").filter((p) =>
            (doc.relationships ?? []).some(
              (r) => r.from === p.id && r.to === constitution.id && r.type === "part_of",
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
 * Return per-phase task completion data.
 * Phases are discovered from PROT-IMPL.subsystem, sorted topologically.
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
  const phaseNodes = findNodesByTypeInSubsystem(subsystem, "stage");
  const sortedPhases = sortPhasesByOrder(subsystem, phaseNodes);

  const result: PhaseProgress[] = [];

  for (let i = 0; i < sortedPhases.length; i++) {
    const phase = sortedPhases[i];
    const phaseNum = i + 1;

    // Find change nodes that are part_of this phase
    const changeRels = findRelationshipsTo(subsystem, phase.id, "part_of");
    let totalTasks = 0;
    let doneTasks = 0;

    for (const rel of changeRels) {
      const change = findNodeInSubsystem(subsystem, rel.from);
      if (change?.type === "change") {
        const tasks = change.plan ?? [];
        totalTasks += tasks.length;
        doneTasks += tasks.filter((t) => t.done === true).length;
      }
    }

    const percent = totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100);

    result.push({
      phase: phaseNum,
      name: phase.name,
      done: doneTasks,
      total: totalTasks,
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
    const phaseNodes = findNodesByTypeInSubsystem(subsystem, "stage");
    const sortedPhases = sortPhasesByOrder(subsystem, phaseNodes);
    if (phase - 1 <= sortedPhases.length) {
      const prevPhase = sortedPhases[phase - 2]; // 0-indexed
      const changeRels = findRelationshipsTo(subsystem, prevPhase.id, "part_of");
      let undoneCount = 0;

      for (const rel of changeRels) {
        const change = findNodeInSubsystem(subsystem, rel.from);
        if (change?.type === "change") {
          const tasks = change.plan ?? [];
          undoneCount += tasks.filter((t) => t.done !== true).length;
        }
      }

      if (undoneCount > 0) {
        issues.push({
          kind: "previous_tasks_incomplete",
          phase: phase - 1,
          remaining: undoneCount,
        });
      }
    }
  }

  // Check user stories
  const userStories = findNodesByType(doc, "capability").filter(
    (n) => n.id.startsWith(`${prefix}-US-`),
  );

  for (const us of userStories) {
    // Check if there's a change implementing it
    const hasChange = (doc.relationships ?? []).some(
      (r) => r.type === "implements" && r.to === us.id && r.from.startsWith(`${prefix}-CHG-`),
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
  const frs = findNodesByType(doc, "invariant").filter(
    (n) => n.id.startsWith(`${prefix}-FR-`),
  );

  for (const fr of frs) {
    // Check if there's a change implementing it
    const hasChange = (doc.relationships ?? []).some(
      (r) => r.type === "implements" && r.to === fr.id && r.from.startsWith(`${prefix}-CHG-`),
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
