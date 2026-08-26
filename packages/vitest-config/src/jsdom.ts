import { defineConfig } from 'vitest/config';

/**
 * Configuration for React code that must run without a renderer: @repo/app-core.
 * jsdom is present because React needs a document, not because components are rendered here.
 */
export const jsdomConfig = defineConfig({
  test: {
    environment: 'jsdom',
    globals: false,
    passWithNoTests: true,
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
});
