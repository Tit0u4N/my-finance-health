import type { WorkspaceRef } from '@repo/data/workspace/workspaceRef';
import type { BiometricUnlockService } from '@repo/platform/services/biometricUnlock';
import { useEffect, useState } from 'react';
import { useBiometricUnlock } from './useBiometricUnlock';

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

export function useUnlockWorkspaceForm({
  workspaceRef,
  biometricUnlock,
  onUnlock,
}: UseUnlockWorkspaceFormDeps): UseUnlockWorkspaceFormResult {
  const [secret, setSecret] = useState('');
  const [remember, setRemember] = useState(false);
  const [rememberTouched, setRememberTouched] = useState(false);
  const [autoPrompted, setAutoPrompted] = useState(false);

  const biometric = useBiometricUnlock({ service: biometricUnlock, ref: workspaceRef });

  // Defaults the checkbox to the current enrollment once it's known — but only until the user
  // touches it themselves, so a manual uncheck during the same session is never clobbered by a
  // stale re-render.
  useEffect(() => {
    if (!(biometric.isChecking || rememberTouched)) {
      setRemember(biometric.isEnrolled);
    }
  }, [biometric.isChecking, biometric.isEnrolled, rememberTouched]);

  // Fires once per mount, only when the workspace already has a biometric entry — cancelling the
  // prompt just leaves the passphrase form in place, it never re-prompts on its own.
  // biome-ignore lint/correctness/useExhaustiveDependencies: biometric.prompt/onUnlock/workspaceRef
  // are stable for the lifetime of this mount (a fresh WorkspaceRef and callback only ever arrive
  // via a full remount, per BootstrapScreen's state.kind switch) — only the two readiness flags
  // below should actually re-trigger this effect.
  useEffect(() => {
    if (autoPrompted || biometric.isChecking || !biometric.isEnrolled) {
      return;
    }
    setAutoPrompted(true);
    void biometric.prompt().then((prompted) => {
      if (prompted) {
        onUnlock(workspaceRef, prompted, true, true);
      }
    });
  }, [autoPrompted, biometric.isChecking, biometric.isEnrolled]);

  return {
    secret,
    onSecretChange: setSecret,
    canSubmit: secret.length > 0,
    onSubmit: () => {
      if (secret.length > 0) {
        onUnlock(workspaceRef, secret, remember, false);
      }
    },
    remember,
    onRememberChange: (next) => {
      setRememberTouched(true);
      setRemember(next);
    },
    biometric: { isSupported: biometric.isSupported, label: biometric.label },
    onBiometricUnlock: () => {
      void biometric.prompt().then((prompted) => {
        if (prompted) {
          onUnlock(workspaceRef, prompted, true, true);
        }
      });
    },
  };
}
