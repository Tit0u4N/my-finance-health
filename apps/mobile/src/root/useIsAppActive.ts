import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

/** True while the app is in the foreground. iOS refuses to show a Face ID prompt for an app that
 * isn't active, so the unlock form's auto-prompt waits on this after an auto-lock (the form is
 * mounted while the app is still in the background). */
export function useIsAppActive(): boolean {
  const [isActive, setIsActive] = useState(AppState.currentState === 'active');

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next) => setIsActive(next === 'active'));
    return () => subscription.remove();
  }, []);

  return isActive;
}
