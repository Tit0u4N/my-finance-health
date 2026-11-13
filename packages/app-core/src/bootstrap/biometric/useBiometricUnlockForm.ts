// @repo/app-core — level 2.
// The biometric half of an unlock form, shared by every host that declares `hasBiometricUnlock`
// (desktop's Touch ID, mobile's Face ID — open-questions.md #23). Each app's own
// useUnlockWorkspaceForm keeps the passphrase field and composes this hook for the rest: the
// "remember" checkbox, the one-shot auto-prompt on an enrolled workspace, and the manual button.

import type { WorkspaceRef } from '@repo/data/workspace/workspaceRef';
import type { BiometricUnlockService } from '@repo/platform/services/biometricUnlock';
import { useEffect, useState } from 'react';
import { useBiometricUnlock } from './useBiometricUnlock';

export type UseBiometricUnlockFormDeps = {
  readonly workspaceRef: WorkspaceRef;
  readonly service: BiometricUnlockService | undefined;
  /** Called with a secret released by the biometric prompt — always `remember: true`,
   *  `sourcedFromBiometric: true` from the caller's point of view. */
  readonly onBiometricSecret: (secret: string) => void;
  /** False while the host can't show an OS prompt (a phone app still in the background right
   *  after an auto-lock): the auto-prompt waits until it turns true instead of failing silently.
   *  Defaults to true. */
  readonly canPrompt?: boolean;
  readonly reason?: string;
};

export type UseBiometricUnlockFormResult = {
  readonly remember: boolean;
  readonly onRememberChange: (remember: boolean) => void;
  readonly biometric: { readonly isSupported: boolean; readonly label: string; readonly isEnrolled: boolean };
  readonly onBiometricUnlock: () => void;
};

export function useBiometricUnlockForm({
  workspaceRef,
  service,
  onBiometricSecret,
  canPrompt = true,
  reason,
}: UseBiometricUnlockFormDeps): UseBiometricUnlockFormResult {
  const [remember, setRemember] = useState(false);
  const [rememberTouched, setRememberTouched] = useState(false);
  const [autoPrompted, setAutoPrompted] = useState(false);

  const biometric = useBiometricUnlock({ service, ref: workspaceRef, ...(reason !== undefined && { reason }) });

  // Defaults the checkbox to the current enrollment once it's known — but only until the user
  // touches it themselves, so a manual uncheck during the same session is never clobbered by a
  // stale re-render.
  useEffect(() => {
    if (!(biometric.isChecking || rememberTouched)) {
      setRemember(biometric.isEnrolled);
    }
  }, [biometric.isChecking, biometric.isEnrolled, rememberTouched]);

  const promptAndUnlock = (): void => {
    void biometric.prompt().then((prompted) => {
      if (prompted) {
        onBiometricSecret(prompted);
      }
    });
  };

  // Fires once per mount, only when the workspace already has a biometric entry — cancelling the
  // prompt just leaves the passphrase form in place, it never re-prompts on its own.
  // `promptAndUnlock` closes over a ref and callback that are stable for this mount (a new
  // WorkspaceRef only arrives through a full remount), so only the readiness flags re-trigger it.
  // biome-ignore lint/correctness/useExhaustiveDependencies: see the comment above
  useEffect(() => {
    if (autoPrompted || !canPrompt || biometric.isChecking || !biometric.isEnrolled) {
      return;
    }
    setAutoPrompted(true);
    promptAndUnlock();
  }, [autoPrompted, canPrompt, biometric.isChecking, biometric.isEnrolled]);

  return {
    remember,
    onRememberChange: (next) => {
      setRememberTouched(true);
      setRemember(next);
    },
    biometric: { isSupported: biometric.isSupported, label: biometric.label, isEnrolled: biometric.isEnrolled },
    onBiometricUnlock: promptAndUnlock,
  };
}
