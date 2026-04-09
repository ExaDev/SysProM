/// <reference types="node" />
import * as z from "zod";
import { Argument, Command, Option } from "commander";

// ---------------------------------------------------------------------------
// Command definition types
// ---------------------------------------------------------------------------

/** Definition of a CLI command — name, description, Zod schemas for args/opts, optional subcommands, and action handler. */
export interface CommandDef<
	TArgs extends z.ZodObject = z.ZodObject,
	TOpts extends z.ZodObject = z.ZodObject,
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

function isRecord(obj: unknown): obj is Record<string, unknown> {
	return typeof obj === "object" && obj !== null;
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

function toRecord(obj: unknown): Record<string, unknown> | undefined {
	if (isRecord(obj)) {
		return obj;
	}
	return undefined;
}

function getShape(schema: unknown): Record<string, unknown> | undefined {
	if (isZodLikeSchema(schema)) {
		return schema.shape;
	}
	return undefined;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function collect(value: string, previous: string[]): string[] {
	return [...previous, value];
}

// ---------------------------------------------------------------------------
// Action handler
// ---------------------------------------------------------------------------

function actionFailure(message: string): never {
	console.error(message);
	process.exit(1);
}

function buildArgsObj(
	argsSchema: z.ZodObject | undefined,
	commanderArgs: unknown[],
): Record<string, unknown> {
	const argsKeys = argsSchema ? Object.keys(getShape(argsSchema) ?? {}) : [];
	const argsObj: Record<string, unknown> = {};
	for (let i = 0; i < argsKeys.length; i++) {
		argsObj[argsKeys[i]] = commanderArgs[i];
	}
	return argsObj;
}

function buildOptsObj(
	argsSchema: z.ZodObject | undefined,
	commanderArgs: unknown[],
): Record<string, unknown> {
	const argsKeys = argsSchema ? Object.keys(getShape(argsSchema) ?? {}) : [];
	const optsObjValue = commanderArgs[argsKeys.length];
	return toRecord(optsObjValue) ?? {};
}

function validateAndParse(
	schema: z.ZodObject,
	data: Record<string, unknown>,
	label: string,
): Record<string, unknown> {
	const parsed = schema.safeParse(data);
	if (!parsed.success) {
		for (const issue of parsed.error.issues) {
			console.error(`${issue.path.join(".")}: ${issue.message}`);
		}
		actionFailure(`${label} validation failed`);
	}
	return schema.parse(data);
}

function runAction(
	argsSchema: z.ZodObject | undefined,
	optsSchema: z.ZodObject | undefined,
	commanderArgs: unknown[],
	action: (
		args: Record<string, unknown>,
		opts: Record<string, unknown>,
	) => void,
): void {
	const argsObj = buildArgsObj(argsSchema, commanderArgs);
	const optsObj = buildOptsObj(argsSchema, commanderArgs);

	const argsData = argsSchema
		? validateAndParse(argsSchema, argsObj, "Argument")
		: {};
	const optsData = optsSchema
		? validateAndParse(optsSchema, optsObj, "Option")
		: {};

	try {
		action(argsData, optsData);
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : String(err);
		console.error(message);
		actionFailure("Action threw an error");
	}
}

// ---------------------------------------------------------------------------
// Argument / option registration helpers
// ---------------------------------------------------------------------------

function registerArguments(cmd: Command, argsSchema?: z.ZodObject): void {
	const shape = getShape(argsSchema);
	if (!shape) return;
	for (const key of Object.keys(shape)) {
		const field = shape[key];
		if (!field || !isZodField(field)) continue;
		const desc = fieldDescription(field);
		const choices = fieldChoices(field);
		const optional = fieldIsOptional(field);
		const flagName = camelToKebab(key);
		if (choices) {
			const arg = new Argument(
				optional ? `[${flagName}]` : `<${flagName}>`,
				desc,
			).choices(choices);
			cmd.addArgument(arg);
		} else {
			cmd.argument(optional ? `[${flagName}]` : `<${flagName}>`, desc);
		}
	}
}

function registerOption(
	cmd: Command,
	flagName: string,
	field: ZodField,
	desc: string,
): void {
	const choices = fieldChoices(field);
	const optional = fieldIsOptional(field);
	const isArr = fieldIsArray(field);
	const isBool = fieldIsBoolean(field);

	if (isBool) {
		cmd.addOption(new Option(`--${flagName}`, desc));
		cmd.addOption(new Option(`--no-${flagName}`));
	} else if (isArr) {
		const opt = new Option(`--${flagName} <value>`)
			.argParser<string[]>(collect)
			.default([]);
		if (!optional) opt.makeOptionMandatory(true);
		cmd.addOption(opt);
	} else if (choices) {
		const opt = new Option(`--${flagName} <value>`).choices(choices);
		if (!optional) opt.makeOptionMandatory(true);
		cmd.addOption(opt);
	} else {
		const opt = new Option(`--${flagName} <value>`, desc);
		if (!optional) opt.makeOptionMandatory(true);
		cmd.addOption(opt);
	}
}

function registerOptions(cmd: Command, optsSchema?: z.ZodObject): void {
	const shape = getShape(optsSchema);
	if (!shape) return;
	for (const key of Object.keys(shape)) {
		const field = shape[key];
		if (!field || !isZodField(field)) continue;
		registerOption(cmd, camelToKebab(key), field, fieldDescription(field));
	}
}

// ---------------------------------------------------------------------------
// Build Commander from CommandDef
// ---------------------------------------------------------------------------

/**
 * Build a Commander.js command tree from a declarative CommandDef, wiring up Zod-validated args, options, and actions.
 * @param def - The command definition to build from.
 * @param parent - The parent Commander command to attach to.
 * @returns The constructed Commander command.
 * @example
 * ```ts
 * const program = new Command();
 * buildCommander(myCommandDef, program);
 * program.parse(process.argv);
 * ```
 */
export function buildCommander(def: CommandDef, parent: Command): Command {
	const cmd = parent.command(def.name);
	cmd.description(def.description);
	registerArguments(cmd, def.args);
	registerOptions(cmd, def.opts);

	if (def.action) {
		const action = def.action;
		cmd.action((...commanderArgs: unknown[]) => {
			runAction(def.args, def.opts, commanderArgs, action);
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

function buildArgDocs(shape: Record<string, unknown> | undefined): ArgDoc[] {
	const docs: ArgDoc[] = [];
	if (!shape) return docs;
	for (const key of Object.keys(shape)) {
		const field = shape[key];
		if (!field || !isZodField(field)) continue;
		docs.push({
			name: camelToKebab(key),
			description: fieldDescription(field),
			required: !fieldIsOptional(field),
			choices: fieldChoices(field),
		});
	}
	return docs;
}

function buildOptDocs(shape: Record<string, unknown> | undefined): OptDoc[] {
	const docs: OptDoc[] = [];
	if (!shape) return docs;
	for (const key of Object.keys(shape)) {
		const field = shape[key];
		if (!field || !isZodField(field)) continue;
		docs.push({
			flag: `--${camelToKebab(key)}`,
			description: fieldDescription(field),
			required: !fieldIsOptional(field),
			repeatable: fieldIsArray(field),
			choices: fieldChoices(field),
		});
	}
	return docs;
}

function isZodField(obj: unknown): obj is ZodField {
	if (typeof obj !== "object" || obj === null) return false;
	const maybeField = toRecord(obj);
	return (
		maybeField !== undefined &&
		(typeof maybeField.safeParse === "function" ||
			"description" in maybeField ||
			"options" in maybeField ||
			"element" in maybeField)
	);
}

/** Extracted documentation for a CLI positional argument. */
export interface ArgDoc {
	name: string;
	description: string;
	required: boolean;
	choices?: string[];
}

/** Extracted documentation for a CLI option/flag. */
export interface OptDoc {
	flag: string;
	description: string;
	required: boolean;
	repeatable: boolean;
	choices?: string[];
}

/** Extracted documentation for a CLI command, including its arguments, options, and subcommands. */
export interface CommandDoc {
	name: string;
	description: string;
	args: ArgDoc[];
	opts: OptDoc[];
	subcommands?: CommandDoc[];
	apiLink?: string;
}

/**
 * Extract structured documentation from a CommandDef by introspecting its Zod schemas for args and options.
 * @param def - The command definition to extract docs from.
 * @returns Structured documentation for the command.
 * @example
 * ```ts
 * const docs = extractDocs(validateCommand);
 * console.log(docs.name, docs.args, docs.opts);
 * ```
 */
export function extractDocs(def: CommandDef): CommandDoc {
	return {
		name: def.name,
		description: def.description,
		args: buildArgDocs(getShape(def.args)),
		opts: buildOptDocs(getShape(def.opts)),
		subcommands: def.subcommands?.map(extractDocs),
		apiLink: def.apiLink,
	};
}
