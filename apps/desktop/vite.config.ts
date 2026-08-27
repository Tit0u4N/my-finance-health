import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Tauri drives this dev server: the port is fixed and its own directory is kept out of the watcher.
export default defineConfig({
  plugins: [
    react({
      // React Compiler runs on the whole compiled graph, shared packages included: they are consumed as sources.
      compiler: true,
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
    // Guarantees a single React instance even though @repo/ui declares it as a peer dependency.
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    // Workspace packages expose TypeScript sources: they go through the app chain, never through the prebundler.
    exclude: ['@repo/ui', '@repo/design-tokens'],
  },
  clearScreen: false,
  envPrefix: ['VITE_', 'TAURI_ENV_'],
  server: {
    port: 1420,
    strictPort: true,
    watch: {
      ignored: ['**/src-tauri/**'],
    },
  },
});
