import { relationshipType, type RelationshipType } from "../schema.js";
import {
  updateNode,
  addRelationship,
  removeRelationship,
  updateMetadata,
} from "../mutate.js";
import { loadDocument, saveDocument } from "../io.js";
import { jsonToMarkdownMultiDoc } from "../json-to-md.js";

function parseFlag(args: string[], flag: string): string | undefined {
  const idx = args.indexOf(flag);
  if (idx >= 0 && idx + 1 < args.length) return args[idx + 1];
  return undefined;
}

function parseFlagAll(args: string[], flag: string): string[] {
  const results: string[] = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === flag && i + 1 < args.length) {
      results.push(args[i + 1]);
    }
  }
  return results;
}

export function run(args: string[]): void {
  if (args.length < 2) {
    console.error("Usage: sysprom update <input> <node-id> [field-flags]");
    console.error("       sysprom update <input> --add-rel <from> <type> <to>");
    console.error("       sysprom update <input> --remove-rel <from> <type> <to>");
    console.error("       sysprom update <input> --meta <key>=<value>");
    console.error("");
    console.error("Node field flags:");
    console.error("  --description <text>      Update description");
    console.error("  --status <status>         Update status");
    console.error("  --context <text>          Update context");
    console.error("  --rationale <text>        Update rationale");
    console.error("  --lifecycle <key>=<val>   Set lifecycle state (e.g. implemented=true)");
    process.exit(1);
  }

  const { doc, format, path } = loadDocument(args[0]);
  const dryRun = args.includes("--dry-run");
  const asJson = args.includes("--json");

  // Relationship operations
  const addRelIdx = args.indexOf("--add-rel");
  if (addRelIdx >= 0) {
    const from = args[addRelIdx + 1];
    const typeStr = args[addRelIdx + 2];
    const to = args[addRelIdx + 3];
    if (!from || !typeStr || !to) {
      console.error("Usage: --add-rel <from> <type> <to>");
      process.exit(1);
    }
    if (!relationshipType.is(typeStr)) {
      console.error(`Unknown relationship type: ${typeStr}`);
      process.exit(1);
    }
    // typeStr is now validated but TypeScript doesn't narrow it, so parse it
    const type = relationshipType.parse(typeStr);
    try {
      const newDoc = addRelationship(doc, { from, to, type });

      if (!dryRun) {
        saveDocument(newDoc, format, path);

        const syncIdx = args.indexOf("--sync");
        const syncDir = syncIdx >= 0 && args[syncIdx + 1] ? args[syncIdx + 1] : undefined;
        if (syncDir) {
          jsonToMarkdownMultiDoc(newDoc, syncDir);
          console.log(`Synced to ${syncDir}`);
        }
      }

      if (asJson) {
        const rel = newDoc.relationships?.find((r) => r.from === from && r.type === type && r.to === to);
        console.log(JSON.stringify(rel, null, 2));
      } else {
        console.log(`${dryRun ? "[dry-run] Would add" : "Added"} relationship: ${from} ${typeStr} ${to}`);
      }
    } catch (err: unknown) {
      console.error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
    return;
  }

  const removeRelIdx = args.indexOf("--remove-rel");
  if (removeRelIdx >= 0) {
    const from = args[removeRelIdx + 1];
    const typeStr = args[removeRelIdx + 2];
    const to = args[removeRelIdx + 3];
    if (!from || !typeStr || !to) {
      console.error("Usage: --remove-rel <from> <type> <to>");
      process.exit(1);
    }
    if (!relationshipType.is(typeStr)) {
      console.error(`Unknown relationship type: ${typeStr}`);
      process.exit(1);
    }
    // typeStr is now validated but TypeScript doesn't narrow it, so parse it
    const type = relationshipType.parse(typeStr);
    try {
      const newDoc = removeRelationship(doc, from, type, to);

      if (!dryRun) {
        saveDocument(newDoc, format, path);

        const syncIdx = args.indexOf("--sync");
        const syncDir = syncIdx >= 0 && args[syncIdx + 1] ? args[syncIdx + 1] : undefined;
        if (syncDir) {
          jsonToMarkdownMultiDoc(newDoc, syncDir);
          console.log(`Synced to ${syncDir}`);
        }
      }

      if (asJson) {
        console.log(JSON.stringify({ from, type: typeStr, to }, null, 2));
      } else {
        console.log(`${dryRun ? "[dry-run] Would remove" : "Removed"} relationship: ${from} ${typeStr} ${to}`);
      }
    } catch (err: unknown) {
      console.error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
    return;
  }

  // Metadata operations
  const metaValues = parseFlagAll(args, "--meta");
  if (metaValues.length > 0) {
    const fields: Record<string, unknown> = {};
    for (const kv of metaValues) {
      const eqIdx = kv.indexOf("=");
      if (eqIdx < 0) {
        console.error(`Invalid --meta format: ${kv} (expected key=value)`);
        process.exit(1);
      }
      const key = kv.slice(0, eqIdx);
      const val = kv.slice(eqIdx + 1);
      const numVal = Number(val);
      fields[key] = Number.isFinite(numVal) && val === String(numVal) ? numVal : val;
    }
    const newDoc = updateMetadata(doc, fields);

    if (!dryRun) {
      saveDocument(newDoc, format, path);

      const syncIdx = args.indexOf("--sync");
      const syncDir = syncIdx >= 0 && args[syncIdx + 1] ? args[syncIdx + 1] : undefined;
      if (syncDir) {
        jsonToMarkdownMultiDoc(newDoc, syncDir);
        console.log(`Synced to ${syncDir}`);
      }
    }

    if (asJson) {
      console.log(JSON.stringify(fields, null, 2));
    } else {
      console.log(`${dryRun ? "[dry-run] Would update" : "Updated"} metadata: ${metaValues.join(", ")}`);
    }
    return;
  }

  // Node field updates
  const nodeId = args[1];
  const node = doc.nodes.find((n) => n.id === nodeId);
  if (!node) {
    console.error(`Node not found: ${nodeId}`);
    process.exit(1);
  }

  const fieldArgs = args.slice(2);
  const fields: Record<string, unknown> = {};

  const description = parseFlag(fieldArgs, "--description");
  if (description) fields.description = description;

  const status = parseFlag(fieldArgs, "--status");
  if (status) {
    fields.status = status;
  }

  const context = parseFlag(fieldArgs, "--context");
  if (context) fields.context = context;

  const rationale = parseFlag(fieldArgs, "--rationale");
  if (rationale) fields.rationale = rationale;

  const lifecycleValues = parseFlagAll(fieldArgs, "--lifecycle");
  if (lifecycleValues.length > 0) {
    const lifecycle = { ...node.lifecycle };
    for (const kv of lifecycleValues) {
      const eqIdx = kv.indexOf("=");
      if (eqIdx < 0) {
        console.error(`Invalid --lifecycle format: ${kv} (expected key=value)`);
        process.exit(1);
      }
      const key = kv.slice(0, eqIdx);
      const rawVal = kv.slice(eqIdx + 1);
      let val: boolean | string;
      if (rawVal === "true") {
        val = true;
      } else if (rawVal === "false") {
        val = false;
      } else if (/^\d{4}-\d{2}-\d{2}/.test(rawVal)) {
        val = rawVal; // ISO date string
      } else {
        val = rawVal === "true"; // fallback to boolean
      }
      lifecycle[key] = val;
    }
    fields.lifecycle = lifecycle;
  }

  if (Object.keys(fields).length === 0) {
    console.error("No fields specified to update.");
    console.error("Use --description, --status, --context, --rationale, or --lifecycle.");
    process.exit(1);
  }

  const newDoc = updateNode(doc, nodeId, fields);

  if (!dryRun) {
    saveDocument(newDoc, format, path);

    const syncIdx = args.indexOf("--sync");
    const syncDir = syncIdx >= 0 && args[syncIdx + 1] ? args[syncIdx + 1] : undefined;
    if (syncDir) {
      jsonToMarkdownMultiDoc(newDoc, syncDir);
      console.log(`Synced to ${syncDir}`);
    }
  }

  if (asJson) {
    console.log(JSON.stringify(fields, null, 2));
  } else {
    console.log(`${dryRun ? "[dry-run] Would update" : "Updated"} ${node.type} ${nodeId} — ${node.name}`);
  }
}
