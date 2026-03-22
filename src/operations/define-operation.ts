import * as z from "zod";

// ---------------------------------------------------------------------------
// Operation definition types
// ---------------------------------------------------------------------------

export interface OperationDef<
  TInput extends z.ZodType = z.ZodType,
  TOutput extends z.ZodType = z.ZodType,
> {
  name: string;
  description: string;
  input: TInput;
  output: TOutput;
  fn: (input: z.infer<TInput>) => z.infer<TOutput>;
}

export type DefinedOperation<
  TInput extends z.ZodType = z.ZodType,
  TOutput extends z.ZodType = z.ZodType,
> = ((input: z.infer<TInput>) => z.infer<TOutput>) & {
  def: OperationDef<TInput, TOutput>;
  inputSchema: TInput;
  outputSchema: TOutput;
};

// ---------------------------------------------------------------------------
// defineOperation — creates a callable operation with attached metadata
// ---------------------------------------------------------------------------

export function defineOperation<
  TInput extends z.ZodType,
  TOutput extends z.ZodType,
>(def: OperationDef<TInput, TOutput>): DefinedOperation<TInput, TOutput> {
  function execute(input: z.infer<TInput>): z.infer<TOutput> {
    const parsed = def.input.safeParse(input);
    if (!parsed.success) {
      const messages = parsed.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ");
      throw new Error(`${def.name}: invalid input — ${messages}`);
    }
    return def.fn(parsed.data);
  }

  return Object.assign(execute, {
    def,
    inputSchema: def.input,
    outputSchema: def.output,
  }) as DefinedOperation<TInput, TOutput>;
}
