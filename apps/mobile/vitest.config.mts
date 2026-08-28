import { fileURLToPath } from 'node:url';
import { nativeConfig } from '@repo/vitest-config/native';
import { defineConfig, mergeConfig } from 'vitest/config';
import { reactNative } from 'vitest-native';

// Vitest requires a default export from its configuration file.
//
// `reactNative()` replaces the whole jest-expo preset: it runs the real React Native JavaScript and mocks
// only the native boundary, resolves the `.native.ts` / `.ios.ts` / `.android.ts` platform suffixes, stubs
// assets, and wires Testing Library Native. It also removes the Bun-specific patch the Jest setup needed,
// since nothing here filters `node_modules` by path.
export default mergeConfig(
  nativeConfig,
  defineConfig({
    plugins: [reactNative()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  }),
);
