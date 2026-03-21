import { readFileSync, existsSync } from "node:fs";
import { join, basename } from "node:path";
import type {
  SysProMDocument,
  Node,
  Relationship,
  NodeStatus,
  RelationshipType,
} from "../schema.js";

// ---------------------------------------------------------------------------
// Helper types
// ---------------------------------------------------------------------------

interface Section {
  level: number;
  heading: string;
  body: string;
  children: Section[];
}

interface ParseResult {
  nodes: Node[];
  relationships: Relationship[];
}

interface CheckboxItem {
  id: string;
  text: string;
  done: boolean;
}

// ---------------------------------------------------------------------------
// Helper functions — markdown parsing
// ---------------------------------------------------------------------------

/**
 * Parse markdown content into a hierarchical section tree by heading level.
 */
function parseSections(body: string): Section[] {
  const lines = body.split("\n");
  const all: Section[] = [];

  // First pass: find all headings and collect their body text
  for (let i = 0; i < lines.length; i++) {
    const hMatch = lines[i].match(/^(#{1,6})\s+(.+)$/);
    if (hMatch) {
      const level = hMatch[1].length;
      const heading = hMatch[2];
      const bodyLines: string[] = [];

      // Collect lines until the next heading
      for (let j = i + 1; j < lines.length; j++) {
        if (lines[j].match(/^#{1,6}\s/)) break;
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

  // Second pass: build tree structure
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

/**
 * Extract bold key-value pairs from markdown like "**Key**: value" or "**Key**: value text".
 */
function parseFrontMatterish(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  const lines = content.split("\n");

  for (const line of lines) {
    const match = line.match(/^\*\*([^*]+)\*\*:\s*(.+)$/);
    if (match) {
      const [, key, value] = match;
      result[key] = value.trim();
    }
  }

  return result;
}

/**
 * Parse checkbox lines like "- [x] ID text" or "- [ ] ID text".
 */
function parseCheckboxes(body: string): CheckboxItem[] {
  const items: CheckboxItem[] = [];
  const lines = body.split("\n");

  for (const line of lines) {
    const match = line.match(/^-\s+\[([x ])\]\s+(.+)$/);
    if (match) {
      const [, checkbox, text] = match;
      const done = checkbox === "x";
      // Extract ID as the first token (e.g., "T001", "CHK001")
      const textMatch = text.match(/^(\S+)\s+(.*)$/);
      const id = textMatch ? textMatch[1] : text;
      const itemText = textMatch ? textMatch[2] : text;

      items.push({ id, text: itemText, done });
    }
  }

  return items;
}

/**
 * Flatten all sections in the tree into a single array for easier searching.
 */
function flattenSections(sections: Section[]): Section[] {
  const result: Section[] = [];
  function walk(s: Section) {
    result.push(s);
    for (const c of s.children) walk(c);
  }
  for (const s of sections) walk(s);
  return result;
}

/**
 * Find the first section whose heading matches a predicate (searches entire tree).
 */
function findSection(
  sections: Section[],
  predicate: (heading: string) => boolean,
): Section | undefined {
  return flattenSections(sections).find((s) => predicate(s.heading));
}

/**
 * Convert status-like strings to NodeStatus. Recognizes common spec-kit patterns.
 */
function mapStatusValue(value: string): NodeStatus {
  const lower = value.toLowerCase().trim();
  const statusMap: Record<string, NodeStatus> = {
    draft: "proposed",
    proposed: "proposed",
    accepted: "accepted",
    active: "active",
    implemented: "implemented",
    adopted: "adopted",
    defined: "defined",
    introduced: "introduced",
    in_progress: "in_progress",
    complete: "complete",
    consolidated: "consolidated",
    experimental: "experimental",
    deprecated: "deprecated",
    retired: "retired",
    superseded: "superseded",
    abandoned: "abandoned",
    deferred: "deferred",
  };
  return statusMap[lower] || "proposed";
}

/**
 * Extract a single line value from body text (e.g., "**Created**: 2025-01-01").
 */
function extractValue(body: string, key: string): string | undefined {
  const pattern = new RegExp(`^\\*\\*${key}\\*\\*:\\s*(.+)$`, "m");
  const match = body.match(pattern);
  return match ? match[1].trim() : undefined;
}

// ---------------------------------------------------------------------------
// constitution.md parser
// ---------------------------------------------------------------------------

export function parseConstitution(
  content: string,
  idPrefix: string,
): ParseResult {
  const sections = parseSections(content);
  const nodes: Node[] = [];
  const relationships: Relationship[] = [];

  // Find title (first # heading)
  let title = "Constitution";
  const titleSection = sections.find((s) => s.level === 1);
  if (titleSection) {
    title = titleSection.heading;
  }

  // Create protocol node for the constitution
  const protocolId = `${idPrefix}-CONST`;
  nodes.push({
    id: protocolId,
    type: "protocol",
    name: title,
    description: titleSection?.body || undefined,
  });

  // Search entire tree for sections
  const allSections = flattenSections(sections);

  // Find "Core Principles" section and extract invariants
  let principlesIdx = 0;
  const principlesSection = findSection(
    sections,
    (h) =>
      h.toLowerCase().includes("core principles") ||
      h.toLowerCase() === "principles",
  );
  if (principlesSection) {
    for (const child of principlesSection.children) {
      principlesIdx++;
      const invariantId = `${idPrefix}-INV-${principlesIdx}`;
      nodes.push({
        id: invariantId,
        type: "invariant",
        name: child.heading,
        description: child.body || undefined,
      });
      relationships.push({
        from: invariantId,
        to: protocolId,
        type: "part_of",
      });
    }
  }

  // Find "Governance" section and create policy node
  const govSection = findSection(
    sections,
    (h) => h.toLowerCase() === "governance",
  );
  if (govSection) {
    const govPolicyId = `${idPrefix}-POL-GOV`;
    nodes.push({
      id: govPolicyId,
      type: "policy",
      name: "Governance",
      description: govSection.body || undefined,
    });
    relationships.push({
      from: govPolicyId,
      to: protocolId,
      type: "part_of",
    });
  }

  // Other ## sections become policies (excluding the main title and known sections)
  const knownHeadings = new Set([
    "core principles",
    "principles",
    "governance",
  ]);
  let policyIdx = 1;
  for (const section of allSections) {
    if (
      section.level === 2 &&
      !knownHeadings.has(section.heading.toLowerCase()) &&
      !section.heading.toLowerCase().includes("core principles")
    ) {
      const policyId = `${idPrefix}-POL-${policyIdx}`;
      nodes.push({
        id: policyId,
        type: "policy",
        name: section.heading,
        description: section.body || undefined,
      });
      relationships.push({
        from: policyId,
        to: protocolId,
        type: "part_of",
      });
      policyIdx++;
    }
  }

  return { nodes, relationships };
}

// ---------------------------------------------------------------------------
// spec.md parser
// ---------------------------------------------------------------------------

export function parseSpec(content: string, idPrefix: string): ParseResult {
  const sections = parseSections(content);
  const allSections = flattenSections(sections);
  const nodes: Node[] = [];
  const relationships: Relationship[] = [];

  // Extract metadata from content (bold key-value pairs)
  const metadata = parseFrontMatterish(content);
  const statusStr = extractValue(content, "Status") || "Draft";
  const status = mapStatusValue(statusStr);

  // Find title (first # heading)
  let title = "Specification";
  let specBodyStart = 0;
  const titleSection = sections.find((s) => s.level === 1);
  if (titleSection) {
    title = titleSection.heading.replace(/^Feature Specification:\s*/i, "");
    specBodyStart = 1;
  }

  // Create artefact node for the spec
  const specId = `${idPrefix}-SPEC`;
  nodes.push({
    id: specId,
    type: "artefact",
    name: title,
    status,
    description: titleSection?.body || undefined,
  });

  // Track user stories, FRs, SCs, and entities
  let usIdx = 0;
  let frIdx = 0;
  let scIdx = 0;
  let entityIdx = 0;

  // Find "User Scenarios & Testing" section
  for (const section of allSections) {
    if (
      section.heading.toLowerCase().includes("user scenarios") ||
      section.heading.toLowerCase().includes("user story")
    ) {
      // Each "### User Story N - Title (Priority: PN)" becomes a capability
      for (const child of section.children) {
        const usMatch = child.heading.match(
          /^User Story\s+(\d+)\s*-\s*(.+?)\s*\(Priority:\s*P(\d+)\)/i,
        );
        if (usMatch) {
          usIdx++;
          const capabilityId = `${idPrefix}-US-${usIdx}`;
          const priority = `P${usMatch[3]}`;
          const storyName = usMatch[2];

          // Extract acceptance scenarios
          const acceptanceLines: string[] = [];
          let inAcceptance = false;
          for (const line of child.body.split("\n")) {
            if (line.toLowerCase().includes("acceptance scenario")) {
              inAcceptance = true;
              continue;
            }
            if (inAcceptance && line.match(/^#+\s/)) break;
            if (inAcceptance) {
              acceptanceLines.push(line);
            }
          }

          // Look for "Independent Test"
          let independentTest: string | undefined;
          const testMatch = child.body.match(
            /\*\*Independent Test\*\*:\s*(.+?)(?:\n|$)/,
          );
          if (testMatch) {
            independentTest = testMatch[1];
          }

          const description: string[] = [];
          description.push(`Priority: ${priority}`);
          if (acceptanceLines.length > 0) {
            description.push("Acceptance Scenarios:", ...acceptanceLines);
          }

          nodes.push({
            id: capabilityId,
            type: "capability",
            name: storyName,
            description,
            context: independentTest,
          });

          relationships.push({
            from: capabilityId,
            to: specId,
            type: "refines",
          });
        }
      }
    }
  }

  // Find "Requirements" section for FR and entity definitions
  for (const section of allSections) {
    if (section.heading.toLowerCase().includes("requirements")) {
      for (const child of section.children) {
        // Look for "Functional Requirements" subsection
        if (child.heading.toLowerCase().includes("functional")) {
          for (const line of child.body.split("\n")) {
            const frMatch = line.match(
              /^-?\s*\*\*FR-(\d+)\*\*:\s*(.+?)(?:\s*\[NEEDS CLARIFICATION[^\]]*\])?(.*)$/,
            );
            if (frMatch) {
              frIdx++;
              const frId = `${idPrefix}-FR-${frIdx}`;
              const frText = frMatch[2] + (frMatch[3] || "");
              const needsClarification = line.includes("NEEDS CLARIFICATION");

              nodes.push({
                id: frId,
                type: "invariant",
                name: `FR-${frIdx}`,
                description: frText,
                status: needsClarification ? "proposed" : "active",
              });

              relationships.push({
                from: frId,
                to: specId,
                type: "constrained_by",
              });
            }
          }
        }

        // Look for "Key Entities" subsection
        if (child.heading.toLowerCase().includes("entities")) {
          for (const line of child.body.split("\n")) {
            const entityMatch = line.match(/^-?\s*\*\*([^*]+)\*\*:\s*(.+)$/);
            if (entityMatch) {
              entityIdx++;
              const entityId = `${idPrefix}-ENT-${entityIdx}`;
              const entityName = entityMatch[1];
              const entityDesc = entityMatch[2];

              nodes.push({
                id: entityId,
                type: "concept",
                name: entityName,
                description: entityDesc,
              });
            }
          }
        }
      }
    }
  }

  // Find "Success Criteria" section
  for (const section of allSections) {
    if (section.heading.toLowerCase().includes("success criteria")) {
      for (const child of section.children) {
        if (child.heading.toLowerCase().includes("measurable")) {
          for (const line of child.body.split("\n")) {
            const scMatch = line.match(/^-?\s*\*\*SC-(\d+)\*\*:\s*(.+)$/);
            if (scMatch) {
              scIdx++;
              const scId = `${idPrefix}-SC-${scIdx}`;
              const scText = scMatch[2];

              nodes.push({
                id: scId,
                type: "invariant",
                name: `SC-${scIdx}`,
                description: scText,
                status: "active",
              });

              relationships.push({
                from: scId,
                to: specId,
                type: "constrained_by",
              });
            }
          }
        }
      }
    }
  }

  // Find "Edge Cases" section and attach to spec as description supplement
  for (const section of allSections) {
    if (section.heading.toLowerCase().includes("edge case")) {
      // Append edge cases to spec description
      if (Array.isArray(nodes[0].description)) {
        nodes[0].description.push("Edge Cases:", section.body);
      } else if (nodes[0].description) {
        nodes[0].description = [
          nodes[0].description,
          "Edge Cases:",
          section.body,
        ];
      } else {
        nodes[0].description = ["Edge Cases:", section.body];
      }
    }
  }

  return { nodes, relationships };
}

// ---------------------------------------------------------------------------
// plan.md parser
// ---------------------------------------------------------------------------

export function parsePlan(content: string, idPrefix: string): ParseResult {
  const sections = parseSections(content);
  const allSections = flattenSections(sections);
  const nodes: Node[] = [];
  const relationships: Relationship[] = [];

  // Extract metadata
  const metadata = parseFrontMatterish(content);

  // Find title (first # heading)
  let title = "Implementation Plan";
  const titleSection = sections.find((s) => s.level === 1);
  if (titleSection) {
    title = titleSection.heading.replace(/^Implementation Plan:\s*/i, "");
  }

  // Create plan artefact
  const planId = `${idPrefix}-PLAN`;
  nodes.push({
    id: planId,
    type: "artefact",
    name: title,
  });

  // Extract summary
  for (const section of allSections) {
    if (section.heading.toLowerCase() === "summary") {
      nodes[0].description = section.body;
      break;
    }
  }

  // Create technical context element
  for (const section of allSections) {
    if (section.heading.toLowerCase().includes("technical context")) {
      const techId = `${idPrefix}-TECH`;
      const contextLines: string[] = [];
      for (const line of section.body.split("\n")) {
        if (line.startsWith("- ")) {
          contextLines.push(line.slice(2));
        }
      }
      nodes.push({
        id: techId,
        type: "element",
        name: "Technical Context",
        description: contextLines,
      });
      break;
    }
  }

  // Create gate for constitution check
  for (const section of allSections) {
    if (section.heading.toLowerCase().includes("constitution")) {
      const gateId = `${idPrefix}-GATE-CONST`;
      nodes.push({
        id: gateId,
        type: "gate",
        name: "Constitution Check",
        description: section.body,
      });
      break;
    }
  }

  // Create element for project structure
  for (const section of allSections) {
    if (section.heading.toLowerCase().includes("project structure")) {
      const structId = `${idPrefix}-STRUCT`;
      const lines = section.body.split("\n").filter((l) => l.trim());
      nodes.push({
        id: structId,
        type: "element",
        name: "Project Structure",
        description: lines,
      });
      break;
    }
  }

  // Add relationships
  // plan depends_on spec
  relationships.push({
    from: planId,
    to: `${idPrefix}-SPEC`,
    type: "depends_on",
  });

  // gate governed_by protocol (if constitution exists)
  const gateNode = nodes.find(
    (n) => n.type === "gate" && n.id.includes("CONST"),
  );
  if (gateNode) {
    relationships.push({
      from: gateNode.id,
      to: `${idPrefix}-CONST`,
      type: "governed_by",
    });
  }

  return { nodes, relationships };
}

// ---------------------------------------------------------------------------
// tasks.md parser
// ---------------------------------------------------------------------------

export function parseTasks(content: string, idPrefix: string): ParseResult {
  const sections = parseSections(content);
  const allSections = flattenSections(sections);
  const topLevelNodes: Node[] = [];
  const topLevelRelationships: Relationship[] = [];

  // Parse phases (## Phase N: Title)
  const phases: Array<{
    title: string;
    phaseNum: number;
    tasks: CheckboxItem[];
  }> = [];
  let phaseNum = 0;

  for (const section of allSections) {
    const phaseMatch = section.heading.match(/^Phase\s+(\d+):\s*(.+)$/i);
    if (phaseMatch) {
      phaseNum++;
      const phaseTitle = phaseMatch[2];

      // Parse tasks in this phase
      const tasks = parseCheckboxes(section.body);

      phases.push({
        title: phaseTitle,
        phaseNum,
        tasks,
      });
    }
  }

  // Build subsystem nodes and relationships
  const subsystemNodes: Node[] = [];
  const subsystemRelationships: Relationship[] = [];

  // Group tasks by user story or phase
  const changesByStory: Record<string, CheckboxItem[]> = {};
  const changesByPhase: Record<number, CheckboxItem[]> = {};

  for (let i = 0; i < phases.length; i++) {
    const phase = phases[i];
    changesByPhase[phase.phaseNum] = [];

    for (const task of phase.tasks) {
      // Look for [US1], [US2], etc. in the task text
      const storyMatch = task.text.match(/\[US(\d+)\]/);
      if (storyMatch) {
        const storyKey = `US${storyMatch[1]}`;
        if (!changesByStory[storyKey]) {
          changesByStory[storyKey] = [];
        }
        changesByStory[storyKey].push(task);
      } else {
        changesByPhase[phase.phaseNum].push(task);
      }
    }
  }

  // Create change nodes for each phase (with LOCAL IDs in subsystem)
  // Use numeric indices (CHG-1, CHG-2, etc.) for phase changes
  for (let i = 0; i < phases.length; i++) {
    const phase = phases[i];
    const tasks = changesByPhase[phase.phaseNum] || [];
    const plan = tasks.map((t) => ({
      description: t.text,
      done: t.done,
    }));

    const changeLocalId = `CHG-${phase.phaseNum}`;
    subsystemNodes.push({
      id: changeLocalId,
      type: "change",
      name: phase.title,
      plan,
    });

    // Wire must_follow between consecutive phase changes
    if (i > 0) {
      const prevPhaseNum = phases[i - 1].phaseNum;
      subsystemRelationships.push({
        from: changeLocalId,
        to: `CHG-${prevPhaseNum}`,
        type: "must_follow",
      });
    }
  }

  // Create change nodes for user stories (with LOCAL IDs in subsystem)
  for (const [storyKey, tasks] of Object.entries(changesByStory)) {
    const changeLocalId = `CHG-${storyKey}`;
    const plan = tasks.map((t) => ({
      description: t.text,
      done: t.done,
    }));

    subsystemNodes.push({
      id: changeLocalId,
      type: "change",
      name: storyKey,
      plan,
    });

    // Link to the capability at the top level (using GLOBAL ID format)
    const changeGlobalId = `${idPrefix}-CHG-${storyKey}`;
    topLevelRelationships.push({
      from: changeGlobalId,
      to: `${idPrefix}-${storyKey}`,
      type: "implements",
    });
  }

  // Create implementation protocol with subsystem
  const protocolId = `${idPrefix}-PROT-IMPL`;
  topLevelNodes.push({
    id: protocolId,
    type: "protocol",
    name: "Implementation Protocol",
    subsystem: {
      nodes: subsystemNodes,
      relationships: subsystemRelationships,
    },
  });

  return { nodes: topLevelNodes, relationships: topLevelRelationships };
}

// ---------------------------------------------------------------------------
// checklist.md parser
// ---------------------------------------------------------------------------

export function parseChecklist(content: string, idPrefix: string): ParseResult {
  const sections = parseSections(content);
  const allSections = flattenSections(sections);
  const nodes: Node[] = [];
  const relationships: Relationship[] = [];

  // Find title and extract checklist type
  let title = "Checklist";
  const titleSection = sections.find((s) => s.level === 1);
  if (titleSection) {
    title = titleSection.heading;
  }

  // Extract metadata (Purpose, Created, etc.)
  const metadata = parseFrontMatterish(content);
  const purpose = metadata["Purpose"] || titleSection?.body || "";

  // Create gate node for the checklist
  const gateId = `${idPrefix}-CHK`;
  nodes.push({
    id: gateId,
    type: "gate",
    name: title,
    description: purpose,
    context: metadata["Created"],
  });

  // Parse all checkbox items and build lifecycle map
  const lifecycle: Record<string, boolean> = {};
  let categoryDescriptions: string[] = [];

  for (const section of allSections) {
    if (section.level === 2) {
      categoryDescriptions.push(`### ${section.heading}`);
    }

    const items = parseCheckboxes(section.body);
    for (const item of items) {
      lifecycle[item.id] = item.done;
      categoryDescriptions.push(
        `- [${item.done ? "x" : " "}] ${item.id} ${item.text}`,
      );
    }
  }

  // Add lifecycle and description to the gate node
  nodes[0].lifecycle = lifecycle;
  if (categoryDescriptions.length > 0) {
    nodes[0].description = categoryDescriptions;
  }

  return { nodes, relationships };
}

// ---------------------------------------------------------------------------
// Full feature directory parser
// ---------------------------------------------------------------------------

export function parseSpecKitFeature(
  featureDir: string,
  idPrefix: string,
  constitutionPath?: string,
): SysProMDocument {
  const nodes: Node[] = [];
  const relationships: Relationship[] = [];

  // Helper to read and parse a file if it exists
  const parseIfExists = (
    filePath: string | null | undefined,
    parser: (content: string, prefix: string) => ParseResult,
  ) => {
    if (filePath && existsSync(filePath)) {
      try {
        const content = readFileSync(filePath, "utf-8");
        const result = parser(content, idPrefix);
        nodes.push(...result.nodes);
        relationships.push(...result.relationships);
      } catch (error) {
        // Log error but continue
        console.warn(`Error parsing ${filePath}:`, error);
      }
    }
  };

  // Parse constitution if provided
  if (constitutionPath && existsSync(constitutionPath)) {
    try {
      const content = readFileSync(constitutionPath, "utf-8");
      const result = parseConstitution(content, idPrefix);
      nodes.push(...result.nodes);
      relationships.push(...result.relationships);
    } catch (error) {
      console.warn(`Error parsing constitution:`, error);
    }
  }

  // Parse spec.md
  const specPath = join(featureDir, "spec.md");
  parseIfExists(specPath, parseSpec);

  // Parse plan.md
  const planPath = join(featureDir, "plan.md");
  parseIfExists(planPath, parsePlan);

  // Parse tasks.md
  const tasksPath = join(featureDir, "tasks.md");
  parseIfExists(tasksPath, parseTasks);

  // Parse checklist.md
  const checklistPath = join(featureDir, "checklist.md");
  parseIfExists(checklistPath, parseChecklist);

  // Extract feature name from directory
  const featureName = basename(featureDir);

  // Build the SysProMDocument
  const doc: SysProMDocument = {
    metadata: {
      title: featureName,
      doc_type: "speckit",
    },
    nodes: nodes.length > 0 ? nodes : undefined,
    relationships: relationships.length > 0 ? relationships : undefined,
  };

  return doc;
}
