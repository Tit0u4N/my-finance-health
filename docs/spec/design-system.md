# Design system

Token layer for web/desktop, extracted from the desktop design's `THEMES`, `ACCENTS`, and `desktop-style.css` (`ui.jsx`, `desktop-shell.jsx`). Targets the files that already exist as scaffolding: `packages/design-tokens/src/{colors,spacing,radii,typography,motion}.ts` and `packages/ui/src/styles/theme.css`. Their current values are placeholders from initial package scaffolding, never tied to a design — this file replaces them (`open-questions.md` #10).

Per the decision taken for this pass (`open-questions.md` #11), only **theme mode** (light/dark/system) is a real product feature. The design's 4 switchable accents and comfortable/compact density toggle are dropped: one fixed accent, one fixed (comfortable) density. Every value below reflects that — the design's `compact` deltas are noted only where relevant, then discarded.

---

## 1. Color roles

Semantic roles, replacing `colorTokens` in `colors.ts`. Source: `THEMES.light` / `THEMES.dark` in `ui.jsx`.

| Role | Light | Dark | Replaces (current `colorTokens` key) |
|---|---|---|---|
| `background` | `#F6F6F4` | `#0B0B0C` | `background` |
| `surface` | `#FFFFFF` | `#141416` | *(new — current tokens have no surface/background split)* |
| `surfaceAlt` | `#FAFAF9` | `#0F0F11` | *(new)* — recessed surface: input fields, chip tracks, code blocks |
| `elevated` | `#FFFFFF` | `#1B1B1E` | *(new)* — modals, dropdowns, tooltips (things that float above `surface`) |
| `border` | `#EAEAE7` | `#26262A` | `border` |
| `borderStrong` | `#D9D9D5` | `#34343A` | *(new)* — dashed drop-zones, focus-adjacent dividers |
| `foreground` | `#0F0F10` | `#F5F5F4` | `foreground` |
| `muted` (text) | `#71716E` | `#8B8B88` | `mutedForeground` — **name collision**: current `colors.ts` uses `muted` for a *background* role. Rename the background role to `chipBg` (below) to free `muted` for text, matching the mock's own naming. |
| `subtle` | `#9C9C99` | `#5F5F5C` | *(new)* — third text tier, below `muted` (timestamps, placeholder text) |
| `chipBg` | `#F1F1EE` | `#1B1B1E` | `muted` (background sense) — renamed, see above |
| `pos` (positive/income) | `#15803D` | `#34D399` | *(new)* |
| `neg` (negative/expense) | `#B91C1C` | `#F87171` | *(new)* |
| `posSoft` | `#DCFCE7` | `rgba(52,211,153,0.14)` | *(new)* — badge/pill backgrounds behind `pos` text |
| `negSoft` | `#FEE2E2` | `rgba(248,113,113,0.14)` | *(new)* |
| `overlay` | `rgba(15,15,16,0.45)` | `rgba(0,0,0,0.55)` | *(new)* — modal/sheet backdrop |

`primary`/`primaryForeground`/`accent`/`accentForeground` are dropped as generic roles; the app has exactly one brand accent (§2), not an interchangeable "primary vs accent" pair — the mock never uses two different brand hues at once.

**Format**: the mock authors in hex/rgba (the design tool's native format); `colors.ts` is oklch. Convert losslessly at implementation time (`culori` or `colorjs.io` — do not hand-convert). Hex above is the authoritative value; oklch is a re-encoding, not a re-decision.

## 2. Accent

Fixed to the mock's `indigo` preset (`ACCENTS.indigo` in `ui.jsx`) — no runtime accent switching (`open-questions.md` #11).

| Token | Value |
|---|---|
| `accent` | `#635BFF` |
| `accentSoft` | `rgba(99,91,255,0.10)` |
| `accentStrong` | `#4F46E5` |

`accentStrong` pairs with `accent` in every gradient the design uses (sidebar brand mark, onboarding rail, About icon, hero `StatTile`) — angle varies by placement (135°/150°/165°), the two color stops don't. No dedicated gradient token needed; components reference `accent` + `accentStrong` directly.

## 3. Categorical palette (chart/data colors)

Not a theme role — a fixed, ordered swatch list for anything the *user* colors: `Category.color`, `Account.color`, `Investment.color` (real domain fields, `domain-model.md`). The mock's own category/account/recurring-frequency colors are drawn from this same 8-hue pool, reused across contexts (e.g. `#635BFF` colors both "Rent" and "Checking" accounts — coincidence of the mock's seed data, not a rule tying a hue to a meaning).

| Token | Hex |
|---|---|
| `categorical-1` | `#635BFF` |
| `categorical-2` | `#10B981` |
| `categorical-3` | `#06B6D4` |
| `categorical-4` | `#84CC16` |
| `categorical-5` | `#F59E0B` |
| `categorical-6` | `#EC4899` |
| `categorical-7` | `#8B5CF6` |
| `categorical-8` | `#EF4444` |

Usage: offered as the default swatch in a category/account color picker (assign `categorical-(n mod 8)` to the n-th created record); once a user sets a color it's stored as literal hex on the record and the token list is no longer consulted for that record. Same 8 values serve both light and dark — the mock does not shift categorical hues by theme.

## 4. Typography

Replaces `fontFamilyTokens`/`fontSizeTokens` in `typography.ts`. The current `xs…display` 6-step ramp doesn't match the design, which pairs each size with a specific weight and letter-spacing rather than using a generic scale — model it as named **text styles**, not a bare size list.

**Families**: `sans` = `'Geist', -apple-system, system-ui, Segoe UI, Roboto, Helvetica, Arial, sans-serif` (replaces current system-only stack; loaded via Google Fonts in the mock — **self-hosted** here, decided: local mode ships offline with no network dependency, so a runtime Google Fonts `<link>` is a non-starter, not just a style preference; `apps/web`/`apps/desktop` bundle the `Geist`/`Geist Mono` font files directly, not this package). `mono` = `'Geist Mono', 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`.

| Style | Size | Weight | Letter-spacing | Used for |
|---|---|---|---|---|
| `caption` | 11px | 600 | +0.35px, uppercase | table headers, section eyebrows |
| `label` | 12px | 540 | −0.05px | field labels, muted metadata |
| `body-sm` | 13px | 440–540 | −0.1px | table cells, secondary text |
| `body` | 14–15px | 440–540 | −0.1px | primary body text, inputs |
| `label-strong` | 13.5px | 600 | −0.1 to −0.2px | row titles, nav items |
| `heading-sm` | 16.5–17px | 600 | −0.3px | modal/panel titles |
| `heading` | 20px | 600 | −0.4px | page titles |
| `value` | 19–25px (`clamp(19px,1.8vw,25px)`) | 600 | −0.9px | `StatTile` values |
| `value-hero` | 21–30px (`clamp(21px,2.1vw,30px)`) | 600 | −0.9px | hero `StatTile`, onboarding headline |

`tabular-nums` (`font-variant-numeric`) is mandatory on every monetary or numeric value — not size-dependent, applies across all styles above when the content is a number. Weight `540` (not `500`) is the design's workhorse weight for anything that isn't a heading or a muted label; keep it as a literal Tailwind font-weight utility (`font-[540]` is disallowed as an arbitrary value under CLAUDE.md — register `540` as a named weight token, e.g. `--font-weight-medium: 540`, since Tailwind's default `medium` is 500).

## 5. Radii

Replaces `radiusTokens` in `radii.ts`. Current `sm/md/lg/xl` (6/10/16/24px) don't match; the design's largest concrete radius is the modal at 18px, and needs a fourth step around 14px that the current 4-step scale skips.

| Token | Value | Used for |
|---|---|---|
| `radius-sm` | `8px` (`0.5rem`) | buttons (sm/md), settings option cards |
| `radius-md` | `10px` (`0.625rem`, unchanged) | inputs, sidebar nav items, chips |
| `radius-lg` | `14px` (`0.875rem`) | `Panel`, cards, `StatTile` |
| `radius-xl` | `18px` (`1.125rem`) | `Modal`/`Dialog` |
| `radius-full` | `9999px` (unchanged) | badges, pills, avatars, switches |

## 6. Shadows

New token category — nothing in `radii.ts`/`colors.ts` currently covers elevation. All values are theme-invariant (the mock reuses the same black-alpha shadow in light and dark; no dark-specific adjustment observed).

| Token | Value | Used for |
|---|---|---|
| `shadow-xs` | `0 1px 2px rgba(0,0,0,.06)` | buttons, inputs (resting) |
| `shadow-sm` | `0 8px 24px rgba(0,0,0,.07)` | hover-card lift (`.hovercard:hover`) |
| `shadow-md` | `0 18px 44px rgba(0,0,0,.18)` | dropdowns, popovers (`AccountFilter`) |
| `shadow-lg` | `0 30px 70px rgba(0,0,0,.28)` | `Modal`/`Dialog` |

The primary button's `0 0 0 1px accent.hex` (a simulated 1px border via box-shadow, not real elevation) is a component-level detail, specified in `ui-inventory.md`'s Button row, not a token.

## 7. Motion

Extends `durationTokens` in `motion.ts` with an easing token — currently missing, and three separate animations (`sidebar` width, `.scale-in`, switch knob) share one curve.

| Token | Value | Replaces / adds |
|---|---|---|
| `duration-fast` | `150ms` | was `120ms` — matches `.tap` interaction feedback |
| `duration-base` | `200ms` | unchanged — `.scale-in`, sidebar collapse, switch knob |
| `duration-slow` | `320ms` | unchanged — reserved, no confirmed mock usage found; keep for larger transitions |
| `ease-emphasized` | `cubic-bezier(.32,.72,0,1)` | *(new)* — the shared curve for `.scale-in`, sidebar width, switch knob |

`.fade-in` (220ms, default ease, translateY 4px) is a one-off entrance used on route/tab content — keep as a component-level animation in `@repo/ui`, not a duration token, since 220ms doesn't otherwise recur.

## 8. Layout scale

The mock's grid recipes (`desktop-style.css`), expressed as Tailwind v4 custom breakpoints + a content-width/gap pair — not arbitrary values, per CLAUDE.md. Default Tailwind breakpoints (640/768/1024/1280/1536) don't hit the design's collapse points, so two named breakpoints are added to the `@theme` block in `theme.css`:

| Token | Value | Collapses |
|---|---|---|
| `--breakpoint-half` | `900px` | `grid-half` (Settings category columns), `grid-settings` (nav rail + content) → single column below |
| `--breakpoint-panel` | `1180px` | `grid-2` (the dominant two-panel layout: chart + side list) → single column below |

| Recipe | Columns | Gap |
|---|---|---|
| `grid-kpi` | `repeat(auto-fit, minmax(226px,1fr))` | 16px |
| `grid-2` | `minmax(0,1.62fr) minmax(0,1fr)` | 16px |
| `grid-half` | two even columns | 16px |
| `grid-cards` | `repeat(auto-fill, minmax(330px,1fr))` | 16px |
| `grid-settings` | `250px minmax(0,1fr)` | 16px |

Page content wrapper (`Content` in `desktop-shell.jsx`): max-width `1400px` (`1560px` for the rare "wide" variant), horizontal padding `32px`, top padding `26px`, bottom padding `56px`, vertical stack gap `18px`. These are the **comfortable-density** values only — the design's `compact` deltas (e.g. content padding `20px 28px 40px`, `grid-kpi` gap dropping to 12px, table row heights 52→44px) are discarded per `open-questions.md` #11 and not carried into tokens.

## 9. Theme mechanism

Unchanged from the current `theme.css` pattern — it already matches the design's approach and needs no redesign, only new values:

- `:root` holds light values as `--mfh-*` custom properties; `.dark` overrides them. `@theme inline` maps `--mfh-*` to Tailwind's `--color-*`/`--spacing-*`/etc. so components consume utilities only.
- `theme.test.ts` (already present) must keep asserting `theme.css` values match the `design-tokens` package exports — update both together, never one without the other.
- Since accent/density are no longer runtime-switchable (§ intro), `theme.css` needs exactly **two** states per token (light/dark) — no third accent-preset or density-scale axis to thread through `@theme inline`.

## 10. React Native caveat

`@repo/design-tokens` is level 0 and also feeds `apps/mobile`'s `StyleSheet` (`start-roadmap.md` §12) — it must stay React/DOM-free. oklch strings are not a color format React Native's `StyleSheet` accepts directly. This pass does **not** resolve that: whether the package exports a conversion helper (oklch → RN-consumable hex/rgba at consumption time) or a dual `{ web, native }` export shape is deferred to the mobile UI spec pass. Flagged here so it isn't silently assumed away — `open-questions.md` gets an entry noting it's open, not decided.
