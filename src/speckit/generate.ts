import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { SysProMDocument, Node, Relationship } from "../schema.js";
import { textToString } from "../text.js";

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
 * Find all nodes of a specific type.
 */
function findNodesByType(doc: SysProMDocument, type: string): Node[] {
  return doc.nodes?.filter((n) => n.type === type) ?? [];
}

/**
 * Find relationships from a source node to nodes of a target type.
 */
function findRelationshipsFrom(
  doc: SysProMDocument,
  fromId: string,
  relationType?: string,
): Relationship[] {
  return (doc.relationships ?? []).filter((r) => {
    if (r.from !== fromId) return false;
    if (relationType && r.type !== relationType) return false;
    return true;
  });
}

/**
 * Find relationships to a target node.
 */
function findRelationshipsTo(
  doc: SysProMDocument,
  toId: string,
  relationType?: string,
): Relationship[] {
  return (doc.relationships ?? []).filter((r) => {
    if (r.to !== toId) return false;
    if (relationType && r.type !== relationType) return false;
    return true;
  });
}

/**
 * Extract priority from a node's name, description, or lifecycle fields.
 * Looks for patterns like "P1", "P2", "Priority: P1", etc.
 */
function extractPriority(node: Node): string {
  const text = [
    node.name,
    node.description ? textToString(node.description) : "",
    Object.keys(node.lifecycle ?? {}).join(" "),
  ]
    .join(" ")
    .toUpperCase();

  const match = text.match(/P[1-5]/);
  return match ? match[0] : "P3";
}

/**
 * Extract numeric suffix from an ID (e.g., "PREFIX-SPEC-001" -> "001").
 */
function getIdSuffix(id: string): string {
  const parts = id.split("-");
  return parts[parts.length - 1] ?? "000";
}

/**
 * Parse tasks from a change node's plan array.
 */
function parseTasks(node: Node): Array<{ description: string; done: boolean }> {
  return (node.plan ?? []).map((task) => ({
    description: textToString(task.description),
    done: task.done ?? false,
  }));
}

/**
 * Format the status for spec output: "proposed" -> "Draft", etc.
 */
function formatStatus(status?: string): string {
  if (!status) return "Draft";
  const mapping: Record<string, string> = {
    proposed: "Draft",
    active: "Active",
    complete: "Complete",
  };
  return mapping[status] ?? status;
}

// ============================================================================
// generate Constitution
// ============================================================================

export function generateConstitution(
  doc: SysProMDocument,
  prefix: string,
): string {
  const protocolId = `${prefix}-CONST`;
  const protocol = findNode(doc, protocolId);

  if (!protocol) {
    return "";
  }

  const title = protocol.name;
  let output = `# ${title} Constitution\n\n`;

  // Core Principles section
  output += "## Core Principles\n\n";

  const invariantRels = findRelationshipsTo(doc, protocolId, "part_of");
  const principleIds = invariantRels
    .map((r) => r.from)
    .map((id) => findNode(doc, id))
    .filter((n) => n !== null);

  if (principleIds.length === 0) {
    output += "*(No principles defined)*\n\n";
  } else {
    for (const principle of principleIds) {
      if (!principle) continue;
      output += `### ${principle.name}\n\n`;
      if (principle.description) {
        output += `${textToString(principle.description)}\n\n`;
      }
    }
  }

  // Governance section
  const govPolicyId = `${prefix}-POL-GOV`;
  const govPolicy = findNode(doc, govPolicyId);

  if (govPolicy) {
    output += "## Governance\n\n";
    if (govPolicy.description) {
      output += `${textToString(govPolicy.description)}\n\n`;
    }
  }

  // Other policy sections
  const policyRels = findRelationshipsTo(doc, protocolId, "part_of");
  const policyIds = policyRels
    .map((r) => r.from)
    .map((id) => findNode(doc, id))
    .filter((n) => n !== null && n.type === "policy" && n.id !== govPolicyId);

  for (const policy of policyIds) {
    if (!policy) continue;
    output += `## ${policy.name}\n\n`;
    if (policy.description) {
      output += `${textToString(policy.description)}\n\n`;
    }
  }

  // Footer with metadata
  const version = protocol.lifecycle?.version ? "1.0" : "";
  const ratified = protocol.lifecycle?.ratified
    ? new Date().toISOString().split("T")[0]
    : "";
  const amended = protocol.lifecycle?.amended
    ? new Date().toISOString().split("T")[0]
    : "";

  const footer = [
    version ? `**Version**: ${version}` : undefined,
    ratified ? `**Ratified**: ${ratified}` : undefined,
    amended ? `**Last Amended**: ${amended}` : undefined,
  ]
    .filter(Boolean)
    .join(" | ");

  if (footer) {
    output += footer + "\n";
  }

  return output.trim();
}

