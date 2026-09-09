// @repo/design-tokens — level 0.
// Corner radii. Source: design-system.md §5.

export const radiusTokens = {
  sm: '0.5rem',
  md: '0.625rem',
  lg: '0.875rem',
  xl: '1.125rem',
  full: '9999px',
} as const;

export type RadiusToken = keyof typeof radiusTokens;
