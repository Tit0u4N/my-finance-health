// @repo/design-tokens — level 0.
// Corner radii.

export const radiusTokens = {
  sm: '0.375rem',
  md: '0.625rem',
  lg: '1rem',
  xl: '1.5rem',
  full: '9999px',
} as const;

export type RadiusToken = keyof typeof radiusTokens;
