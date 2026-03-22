import eslint from "@eslint/js";
import type { Rule } from "eslint";
import { defineConfig } from "eslint/config";
import eslintComments from "@eslint-community/eslint-plugin-eslint-comments";
import jsdoc from "eslint-plugin-jsdoc";
import prettier from "eslint-plugin-prettier/recommended";
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
				// Re-exports have a source — those are fine
				if (node.source) return;
				// Anything else (export function, export const, export {}) is logic
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

const barrelPlugin = {
	rules: {
		"no-re-exports": noReExports,
		"index-re-exports-only": indexReExportsOnly,
	},
};

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export default defineConfig(
	eslint.configs.recommended,
	tseslint.configs.strictTypeChecked,
	tseslint.configs.stylisticTypeChecked,
	prettier,
	{
		files: ["src/**/*.ts"],
		...jsdoc.configs["flat/recommended-typescript-error"],
		rules: {
			...jsdoc.configs["flat/recommended-typescript-error"].rules,
			...jsdoc.configs["flat/requirements-typescript-error"].rules,
			...jsdoc.configs["flat/contents-typescript-error"].rules,
			...jsdoc.configs["flat/logical-typescript-error"].rules,
			...jsdoc.configs["flat/stylistic-typescript-error"].rules,
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
			"jsdoc/require-description": "error",
		},
	},
	{
		plugins: {
			barrel: barrelPlugin,
			"eslint-comments": eslintComments,
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
		},
	},
	{
		ignores: [
			"dist/",
			"node_modules/",
			"docs/",
			"commitlint.config.ts",
			"release.config.mjs",
			"site/assets/*.js",
		],
	},
);
