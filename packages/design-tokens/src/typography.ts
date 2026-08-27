// @repo/design-tokens — level 0.
// Font families and typographic scale.

export const fontFamilyTokens = {
  sans: 'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
  mono: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
} as const;

export const fontSizeTokens = {
  xs: '0.75rem',
  sm: '0.875rem',
  base: '1rem',
  lg: '1.125rem',
  xl: '1.375rem',
  display: '2.75rem',
} as const;

export type FontFamilyToken = keyof typeof fontFamilyTokens;
export type FontSizeToken = keyof typeof fontSizeTokens;
