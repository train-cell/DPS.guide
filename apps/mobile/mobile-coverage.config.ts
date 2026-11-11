import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
    environment: 'node',
    pool: 'forks',
    maxWorkers: 1,
    coverage: {
      enabled: true,
      include: [
        'src/othoni/rythisies/rythisies.tsx',
        'src/provoli-pdf/provoli-pdf.tsx',
        'src/ypiresies/ai-generation-approval.tsx',
        'src/ypiresies/syndesi-eclass.ts',
        'src/provoli-pdf/pdf-ypiresies.ts',
        'src/eidopoiiseis/rythisies-eidopoiseon.tsx',
        'src/vault/vault.ts',
      ],
      reportDir: 'coverage-target',
      reporter: 'json-summary',
    },
  },
});
