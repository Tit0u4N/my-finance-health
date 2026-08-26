import { defineConfig } from 'vitest/config';

/**
 * Base configuration for packages containing no React and no DOM:
 * domain, platform, design-tokens, data, i18n, platform-*.
 *
 * `passWithNoTests` keeps freshly scaffolded packages green until their first test lands.
 */
export const nodeConfig = defineConfig({
  test: {
    environment: 'node',
    globals: false,
    passWithNoTests: true,
    include: ['src/**/*.test.ts'],
  },
});
