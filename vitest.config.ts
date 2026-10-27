import { configDefaults, defineConfig } from 'vitest/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      { find: '@dps/core/testing', replacement: path.resolve(__dirname, 'packages/core/src/testing/index.ts') },
      { find: /^@dps\/core$/, replacement: path.resolve(__dirname, 'packages/core/src/index.ts') },
    ],
  },
  test: {
    environment: 'node',
    pool: 'threads',
    maxWorkers: 2,
    exclude: [...configDefaults.exclude, '**/dist/**', '**/e2e/**', '**/test-results/**'],
    coverage: {
      provider: 'v8',
      include: ['packages/*/src/**', 'apps/*/src/**'],
      reportsDirectory: './coverage',
    },
  },
});
