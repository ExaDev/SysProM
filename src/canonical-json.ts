/**
 * @module canonical-json
 *
 * JSON serialisation with RFC 8785 key ordering and value semantics,
 * optionally pretty-printed with configurable indentation.
 *
 * - Object keys sorted by Unicode code point order
 * - Numbers formatted per ECMAScript toString()
 * - Strings escaped per JSON spec
 * - null, true, false as literals
 * - undefined values omitted from objects
 */

export interface FormatOptions {
	indent?: string;
}

/**
 * Serialise a value to canonical JSON with RFC 8785 key ordering.
 *
 * @param value - The value to serialise.
 * @param options - Formatting options (e.g. indentation).
 * @returns The canonical JSON string.
 */
export function canonicalise(
	value: unknown,
	options: FormatOptions = {},
): string {
	const indent = options.indent ?? "";
	return serialise(value, indent, 0);
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function serialise(value: unknown, indent: string, depth: number): string {
	if (value === null) return "null";
	if (value === true) return "true";
	if (value === false) return "false";

	if (typeof value === "number") {
		if (!Number.isFinite(value)) {
			throw new Error("Non-finite numbers are not serialisable");
		}
		return Object.is(value, -0) ? "0" : String(value);
	}

	if (typeof value === "string") {
		return serialiseString(value);
	}

	if (Array.isArray(value)) {
		return serialiseArray(value, indent, depth);
	}

	if (isRecord(value)) {
		return serialiseObject(value, indent, depth);
	}

	throw new Error(`Unserialisable type: ${typeof value}`);
}

function serialiseArray(
	value: unknown[],
	indent: string,
	depth: number,
): string {
	if (value.length === 0) return "[]";

	if (!indent) {
		return "[" + value.map((v) => serialise(v, indent, depth)).join(",") + "]";
	}

	const inner = depth + 1;
	const pad = indent.repeat(inner);
	const items = value.map((v) => pad + serialise(v, indent, inner));
	return "[\n" + items.join(",\n") + "\n" + indent.repeat(depth) + "]";
}

function serialiseObject(
	value: Record<string, unknown>,
	indent: string,
	depth: number,
): string {
	const keys = Object.keys(value)
		.filter((k) => value[k] !== undefined)
		.sort(compareCodePoints);

	if (keys.length === 0) return "{}";

	if (!indent) {
		const entries = keys.map(
			(k) => serialiseString(k) + ":" + serialise(value[k], indent, depth),
		);
		return "{" + entries.join(",") + "}";
	}

	const inner = depth + 1;
	const pad = indent.repeat(inner);
	const entries = keys.map(
		(k) => pad + serialiseString(k) + ": " + serialise(value[k], indent, inner),
	);
	return "{\n" + entries.join(",\n") + "\n" + indent.repeat(depth) + "}";
}

function compareCodePoints(a: string, b: string): number {
	if (a < b) return -1;
	if (a > b) return 1;
	return 0;
}

function serialiseString(value: string): string {
	let result = '"';
	for (let i = 0; i < value.length; i++) {
		const code = value.charCodeAt(i);
		switch (code) {
			case 0x08:
				result += "\\b";
				break;
			case 0x09:
				result += "\\t";
				break;
			case 0x0a:
				result += "\\n";
				break;
			case 0x0c:
				result += "\\f";
				break;
			case 0x0d:
				result += "\\r";
				break;
			case 0x22:
				result += '\\"';
				break;
			case 0x5c:
				result += "\\\\";
				break;
			default:
				if (code < 0x20) {
					result += "\\u" + code.toString(16).padStart(4, "0");
				} else {
					result += value[i];
				}
		}
	}
	return result + '"';
}
