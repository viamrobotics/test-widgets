import { includeIgnoreFile } from '@eslint/compat'
import js from '@eslint/js'
import prettier from 'eslint-config-prettier'
import perfectionist from 'eslint-plugin-perfectionist'
import svelte from 'eslint-plugin-svelte'
import unicorn from 'eslint-plugin-unicorn'
import { defineConfig } from 'eslint/config'
import globals from 'globals'
import path from 'node:path'
import ts from 'typescript-eslint'

import svelteConfig from './svelte.config.js'

const gitignorePath = path.resolve(import.meta.dirname, '.gitignore')

export default defineConfig(
	includeIgnoreFile(gitignorePath),
	js.configs.recommended,
	ts.configs.recommended,
	svelte.configs.recommended,
	prettier,
	svelte.configs.prettier,
	perfectionist.configs['recommended-natural'],
	unicorn.configs.recommended,
	{
		languageOptions: { globals: { ...globals.browser, ...globals.node } },
		rules: {
			// typescript-eslint strongly recommend that you do not use the no-undef lint rule on TypeScript projects.
			// see: https://typescript-eslint.io/troubleshooting/faqs/eslint/#i-get-errors-from-the-no-undef-rule-about-global-variables-not-being-defined-even-though-there-are-no-typescript-errors
			'no-undef': 'off',
		},
	},
	{
		files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
		languageOptions: {
			parserOptions: {
				projectService: true,
				extraFileExtensions: ['.svelte'],
				parser: ts.parser,
				svelteConfig,
			},
		},
	},

	{
		name: 'viam/base',
		rules: {
			'no-useless-assignment': 'off',
		},
	},

	{
		name: 'viam/svelte/svelte-base',
		rules: {
			// Off because this currently has false positives
			'svelte/prefer-svelte-reactivity': 'off',
		},
	},

	{
		name: 'viam/perfectionist',
		rules: {
			'perfectionist/sort-array-includes': 'off',
			'perfectionist/sort-classes': 'off',
			'perfectionist/sort-decorators': 'off',
			'perfectionist/sort-enums': 'off',
			'perfectionist/sort-export-attributes': 'off',
			'perfectionist/sort-exports': 'off',
			'perfectionist/sort-heritage-clauses': 'off',
			'perfectionist/sort-interfaces': 'off',
			'perfectionist/sort-intersection-types': 'off',
			'perfectionist/sort-jsx-props': 'off',
			'perfectionist/sort-maps': 'off',
			'perfectionist/sort-modules': 'off',
			'perfectionist/sort-named-exports': 'off',
			'perfectionist/sort-object-types': 'off',
			'perfectionist/sort-objects': 'off',
			'perfectionist/sort-sets': 'off',
			'perfectionist/sort-switch-case': 'off',
			'perfectionist/sort-union-types': 'off',
			'perfectionist/sort-variable-declarations': 'off',

			'perfectionist/sort-imports': [
				'error',
				{
					internalPattern: [String.raw`^\$`],
				},
			],
		},
	},

	{
		name: 'viam/unicorn',
		rules: {
			'unicorn/consistent-function-scoping': 'off',
			'unicorn/custom-error-definition': 'error',
			'unicorn/escape-case': 'off',
			'unicorn/filename-case': 'off',
			'unicorn/no-for-loop': 'off',
			'unicorn/no-hex-escape': 'off',
			'unicorn/no-null': 'off',
			'unicorn/no-object-as-default-parameter': 'off',
			'unicorn/no-process-exit': 'off',
			'unicorn/no-unused-properties': 'error',
			'unicorn/no-useless-undefined': 'off',
			'unicorn/number-literal-case': 'off',
			'unicorn/numeric-separators-style': 'off',
			'unicorn/prefer-add-event-listener': 'off',
			'unicorn/prefer-blob-reading-methods': 'off',
			'unicorn/prefer-code-point': 'off',
			'unicorn/prefer-string-replace-all': 'error',
			'unicorn/prefer-switch': 'off',
			'unicorn/prefer-top-level-await': 'off',
			'unicorn/prevent-abbreviations': 'off',
			'unicorn/require-module-specifiers': 'off',
			'unicorn/prefer-global-this': 'off',

			// TODO
			// 'unicorn/filename-case': [
			// 	'error',
			// 	{
			// 		cases: {
			// 			camelCase: true,
			// 			pascalCase: true,
			// 		},
			// 	},
			// ],
		},
	}
)
