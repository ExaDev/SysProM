import { readFileSync, writeFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { sysproMDocument, type SysProMDocument } from "./schema.js";
import { markdownSingleToJson, markdownMultiDocToJson } from "./md-to-json.js";
import { jsonToMarkdownSingle, jsonToMarkdownMultiDoc } from "./json-to-md.js";
import { canonicalise } from "./canonical-json.js";

export type Format = "json" | "single-md" | "multi-md";

export interface LoadedDocument {
  doc: SysProMDocument;
  format: Format;
  path: string;
}

function detectFormat(input: string): Format {
  const stat = statSync(input);
  if (stat.isDirectory()) return "multi-md";
  if (input.endsWith(".json")) return "json";
  return "single-md";
}

/**
 * Load a SysProM document from a file (JSON or Markdown).
 */
export function loadDocument(input: string): LoadedDocument {
  const path = resolve(input);
  const format = detectFormat(path);

  let doc: SysProMDocument;
  switch (format) {
    case "json": {
      const raw = JSON.parse(readFileSync(path, "utf8")) as unknown;
      const result = sysproMDocument.safeParse(raw);
      if (!result.success) {
        throw new Error(
          `Invalid SysProM document:\n${result.error.issues.map((i) => `  ${i.path.join(".")}: ${i.message}`).join("\n")}`,
        );
      }
      doc = result.data;
      break;
    }
    case "single-md": {
      const content = readFileSync(path, "utf8");
      doc = markdownSingleToJson(content);
      break;
    }
    case "multi-md": {
      doc = markdownMultiDocToJson(path);
      break;
    }
  }

  return { doc, format, path };
}

/**
 * Save a SysProM document to a file (JSON or Markdown).
 */
export function saveDocument(
  doc: SysProMDocument,
  format: Format,
  path: string,
): void {
  switch (format) {
    case "json":
      writeFileSync(path, canonicalise(doc, { indent: "\t" }) + "\n");
      break;
    case "single-md":
      writeFileSync(path, jsonToMarkdownSingle(doc));
      break;
    case "multi-md":
      jsonToMarkdownMultiDoc(doc, path);
      break;
  }
}
