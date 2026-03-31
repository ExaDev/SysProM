import { z } from "zod";

/**
 * Attach a type guard directly to a Zod schema.
 *
 * This keeps the runtime validator, the inferred TypeScript type,
 * and the runtime type guard derived from the same source.
 * @param schema - Zod schema to extend
 * @returns The original schema augmented with an `is` guard
 * @example
 * const MySchema = defineSchema(z.string());
 * if (MySchema.is(value)) { // value is string
 * }
 */
export function defineSchema<T extends z.ZodType>(
	schema: T,
): T & {
	is(value: unknown): value is z.infer<T>;
} {
	// Object.assign has a helpful return type (T & U) so no manual assertion is needed.
	return Object.assign(schema, {
		is(value: unknown): value is z.infer<T> {
			return schema.safeParse(value).success;
		},
	});
}

export default defineSchema;
