import js from '@eslint/js'
import eslintConfigPrettier from 'eslint-config-prettier'
import vue from 'eslint-plugin-vue'
import globals from 'globals'
import tseslint from 'typescript-eslint'

const typedFiles = ['**/*.{ts,tsx,mts,cts,vue}']
const typescriptConfig = tseslint.configs.strict.map((config) => ({
  ...config,
  files: typedFiles,
}))

export default tseslint.config(
  {
    ignores: ['coverage/**', 'dist/**', 'dist-ssr/**', 'node_modules/**'],
  },
  js.configs.recommended,
  ...typescriptConfig,
  ...vue.configs['flat/recommended'],
  {
    files: typedFiles,
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
    },
  },
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
      },
    },
  },
  {
    files: ['*.{js,mjs,cjs}'],
    languageOptions: {
      globals: globals.node,
    },
  },
  eslintConfigPrettier,
)
