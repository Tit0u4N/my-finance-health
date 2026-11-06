// @repo/design-tokens — level 0.
// Raw colour values, expressed in oklch so the DOM theme and the future native theme read the same source.
// Source: design-system.md §1-§3, converted losslessly from the mock's hex/rgba at implementation
// time (culori) — the hex in design-system.md is the authoritative value, oklch is a re-encoding.

export const colorTokens = {
  light: {
    background: 'oklch(0.9702 0.0041 271.37)',
    surface: 'oklch(1 0 0)',
    surfaceAlt: 'oklch(0.9846 0.0017 247.84)',
    elevated: 'oklch(1 0 0)',
    border: 'oklch(0.9271 0.0075 260.73)',
    borderStrong: 'oklch(0.8715 0.0123 259.82)',
    foreground: 'oklch(0.1767 0.0114 260.64)',
    muted: 'oklch(0.5444 0.035 265.11)',
    subtle: 'oklch(0.7098 0.0273 261.12)',
    chipBg: 'oklch(0.9548 0.0058 264.53)',
    pos: 'oklch(0.5273 0.1371 150.07)',
    neg: 'oklch(0.5534 0.1739 38.4)',
    posSoft: 'oklch(0.9624 0.0434 156.74)',
    negSoft: 'oklch(0.9542 0.0372 75.16)',
    overlay: 'oklch(0.1689 0.0021 286.18 / 0.45)',
  },
  dark: {
    background: 'oklch(0.15 0.0021 286.14)',
    surface: 'oklch(0.1921 0.004 286.02)',
    surfaceAlt: 'oklch(0.1693 0.0041 285.95)',
    elevated: 'oklch(0.2234 0.0058 285.92)',
    border: 'oklch(0.2702 0.0073 285.9)',
    borderStrong: 'oklch(0.3274 0.0105 285.81)',
    foreground: 'oklch(0.9699 0.0013 106.42)',
    muted: 'oklch(0.6358 0.0044 106.52)',
    subtle: 'oklch(0.4845 0.0047 106.57)',
    chipBg: 'oklch(0.2234 0.0058 285.92)',
    pos: 'oklch(0.7729 0.1535 163.22)',
    neg: 'oklch(0.7576 0.159 55.93)',
    posSoft: 'oklch(0.7729 0.1535 163.22 / 0.14)',
    negSoft: 'oklch(0.7576 0.159 55.93 / 0.14)',
    overlay: 'oklch(0 0 0 / 0.55)',
  },
} as const;

export type ColorScheme = keyof typeof colorTokens;
export type ColorToken = keyof (typeof colorTokens)['light'];

// Fixed brand accent — no runtime accent switching (design-system.md §2, open-questions.md #11).
// Same value in light and dark.
export const accentTokens = {
  accent: 'oklch(0.5784 0.2346 278.29)',
  accentSoft: 'oklch(0.5784 0.2346 278.29 / 0.1)',
  accentStrong: 'oklch(0.5106 0.2301 276.97)',
} as const;

export type AccentToken = keyof typeof accentTokens;

// Fixed, ordered swatch list for anything the *user* colours (Category.color, Account.color,
// Investment.color) — not a theme role (design-system.md §3). Same 8 values in light and dark.
export const categoricalPalette = [
  'oklch(0.5784 0.2346 278.29)',
  'oklch(0.6959 0.1491 162.48)',
  'oklch(0.7148 0.1257 215.22)',
  'oklch(0.7681 0.2044 130.85)',
  'oklch(0.7686 0.1647 70.08)',
  'oklch(0.6559 0.2118 354.31)',
  'oklch(0.6056 0.2189 292.72)',
  'oklch(0.6368 0.2078 25.33)',
] as const;

// Same 8 swatches as `categoricalPalette`, index-aligned, but in the hex form
// `hexColorSchema` requires on the records users actually colour (Category.color,
// Account.color, Investment.color — domain-model.md). Hex is the *persisted* form; oklch
// above is the *render* form. Authoritative source: design-system.md §3.
export const categoricalPaletteHex = [
  '#635BFF',
  '#10B981',
  '#06B6D4',
  '#84CC16',
  '#F59E0B',
  '#EC4899',
  '#8B5CF6',
  '#EF4444',
] as const;
