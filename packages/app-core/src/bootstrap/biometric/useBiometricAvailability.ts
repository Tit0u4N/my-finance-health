import type { BiometricUnlockService } from '@repo/platform/services/biometricUnlock';
import { useEffect, useState } from 'react';

export type UseBiometricAvailabilityResult = {
  readonly isSupported: boolean;
  readonly label: string;
};

/** Hardware presence only — no enrollment/ref concern, so the create-workspace form (which has
 * no ref to check until a save location is picked at submit) can still show the right copy. */
export function useBiometricAvailability(service: BiometricUnlockService | undefined): UseBiometricAvailabilityResult {
  const [isSupported, setIsSupported] = useState(false);
  const [label, setLabel] = useState('Biometric unlock');

  useEffect(() => {
    if (!service) {
      setIsSupported(false);
      return;
    }

    let cancelled = false;
    void service.status().then((status) => {
      if (!cancelled) {
        setIsSupported(status.isAvailable);
        setLabel(status.label);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [service]);

  return { isSupported, label };
}
