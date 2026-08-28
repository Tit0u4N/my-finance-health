import { useContext } from 'react';
import { type Theme, ThemeContext } from './ThemeContext';

/**
 * Single access point to the palette. Components never read `COLORS` directly, so a screen cannot end up
 * pinned to one scheme, and no component ever declares two style objects for light and dark.
 */
export function useColor(): Theme {
  const theme = useContext(ThemeContext);

  if (theme === null) {
    throw new Error('useColor must be called inside a <ThemeProvider>.');
  }

  return theme;
}
