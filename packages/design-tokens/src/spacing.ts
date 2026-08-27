// @repo/design-tokens — level 0.
// Named spacings. The DOM theme exposes them as Tailwind custom properties, so no arbitrary value is ever needed.

export const spacingTokens = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2.5rem',
  gutter: '1.25rem',
  section: '4rem',
} as const;

export type SpacingToken = keyof typeof spacingTokens;
