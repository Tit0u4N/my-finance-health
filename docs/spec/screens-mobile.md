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

First pass (2026-09-27): Dashboard (Home tab) and the 3-step onboarding flow; every other tab a
routed placeholder (`ComingSoon`), staged deliberately rather than landing all ~15 screens/5
charts/full nav in one diff.

Activity pass (2026-09-28): the **Activity tab** is real — both segments (ledger, recurring) with
full CRUD, matching `open-questions.md` #19's decision for desktop. Accounts, Invest and Settings
remain `ComingSoon`.

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
| Activity — shell | `screens-tx.jsx` header + tabs | Hosts both segments; the header's round `+` opens whichever create sheet the visible segment calls for | workspace settings (timezone → "today", base currency), accounts, categories | — | header subtitle: listed-transaction count on the ledger, active-rule count on recurring | which segment is visible |
| Activity — ledger (Transactions segment) | `screens-tx.jsx` `TxAll` | The full transaction list, searchable and filterable, grouped by day | transactions for the current filter set (`useTransactions`, `keepPreviousData`), accounts, categories | `Transaction` create / update / delete | per-day buckets with a signed per-day total (base currency); per-row category colour/icon, account name, signed amount; relative day label inside the week, absolute beyond it | search text, type / account / category filter, which row's action sheet is open, which row is pending deletion |
| Activity — recurring (Recurring segment) | `screens-tx.jsx` `TxRecurring` | One card per rule, soonest first, with the pause toggle | recurring rules (unscoped criteria), accounts, categories | `RecurringRule` create / update / delete, and the `active` toggle (the same `update` operation) | next occurrence per rule (`computeNextOccurrence`) and the card order it drives; relative "next" label; frequency label | which card's action sheet is open, which rule is pending deletion |
| Activity — transaction sheet | `screens-tx.jsx` new-transaction sheet | Create and edit in one draft | categories, accounts, description suggestions (trailing year) | `Transaction` create / update | amount sign, derived from the picked category's `kind` — never from the expense/income toggle, which only re-filters the categories offered and resets the pick | draft (kind, amount, description, category, account, date mode + date, note), submit error |
| Activity — recurring sheet | `screens-tx.jsx` new-rule sheet | Create and edit in one draft | categories, accounts | `RecurringRule` create / update | amount sign, same derivation as above | draft (kind, description, amount, frequency, account, category, start date), submit error |
| Activity — row actions / delete confirm | — (native stand-in) | Edit or delete one row | — | — | — | which row, and whether the confirm step is showing |
| Accounts, Invest, Settings | — | Not built yet | — | — | — | — |

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

### Activity tab — dropped or diverged (2026-09-28)

- **No KPI tile row.** Desktop's ledger has Inflow/Outflow/Net tiles and its Recurring screen has
  four monthly-commitment tiles; the mobile mock has neither on this tab, and `computePeriodTotals`
  / `computeMonthlyCommitment` are already covered by desktop. The header subtitle carries the one
  count each segment actually needs. `transactions:list.kpi*` / `recurring:list.kpi*` therefore stay
  desktop-only keys.
- **Per-screen account filter, not a cross-screen scope.** Desktop shares one
  `AccountSelectionProvider` across Overview/Transactions/Recurring; mobile has no such store (see
  "Cross-screen state" below), and the mock draws its own account chip inside the filter row. So the
  ledger's account filter is local `useState`, and it is a *single* account (or "all"), matching the
  chip — not desktop's multi-select.
- **Recurring segment has no account filter at all**, matching the mock: its criteria are always
  `{}`. Only the ledger filters.
- **Text/chip date entry, not a native date picker.** The transaction sheet offers Today / Yesterday
  / Custom, with Custom revealing a `YYYY-MM-DD` field; the rule sheet's start date is that field
  directly. A real wheel/calendar picker needs `@react-native-community/datetimepicker`, an
  unapproved dependency for this pass — flagged here rather than silently added. The consequence is
  that both sheets validate the typed date with `safeParse` (desktop's forms can `parse`, because
  their `DatePicker` constrains the value).
- **Row actions are a sheet, not a dropdown menu.** Desktop uses `DropdownMenu` anchored to the row;
  there is no native equivalent worth hand-rolling, so `MoreVertical` opens a bottom sheet listing
  Edit / Delete. Delete then goes through `ConfirmSheet`, same two-step as desktop's `ConfirmDialog`.
- **Option pickers are sheets, not wheels.** `ChipSelect` opens a `Sheet` of options with a check on
  the current one — same reason as the date picker: no picker dependency is approved.
- **No "Paused" badge.** The mock draws one next to the switch. The switch's own off state plus the
  card's reduced opacity already say it, and no `recurring:` key exists for the word — adding one to
  restate what the control shows would be redundant chrome.
- **No sort control.** Desktop's ledger sorts by date or amount from its column headers; the mock has
  no sort affordance and the criteria are fixed at `date:desc`, which is also what the day grouping
  depends on.
- **No search debounce.** Desktop debounces because each keystroke would otherwise write a router
  search param; there is no URL here, and `keepPreviousData` keeps the list on screen while the next
  criteria resolve.
- **Rule cards show the category's icon and colour**, where the mock draws a generic `repeat` disc —
  the category is the useful identity, and rendering `Category.color` on every view of the entity is
  `cross-app-pitfalls.md` #7. The recurrence is carried by the frequency and next-occurrence badges.
- **Both segments' hooks run whether or not their segment is visible.** React forbids a conditional
  hook; the cost is one cached query for the hidden segment, bought back as an instant tab switch and
  a header subtitle that can count either side.

## Cross-screen state

`amountsHidden` is the only cross-screen state reused so far — same store as desktop
(`@repo/app-core`'s `PreferencesProvider`), already device-local and persisted
(`open-questions.md #4`). Every money value on the Activity tab reads it too, through `AmountValue`.
No account-scope filter exists on mobile (see the Dropped lists above), so there is nothing
equivalent to desktop's `accSel` to share: the ledger's account chip is that screen's own state and
resets when the tab unmounts.
