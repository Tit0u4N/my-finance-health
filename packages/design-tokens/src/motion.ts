// @repo/design-tokens — level 0.
// Animation durations and easing. Source: design-system.md §7.

export const durationTokens = {
  fast: '150ms',
  base: '200ms',
  slow: '320ms',
} as const;

export type DurationToken = keyof typeof durationTokens;

export const easingTokens = {
  emphasized: 'cubic-bezier(0.32, 0.72, 0, 1)',
} as const;

export type EasingToken = keyof typeof easingTokens;
