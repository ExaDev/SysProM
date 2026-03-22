import eslint from "@eslint/js";
import { defineConfig } from "eslint/config";
import prettier from "eslint-plugin-prettier/recommended";
import tseslint from "typescript-eslint";

export default defineConfig(
	eslint.configs.recommended,
	tseslint.configs.strictTypeChecked,
	tseslint.configs.stylisticTypeChecked,
	prettier,
	{
		rules: {
			"prettier/prettier": [
				"error",
				{
					useTabs: true,
					singleQuote: false,
				},
			],
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
		},
	},
	{
		ignores: ["dist/", "node_modules/", "docs/"],
	},
);
