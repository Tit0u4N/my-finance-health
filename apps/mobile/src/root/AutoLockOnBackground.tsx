import { usePreferencesStore } from '@repo/app-core/stores/PreferencesProvider';
import { useEffect } from 'react';
import { AppState } from 'react-native';

type AutoLockOnBackgroundProps = {
  readonly onLock: () => void;
};

/**
 * Locks the open workspace the moment the app goes to the background, when the user turned on
 * Settings → Data → "Lock when leaving the app" (`autoLock` preference, off by default — audit
 * I8). Locking also closes the session, so the occupancy lock is released while the phone is
 * suspended instead of going stale (audit P6). On return the unlock form shows, and Face ID
 * prompts on its own if enrolled (useBiometricUnlockForm waits until the app is active again).
 *
 * `background` only, never `inactive`: iOS turns the app `inactive` while the Face ID sheet, a
 * system picker or Control Center is over it, and locking then would fight the very prompt that
 * unlocks it. Rendered inside `AppStageProviders` (where the preferences store exists), the same
 * render-nothing shape as ThemeModeSync.
 */
export function AutoLockOnBackground({ onLock }: AutoLockOnBackgroundProps) {
  const autoLock = usePreferencesStore((state) => state.autoLock);

  useEffect(() => {
    if (!autoLock) {
      return;
    }
    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'background') {
        onLock();
      }
    });
    return () => subscription.remove();
  }, [autoLock, onLock]);

  return null;
}
