# Cross-app pitfalls and conventions

Source: six bugs found and fixed in `apps/desktop` on 2026-09-12 (popups rendering behind
modals/header, preferences not persisting, unreadable amounts on the hero tile in light mode,
un-localized exchange-rate display, colorless transaction/category pickers, no per-position
investment curve). Each had a root cause that is not desktop-specific — it is a pattern any future
screen, any future `@repo/ui` component, or `apps/mobile` can reintroduce. This file states the
underlying rule so it gets caught at write time instead of at manual-QA time.

**#9 added 2026-09-27**: the first real bug found from the mobile side, once `apps/mobile` started
composing screens with `@repo/app-core`'s real providers.

Each entry says whether it is **DOM-only** (applies to `@repo/ui`, `apps/web`, `apps/desktop`) or
**universal** (applies to any target, `apps/mobile` included).

---

## 1. A portalled overlay needs an explicit z-index — DOM-only

`Select`, `Popover`, `DropdownMenu`, and `Tooltip` (`packages/ui/src/components`) are base-ui
primitives that portal to `document.body`. A portalled element with no `z-index` paints at `auto`,
which loses to any ancestor-independent stacking context (`Dialog`'s `z-40`/`z-50`, `PageHeader`'s
`z-20`) regardless of DOM order or which one opened later. The result: a `Select` inside a modal
renders behind the modal; a popover trigger that lives in the header renders behind the header.

