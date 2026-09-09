import { usePreferencesStore } from '@repo/app-core/stores/PreferencesProvider';
import { useEffect } from 'react';

/** Mirrors the preferences store's `themeMode` (light/dark/system) onto the `dark` class on
 * `<html>`, which `@repo/ui`'s `theme.css` keys every dark-mode value off. */
export function useThemeSync(): void {
  const themeMode = usePreferencesStore((state) => state.themeMode);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const isDark = themeMode === 'dark' || (themeMode === 'system' && media.matches);
      document.documentElement.classList.toggle('dark', isDark);
    };
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [themeMode]);
}
