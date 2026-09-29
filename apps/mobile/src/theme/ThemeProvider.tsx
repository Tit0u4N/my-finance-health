import type { ThemeMode } from '@repo/app-core/stores/createPreferencesStore';
import type { ColorScheme } from '@repo/design-tokens/colors';
import { type ReactNode, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { type Theme, ThemeContext } from './ThemeContext';
import { COLORS } from './tokens';

type ThemeProviderProps = {
  readonly children: ReactNode;
};

/**
 * Holds the active colour scheme. Starts on `'system'` (follows the OS) until `setThemeMode` is
 * called with `'light'`/`'dark'`, which pins it. `setThemeMode` is pushed from outside — by
 * `ThemeModeSync`, mounted once the app stage's `usePreferencesStore` exists — rather than read
 * here directly: `ThemeProvider` sits above `AppRoot` in `app/_layout.tsx` (every pre-app-stage
 * surface, including `AppRoot`'s own "unsupported storage mode" fallback, calls `useColor()`), so
 * it cannot itself be a descendant of the provider carrying the persisted preference.
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  const systemScheme = useColorScheme();
  const [mode, setThemeMode] = useState<ThemeMode>('system');

  const scheme: ColorScheme = mode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : mode;

  const theme = useMemo<Theme>(
    () => ({
      colors: COLORS[scheme],
      scheme,
      setThemeMode,
    }),
    [scheme],
  );

  return <ThemeContext value={theme}>{children}</ThemeContext>;
}
