import { useBiometricUnlockForm } from '@repo/app-core/bootstrap/biometric/useBiometricUnlockForm';
import type { WorkspaceRef } from '@repo/data/workspace/workspaceRef';
import type { BiometricUnlockService } from '@repo/platform/services/biometricUnlock';
import { useState } from 'react';

export type UseUnlockWorkspaceFormDeps = {
  readonly workspaceRef: WorkspaceRef;
  readonly biometricUnlock: BiometricUnlockService | undefined;
  /** `sourcedFromBiometric` tells the caller whether `secret` came from a biometric prompt
   * (rather than being typed), so it can forget a stale entry if the unlock then fails. */
  readonly onUnlock: (ref: WorkspaceRef, secret: string, remember: boolean, sourcedFromBiometric: boolean) => void;
};

export type UseUnlockWorkspaceFormResult = {
  readonly secret: string;
  readonly onSecretChange: (secret: string) => void;
  readonly canSubmit: boolean;
  readonly onSubmit: () => void;
  readonly remember: boolean;
  readonly onRememberChange: (remember: boolean) => void;
  readonly biometric: { readonly isSupported: boolean; readonly label: string };
  readonly onBiometricUnlock: () => void;
};

/** Passphrase field only — the biometric checkbox, auto-prompt and button are the shared
 * useBiometricUnlockForm (@repo/app-core), the same hook apps/mobile composes. */
export function useUnlockWorkspaceForm({
  workspaceRef,
  biometricUnlock,
  onUnlock,
}: UseUnlockWorkspaceFormDeps): UseUnlockWorkspaceFormResult {
  const [secret, setSecret] = useState('');

  const form = useBiometricUnlockForm({
    workspaceRef,
    service: biometricUnlock,
    onBiometricSecret: (released) => onUnlock(workspaceRef, released, true, true),
  });

  return {
    secret,
    onSecretChange: setSecret,
    canSubmit: secret.length > 0,
    onSubmit: () => {
      if (secret.length > 0) {
        onUnlock(workspaceRef, secret, form.remember, false);
      }
    },
    remember: form.remember,
    onRememberChange: form.onRememberChange,
    biometric: { isSupported: form.biometric.isSupported, label: form.biometric.label },
    onBiometricUnlock: form.onBiometricUnlock,
  };
}
