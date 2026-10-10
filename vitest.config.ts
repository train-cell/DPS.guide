import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    pool: 'threads',
    poolOptions: {
      threads: {
        minThreads: 1,
        maxThreads: 2,
      },
    },
    minWorkers: 1,
    maxWorkers: 2,
    exclude: [...configDefaults.exclude, '**/e2e/**', '**/test-results/**'],
    coverage: {
      provider: 'v8',
      include: ['packages/*/src/**', 'apps/*/src/**'],
      reportsDirectory: './coverage',
    },
  },
});
