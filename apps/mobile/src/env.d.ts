// Ambient declaration for the one Expo-inlined env var this app reads so far
// (root/AppRoot.tsx). `expo start`/`expo prebuild` normally generate a fuller `expo-env.d.ts` for
// this, but that file is gitignored scaffold, not something to depend on being present.
declare const process: { readonly env: { readonly EXPO_PUBLIC_STORAGE_MODE?: string } };

// Hermes provides `TextEncoder` and Expo's runtime installs `TextDecoder` (expo/src/winter), but
// React Native's own types declare neither, and `tsconfig.json` has no DOM lib. @repo/data uses
// both (the workspace descriptor, the lock file, the journal), so the surface it relies on is
// declared here — UTF-8 only, no streaming options.
declare class TextEncoder {
  encode(input?: string): Uint8Array<ArrayBuffer>;
}
declare class TextDecoder {
  decode(input?: ArrayBuffer | ArrayBufferView): string;
}
