import { defineConfig } from 'vitest/config';

/**
 * Configuration for the React Native context: apps/mobile.
 *
 * The environment stays `node`: React Native has no document, and the renderer used by Testing Library
 * Native produces a JSON tree rather than DOM nodes. jsdom would only add globals the native code must
 * never see.
 *
 * The `vitest-native` plugin, Testing Library Native, and the setup files are deliberately not wired here,
 * for the same reason `domConfig` leaves Testing Library out: React Native must not be pulled into a
 * configuration package, which would put a DOM runtime and a native runtime inside the same package.
 * apps/mobile declares them and adds the plugin itself.
 */
export const nativeConfig = defineConfig({
  test: {
    environment: 'node',
    globals: false,
    passWithNoTests: true,
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
});
