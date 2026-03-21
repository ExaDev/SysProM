import type { SysProMDocument, Node } from "./schema.js";

/**
 * A point-in-time event representing a state change in a node's lifecycle.
 */
export interface TimelineEvent {
  nodeId: string;
  nodeName: string;
  nodeType: string;
  state: string;
  timestamp: string; // ISO 8601 date string
}

/**
 * The active states of a node at a specific point in time.
 */
export interface NodeState {
  nodeId: string;
  nodeName: string;
  activeStates: string[];
}

/**
 * Extract all timestamped lifecycle events from a document and its subsystems,
 * sorted chronologically.
 *
 * Walks all nodes and collects entries from each node's lifecycle where the
 * value is a string (ISO date). Boolean values are skipped as they have no
 * timestamp. Subsystem nodes are processed recursively.
 *
 * Results are sorted by timestamp, earliest first.
 *
 * @param doc - The SysProM document to extract events from.
 * @returns Timeline events sorted by timestamp, earliest first.
 */
export function timeline(doc: SysProMDocument): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  function processNode(node: Node): void {
    if (node.lifecycle) {
      for (const [state, value] of Object.entries(node.lifecycle)) {
        // Only include entries where the value is a string (ISO date)
        if (typeof value === "string") {
          events.push({
            nodeId: node.id,
            nodeName: node.name,
            nodeType: node.type,
            state,
            timestamp: value,
          });
        }
      }
    }

    // Recursively process subsystem
    if (node.subsystem) {
      timeline(node.subsystem).forEach((event) => {
        events.push(event);
      });
    }
  }

  // Process all nodes at this level
  if (doc.nodes) {
    for (const node of doc.nodes) {
      processNode(node);
    }
  }

  // Sort chronologically by timestamp (ISO 8601 string comparison works)
  events.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  return events;
}

/**
 * Extract the lifecycle history of a specific node, sorted chronologically.
 *
 * Searches for the node by ID (recursively in subsystems) and returns all
 * timestamped lifecycle entries. Returns an empty array if the node is not
 * found or has no lifecycle entries with timestamps.
 *
 * @param doc - The SysProM document to search.
 * @param nodeId - The ID of the node to retrieve history for.
 * @returns Timestamped lifecycle events for the node, or an empty array if not found.
 */
export function nodeHistory(
  doc: SysProMDocument,
  nodeId: string
): TimelineEvent[] {
  function findNode(
    searchDoc: SysProMDocument,
    id: string
  ): Node | undefined {
    if (searchDoc.nodes) {
      for (const node of searchDoc.nodes) {
        if (node.id === id) {
          return node;
        }
        // Recursively search subsystems
        if (node.subsystem) {
          const found = findNode(node.subsystem, id);
          if (found) {
            return found;
          }
        }
      }
    }
    return undefined;
  }

  const node = findNode(doc, nodeId);
  if (!node) {
    return [];
  }

  const events: TimelineEvent[] = [];

  if (node.lifecycle) {
    for (const [state, value] of Object.entries(node.lifecycle)) {
      // Only include entries where the value is a string (ISO date)
      if (typeof value === "string") {
        events.push({
          nodeId: node.id,
          nodeName: node.name,
          nodeType: node.type,
          state,
          timestamp: value,
        });
      }
    }
  }

  // Sort chronologically by timestamp
  events.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  return events;
}

/**
 * Determine the active states of all nodes at a specific point in time.
 *
 * For each node with a lifecycle, collects all states where:
 * - The value is a string (ISO date) AND the date is <= the query timestamp, or
 * - The value is boolean true (active but undated)
 *
 * Returns an array of nodes with at least one active state, sorted by nodeId.
 * Uses simple string comparison for ISO 8601 date ordering (this works correctly
 * for well-formed ISO dates).
 *
 * @param doc - The SysProM document to query.
 * @param timestamp - An ISO 8601 date string to query against.
 * @returns Nodes with active states at the given timestamp, sorted by nodeId.
 */
export function stateAt(
  doc: SysProMDocument,
  timestamp: string
): NodeState[] {
  const nodeStates = new Map<string, NodeState>();

  function processNode(node: Node): void {
    if (node.lifecycle) {
      const activeStates: string[] = [];

      for (const [state, value] of Object.entries(node.lifecycle)) {
        if (typeof value === "boolean") {
          // Include boolean true entries (active but undated)
          if (value === true) {
            activeStates.push(state);
          }
        } else if (typeof value === "string") {
          // Include string (ISO date) entries where date <= query timestamp
          if (value.localeCompare(timestamp) <= 0) {
            activeStates.push(state);
          }
        }
      }

      // Only include nodes with at least one active state
      if (activeStates.length > 0) {
        nodeStates.set(node.id, {
          nodeId: node.id,
          nodeName: node.name,
          activeStates: activeStates.sort(),
        });
      }
    }

    // Recursively process subsystem
    if (node.subsystem) {
      stateAt(node.subsystem, timestamp).forEach((state) => {
        nodeStates.set(state.nodeId, state);
      });
    }
  }

  // Process all nodes at this level
  if (doc.nodes) {
    for (const node of doc.nodes) {
      processNode(node);
    }
  }

  // Sort by nodeId and return as array
  return Array.from(nodeStates.values()).sort((a, b) =>
    a.nodeId.localeCompare(b.nodeId)
  );
}
