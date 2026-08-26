import { defineConfig } from 'vitest/config';

/**
 * Configuration for packages rendering DOM components: @repo/ui, and later the DOM applications.
 *
 * Testing Library is deliberately not wired here: its React binding would pull React into a
 * configuration package. Each consuming package declares its own Testing Library dependencies
 * and adds them through `setupFiles`.
 */
export const domConfig = defineConfig({
  test: {
    environment: 'jsdom',
    globals: false,
    passWithNoTests: true,
    css: true,
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
});
