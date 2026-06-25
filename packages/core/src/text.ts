/**
 * Normalise a text field (string | string[]) to a single string, joining with newlines.
 * @param value - The text field to normalise.
 * @returns A single string.
 * @example
 * ```ts
 * textToString(["line 1", "line 2"]) // => "line 1\nline 2"
 * textToString("hello") // => "hello"
 * ```
 */
export function textToString(value: string | string[]): string {
	return Array.isArray(value) ? value.join("\n") : value;
}

/**
 * Normalise a text field to an array of lines.
 * @param value - The text field to normalise.
 * @returns An array of lines.
 * @example
 * ```ts
 * textToLines("hello") // => ["hello"]
 * textToLines(["a", "b"]) // => ["a", "b"]
 * ```
 */
export function textToLines(value: string | string[]): string[] {
	return Array.isArray(value) ? value : [value];
}

/**
 * Format a text field for Markdown output — each line becomes a paragraph.
 * @param value - The text field to format.
 * @returns Markdown-formatted string.
 * @example
 * ```ts
 * textToMarkdown(["para 1", "para 2"]) // => "para 1\npara 2"
 * ```
 */
export function textToMarkdown(value: string | string[]): string {
	return textToLines(value).join("\n");
}

/**
 * Parse a Markdown text block back into the canonical text representation.
 * Single-line content stays as a string; multiline becomes an array.
 * @param block - The Markdown text block to parse.
 * @returns A string for single-line content, or an array of lines for multiline.
 * @example
 * ```ts
 * markdownToText("single line") // => "single line"
 * markdownToText("line 1\nline 2") // => ["line 1", "line 2"]
 * ```
 */
export function markdownToText(block: string): string | string[] {
	const lines = block.split("\n");
	return lines.length === 1 ? lines[0] : lines;
}
