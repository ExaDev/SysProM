import eslint from "@eslint/js";
import type { Rule } from "eslint";
import { defineConfig } from "eslint/config";
import eslintComments from "@eslint-community/eslint-plugin-eslint-comments";
import markdown from "@eslint/markdown";
import json from "@eslint/json";
import { fixupConfigRules, fixupPluginRules } from "@eslint/compat";
import jsdoc from "eslint-plugin-jsdoc";
import prettier from "eslint-plugin-prettier/recommended";
import sonarjs from "eslint-plugin-sonarjs";
import tseslint from "typescript-eslint";

// ---------------------------------------------------------------------------
// Custom rules: barrel export discipline
// ---------------------------------------------------------------------------

const noReExports: Rule.RuleModule = {
	meta: {
		type: "problem",
		messages: {
			noReExport:
				"Re-exports (export ... from) are only allowed in index files.",
		},
	},
	create(context) {
		const filename = context.filename;
		const isIndex = /\/index\.[cm]?[jt]sx?$/.test(filename);
		if (isIndex) return {};

		return {
			ExportNamedDeclaration(node) {
				if (node.source) {
					context.report({ node, messageId: "noReExport" });
				}
			},
			ExportAllDeclaration(node) {
				context.report({ node, messageId: "noReExport" });
			},
		};
	},
};

const indexReExportsOnly: Rule.RuleModule = {
	meta: {
		type: "problem",
		messages: {
			noLogic:
				"Index files must only contain re-exports (export ... from). No declarations, functions, or logic.",
		},
	},
	create(context) {
		const filename = context.filename;
		const isIndex = /\/index\.[cm]?[jt]sx?$/.test(filename);
		if (!isIndex) return {};

		return {
			ExportNamedDeclaration(node) {
				if (node.source) return;
				context.report({ node, messageId: "noLogic" });
			},
			ExportDefaultDeclaration(node) {
				context.report({ node, messageId: "noLogic" });
			},
			VariableDeclaration(node) {
				context.report({ node, messageId: "noLogic" });
			},
			FunctionDeclaration(node) {
				context.report({ node, messageId: "noLogic" });
			},
			ClassDeclaration(node) {
				context.report({ node, messageId: "noLogic" });
			},
			ImportDeclaration() {
				// Imports are fine — needed for re-exports
			},
		};
	},
};

const noPointlessReassignments: Rule.RuleModule = {
	meta: {
		type: "problem",
		messages: {
			pointlessReassignment:
				"Pointless reassignment. {{ name }} is just an alias for {{ value }}. Use the original directly instead.",
		},
	},
	create(context) {
		return {
			VariableDeclarator(node) {
				if (node.id.type !== "Identifier" || node.init?.type !== "Identifier") {
					return;
				}
				if (node.id.name.startsWith("_")) {
					return;
				}
				context.report({
					node,
					messageId: "pointlessReassignment",
					data: {
						name: node.id.name,
						value: node.init.name,
					},
				});
			},
		};
	},
};

const barrelPlugin = {
	rules: {
		"no-re-exports": noReExports,
		"index-re-exports-only": indexReExportsOnly,
		"no-pointless-reassignments": noPointlessReassignments,
	},
};

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

// Fix up legacy shareable configs so they are flat-config compatible
const fixupPrettier = fixupConfigRules(prettier);
const fixupSonarjs = fixupConfigRules(sonarjs.configs.recommended);
const fixupJsdDoc = fixupConfigRules(
	jsdoc.configs["flat/recommended-typescript-error"],
);
const typedTsFiles = ["**/*.ts", "**/*.tsx", "**/*.mts", "**/*.cts"];
const codeFiles = ["**/*.js", "**/*.cjs", "**/*.mjs", ...typedTsFiles];
const typedTsConfigs = [
	...tseslint.configs.strictTypeChecked,
	...tseslint.configs.stylisticTypeChecked,
].map((config) => ({
	...config,
	files: typedTsFiles,
}));