// ============================================================================
// generateSpec
// ============================================================================

export function generateSpec(doc: SysProMDocument, prefix: string): string {
  const specId = `${prefix}-SPEC`;
  const spec = findNode(doc, specId);

  if (!spec) {
    return "";
  }

  const title = spec.name;
  let output = `# Feature Specification: ${title}\n\n`;

  // Metadata
  output += `**Feature Branch**: \`${prefix.toLowerCase()}\`\n`;
  output += `**Created**: ${new Date().toISOString().split("T")[0]}\n`;
  output += `**Status**: ${formatStatus(spec.status)}\n\n`;

  // User Scenarios & Testing section
  output += "## User Scenarios & Testing *(mandatory)*\n\n";

  const capabilityRels = findRelationshipsTo(doc, specId, "refines");
  const capabilityIds = capabilityRels
    .map((r) => r.from)
    .map((id) => findNode(doc, id));

  // Sort by ID suffix number
  capabilityIds.sort((a, b) => {
    const suffixA = parseInt(getIdSuffix(a?.id ?? "000"), 10);
    const suffixB = parseInt(getIdSuffix(b?.id ?? "000"), 10);
    return suffixA - suffixB;
  });

  if (capabilityIds.length === 0) {
    output += "*(No user scenarios defined)*\n\n";
  } else {
    for (const capability of capabilityIds) {
      if (!capability) continue;

      const priority = extractPriority(capability);
      output += `### User Story ${getIdSuffix(capability.id)} - ${capability.name} (Priority: ${priority})\n\n`;

      if (capability.description) {
        const desc = textToString(capability.description);
        output += `${desc}\n\n`;
      }

      output += `**Why this priority**: [explanation needed]\n\n`;

      // Independent Test section
      if (capability.context) {
        const context = textToString(capability.context);
        output += `**Independent Test**: ${context}\n\n`;
      } else {
        output += `**Independent Test**: [test description needed]\n\n`;
      }

      // Acceptance Scenarios
      output += "**Acceptance Scenarios**:\n\n";
      if (capability.description && Array.isArray(capability.description)) {
        const scenarioLines = capability.description.filter((line) =>
          line.toUpperCase().startsWith("**GIVEN**"),
        );
        if (scenarioLines.length > 0) {
          scenarioLines.forEach((line, idx) => {
            output += `${idx + 1}. ${line}\n\n`;
          });
        } else {
          output +=
            "1. **Given** [state], **When** [action], **Then** [outcome]\n\n";
        }
      } else {
        output +=
          "1. **Given** [state], **When** [action], **Then** [outcome]\n\n";
      }

      output += "---\n\n";
    }
  }

  // Edge Cases section
  output += "### Edge Cases\n\n";
  output += "- [edge case items]\n\n";

  // Requirements section
  output += "## Requirements *(mandatory)*\n\n";

  // Functional Requirements
  output += "### Functional Requirements\n\n";
  const frNodes = findNodesByType(doc, "invariant").filter((n) =>
    n.id.startsWith(`${prefix}-FR-`),
  );

  if (frNodes.length === 0) {
    output += "- [requirements needed]\n\n";
  } else {
    frNodes.forEach((req) => {
      const reqText = textToString(req.description ?? "");
      const status = req.status === "proposed" ? ` [NEEDS CLARIFICATION]` : "";
      output += `- **${req.id}**: ${reqText}${status}\n`;
    });
    output += "\n";
  }

  // Key Entities
  const entityNodes = findNodesByType(doc, "concept").filter((n) =>
    n.id.startsWith(`${prefix}-ENT-`),
  );

  if (entityNodes.length > 0) {
    output += "### Key Entities *(include if feature involves data)*\n\n";
    for (const entity of entityNodes) {
      output += `- **${entity.name}**: ${textToString(entity.description ?? "")}\n`;
    }
    output += "\n";
  }

  // Success Criteria section
  output += "## Success Criteria *(mandatory)*\n\n";
  output += "### Measurable Outcomes\n\n";

  const scNodes = findNodesByType(doc, "invariant").filter((n) =>
    n.id.startsWith(`${prefix}-SC-`),
  );

  if (scNodes.length === 0) {
    output += "- **SC-001**: [metric needed]\n\n";
  } else {
    for (const sc of scNodes) {
      output += `- **${sc.id}**: ${textToString(sc.description ?? "")}\n`;
    }
    output += "\n";
  }

  return output.trim();
}

// ============================================================================
// generatePlan
// ============================================================================

