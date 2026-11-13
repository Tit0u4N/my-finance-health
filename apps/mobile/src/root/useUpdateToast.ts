import * as Updates from 'expo-updates';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

/** `checkAutomatically: ON_LOAD` only covers a cold start; a phone app can stay suspended for days. */
const MIN_CHECK_INTERVAL_MS = 10 * 60 * 1000;

/** True once enough time passed since the last check for a foreground return to ask again. */
export function shouldCheckForUpdate(now: number, lastCheckAt: number): boolean {
  return now - lastCheckAt >= MIN_CHECK_INTERVAL_MS;
}

// Offline or server down is the normal case here: the next foreground return simply tries again.
async function downloadUpdateIfAvailable(): Promise<void> {
  try {
    const { isAvailable } = await Updates.checkForUpdateAsync();
    if (isAvailable) {
      await Updates.fetchUpdateAsync();
    }
  } catch {
    return;
  }
}

/**
 * ViewModel behind UpdateToast. A downloaded update is never applied by itself: reloading would
 * wipe whatever the user is doing (and re-lock the workspace). It shows once `isUpdatePending`
 * and applies only on "Restart"; otherwise it applies on the next cold start anyway.
 */
export function useUpdateToast() {
  const { isUpdatePending } = Updates.useUpdates();
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (!Updates.isEnabled) {
      return;
    }
    let lastCheckAt = Date.now();
    const subscription = AppState.addEventListener('change', (next) => {
      if (next !== 'active' || !shouldCheckForUpdate(Date.now(), lastCheckAt)) {
        return;
      }
      lastCheckAt = Date.now();
      void downloadUpdateIfAvailable();
    });
    return () => subscription.remove();
  }, []);

  const handleRestart = () => {
    void Updates.reloadAsync();
  };

  const handleDismiss = () => setIsDismissed(true);

  return { isVisible: isUpdatePending && !isDismissed, handleRestart, handleDismiss };
}
