/** Normalise a text field (string | string[]) to a single string, joining with newlines. */
export function textToString(value: string | string[]): string {
  return Array.isArray(value) ? value.join("\n") : value;
}

/** Normalise a text field to an array of lines. */
export function textToLines(value: string | string[]): string[] {
  return Array.isArray(value) ? value : [value];
}

/** Format a text field for Markdown output — each line becomes a paragraph. */
export function textToMarkdown(value: string | string[]): string {
  return textToLines(value).join("\n");
}

/**
 * Parse a Markdown text block back into the canonical text representation.
 * Single-line content stays as a string; multiline becomes an array.
 */
export function markdownToText(block: string): string | string[] {
  const lines = block.split("\n");
  return lines.length === 1 ? lines[0] : lines;
}
