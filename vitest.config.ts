import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    pool: 'threads',
    maxWorkers: 2,
    exclude: [...configDefaults.exclude, '**/e2e/**', '**/test-results/**'],
    coverage: {
      provider: 'v8',
      include: ['packages/*/src/**', 'apps/*/src/**'],
      reportsDirectory: './coverage',
    },
  },
});
