// Ambient declaration for the one Expo-inlined env var this app reads so far
// (root/AppRoot.tsx). `expo start`/`expo prebuild` normally generate a fuller `expo-env.d.ts` for
// this, but that file is gitignored scaffold, not something to depend on being present.
declare const process: { readonly env: { readonly EXPO_PUBLIC_STORAGE_MODE?: string } };