export function generatePlan(doc: SysProMDocument, prefix: string): string {
  const implProtocolId = `${prefix}-PROT-IMPL`;
  const protocol = findNode(doc, implProtocolId);

  if (!protocol) {
    return "";
  }

  const title = protocol.name;
  let output = `# Implementation Plan: ${title}\n\n`;

  output += `**Branch**: \`${prefix.toLowerCase()}\`\n`;
  output += `**Date**: ${new Date().toISOString().split("T")[0]}\n`;
  output += `**Spec**: [link to spec.md]\n\n`;

  // Summary
  output += "## Summary\n\n";
  if (protocol.description) {
    output += `${textToString(protocol.description)}\n\n`;
  } else {
    output += "[Summary of the implementation plan]\n\n";
  }

  // Technical Context
  output += "## Technical Context\n\n";
  if (protocol.context) {
    const context = textToString(protocol.context);
    const lines = Array.isArray(protocol.context)
      ? protocol.context
      : [context];
    lines.forEach((line) => {
      output += `${line}\n`;
    });
    output += "\n";
  } else {
    output += "[Key technical decisions and context]\n\n";
  }

  // Constitution Check
  output += "## Constitution Check\n\n";
  if (protocol.rationale) {
    output += `${textToString(protocol.rationale)}\n\n`;
  } else {
    output += "[Alignment with constitution principles]\n\n";
  }

  // Project Structure
  output += "## Project Structure\n\n";
  output += "[Project directory structure and module organization]\n\n";

  return output.trim();
}

// ============================================================================
// generateTasks
// ============================================================================

export function generateTasks(doc: SysProMDocument, prefix: string): string {
  const implProtocolId = `${prefix}-PROT-IMPL`;
  const protocol = findNode(doc, implProtocolId);

  if (!protocol) {
    return "";
  }

  const title = protocol.name;
  let output = `# Task List: ${title}\n\n`;

  // Find stage nodes that are part_of the protocol
  const stageRels = findRelationshipsTo(doc, implProtocolId, "part_of");
  const stageIds = stageRels.map((r) => r.from).map((id) => findNode(doc, id));

  // Sort stages by must_follow order
  const sortedStages: (Node | null)[] = [];
  const processedIds = new Set<string>();

  function addStageInOrder(stageId: string | null | undefined) {
    if (!stageId || processedIds.has(stageId)) return;
    processedIds.add(stageId);

    const stage = findNode(doc, stageId);
    if (stage) {
      sortedStages.push(stage);
    }

    // Find stages that must_follow this stage (i.e., come after it)
    // must_follow relationship: { from: nextStage, to: thisStage } means nextStage follows thisStage
    const followersRels = findRelationshipsTo(doc, stageId, "must_follow");
    for (const rel of followersRels) {
      addStageInOrder(rel.from);
    }
  }

  // Start with stages that don't must_follow any other stage (first stages)
  // A stage is first if it has no outgoing must_follow relationship
  for (const stage of stageIds) {
    if (!stage) continue;
    const precedingRels = findRelationshipsFrom(doc, stage.id, "must_follow");
    if (precedingRels.length === 0) {
      addStageInOrder(stage.id);
    }
  }

  // Add any remaining stages not yet processed
  for (const stage of stageIds) {
    if (stage && !processedIds.has(stage.id)) {
      addStageInOrder(stage.id);
    }
  }

  if (sortedStages.length === 0) {
    output += "*(No phases defined)*\n\n";
    return output.trim();
  }

  // Collect all change nodes in the document
  const allChanges = (doc.nodes ?? []).filter(
    (n) => n.type === "change" && n.id.startsWith(prefix),
  );

  let taskCounter = 1;

  for (let phaseIdx = 0; phaseIdx < sortedStages.length; phaseIdx++) {
    const stage = sortedStages[phaseIdx];
    if (!stage) continue;

    output += `## Phase ${phaseIdx + 1}: ${stage.name}\n\n`;

    // Find change nodes related to this stage
    const phaseNum = phaseIdx + 1;
    const phaseChangeId = `${prefix}-CHG-PH${phaseNum}`;
    const phaseChange = findNode(doc, phaseChangeId);

    // Find change nodes linked FROM or TO stage via any relationship
    const changeRelsFrom = findRelationshipsFrom(doc, stage.id);
    const changeRelsTo = findRelationshipsTo(doc, stage.id);

    const linkedChangeIds = new Set<string>();
    for (const r of changeRelsFrom) {
      const n = findNode(doc, r.to);
      if (n?.type === "change") linkedChangeIds.add(n.id);
    }
    for (const r of changeRelsTo) {
      const n = findNode(doc, r.from);
      if (n?.type === "change") linkedChangeIds.add(n.id);
    }

    // Collect changes for this phase
    const phaseChanges: Node[] = [];
    if (phaseChange) phaseChanges.push(phaseChange);
    for (const id of linkedChangeIds) {
      const n = findNode(doc, id);
      if (n && !phaseChanges.some((c) => c.id === n.id)) phaseChanges.push(n);
    }

    // If no changes found by relationship or prefix, try matching by phase suffix
    if (phaseChanges.length === 0) {
      for (const change of allChanges) {
        if (
          change.id.includes(`PH${phaseNum}`) ||
          change.id.includes(`PH-${phaseNum}`)
        ) {
          phaseChanges.push(change);
        }
      }
    }

    for (const change of phaseChanges) {
      const tasks = parseTasks(change);

      // Find capability that this change implements
      const implRels = findRelationshipsFrom(doc, change.id, "implements");
      const usStory = implRels.length > 0 ? getIdSuffix(implRels[0].to) : null;

      for (const task of tasks) {
        const checkbox = task.done ? "[x]" : "[ ]";
        const taskNum = String(taskCounter).padStart(3, "0");
        let taskLine = `- ${checkbox} T${taskNum}`;

        if (usStory && usStory !== "000") {
          taskLine += ` [US${usStory}]`;
        }

        taskLine += ` ${textToString(task.description)}`;
        output += taskLine + "\n";
        taskCounter++;
      }
    }

    output += "\n";
  }

  return output.trim();
}

