import { fileURLToPath } from 'node:url';
import { domConfig } from '@repo/vitest-config/dom';
import { defineConfig, mergeConfig } from 'vitest/config';

// Vitest requires a default export from its configuration file.
export default mergeConfig(
  domConfig,
  defineConfig({
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    test: {
      setupFiles: ['./vitest.setup.ts'],
      // The app-level tests exercise the fixture workspace; the default mode is `classic`.
      env: { VITE_STORAGE_MODE: 'inMemory' },
    },
  }),
);
