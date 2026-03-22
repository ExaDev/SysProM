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

type ZodField = z.ZodType & {
	unwrap?: () => ZodField;
	removeDefault?: () => ZodField;
	safeParse?: (val: unknown) => { success: boolean };
	options?: readonly string[];
	element?: ZodField;
	description?: string;
};

function unwrapField(field: ZodField): ZodField {
	if (typeof field.removeDefault === "function")
		return unwrapField(field.removeDefault());
	if (fieldIsOptional(field) && typeof field.unwrap === "function")
		return unwrapField(field.unwrap());
	return field;
}

function fieldIsOptional(field: ZodField): boolean {
	return (
		typeof field.safeParse === "function" && field.safeParse(undefined).success
	);
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
	if ("element" in inner && inner.element) {
		const el = inner.element;
		if ("options" in el && Array.isArray(el.options)) {
			return el.options.map(String);
		}
	}
	return undefined;
}

function isZodField(obj: unknown): obj is ZodField {
	if (typeof obj !== "object" || obj === null) return false;
	// Check if it has methods/properties characteristic of Zod fields
	const maybeField = toRecord(obj);
	return (
		maybeField !== undefined &&
		(typeof maybeField.safeParse === "function" ||
			"description" in maybeField ||
			"options" in maybeField ||
			"element" in maybeField)
	);
}

function isRecord(obj: unknown): obj is Record<string, unknown> {
	return typeof obj === "object" && obj !== null;
}

function toRecord(obj: unknown): Record<string, unknown> | undefined {
	if (isRecord(obj)) {
		return obj;
	}
	return undefined;
}

function fieldDescription(field: ZodField): string {
	return field.description ?? "";
}

function camelToKebab(name: string): string {
	return name.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
}

function isZodLikeSchema(
	obj: unknown,
): obj is { shape: Record<string, unknown> } {
	if (typeof obj !== "object" || obj === null) return false;
	const maybeShape = toRecord(obj)?.shape;
	return typeof maybeShape === "object" && maybeShape !== null;
}

function getShape(schema: unknown): Record<string, unknown> | undefined {
	if (isZodLikeSchema(schema)) {
		return schema.shape;
	}
	return undefined;
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

	{
		const argsShape = getShape(def.args);
		if (argsShape) {
			for (const key of Object.keys(argsShape)) {
				const field = argsShape[key];
				if (!field || !isZodField(field)) continue;
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
	}

	{
		const optsShape = getShape(def.opts);
		if (optsShape) {
			for (const key of Object.keys(optsShape)) {
				const field = optsShape[key];
				if (!field || !isZodField(field)) continue;
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
					const opt = new Option(`--${flagName} <value>`, desc).choices(
						choices,
					);
					if (!optional) opt.makeOptionMandatory();
					cmd.addOption(opt);
				} else if (optional) {
					cmd.option(`--${flagName} <value>`, desc);
				} else {
					cmd.requiredOption(`--${flagName} <value>`, desc);
				}
			}
		}
	}

	if (def.action) {
		const action = def.action;
		const argsSchema = def.args;
		const optsSchema = def.opts;

		cmd.action((...commanderArgs: unknown[]) => {
			let argsKeys: string[] = [];
			const argsShape = getShape(argsSchema);
			if (argsShape) {
				argsKeys = Object.keys(argsShape);
			}
			const argsObj: Record<string, unknown> = {};
			for (let i = 0; i < argsKeys.length; i++) {
				argsObj[argsKeys[i]] = commanderArgs[i];
			}
			const optsObjValue = commanderArgs[argsKeys.length];
			const optsObj: Record<string, unknown> = toRecord(optsObjValue) ?? {};

			const parsedArgs = argsSchema
				? argsSchema.safeParse(argsObj)
				: { data: {} };
			const parsedOpts = optsSchema
				? optsSchema.safeParse(optsObj)
				: { data: {} };

			if ("success" in parsedArgs && !parsedArgs.success) {
				for (const issue of parsedArgs.error.issues) {
					console.error(`${issue.path.join(".")}: ${issue.message}`);
				}
				process.exit(1);
			}
			if ("success" in parsedOpts && !parsedOpts.success) {
				for (const issue of parsedOpts.error.issues) {
					console.error(`${issue.path.join(".")}: ${issue.message}`);
				}
				process.exit(1);
			}

			try {
				const argsData = "data" in parsedArgs ? parsedArgs.data : {};
				const optsData = "data" in parsedOpts ? parsedOpts.data : {};
				action(argsData, optsData);
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
	{
		const argsShape = getShape(def.args);
		if (argsShape) {
			for (const key of Object.keys(argsShape)) {
				const field = argsShape[key];
				if (!field || !isZodField(field)) continue;
				args.push({
					name: camelToKebab(key),
					description: fieldDescription(field),
					required: !fieldIsOptional(field),
					choices: fieldChoices(field),
				});
			}
		}
	}

	const opts: OptDoc[] = [];
	{
		const optsShape = getShape(def.opts);
		if (optsShape) {
			for (const key of Object.keys(optsShape)) {
				const field = optsShape[key];
				if (!field || !isZodField(field)) continue;
				opts.push({
					flag: `--${camelToKebab(key)}`,
					description: fieldDescription(field),
					required: !fieldIsOptional(field),
					repeatable: fieldIsArray(field),
					choices: fieldChoices(field),
				});
			}
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