export default defineConfig(
	eslint.configs.recommended,
	...typedTsConfigs,
	...fixupSonarjs.map((config) => ({
		...config,
		files: codeFiles,
	})),
	...fixupPrettier.map((config) => ({
		...config,
		files: codeFiles,
	})),
	{
		files: ["src/**/*.ts"],
		...fixupJsdDoc[0],
		rules: {
			...fixupJsdDoc[0]?.rules,
			...jsdoc.configs["flat/requirements-typescript-error"].rules,
			...jsdoc.configs["flat/contents-typescript-error"].rules,
			...jsdoc.configs["flat/logical-typescript-error"].rules,
			...jsdoc.configs["flat/stylistic-typescript-error"].rules,
			"jsdoc/informative-docs": "off",
			"jsdoc/match-description": "off",
			"jsdoc/no-blank-blocks": "off",
			"jsdoc/require-description": "off",
			"jsdoc/require-example": "off",
			"jsdoc/require-hyphen-before-param-description": ["error", "always"],
			"jsdoc/require-jsdoc": [
				"error",
				{
					publicOnly: true,
					require: {
						FunctionDeclaration: true,
						ClassDeclaration: true,
						ArrowFunctionExpression: true,
					},
					contexts: [
						"TSInterfaceDeclaration",
						"TSTypeAliasDeclaration",
						"TSEnumDeclaration",
					],
				},
			],
			"jsdoc/require-param": "off",
			"jsdoc/require-param-description": "off",
			"jsdoc/require-returns": "off",
			"jsdoc/tag-lines": "off",
		},
	},
	{
		plugins: {
			json,
		},
	},
	{
		files: ["**/*.json"],
		language: "json/json",
		rules: {
			"json/no-duplicate-keys": "error",
			"no-irregular-whitespace": "off",
		},
	},
	{
		files: ["**/*.md"],
		plugins: {
			markdown,
		},
		language: "markdown/commonmark",
		rules: {
			"no-irregular-whitespace": "off",
		},
	},
	{
		files: codeFiles,
		plugins: {
			barrel: barrelPlugin,
			"eslint-comments": fixupPluginRules(eslintComments),
		},
		rules: {
			"prettier/prettier": [
				"error",
				{
					useTabs: true,
					singleQuote: false,
				},
			],
			"barrel/no-re-exports": "error",
			"barrel/index-re-exports-only": "error",
			"barrel/no-pointless-reassignments": "error",
			"eslint-comments/no-use": "error",
		},
	},
	{
		languageOptions: {
			parserOptions: {
				projectService: {
					allowDefaultProject: ["eslint.config.ts", "scripts/*.ts"],
				},
				tsconfigRootDir: import.meta.dirname,
			},
		},
	},
	{
		files: typedTsFiles,
		rules: {
			"@typescript-eslint/ban-ts-comment": "error",
			"@typescript-eslint/consistent-type-assertions": [
				"error",
				{ assertionStyle: "never" },
			],
			"@typescript-eslint/no-unused-vars": "error",
		},
	},
	{
		files: ["src/**/*.ts"],
		languageOptions: {
			globals: {
				process: "readonly",
			},
		},
	},
	{
		files: ["src/**/*.ts"],
		rules: {
			"@typescript-eslint/no-unnecessary-condition": "off",
			"sonarjs/cognitive-complexity": "off",
			"sonarjs/no-alphabetical-sort": "off",
			"sonarjs/no-misleading-array-reverse": "off",
			"sonarjs/no-nested-assignment": "off",
			"sonarjs/no-nested-conditional": "off",
			"sonarjs/no-nested-template-literals": "off",
			"sonarjs/prefer-regexp-exec": "off",
			"sonarjs/slow-regex": "off",
			"sonarjs/updated-loop-counter": "off",
		},
	},
	{
		files: ["tests/**/*.ts"],
		rules: {
			"@typescript-eslint/consistent-type-assertions": [
				"error",
				{ assertionStyle: "as", objectLiteralTypeAssertions: "allow" },
			],
			"@typescript-eslint/no-unused-vars": "off",
			"@typescript-eslint/no-floating-promises": "off",
			"@typescript-eslint/no-unnecessary-condition": "off",
			"@typescript-eslint/no-unsafe-assignment": "off",
			"@typescript-eslint/no-unsafe-member-access": "off",
			"@typescript-eslint/no-unsafe-call": "off",
			"@typescript-eslint/no-unsafe-argument": "off",
			"@typescript-eslint/restrict-template-expressions": "off",
			"@typescript-eslint/require-await": "off",
			"@typescript-eslint/no-non-null-assertion": "off",
			"@typescript-eslint/no-explicit-any": "off",
			"@typescript-eslint/prefer-nullish-coalescing": "off",
			"sonarjs/no-alphabetical-sort": "off",
			"sonarjs/os-command": "off",
			"sonarjs/todo-tag": "off",
		},
	},
	{
		files: ["scripts/**/*.ts", "eslint.config.ts"],
		rules: {
			"@typescript-eslint/consistent-type-assertions": "off",
			"@typescript-eslint/no-unsafe-argument": "off",
			"@typescript-eslint/no-unsafe-assignment": "off",
			"@typescript-eslint/no-unsafe-call": "off",
			"@typescript-eslint/no-unsafe-member-access": "off",
			"@typescript-eslint/restrict-template-expressions": "off",
			"sonarjs/cognitive-complexity": "off",
			"sonarjs/no-nested-template-literals": "off",
		},
	},
	{
		ignores: [
			".claude/worktrees/**",
			"dist/",
			"node_modules/",
			"docs/",
			"commitlint.config.ts",
			"release.config.mjs",
			"site/assets/*.js",
		],
	},
);
