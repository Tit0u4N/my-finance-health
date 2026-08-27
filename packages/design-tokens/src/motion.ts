// @repo/design-tokens — level 0.
// Animation durations.

export const durationTokens = {
  fast: '120ms',
  base: '200ms',
  slow: '320ms',
} as const;

export type DurationToken = keyof typeof durationTokens;
