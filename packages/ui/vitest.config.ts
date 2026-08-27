import { domConfig } from '@repo/vitest-config/dom';
import { defineConfig, mergeConfig } from 'vitest/config';

// Vitest requires a default export from its configuration file.
export default mergeConfig(
  domConfig,
  defineConfig({
    test: {
      setupFiles: ['./vitest.setup.ts'],
    },
  }),
);
