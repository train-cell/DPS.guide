import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/coverage/**',
      '**/build/**',
      'pnpm-lock.yaml',
      '**/*.css',
      '**/*.tsbuildinfo',
      'apps/mobile/android/**',
      'apps/mobile/ios/**',
      'apps/mobile/native-artifacts/**',
      'apps/mobile/public/**',
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
      // Οι παράμετροι με πρόθεμα `_` είναι σκόπιμα αχρησίαστες (π.χ. mocks που
      // αγνοούν το αίτημα) — δεν είναι λάθος, είναι σύμβαση.
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },
  {
    files: ['apps/cli/**', 'scripts/**'],
    rules: {
      'no-console': 'off',
    },
  },
  {
    files: ['scripts/**/*.mjs', 'spikes/**/*.mjs'],
    languageOptions: {
      globals: {
        AbortSignal: 'readonly',
        Buffer: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        console: 'readonly',
        fetch: 'readonly',
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
      'apps/mobile/bridge/**/*.ts',
      'apps/mobile/e2e/**/*.ts',
      'apps/mobile/src/**/*.test.tsx',
      'apps/mobile/test-fixtures/**/*.{ts,tsx}',
      'packages/*/tests/**/*.ts',
      'packages/*/src/**/*.test.ts',
      'apps/cli/src/**/*.test.ts',
      'apps/mobile/src/**/*.test.ts',
      'scripts/**/*.test.ts',
      'spikes/**/*.mjs',
    ],
    extends: [tseslint.configs.disableTypeChecked],
  },
);
