import * as z from "zod";
import { Argument, Command, Option } from "commander";

// ---------------------------------------------------------------------------
// Command definition types
// ---------------------------------------------------------------------------

export interface CommandDef<
  TArgs extends z.ZodObject<z.ZodRawShape> = z.ZodObject<z.ZodRawShape>,
  TOpts extends z.ZodObject<z.ZodRawShape> = z.ZodObject<z.ZodRawShape>,
> {
  name: string;
  description: string;
  args?: TArgs;
  opts?: TOpts;
  subcommands?: CommandDef[];
  action?: (args: z.infer<TArgs>, opts: z.infer<TOpts>) => void;
  apiLink?: string;
}

// ---------------------------------------------------------------------------
// Zod schema introspection (duck-typed for Zod 4 compatibility)
// ---------------------------------------------------------------------------

type ZodField = z.ZodTypeAny & {
  unwrap?: () => ZodField;
  removeDefault?: () => ZodField;
  isOptional?: () => boolean;
  options?: readonly string[];
  element?: ZodField;
  description?: string;
};

function unwrapField(field: ZodField): ZodField {
  if (typeof field.removeDefault === "function") return unwrapField(field.removeDefault());
  if (fieldIsOptional(field) && typeof field.unwrap === "function") return unwrapField(field.unwrap());
  return field;
}

function fieldIsOptional(field: ZodField): boolean {
  return typeof field.isOptional === "function" && field.isOptional();
}

function fieldIsArray(field: ZodField): boolean {
  const inner = unwrapField(field);
  return "element" in inner;
}

function fieldIsBoolean(field: ZodField): boolean {
  const inner = unwrapField(field);
  // ZodBoolean has no unique property, but we can check safeParse
  const trueResult = inner.safeParse(true);
  const strResult = inner.safeParse("test");
  return trueResult.success && !strResult.success;
}

function fieldChoices(field: ZodField): string[] | undefined {
  const inner = unwrapField(field);
  if ("options" in inner && Array.isArray(inner.options)) {
    return inner.options.map(String);
  }
  if ("element" in inner) {
    const el = (inner as { element: ZodField }).element;
    if ("options" in el && Array.isArray(el.options)) {
      return el.options.map(String);
    }
  }
  return undefined;
}

function fieldDescription(field: ZodField): string {
  return field.description ?? "";
}

function camelToKebab(name: string): string {
  return name.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
}

// ---------------------------------------------------------------------------
// Build Commander from CommandDef
// ---------------------------------------------------------------------------

function collect(value: string, previous: string[]): string[] {
  return [...previous, value];
}

export function buildCommander(def: CommandDef, parent: Command): Command {
  const cmd = parent.command(def.name);
  cmd.description(def.description);

  if (def.args) {
    const shape = def.args.shape;
    for (const key of Object.keys(shape)) {
      const field = shape[key] as ZodField;
      const desc = fieldDescription(field);
      const choices = fieldChoices(field);
      const flagName = camelToKebab(key);

      if (choices) {
        cmd.addArgument(new Argument(`<${flagName}>`, desc).choices(choices));
      } else {
        cmd.argument(`<${flagName}>`, desc);
      }
    }
  }

  if (def.opts) {
    const shape = def.opts.shape;
    for (const key of Object.keys(shape)) {
      const field = shape[key] as ZodField;
      const desc = fieldDescription(field);
      const choices = fieldChoices(field);
      const flagName = camelToKebab(key);
      const optional = fieldIsOptional(field);
      const isArr = fieldIsArray(field);
      const isBool = fieldIsBoolean(field);

      if (isBool) {
        cmd.option(`--${flagName}`, desc);
      } else if (isArr) {
        if (optional) {
          cmd.option(`--${flagName} <value>`, desc, collect, []);
        } else {
          cmd.requiredOption(`--${flagName} <value>`, desc, collect, []);
        }
      } else if (choices) {
        const opt = new Option(`--${flagName} <value>`, desc).choices(choices);
        if (!optional) opt.makeOptionMandatory();
        cmd.addOption(opt);
      } else if (optional) {
        cmd.option(`--${flagName} <value>`, desc);
      } else {
        cmd.requiredOption(`--${flagName} <value>`, desc);
      }
    }
  }

  if (def.action) {
    const action = def.action;
    const argsSchema = def.args;
    const optsSchema = def.opts;

    cmd.action((...commanderArgs: unknown[]) => {
      const argsKeys = argsSchema ? Object.keys(argsSchema.shape) : [];
      const argsObj: Record<string, unknown> = {};
      for (let i = 0; i < argsKeys.length; i++) {
        argsObj[argsKeys[i]] = commanderArgs[i];
      }
      const optsObj = (commanderArgs[argsKeys.length] ?? {}) as Record<string, unknown>;

      const parsedArgs = argsSchema ? argsSchema.safeParse(argsObj) : undefined;
      const parsedOpts = optsSchema ? optsSchema.safeParse(optsObj) : undefined;

      if (parsedArgs && !parsedArgs.success) {
        for (const issue of parsedArgs.error.issues) {
          console.error(`${issue.path.join(".")}: ${issue.message}`);
        }
        process.exit(1);
      }
      if (parsedOpts && !parsedOpts.success) {
        for (const issue of parsedOpts.error.issues) {
          console.error(`${issue.path.join(".")}: ${issue.message}`);
        }
        process.exit(1);
      }

      try {
        action(
          parsedArgs?.data ?? ({} as never),
          parsedOpts?.data ?? ({} as never),
        );
      } catch (err: unknown) {
        console.error(err instanceof Error ? err.message : String(err));
        process.exit(1);
      }
    });
  }

  if (def.subcommands) {
    for (const sub of def.subcommands) {
      buildCommander(sub, cmd);
    }
  }

  return cmd;
}

// ---------------------------------------------------------------------------
// Documentation extraction
// ---------------------------------------------------------------------------

export interface ArgDoc {
  name: string;
  description: string;
  required: boolean;
  choices?: string[];
}

export interface OptDoc {
  flag: string;
  description: string;
  required: boolean;
  repeatable: boolean;
  choices?: string[];
}

export interface CommandDoc {
  name: string;
  description: string;
  args: ArgDoc[];
  opts: OptDoc[];
  subcommands?: CommandDoc[];
  apiLink?: string;
}

export function extractDocs(def: CommandDef): CommandDoc {
  const args: ArgDoc[] = [];
  if (def.args) {
    const shape = def.args.shape;
    for (const key of Object.keys(shape)) {
      const field = shape[key] as ZodField;
      args.push({
        name: camelToKebab(key),
        description: fieldDescription(field),
        required: !fieldIsOptional(field),
        choices: fieldChoices(field),
      });
    }
  }

  const opts: OptDoc[] = [];
  if (def.opts) {
    const shape = def.opts.shape;
    for (const key of Object.keys(shape)) {
      const field = shape[key] as ZodField;
      opts.push({
        flag: `--${camelToKebab(key)}`,
        description: fieldDescription(field),
        required: !fieldIsOptional(field),
        repeatable: fieldIsArray(field),
        choices: fieldChoices(field),
      });
    }
  }

  return {
    name: def.name,
    description: def.description,
    args,
    opts,
    subcommands: def.subcommands?.map(extractDocs),
    apiLink: def.apiLink,
  };
}
