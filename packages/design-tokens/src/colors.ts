// @repo/design-tokens — level 0.
// Raw colour values, expressed in oklch so the DOM theme and the future native theme read the same source.
// Source: design-system.md §1-§3, converted losslessly from the mock's hex/rgba at implementation
// time (culori) — the hex in design-system.md is the authoritative value, oklch is a re-encoding.

export const colorTokens = {
  light: {
    background: 'oklch(0.9726 0.0026 106.45)',
    surface: 'oklch(1 0 0)',
    surfaceAlt: 'oklch(0.9848 0.0013 106.42)',
    elevated: 'oklch(1 0 0)',
    border: 'oklch(0.9362 0.004 106.48)',
    borderStrong: 'oklch(0.8842 0.0054 106.51)',
    foreground: 'oklch(0.1689 0.0021 286.18)',
    muted: 'oklch(0.5477 0.0046 106.55)',
    subtle: 'oklch(0.6918 0.0043 106.51)',
    chipBg: 'oklch(0.9573 0.004 106.47)',
    pos: 'oklch(0.5273 0.1371 150.07)',
    neg: 'oklch(0.5054 0.1905 27.52)',
    posSoft: 'oklch(0.9624 0.0434 156.74)',
    negSoft: 'oklch(0.9356 0.0309 17.72)',
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
    neg: 'oklch(0.7106 0.1661 22.22)',
    posSoft: 'oklch(0.7729 0.1535 163.22 / 0.14)',
    negSoft: 'oklch(0.7106 0.1661 22.22 / 0.14)',
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
