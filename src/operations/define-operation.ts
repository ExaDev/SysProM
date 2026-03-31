import * as z from "zod";

// ---------------------------------------------------------------------------
// Operation definition types
// ---------------------------------------------------------------------------

/**
 * Definition of a SysProM operation — a named, typed function with Zod schemas
 * for input validation and output description.
 * @template TInput - Zod schema type for the operation's input.
 * @template TOutput - Zod schema type for the operation's output.
 */
export interface OperationDef<
	TInput extends z.ZodType = z.ZodType,
	TOutput extends z.ZodType = z.ZodType,
> {
	/** Machine-readable operation name (e.g. `"addNode"`). */
	name: string;
	/** Human-readable description of what the operation does. */
	description: string;
	/** Zod schema used to validate the operation's input. */
	input: TInput;
	/** Zod schema describing the operation's output shape. */
	output: TOutput;
	/** The implementation function. */
	fn: (input: z.infer<TInput>) => z.infer<TOutput>;
}

/**
 * A callable operation with attached metadata. Can be invoked directly as a
 * function, and also exposes `.def`, `.inputSchema`, and `.outputSchema` for
 * introspection.
 * @template TInput - Zod schema type for the operation's input.
 * @template TOutput - Zod schema type for the operation's output.
 */
export type DefinedOperation<
	TInput extends z.ZodType = z.ZodType,
	TOutput extends z.ZodType = z.ZodType,
> = ((input: z.input<TInput>) => z.infer<TOutput>) & {
	/** The full operation definition including name, description, and schemas. */
	def: OperationDef<TInput, TOutput>;
	/** Zod schema for validating input before execution. */
	inputSchema: TInput;
	/** Zod schema describing the output shape. */
	outputSchema: TOutput;
};

// ---------------------------------------------------------------------------
// defineOperation — creates a callable operation with attached metadata
// ---------------------------------------------------------------------------

/**
 * Create a callable operation from a definition. The returned function validates
 * input against the Zod schema before delegating to the implementation.
 * @param def - The operation definition with name, schemas, and implementation.
 * @returns A callable function with `.def`, `.inputSchema`, and `.outputSchema` attached.
 * @throws {Error} If the input fails Zod validation.
 * @example
 * ```ts
 * const myOp = defineOperation({
 *   name: "greet",
 *   description: "Say hello",
 *   input: z.object({ name: z.string() }),
 *   output: z.string(),
 *   fn: ({ name }) => `Hello, ${name}!`,
 * });
 * myOp({ name: "world" }); // => "Hello, world!"
 * ```
 */
export function defineOperation<
	TInput extends z.ZodType,
	TOutput extends z.ZodType,
>(def: OperationDef<TInput, TOutput>): DefinedOperation<TInput, TOutput> {
	function execute(input: z.input<TInput>): z.infer<TOutput> {
		const parsed = def.input.safeParse(input);
		if (!parsed.success) {
			const messages = parsed.error.issues
				.map((i) => `${i.path.join(".")}: ${i.message}`)
				.join("; ");
			throw new Error(`${def.name}: invalid input — ${messages}`);
		}
		return def.fn(parsed.data);
	}

	const result = Object.assign(execute, {
		def,
		inputSchema: def.input,
		outputSchema: def.output,
	});

	return result satisfies DefinedOperation<TInput, TOutput>;
}
