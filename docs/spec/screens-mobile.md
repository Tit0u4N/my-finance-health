# Screens — mobile (first pass)

The desktop pass's `screens.md` explicitly deferred this ("mobile screens get their own pass
later, by decision" — `README.md`). This is that pass, for the screens actually built so far.
Same format: one row per screen, purpose and data needs only.

## Source

Claude Design project `7722ea98-be3f-45fc-a294-5a245d0490d7`, mobile target, read on 2026-09-27.
Files read: `My Finance Health.html`, `app.jsx`, `charts.jsx`, `data.js`, `ios-frame.jsx`,
`onboarding.jsx`, `screens-invest-settings.jsx`, `screens-main.jsx`, `screens-tx.jsx`, `style.css`,
`tweaks-panel.jsx`, `ui.jsx` — the project's mobile/legacy variants the desktop pass explicitly
left out. `tweaks-panel.jsx` is design-tool scaffolding, same verdict as the desktop pass reached
for it: not part of the product.

## Status

Built in this pass: Dashboard (Home tab) and the 3-step onboarding flow. Every other tab
(Accounts, Activity, Invest, Settings) is a routed placeholder (`ComingSoon`) — real content is a
later pass, staged deliberately rather than landing all ~15 screens/5 charts/full nav in one diff.

## Rendering boundary

`apps/mobile` shares no UI component with web/desktop (CLAUDE.md) — every screen below is its own
native implementation, reusing `@repo/app-core`'s queries/mutations/selectors unchanged (same as
apps/desktop's own screens do) but never `@repo/ui`/`@repo/routes`/`@repo/router` (DOM-only,
`biome.json`-enforced). Icons: `lucide-react-native` (`ui-inventory-mobile.md` §3, same slug
mapping as desktop's `packages/routes/src/shared/visuals.ts`, duplicated rather than shared for
the same rendering-boundary reason).

## Bootstrap-adjacent

| Screen | Source | Purpose | Reads | Writes | Local-only UI state |
|---|---|---|---|---|---|
| Onboarding — choose workspace | `onboarding.jsx` step 0 | Presentational only in this pass — `EXPO_PUBLIC_STORAGE_MODE=inMemory`'s fixture workspace is always already open, so there is no empty-workspace state for a real "create/open" action to land on yet (`@repo/platform-expo` is still a placeholder). Mirrors apps/desktop's own "bootstrap-only UI ahead of its backing infra" precedent. | — | — | selected option (`create` \| `open`) |
| Onboarding — add accounts | `onboarding.jsx` step 1 | Seed at least one account before entering the app | live `Account` list (so a mid-flow add shows up immediately) | `Account` (create, one or more) — a **real** `useCreateAccount` mutation against the fixture repositories, same hook apps/desktop's own onboarding-equivalent work would use | draft account form |
| Onboarding — pick categories | `onboarding.jsx` step 2 | Enable/disable the seed category set | seed category list (static, not repository-backed — see caveat below) | `Category` (create the enabled subset) via `useCreateCategory` | per-category on/off toggle |

**Caveat, stated plainly rather than engineered around:** the fixture workspace
(`createMockWorkspace.ts`) already ships its own seed accounts/categories (the same ones the
Dashboard row below reads). Running onboarding today adds *more* accounts/categories alongside
that seed rather than starting from empty — there's no real empty-workspace state to demonstrate
against yet. This resolves on its own once `@repo/platform-expo`'s real adapter lands and a
freshly created local workspace is genuinely empty.

## App stage

| Screen | Source | Purpose | Reads | Writes | Derived values | Local-only UI state |
|---|---|---|---|---|---|---|
| Home (dashboard) | `screens-main.jsx` `Dashboard` | Month-to-date financial summary | accounts, transactions (current month, every account — the mobile mock has no account-scope filter, unlike desktop's Overview), exchange rates, categories | — | total balance (base-currency, converted — not the mock's raw same-currency sum); MTD income/expense; category spend breakdown (donut); cashflow sankey (income category → total → expense category + savings); net savings rate | amounts-hidden toggle (shared with desktop's own preference — `usePreferencesStore`, real, persisted) |
| Accounts, Activity, Invest, Settings | — | Not built this pass | — | — | — | — |

Dropped relative to both the mock and desktop's Overview, with a reason each:

- **Per-account list + sparklines**, **upcoming recurring**: not present on this tab in the mobile
  mock (`screens-main.jsx`'s `Dashboard`) — they belong to the (not-yet-built) Accounts tab instead.
- **"Net saved" KPI tile**: desktop-only; the mobile mock's KPI row has exactly two tiles
  (income, expense).
- **KPI delta badges ("+12%"/"−4%")**: the mock hardcodes these with no derivation — nothing in
  `computeRecentPeriodTrend`/`computePeriodTotals` backs a month-over-month comparison yet. Rather
  than fabricate a number the app would be lying about, they're dropped until a real "previous
  period" selector exists. The hero card's own delta (net savings rate) is real —
  `computePeriodTotals().rate`, already computed for desktop's `kpi.netRate`.
- **Hero card gradient background**: the mock uses a two-stop CSS gradient; rendering that on
  native needs `expo-linear-gradient`, an unapproved new dependency for this pass. Solid accent
  fill instead — flagged here rather than silently added.
- **Notification bell**: decorative-only in the mock (no notifications feature, no real unread
  state) — dropped rather than shipping dead chrome.

## Cross-screen state

`amountsHidden` is the only cross-screen state reused this pass — same store as desktop
(`@repo/app-core`'s `PreferencesProvider`), already device-local and persisted
(`open-questions.md #4`). No account-scope filter exists yet on mobile (see the Dropped list
above), so there is nothing equivalent to desktop's `accSel` to share.