// ============================================================================
// generateChecklist
// ============================================================================

export function generateChecklist(
  doc: SysProMDocument,
  prefix: string,
): string {
  const gateId = `${prefix}-CHK`;
  const gate = findNode(doc, gateId);

  if (!gate) {
    return "";
  }

  const title = gate.name;
  let output = `# Checklist: ${title}\n\n`;

  output += `**Purpose**: ${textToString(gate.description ?? "No description provided")}\n`;
  output += `**Created**: ${new Date().toISOString().split("T")[0]}\n\n`;

  // Parse description for section markers and lifecycle for items
  const description = gate.description ? textToString(gate.description) : "";
  const lines = description.split("\n");

  const sections: Map<
    string,
    Array<{ key: string; done: boolean }>
  > = new Map();
  let currentSection = "Items";

  for (const line of lines) {
    if (line.startsWith("## ")) {
      currentSection = line.replace("## ", "").trim();
    }
  }

  // Use lifecycle as checklist items
  if (gate.lifecycle && Object.keys(gate.lifecycle).length > 0) {
    for (const [key, done] of Object.entries(gate.lifecycle)) {
      if (!sections.has(currentSection)) {
        sections.set(currentSection, []);
      }
      sections.get(currentSection)!.push({ key, done });
    }
  }

  if (sections.size === 0) {
    output += "## Items\n\n";
    output += "- [ ] CHK001 [checklist item needed]\n\n";
  } else {
    let itemCounter = 1;
    for (const [section, items] of sections) {
      output += `## ${section}\n\n`;
      for (const item of items) {
        const checkbox = item.done ? "[x]" : "[ ]";
        const checkNum = String(itemCounter).padStart(3, "0");
        output += `- ${checkbox} CHK${checkNum} ${item.key}\n`;
        itemCounter++;
      }
      output += "\n";
    }
  }

  return output.trim();
}

// ============================================================================
// generateSpecKitProject
// ============================================================================

export function generateSpecKitProject(
  doc: SysProMDocument,
  outputDir: string,
  prefix: string,
): void {
  // Create output directory if it doesn't exist
  mkdirSync(outputDir, { recursive: true });

  // Generate and write constitution.md
  const constitution = generateConstitution(doc, prefix);
  if (constitution.trim()) {
    writeFileSync(join(outputDir, "constitution.md"), constitution + "\n");
  }

  // Generate and write spec.md
  const spec = generateSpec(doc, prefix);
  if (spec.trim()) {
    writeFileSync(join(outputDir, "spec.md"), spec + "\n");
  }

  // Generate and write plan.md
  const plan = generatePlan(doc, prefix);
  if (plan.trim()) {
    writeFileSync(join(outputDir, "plan.md"), plan + "\n");
  }

  // Generate and write tasks.md
  const tasks = generateTasks(doc, prefix);
  if (tasks.trim()) {
    writeFileSync(join(outputDir, "tasks.md"), tasks + "\n");
  }

  // Generate and write checklist.md
  const checklist = generateChecklist(doc, prefix);
  if (checklist.trim()) {
    writeFileSync(join(outputDir, "checklist.md"), checklist + "\n");
  }
}
