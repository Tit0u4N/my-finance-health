import type { UseWorkspaceBootstrapResult } from '@repo/app-core/bootstrap/useWorkspaceBootstrap';
import type { BiometricUnlockService } from '@repo/platform/services/biometricUnlock';
import { useEffect, useState } from 'react';

export type BiometricIntent = {
  readonly key: string;
  readonly secret: string;
  readonly remember: boolean;
  /** True when `secret` was released by a biometric prompt rather than typed — a failure with
   * this set means the stored entry is stale (passphrase changed, or a bad entry) and should be
   * forgotten so the next launch isn't stuck re-prompting with the same wrong secret. */
  readonly sourcedFromBiometric: boolean;
};

export type UseBiometricEnrollmentResult = {
  readonly track: (intent: BiometricIntent) => void;
};

/** Applies the biometric store/forget side effect once the opener's own async result is known.
 * Must be called from a component that stays mounted across the `ready` transition — the
 * bootstrap screen itself is unmounted the instant state becomes `ready` (LocalApp swaps in the
 * app stage), so an effect living there never sees `ready` and the entry is never written.
 *
 * At most one unlock/create is ever in flight at a time (submit is disabled while pending), so a
 * `ready`/`failed` transition while an intent is recorded always belongs to it. */
export function useBiometricEnrollment(
  state: UseWorkspaceBootstrapResult['state'],
  biometricUnlock: BiometricUnlockService | undefined,
): UseBiometricEnrollmentResult {
  const [intent, setIntent] = useState<BiometricIntent | null>(null);

  useEffect(() => {
    if (!(intent && biometricUnlock)) {
      return;
    }
    const { key, secret, remember, sourcedFromBiometric } = intent;
    if (state.kind === 'ready') {
      if (!sourcedFromBiometric) {
        // Remove before set, never set over an existing entry: the plugin then does a
        // SecItemUpdate, which re-prompts Touch ID on a UserPresence item. A remove needs no
        // auth, and re-adding also refreshes a stale entry after a passphrase change.
        void (remember
          ? biometricUnlock
              .remove(key)
              .then(() => biometricUnlock.set(key, secret))
              .catch((error) => {
                // biome-ignore lint/suspicious/noConsole: enrollment failing must not break the unlock that just succeeded, but it must not be silent either
                console.error('[biometricUnlock] enrollment failed', error);
              })
          : biometricUnlock.remove(key));
      }
      // A biometric-sourced unlock already holds this exact secret in the entry — nothing to write.
      setIntent(null);
    } else if (state.kind === 'failed' && sourcedFromBiometric) {
      void biometricUnlock.remove(key);
      setIntent(null);
    }
  }, [state, intent, biometricUnlock]);

  return { track: setIntent };
}
