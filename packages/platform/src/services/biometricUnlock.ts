// @repo/platform — level 0.
// A narrow, opt-in convenience distinct from SecretsService (whose `get()` must never prompt):
// a per-device biometric-bound copy of a workspace passphrase (open-questions.md #23, amending
// #5 — the passphrase stays the only key material, this never replaces it). Declared by
// PlatformCapabilities.hasBiometricUnlock, never assumed present.

export type BiometricUnlockStatus = {
  /** Hardware present and a biometric is enrolled. */
  readonly isAvailable: boolean;
  /** Display copy resolved by the adapter ("Touch ID", "Windows Hello") — data, not a
   *  platform-name branch in shared code (start-roadmap.md §2, principle 1). */
  readonly label: string;
};

export type BiometricUnlockService = {
  status(): Promise<BiometricUnlockStatus>;
  has(key: string): Promise<boolean>;
  /** Prompts the user. Resolves `null` when cancelled or refused — never throws for a user decision. */
  get(key: string, reason: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
};
