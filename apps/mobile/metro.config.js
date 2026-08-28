// Metro entry point of apps/mobile.
//
// The four monorepo requirements of docs/start-roadmap.md §7 — watch the repository root, restrict module
// lookup to the app then the root, disable hierarchical lookup so a single React instance survives, and
// resolve through the `exports` field because the @repo/* packages expose their TypeScript sources — are all
// applied by `getDefaultConfig` since Expo SDK 52 and React Native 0.79. Re-declaring them by hand is what
// the Expo monorepo guide now tells you to delete, so this file stays at the default on purpose.

const { getDefaultConfig } = require('expo/metro-config');

module.exports = getDefaultConfig(__dirname);
