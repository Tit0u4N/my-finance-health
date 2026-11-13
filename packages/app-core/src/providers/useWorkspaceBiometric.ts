// @repo/app-core — level 2.
// Settings-side view of the open workspace's biometric entry (open-questions.md #26, extending
// #23): whether one is stored on this device, and a way to forget it. Turning it *on* stays on the
// unlock and create forms — the only places that hold the passphrase; nothing in the app stage
// keeps it in memory, by design.
//
// Capability check, not a platform-name branch: unavailable whenever the platform doesn't declare
// `hasBiometricUnlock`, the device has no usable biometric, or the host provided no workspace key.

import { useContext, useEffect, useState } from 'react';
import { usePlatform } from './usePlatform';
import { WorkspaceBiometricContext } from './workspaceBiometricContext';

export type UseWorkspaceBiometricResult =
  | { readonly isAvailable: false }
  | {
      readonly isAvailable: true;
      /** "Face ID", "Touch ID"… resolved by the adapter. */
      readonly label: string;
      readonly isEnrolled: boolean;
      readonly isUpdating: boolean;
      /** The last forget attempt failed and the entry is still stored. */
      readonly forgetFailed: boolean;
      /** Forgets this device's copy of the passphrase; the next unlock asks for it again. */
      readonly onForget: () => void;
    };

type Resolved = { readonly isAvailable: boolean; readonly label: string; readonly isEnrolled: boolean };

export function useWorkspaceBiometric(): UseWorkspaceBiometricResult {
  const platform = usePlatform();
  const key = useContext(WorkspaceBiometricContext);
  const service = platform.capabilities.hasBiometricUnlock ? platform.biometricUnlock : undefined;
  const [resolved, setResolved] = useState<Resolved | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [forgetFailed, setForgetFailed] = useState(false);

  useEffect(() => {
    if (!(service && key !== null)) {
      setResolved(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      const status = await service.status();
      const isEnrolled = status.isAvailable ? await service.has(key) : false;
      if (!cancelled) {
        setResolved({ isAvailable: status.isAvailable, label: status.label, isEnrolled });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [service, key]);

  if (!(service && key !== null && resolved?.isAvailable)) {
    return { isAvailable: false };
  }

  return {
    isAvailable: true,
    label: resolved.label,
    isEnrolled: resolved.isEnrolled,
    isUpdating,
    forgetFailed,
    onForget: () => {
      if (isUpdating) {
        return;
      }
      setIsUpdating(true);
      void service
        .remove(key)
        .then(() => {
          setForgetFailed(false);
          setResolved({ ...resolved, isEnrolled: false });
        })
        // A failed forget leaves the entry in place — surfaced, never swallowed.
        .catch(() => setForgetFailed(true))
        .finally(() => setIsUpdating(false));
    },
  };
}
