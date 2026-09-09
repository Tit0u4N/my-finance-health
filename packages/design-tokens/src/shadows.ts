// @repo/design-tokens — level 0.
// Elevation. New token category (design-system.md §6) — values are theme-invariant, the mock
// reuses the same black-alpha shadow in light and dark.

export const shadowTokens = {
  xs: '0 1px 2px rgba(0, 0, 0, 0.06)',
  sm: '0 8px 24px rgba(0, 0, 0, 0.07)',
  md: '0 18px 44px rgba(0, 0, 0, 0.18)',
  lg: '0 30px 70px rgba(0, 0, 0, 0.28)',
} as const;

export type ShadowToken = keyof typeof shadowTokens;