**Rule**: every portalled `@repo/ui` primitive gets an explicit `z-index` from the one documented
scale (`Dialog.tsx`'s header comment: `20 → 40 → 50 → 60 → 70`). When adding a new portalled
primitive (a `Combobox`, a `Sheet`, …), give its `Positioner`/portal root the next free number in
that scale — never leave it at `auto` and never invent a second scale elsewhere.

## 2. A real platform-service adapter lives in the app's OWN `platform-*` package — universal

`createLocalStorageKeyValueStore` had to move from `@repo/platform-web` to `@repo/platform-tauri`
mid-implementation: `biome.json`'s `apps/desktop/**` override hard-blocks importing
`@repo/platform-web`, even though Tauri's webview happens to expose the same `localStorage` API
`platform-web` would have used. The boundary is "which adapter package this app owns", not "which
runtime API the code happens to call".

**Rule**: before writing a new adapter (`KeyValueStore`, `SecretsService`, `FileSystemService`,
`SqlDriver`, …), check `biome.json`'s `noRestrictedImports` override for the *app* that will
consume it, and put the adapter in the one `platform-*` package that app is allowed to import
(`platform-web` for `apps/web`, `platform-tauri` for `apps/desktop`, `platform-expo` for
`apps/mobile`). Do this before writing the module, not after typecheck/lint rejects the import —
the matrix is enforced by tooling, not open to a one-off exception.

## 3. The fake/mock platform's ephemeral services are for tests, never for what an app boots with by default — universal

`createFakePlatform`'s `keyValueStore` is an in-memory `Map` and its `localization.locale()` is
hardcoded `'en-US'` — correct for shared-package tests (`start-roadmap.md` §13: "no shared test
starts a real adapter"), wrong for a real window. `apps/desktop` booted `createMockWorkspace()`
directly and inherited both, so every preference reset on reload and "System" language was always
English regardless of the OS locale.

**Rule**: an app's root composition hook (`useApp.ts` or equivalent) that boots a mock/fake
workspace must explicitly override every service whose fake behavior would be visibly wrong in a
real window — at minimum `keyValueStore` (real persistence) and `localization.locale()` (the
platform's real locale, e.g. `navigator.language` on web/desktop, the native locale API on mobile).
Never assume the object `createFakePlatform`/`createMockWorkspace` returns is production-ready as-is.

## 4. Anything painted on an accent/brand-colored surface needs its own on-accent tone — DOM-only today, same principle for native

`StatTile`'s `hero` tile sets `text-white` on the container, but `AmountValue`'s default tone
(`text-foreground`) and `Badge`'s default `accent` tone (`text-accent`) both emit a color on the
child span itself, which wins over the inherited white. In light mode `--mfh-foreground` is
near-black on the indigo gradient (~3:1 contrast); in dark mode `--mfh-foreground` happens to be
near-white, so the same bug reads as fine there — dark-mode-only testing would have missed it.

**Rule**: a component that can render inside a colored "hero"/highlighted container needs an
explicit `onAccent` (or equivalent) tone variant — never rely on inherited color from a parent
`text-white`, and never test only in one theme. When adding a new hero-style container, grep the
children it renders for any tone that defaults to `text-foreground`/`text-accent` and give it an
on-accent value. `apps/mobile` has no CSS inheritance to rely on in the first place, but the same
review question applies: does this native component's text/icon color account for a colored
background, or does it assume a neutral one?

## 5. Every locale-sensitive number goes through `Intl` with an explicit locale — universal

`usePreferencesScreen.ts` displayed the exchange rate as `String(rateToDecimal(rate))` — the one
number in the app that bypassed `Intl` entirely, so it always showed a `.` decimal separator even
under the French locale, while every other number (`formatMoney`, `formatPercent`,
`formatAbsoluteDate`) already went through a `packages/app-core/src/selectors/format*.ts` helper
with an explicit `locale` argument sourced from `useFormattingLocale()`.

**Rule**: a new numeric or date display never uses `String(x)`, template-literal interpolation, or
`.toFixed()`. Add (or reuse) a `format*.ts` selector in `@repo/app-core/selectors` that takes
`locale` explicitly, and call it from the ViewModel via `useFormattingLocale()`. This applies
identically to `apps/mobile` once it has its own numeric displays — the selectors already live in
a platform-agnostic package.

## 6. Seed/mock data must actually reach every state a screen claims to support — universal

The exchange-rate section had a passing test named "shows the exchange-rate empty state" — true,
but only because the seed made the populated state unreachable (every account was EUR, base
currency was EUR, `exchangeRate: []`). The test never failed, but it never proved the populated
row rendered correctly either.

**Rule**: when a screen/section has more than one state (empty vs. populated, zero vs. many), the
seed data used by its tests must contain at least one record that reaches the populated branch.
An "empty state" test is only meaningful once a sibling test exists that reaches the non-empty one
against the same seed shape. This applies to any app's mock data, not just desktop's.

## 7. A per-record identity color is data, not a token — universal

`CategoryChips` only drew `item.color` as a fallback dot when a category had no icon — since the
transaction/recurring modals always pass an icon, the category's own color was never actually
visible, and the checked state used a hardcoded accent color instead. `Category.color`,
`Account.color`, and `Investment.color` are required, user-assigned hex values
(`hexColorSchema`) — exactly the kind of per-record identity `Avatar.tsx` already treats as real
data (inline style, `color-mix` for a soft tint), not a decoration a fallback overrides.

**Rule**: once an entity carries its own `color` field, every view of that entity — list row,
picker chip, detail hero, native list cell — renders that color, and a "selected"/"active" state
tints *with* that color rather than replacing it with a fixed accent. This is a data-modeling
convention, independent of DOM vs. native rendering.

## 8. A toggle over a signed/typed domain concept gets a matching semantic tone — DOM-only pattern, same principle for native

The income/expense `Tabs` in the transaction and recurring-rule modals had no tone variant, so
both tabs looked identical regardless of which was active — inconsistent with how the rest of the
app already colors income/expense (`pos`/`neg`) everywhere else (KPI icons, `AmountValue`,
`Badge`).

**Rule**: when a control lets the user pick between two sides of an already-colored domain
distinction (income/expense, positive/negative, active/paused), give the active/selected state the
same semantic tone (`pos`/`neg` or the app's equivalent) that the rest of the UI already uses for
that distinction — don't leave it neutral gray by default. On `apps/mobile`, the same review
question applies to whatever native segmented-control/tab component is built.

## 9. A shared package's own test-only React version can silently duplicate React in a consuming app's test run — universal, but hits `apps/mobile` hardest

Found 2026-09-27, first time `apps/mobile` composed a screen with `@repo/app-core`'s real
providers (`AppStageProviders`) in a test. `@repo/app-core` is peer-dependency-only on `react`
(`>=18`) in its actual source — correct, per docs/start-roadmap.md §5 — but its own `devDependencies`
still need a *concrete* react/react-dom to run its own Vitest suite, pinned to the "dom" catalog.
Bun installs workspace packages independently rather than hoisting: `packages/app-core/node_modules/react`
physically resolves to whatever the "dom" catalog gives (`^19.2.0`, currently `19.2.8`), while
`apps/mobile/node_modules/react` is the "native" catalog's exact `19.2.3` (Expo's SDK dictates it —
not a range). When a mobile test imports `@repo/app-core`'s source directly (shared packages ship
raw TypeScript, never a build — CLAUDE.md's Commands section), every library app-core's providers
compose that itself calls `require('react')` internally (`zustand/react`, `@tanstack/react-query`,
`react-i18next`) resolves through app-core's own nested `19.2.8`, not mobile's `19.2.3` — two
physical React instances in one render tree, "Invalid hook call".

This is real only for the test process — Metro bundles a single physical React for an actual
build, so it never reaches a device — but it's real: `vitest-native`'s "mock engine" bypasses every
standard Vite fix (`resolve.alias`, `resolve.dedupe`, `resolve.noExternal: true` — all tried, all
ineffective for a dependency reached only through `@repo/app-core`), and forcing app-core's own
devDependency to match mobile's exact version instead breaks apps/desktop's suite the same way, in
the opposite direction (desktop's react-dom, still dom-catalog, would then mismatch app-core's
react). Neither side can be pinned to satisfy both without an actual fix upstream (in `vitest-native`,
or a genuinely hoisted single React per catalog rather than per-package).

**Rule, until fixed upstream**: this is a real, filed gap, not a workaround to invent locally each
time it's hit — `apps/mobile/src/screens/dashboard/DashboardScreen.test.tsx` and
`OnboardingScreen.test.tsx`'s `it.skip` calls point back here rather than re-deriving the
diagnosis. Before spending time re-debugging the same "Invalid hook call" in a later mobile
screen's test, check here first. A composition test that only needs `@repo/app-core`'s pure
query/selector hooks (no `zustand`-backed store, no `react-i18next`) may not hit this at all —
only screens reading `usePreferencesStore`/`useTranslation`/`AccountSelectionProvider` currently do.

---

## Applicability summary

| # | Rule | DOM-only (`@repo/ui`, web, desktop) | Universal (`apps/mobile` too) |
|---|---|:---:|:---:|
| 1 | Portalled overlay z-index scale | ✓ | |
| 2 | Adapter lives in the app's own `platform-*` package | | ✓ |
| 3 | Override the fake platform's ephemeral services before shipping | | ✓ |
| 4 | Explicit on-accent tone, never inherited color | ✓ (native: same review question, no CSS inheritance) | |
| 5 | Locale-aware `format*` selector, never `String(x)` | | ✓ |
| 6 | Seed data must reach every screen state under test | | ✓ |
| 7 | Per-record `color` is data, always rendered | | ✓ |
| 8 | Signed/typed toggle gets a matching semantic tone | ✓ (native: same review question) | |
| 9 | Shared package's test-only React version can duplicate React in a consumer's test | | ✓ (hits `apps/mobile` first) |
