// @repo/design-tokens — level 0.
// Font families and named text styles. Source: design-system.md §4 — the mock pairs each size
// with a specific weight and letter-spacing rather than a generic scale, so this is modelled as
// named styles, not a bare size list.

// Self-hosted Geist/Geist Mono are bundled by apps/web and apps/desktop directly (local mode ships
// offline, so a runtime Google Fonts <link> is a non-starter) — deferred, not part of this pass.
// The stack below renders on system fallbacks until the font files land.
export const fontFamilyTokens = {
  sans: '"Geist", -apple-system, system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  mono: '"Geist Mono", "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
} as const;

export type FontFamilyToken = keyof typeof fontFamilyTokens;

export type TextStyle = {
  readonly fontSize: string;
  readonly fontWeight: number;
  readonly letterSpacing: string;
};

// Weight 540 is the design's workhorse weight for anything that isn't a heading or a muted label —
// Tailwind's default `medium` is 500, so it's registered as its own named weight instead.
export const textStyleTokens = {
  caption: { fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.35px' },
  label: { fontSize: '0.75rem', fontWeight: 540, letterSpacing: '-0.05px' },
  bodySm: { fontSize: '0.8125rem', fontWeight: 440, letterSpacing: '-0.1px' },
  body: { fontSize: '0.9375rem', fontWeight: 440, letterSpacing: '-0.1px' },
  labelStrong: { fontSize: '0.84375rem', fontWeight: 600, letterSpacing: '-0.15px' },
  headingSm: { fontSize: '1.0625rem', fontWeight: 600, letterSpacing: '-0.3px' },
  heading: { fontSize: '1.25rem', fontWeight: 600, letterSpacing: '-0.4px' },
  value: { fontSize: 'clamp(19px, 1.8vw, 25px)', fontWeight: 600, letterSpacing: '-0.9px' },
  valueHero: { fontSize: 'clamp(21px, 2.1vw, 30px)', fontWeight: 600, letterSpacing: '-0.9px' },
} as const satisfies Record<string, TextStyle>;

export type TextStyleToken = keyof typeof textStyleTokens;

export const fontWeightTokens = {
  medium: 540,
} as const;

export type FontWeightToken = keyof typeof fontWeightTokens;
