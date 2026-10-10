import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/coverage/**',
      'pnpm-lock.yaml',
      '**/*.css',
      '**/*.tsbuildinfo',
      'apps/mobile/ios/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/ban-ts-comment': [
        'error',
        {
          'ts-expect-error': 'allow-with-description',
          'ts-ignore': true,
          'ts-nocheck': true,
          'ts-check': true,
          'minimumDescriptionLength': 3,
        },
      ],
      camelcase: 'off',
      'no-console': 'error',
    },
  },
  {
    files: ['apps/cli/**', 'scripts/**'],
    rules: {
      'no-console': 'off',
    },
  },
  {
    files: ['scripts/**/*.mjs'],
    languageOptions: {
      globals: {
        console: 'readonly',
        process: 'readonly',
        setTimeout: 'readonly',
      },
    },
  },
  {
    files: [
      'scripts/**/*.mjs',
      '*.mjs',
      'vitest.config.ts',
      'apps/mobile/*.config.ts',
      'apps/mobile/e2e/**/*.ts',
      'packages/core/tests/**/*.ts',
    ],
    extends: [tseslint.configs.disableTypeChecked],
  },
);
