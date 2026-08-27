// @repo/design-tokens — level 0.
// Raw colour values, expressed in oklch so the DOM theme and the future native theme read the same source.
// Consumed on the DOM side by the Tailwind theme sheet of @repo/ui.

export const colorTokens = {
  light: {
    background: 'oklch(0.99 0.005 250)',
    foreground: 'oklch(0.21 0.02 260)',
    muted: 'oklch(0.96 0.008 250)',
    mutedForeground: 'oklch(0.52 0.02 260)',
    border: 'oklch(0.9 0.01 250)',
    primary: 'oklch(0.58 0.16 250)',
    primaryForeground: 'oklch(0.99 0.005 250)',
    accent: 'oklch(0.72 0.13 165)',
    accentForeground: 'oklch(0.21 0.02 260)',
  },
  dark: {
    background: 'oklch(0.18 0.02 260)',
    foreground: 'oklch(0.96 0.008 250)',
    muted: 'oklch(0.25 0.02 260)',
    mutedForeground: 'oklch(0.72 0.02 260)',
    border: 'oklch(0.32 0.02 260)',
    primary: 'oklch(0.7 0.14 250)',
    primaryForeground: 'oklch(0.18 0.02 260)',
    accent: 'oklch(0.78 0.12 165)',
    accentForeground: 'oklch(0.18 0.02 260)',
  },
} as const;

export type ColorScheme = keyof typeof colorTokens;
export type ColorToken = keyof (typeof colorTokens)['light'];
