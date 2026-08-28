import type { ColorScheme } from '@repo/design-tokens/colors';
import { createContext } from 'react';
import type { Palette } from './tokens';

export type Theme = {
  readonly scheme: ColorScheme;
  readonly colors: Palette;
  readonly toggleScheme: () => void;
};

export const ThemeContext = createContext<Theme | null>(null);
