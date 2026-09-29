import { usePreferencesStore } from '@repo/app-core/stores/PreferencesProvider';
import { useEffect } from 'react';
import { useColor } from './useColor';

/**
 * Pushes the persisted `themeMode` preference into `ThemeProvider`, which cannot read the
 * preferences store itself (it sits above `AppStageProviders` in `app/_layout.tsx`). Rendered by
 * `AppRoot.tsx` inside `AppStageProviders`, alongside its `children` rather than wrapping them —
 * the same "small syncing component mounted where the store it reads actually exists" shape as
 * `AppStageProviders.tsx`'s own `PreferredLanguage`. Renders nothing; a `useEffect` rather than a
 * ViewModel/View pair because there is no presentation here to split out.
 */
export function ThemeModeSync() {
  const themeMode = usePreferencesStore((state) => state.themeMode);
  const { setThemeMode } = useColor();

  useEffect(() => {
    setThemeMode(themeMode);
  }, [themeMode, setThemeMode]);

  return null;
}
