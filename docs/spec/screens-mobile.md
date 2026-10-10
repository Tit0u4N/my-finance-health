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

Accounts + Settings pass (2026-09-29): both tabs are real. **Invest remains the only `ComingSoon`
placeholder.** This pass also fixed a latent bug the Accounts/Settings work exposed:
`apps/mobile/src/root/useAppRoot.ts`'s fixture workspace was booting with `createFakePlatform`'s
all-`true` default `PlatformCapabilities` — meaning a naive capability gate (Settings → Data) would
have rendered as if file import/export worked, against `@repo/platform-expo`'s still-placeholder
adapter. `apps/mobile` now passes its own honest capability set (everything false) into
`createMockWorkspace`, which gained an optional `{ capabilities?, locale? }` parameter for exactly
this (`packages/data/src/mock/createMockWorkspace.ts`) — apps/desktop's own call is unaffected,
since the parameter defaults to the previous all-`true` behaviour. `locale` stays on the default
`'en-US'` placeholder for now: a real device-locale override needs `expo-localization`, a new
dependency that belongs in `@repo/platform-expo` (`cross-app-pitfalls.md` #2), not added in this
pass — left as a named follow-up rather than silently deferred.

Invest pass (2026-10-07): the **Invest tab** is real (list, detail, add/edit position, record
value, delete) — no `ComingSoon` placeholder remains. Mock `InvestPortfolio`/`InvestDetail` are
followed (hero + portfolio trend, allocation bars, positions list; detail with price chart, range
tabs, value snapshots). Diverged: no sortable table/curve select/notes panel/KPI tiles (desktop-only);
edit/delete live on detail (pencil + "Delete position"), not per-row; record-value date is typed
`YYYY-MM-DD`. Added `useInvestmentsValueHistory` to app-core (fan-out sibling of
`useAccountsBalanceHistory`, so mobile never imports `@tanstack/react-query`).

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
| Onboarding — choose workspace | `onboarding.jsx` step 0 | Still presentational inside the app stage — a workspace is already open by the time it shows. The real create/import/unlock lives in the **Bootstrap stage** below, which runs before the app stage under `EXPO_PUBLIC_STORAGE_MODE=classic`. | — | — | selected option (`create` \| `open`) |
| Onboarding — add accounts | `onboarding.jsx` step 1 | Seed at least one account before entering the app | live `Account` list (so a mid-flow add shows up immediately) | `Account` (create, one or more) — a **real** `useCreateAccount` mutation against the fixture repositories, same hook apps/desktop's own onboarding-equivalent work would use | draft account form |
| Onboarding — pick categories | `onboarding.jsx` step 2 | Enable/disable the seed category set | seed category list (static, not repository-backed — see caveat below) | `Category` (create the enabled subset) via `useCreateCategory` | per-category on/off toggle |

**Caveat, stated plainly rather than engineered around:** the fixture workspace
(`createMockWorkspace.ts`) already ships its own seed accounts/categories (the same ones the
Dashboard row below reads). Running onboarding today adds *more* accounts/categories alongside
that seed rather than starting from empty — there's no real empty-workspace state to demonstrate
against in `inMemory` mode. Under `classic` it resolves as predicted: a freshly created local
workspace is genuinely empty, so steps 1–2 now seed a real, empty workspace.

### Bootstrap stage (`EXPO_PUBLIC_STORAGE_MODE=classic`, 2026-10-07)

`@repo/platform-expo` is real, so mobile has a local mode (`open-questions.md` #25).
`apps/mobile/src/root/LocalAppRoot.tsx` mirrors desktop's `LocalApp.tsx`: bootstrap stage (platform +
translations only) until the workspace is `ready`, then `AppStageProviders` around the Expo Router
`Stack`. All UI lives in `apps/mobile/src/bootstrap/` (View + ViewModel pairs, native components, no
sharing with desktop's DOM ones; English copy, like desktop's bootstrap — no i18n namespace yet).

| View | Purpose | Notes |
|---|---|---|
| Workspace list | Recent sandbox workspaces, *Create a workspace*, *Import a workspace* | `needs-designation` |
| Create sheet | Name, base currency, passphrase ×2 (min 8, `@repo/app-core/bootstrap/newPassphrase`) | Workspace lives in the app sandbox (path chosen by the core, stated in the sheet). Optional *Save a copy to…* folder picker (iCloud Drive, On My iPhone…): the copy is written right after creation and an alert names the folder |
| Import sheet | Pick a folder → list the `.mfhdb` files that have a `.mfhmeta` beside them → copy into the sandbox → straight to unlock | Folder must directly contain the file |
| Unlock | Passphrase, *Choose another workspace* | `needs-unlock`; no biometric option yet |
| Progress / error | Spinner labelled by the cosmetic `migrating`/`replaying` side-channel; error copy from the shared `describeBootstrapError`, retry, choose another | |

`useWorkspaceBootstrap` gained `chooseAnother()` (reload the recent list, return to the list) for the
unlock/error screens and Settings → Data's *Switch workspace*. A dev build is required (SQLCipher
comes from `expo-sqlite`'s config plugin; Expo Go cannot run it).

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
| Accounts (list) | `screens-main.jsx` `AccountsList` | Browse every account as a card, with a balance sparkline and past-month change | accounts, per-account balance history (`getBalanceHistory(id, '1m')`, one query per account), workspace settings, exchange rates | `Account` create | cross-account total (base-currency, converted); per-account 30-day change (see "Accounts tab" below for why it's not derived from the sparkline series) | new-account draft |
| Account detail | `screens-main.jsx` `AccountDetail` | One account's trend and full transaction list | one account, its transactions (search/category-filterable), its balance history (range-selectable: 7d/1m/3m/1y/all) | `Account` update (name, type — no colour/currency control on mobile) | balance trend points; per-row relative date | selected range, search text, category filter, edit draft |
| New/Edit account sheet | `screens-tx.jsx` `AddAccountModal` | Create an account, or rename/retype an existing one | account types, currencies | `Account` create / update | auto-assigned colour on create (`categoricalPaletteHex[n % 8]`, design-system.md §3) | draft (name, type, currency, initial balance), submit error |
| Settings — root menu | `screens-invest-settings.jsx` `SettingsScreen` | Entry point into every settings sub-screen, grouped "App"/"Support" | categories (for a subtitle count elsewhere), platform capabilities (for the "Encrypted" badge only) | — | — | — |
| Settings → Preferences | `screens-invest-settings.jsx` `SetPrefs` | Theme, language, base currency, exchange rates — no sidebar control (DOM-only) | workspace settings, exchange rates, accounts (to know which currencies need a rate) | device-local preference writes (`themeMode`, `language`); `WorkspaceSettingsRepository.setBaseCurrency`; `ExchangeRateRepository.upsert` | — | per-currency rate draft map |
| Settings → Categories | `screens-invest-settings.jsx` `SetCategories` | Manage the category list, one kind at a time via a segmented switch | categories, transaction count for the category pending deletion | `Category` create / update / delete | usage-warning count on delete | active tab (expense/income), create/edit draft, deleting category |
| Settings → Data | `screens-invest-settings.jsx` `SetDatabase`, adapted | Real workspace facts (timezone, base currency, record count) always; file actions capability-gated | workspace settings, accounts, categories, transactions, recurring rules, exchange rates (for the record count) | — | total record count | — |
| Settings → About | `screens-invest-settings.jsx` `SetAbout`, adapted | Static app info plus the storage/sync/telemetry facts | platform capabilities (for the "Encrypted" badge only) | — | — (hardcoded strings) | — |

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

### Accounts + Settings tabs — dropped or diverged (2026-09-29)

- **No accent colour, density, or tab-bar-style pickers in Preferences.** The mock's Preferences
  screen shows all three; `open-questions.md` #11 already dropped accent and density as non-v1
  product features for desktop, and this pass extends the same reasoning to the mock's tab-bar-style
  picker — a designer tweak, not a shipped feature. Theme mode (light/dark/system) is the only
  theming axis Preferences exposes.
- **No sidebar-mode control.** `SidebarMode` is a DOM-only concept (`open-questions.md` #11); mobile
  has a tab bar, not a collapsible sidebar, so `usePreferencesScreen.ts` never reads or exposes it.
- **Settings → Database's "Active file" panel does not transpose.** The mock shows
  `~/Documents/MyFinanceHealth.db`, a size, and a "Switch file" action. `start-roadmap.md` §325 and
  `context.md`'s file-location row both say mobile cannot open a file in place — the model is
  explicit import into, and export out of, the app-reserved directory. Settings → Data instead shows
  real workspace facts (timezone, base currency, record count) unconditionally, and renders
  `settings:database.emptyState` ("Not available on this platform") in place of file actions while
  `platform.capabilities.canWriteFile` is false (the `inMemory` fixture). Under `classic` it is true,
  and a *Backup and transfer* group appears: **Export workspace** (folder picker → dated subfolder,
  e.g. into iCloud Drive), **Lock workspace**, **Switch workspace** — gated on a real local session
  (`useWorkspaceSession()`), so the fixture mode never shows an export with nothing behind it. The Data *row* on the root menu is never hidden by this gate — only the row's own screen
  content is — so the destination stays reachable by deep link and back-stack.
- **No "Reset everything" action.** No `resetWorkspace` mutation exists anywhere in
  `@repo/app-core`'s mutations, and desktop's own `useDatabaseScreen.ts` already ships this action
  with no handler wired up. Shipping an inert destructive button on a brand-new screen is exactly the
  dead chrome this doc's other "Dropped" lists already refuse (the notification bell, the "Paused"
  badge).
- **No "Switch file" / "Create backup" / "Export CSV" actions** under those names: the mobile
  equivalents are *Export workspace* / *Switch workspace* (above). Rolling backups and CSV export
  are not built.
- **"Encrypted at rest" badge is capability-gated, not hardcoded on.** The mock's Settings identity
  card always shows it. `platform.capabilities.hasEncryptedSqlDriver` is false in the in-memory fixture and true under
  `classic`, so the badge appears on both the Settings root card and the About screen only for a real
  encrypted workspace.
- **Gradient monogram avatar → solid accent fill.** Same call the Dashboard pass already made for
  its hero card: `expo-linear-gradient` is an unapproved new dependency.
- **Account detail's header shows only balance + two badges, no KPI tile row.** Matches the mock
  exactly, and is the same "no KPI tile row" decision the Activity pass already made — `Inflow`/
  `Outflow`/`Net` and `computePeriodTotals` stay desktop-only for this screen too.
- **Account detail's search/filter are an inline `Field` + `ChipSelect`, not the mock's two round
  icon buttons.** Consistency with the already-shipped `LedgerTab.tsx` pattern won out over fidelity
  to a mock of a screen that hadn't shipped yet.
- **`LineChart`'s hover tooltip is dropped**, same reasoning as the Activity tab's date-picker and
  option-picker entries: no touch equivalent of a mouse hover exists, and the chart geometry
  (`apps/mobile/src/ui/charts/lineChartMath.ts`) is a duplicate of `@repo/ui`'s own module rather
  than a shared one, for the same rendering-boundary reason `Sankey`/`Donut`/`MiniBar` already are.
- **The 30-day per-account change is a date-bounded transaction sum, never derived from
  `getBalanceHistory`'s series** — `app-core-inventory.md` §6 calls this out explicitly: that
  series has no leading window-start point, so a single-transaction account's last-minus-first would
  read as zero even when the real change is not.

## Cross-screen state

`amountsHidden`, `themeMode` and `language` are the cross-screen state reused so far — the same
store as desktop (`@repo/app-core`'s `PreferencesProvider`), already device-local. `amountsHidden`
was already persisted; `themeMode` and `language` are too, in principle, but on mobile today they
reset on cold start (see the Status section's note on `useAppRoot.ts`'s fixture `keyValueStore`
being in-memory until `@repo/platform-expo` lands). Every money value on the Activity and Accounts
tabs reads `amountsHidden` through `AmountValue`; `apps/mobile/src/theme/ThemeModeSync.tsx` pushes
`themeMode` into `ThemeProvider` (which cannot read the store itself — it sits above
`AppStageProviders` in `app/_layout.tsx`) so a Preferences theme change repaints the whole app, not
just the Settings tab. No account-scope filter exists on mobile (see the Dropped lists above), so
there is nothing equivalent to desktop's `accSel` to share: the ledger's account chip is that
screen's own state and resets when the tab unmounts, and so is the Accounts list's palette-index
colour assignment (it reads `accounts.length` fresh each time, not a shared counter).
