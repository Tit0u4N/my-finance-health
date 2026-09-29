import type { ThemeMode } from '@repo/app-core/stores/createPreferencesStore';
import type { ColorScheme } from '@repo/design-tokens/colors';
import { createContext } from 'react';
import type { Palette } from './tokens';

export type Theme = {
  readonly scheme: ColorScheme;
  readonly colors: Palette;
  /** Pushed by `ThemeModeSync` from the persisted `usePreferencesStore().themeMode` once the app
   * stage mounts — `ThemeProvider` itself never reads the store (it sits above it in the tree). */
  readonly setThemeMode: (mode: ThemeMode) => void;
};

export const ThemeContext = createContext<Theme | null>(null);
