// @repo/design-tokens — level 0.
// Layout breakpoints, DOM only (design-system.md §8). Default Tailwind breakpoints don't hit the
// design's collapse points. Grid recipes (gap/columns) live as Tailwind utilities in
// @repo/ui/styles/theme.css, added one at a time as the screens that need them land — this file
// only carries the two custom breakpoints those recipes key off.

export const breakpointTokens = {
  half: '900px',
  panel: '1180px',
} as const;

export type BreakpointToken = keyof typeof breakpointTokens;

// The page-body wrapper every screen uses (design-system.md §8, `Content` in the mock's
// desktop-shell.jsx). Comfortable-density values only — the mock's `compact` deltas are dropped
// per open-questions.md #11. Consumed directly as inline style, not routed through Tailwind
// classes: none of these pixel values fit the generic spacing/radius scale, and they're invariant
// across theme/viewport (bar the `@container` collapse the two breakpoints above already cover).
export const contentLayoutTokens = {
  maxWidth: '1400px',
  maxWidthWide: '1560px',
  paddingX: '2rem',
  paddingTop: '1.625rem',
  paddingBottom: '3.5rem',
  gap: '1.125rem',
} as const;
