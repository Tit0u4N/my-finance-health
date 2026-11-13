import type { WorkspaceRef } from '@repo/data/workspace/workspaceRef';
import type { BiometricUnlockService } from '@repo/platform/services/biometricUnlock';
import { useEffect, useState } from 'react';

export type UseBiometricUnlockDeps = {
  readonly service: BiometricUnlockService | undefined;
  readonly ref: WorkspaceRef;
  /** Shown by the OS prompt. */
  readonly reason?: string;
};

export type UseBiometricUnlockResult = {
  readonly isSupported: boolean;
  readonly label: string;
  readonly isEnrolled: boolean;
  readonly isChecking: boolean;
  /** Prompts. Resolves `null` when cancelled or refused. */
  readonly prompt: () => Promise<string | null>;
};

const DEFAULT_UNLOCK_REASON = 'Unlock your workspace';

/** Resolves whether biometric unlock is available and already enrolled for one workspace ref,
 * keyed by its stable id (open-questions.md #23). Shared by every host that declares
 * `hasBiometricUnlock` (desktop's Touch ID, mobile's Face ID) — only the BiometricUnlockService
 * adapter differs. Storing or forgetting the entry is owned by useBiometricEnrollment, which alone
 * knows whether the unlock attempt that follows actually succeeds.
 *
 * Status and enrollment are resolved in one sequential chain, not two independent effects: a
 * status-only effect (as useBiometricAvailability.ts has, for the
 * create-workspace form which has no ref yet) would let an enrollment effect keyed on the
 * not-yet-resolved `isSupported` flag see it as `false` on the very first render and report
 * "done checking" a tick before availability itself is even known. */
export function useBiometricUnlock({
  service,
  ref,
  reason = DEFAULT_UNLOCK_REASON,
}: UseBiometricUnlockDeps): UseBiometricUnlockResult {
  const [isSupported, setIsSupported] = useState(false);
  const [label, setLabel] = useState('Biometric unlock');
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isChecking, setIsChecking] = useState(service !== undefined);

  useEffect(() => {
    if (!service) {
      setIsSupported(false);
      setIsEnrolled(false);
      setIsChecking(false);
      return;
    }

    let cancelled = false;
    setIsChecking(true);
    void (async () => {
      const status = await service.status();
      if (cancelled) {
        return;
      }
      setIsSupported(status.isAvailable);
      setLabel(status.label);
      if (!status.isAvailable) {
        setIsEnrolled(false);
        setIsChecking(false);
        return;
      }
      const enrolled = await service.has(ref.id);
      if (!cancelled) {
        setIsEnrolled(enrolled);
        setIsChecking(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [service, ref.id]);

  return {
    isSupported,
    label,
    isEnrolled,
    isChecking,
    prompt: () => (service ? service.get(ref.id, reason) : Promise.resolve(null)),
  };
}
