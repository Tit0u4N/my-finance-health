import { useBiometricUnlockForm } from '@repo/app-core/bootstrap/biometric/useBiometricUnlockForm';
import type { WorkspaceRef } from '@repo/data/workspace/workspaceRef';
import type { BiometricUnlockService } from '@repo/platform/services/biometricUnlock';
import { useState } from 'react';
import { useIsAppActive } from '@/root/useIsAppActive';

export type UseUnlockWorkspaceFormDeps = {
  readonly workspaceRef: WorkspaceRef;
  readonly biometricUnlock: BiometricUnlockService | undefined;
  /** `sourcedFromBiometric` tells the caller whether `secret` came from a Face ID prompt (rather
   * than being typed), so a stale entry can be forgotten if the unlock then fails. */
  readonly onUnlock: (ref: WorkspaceRef, secret: string, remember: boolean, sourcedFromBiometric: boolean) => void;
};

export type UseUnlockWorkspaceFormResult = {
  readonly secret: string;
  readonly onSecretChange: (secret: string) => void;
  readonly canSubmit: boolean;
  readonly onSubmit: () => void;
  readonly remember: boolean;
  readonly onRememberChange: (remember: boolean) => void;
  readonly biometric: { readonly isSupported: boolean; readonly label: string; readonly isEnrolled: boolean };
  readonly onBiometricUnlock: () => void;
};

/** Passphrase field only — the Face ID switch, auto-prompt and button are the shared
 * useBiometricUnlockForm (@repo/app-core), the same hook apps/desktop composes for Touch ID. */
export function useUnlockWorkspaceForm({
  workspaceRef,
  biometricUnlock,
  onUnlock,
}: UseUnlockWorkspaceFormDeps): UseUnlockWorkspaceFormResult {
  const [secret, setSecret] = useState('');
  const isAppActive = useIsAppActive();
  const canSubmit = secret.length > 0;

  const form = useBiometricUnlockForm({
    workspaceRef,
    service: biometricUnlock,
    canPrompt: isAppActive,
    onBiometricSecret: (released) => onUnlock(workspaceRef, released, true, true),
  });

  return {
    secret,
    onSecretChange: setSecret,
    canSubmit,
    onSubmit: () => {
      if (canSubmit) {
        onUnlock(workspaceRef, secret, form.remember, false);
      }
    },
    remember: form.remember,
    onRememberChange: form.onRememberChange,
    biometric: form.biometric,
    onBiometricUnlock: form.onBiometricUnlock,
  };
}
