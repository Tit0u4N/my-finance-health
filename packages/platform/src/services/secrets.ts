// @repo/platform — level 0.
// The OS-level secret vault (keyring on desktop, expo-secure-store on mobile). Absent on web —
// declared by PlatformCapabilities.hasSecretVault, never assumed present.

export type SecretsService = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
};
