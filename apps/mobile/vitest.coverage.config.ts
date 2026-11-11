import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/vault/vault.test.ts', 'src/vault/vault-orthosi.test.ts'],
    environment: 'node',
  },
  coverage: {
    enabled: true,
    include: ['src/vault/vault.ts'],
    reportDir: 'coverage-json',
    reporter: 'json',
  },
});
