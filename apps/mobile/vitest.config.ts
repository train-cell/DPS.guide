import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Μόνο τα unit tests του src: τα e2e/** είναι Playwright specs
    // (τρέχουν με `npx playwright test`, όχι με vitest).
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
    environment: 'node',
  },
});
