import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/othoni/mathimata/*.test.*', 'src/othoni/proedri/*.test.*', 'src/othoni/simera/*.test.*', 'src/othoni/rythisies/*.test.*'],
    exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
    environment: 'node',
    pool: 'forks',
    maxWorkers: 1,
    coverage: {
      enabled: true,
      include: [
        'src/othoni/mathimata/mathimata.tsx',
        'src/othoni/proedri/proedri.tsx',
        'src/othoni/simera/simera.tsx',
        'src/othoni/rythisies/rythisies.tsx',
      ],
      reportDir: 'coverage-target',
      reporter: ['json-summary', 'json'],
    },
  },
});
