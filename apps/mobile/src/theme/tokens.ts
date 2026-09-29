/**
 * Native theme of apps/mobile, derived from `@repo/design-tokens`.
 *
 * The mobile app owns its presentation layer (docs/start-roadmap.md §5) and introduces no styling layer on
 * top of React Native: `StyleSheet` consumes these values directly. Design tokens are authored for the DOM —
 * `rem` lengths and `oklch()` colours — neither of which React Native understands, so this module is the one
 * place that translates them. No screen and no component ever restates a raw value.
 */

import { accentTokens, type ColorScheme, type ColorToken, colorTokens } from '@repo/design-tokens/colors';
import { radiusTokens } from '@repo/design-tokens/radii';
import { spacingTokens } from '@repo/design-tokens/spacing';
import { textStyleTokens } from '@repo/design-tokens/typography';
import { oklchToHex } from './oklch';

/** React Native lengths are density-independent pixels; the DOM tokens are relative to a 16px root. */
const ROOT_FONT_SIZE = 16;

function toPixels(value: string): number {
  // `value`/`valueHero` (design-system.md §4) are `clamp(minPx, ...)` for the DOM's viewport-based
  // scaling — meaningless in React Native, so the clamp's floor is the native size.
  const clampMatch = /^clamp\(([\d.]+)px/.exec(value);
  const amount = Number.parseFloat(clampMatch?.[1] ?? value);

  if (Number.isNaN(amount)) {
    throw new Error(`Unsupported length token: ${value}.`);
  }

  return value.endsWith('rem') ? amount * ROOT_FONT_SIZE : amount;
}

// `Object.fromEntries` loses the key union, so the shape is restated once here rather than at every call site.
function toPixelScale<Key extends string>(tokens: Readonly<Record<Key, string>>): Readonly<Record<Key, number>> {
  return Object.fromEntries(Object.entries<string>(tokens).map(([key, value]) => [key, toPixels(value)])) as Record<
    Key,
    number
  >;
}

function toHexPalette(tokens: Readonly<Record<ColorToken, string>>): Readonly<Record<ColorToken, string>> {
  return Object.fromEntries(Object.entries<string>(tokens).map(([key, value]) => [key, oklchToHex(value)])) as Record<
    ColorToken,
    string
  >;
}

export const SPACING = toPixelScale(spacingTokens);

// Named text styles (design-system.md §4) replace the old bare size scale — only the pixel size
// carries over here; weight and tracking stay literal per component, same as before this change.
export const FONT_SIZE = toPixelScale(
  Object.fromEntries(Object.entries(textStyleTokens).map(([key, style]) => [key, style.fontSize])) as Record<
    keyof typeof textStyleTokens,
    string
  >,
);

export const BORDER_RADIUS = toPixelScale(radiusTokens);

/** Fixed brand accent (design-system.md §2) — no runtime accent switching, same value both themes. */
export const ACCENT = oklchToHex(accentTokens.accent);

/** Touchable heights, kept above the 44dp accessibility floor of both platforms. */
export const HEIGHT = {
  badge: 28,
  chip: 36,
  control: 48,
  /** The New-transaction sheet's oversized amount entry (`Field`'s `focal` variant). */
  focalControl: 64,
} as const;

/** Tracking, in density-independent pixels. The DOM side gets the equivalent from Tailwind's `tracking-*`. */
export const LETTER_SPACING = {
  wide: 1.5,
} as const;

export const COLORS: Readonly<Record<ColorScheme, Readonly<Record<ColorToken, string>>>> = {
  light: toHexPalette(colorTokens.light),
  dark: toHexPalette(colorTokens.dark),
};

export type Palette = (typeof COLORS)[ColorScheme];
