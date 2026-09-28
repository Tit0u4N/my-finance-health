// Metro entry point of apps/mobile.
//
// The four monorepo requirements of docs/start-roadmap.md §7 — watch the repository root, restrict module
// lookup to the app then the root, disable hierarchical lookup so a single React instance survives, and
// resolve through the `exports` field because the @repo/* packages expose their TypeScript sources — are all
// applied by `getDefaultConfig` since Expo SDK 52 and React Native 0.79. Re-declaring them by hand is what
// the Expo monorepo guide now tells you to delete, so this file stays at the default on purpose — except
// for the one resolver patch below.

const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// A `@repo/*` package's `exports` map (e.g. @repo/app-core's `"./*": { "default": "./src/*" }`) is
// deliberately extension-less: the package mixes `.ts` and `.tsx` sources, and there is no single
// wildcard target that bakes in one extension for both (unlike @repo/domain/@repo/data/@repo/i18n,
// pure-`.ts` packages that bake `.ts` in directly). tsc, Vite, and Vitest all extension-probe an
// extension-less exports target on their own; Metro's package-exports resolution does not, and
// fails "Unable to resolve" for any subpath whose file happens to be `.tsx` (any provider/component
// export, e.g. `@repo/app-core/providers/AppStageProviders`). Appending the extension straight onto
// the *request* instead of the exports map needs no probing on Metro's part either way: the
// wildcard then substitutes to an already-fully-qualified path.
const RESOLVABLE_EXTENSIONS = ['.ts', '.tsx'];

config.resolver.resolveRequest = (context, moduleName, platform) => {
  try {
    return context.resolveRequest(context, moduleName, platform);
  } catch (error) {
    if (!moduleName.startsWith('@repo/')) {
      throw error;
    }
    for (const extension of RESOLVABLE_EXTENSIONS) {
      try {
        return context.resolveRequest(context, `${moduleName}${extension}`, platform);
      } catch {
        // Try the next extension — the original error is what's worth surfacing if none resolve.
      }
    }
    throw error;
  }
};

module.exports = config;
