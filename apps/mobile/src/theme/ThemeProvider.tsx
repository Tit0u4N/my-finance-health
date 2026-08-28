import type { ColorScheme } from '@repo/design-tokens/colors';
import { type ReactNode, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { type Theme, ThemeContext } from './ThemeContext';
import { COLORS } from './tokens';

type ThemeProviderProps = {
  readonly children: ReactNode;
};

/**
 * Holds the active colour scheme. It starts on the system preference and follows it until the user overrides
 * it, at which point the override wins for the rest of the session.
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  const systemScheme = useColorScheme();
  const [overriddenScheme, setOverriddenScheme] = useState<ColorScheme | null>(null);

  const scheme: ColorScheme = overriddenScheme ?? (systemScheme === 'dark' ? 'dark' : 'light');

  const theme = useMemo<Theme>(
    () => ({
      scheme,
      colors: COLORS[scheme],
      toggleScheme: () => setOverriddenScheme(scheme === 'dark' ? 'light' : 'dark'),
    }),
    [scheme],
  );

  return <ThemeContext value={theme}>{children}</ThemeContext>;
}
