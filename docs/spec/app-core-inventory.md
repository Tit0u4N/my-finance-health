# `@repo/app-core` inventory

What has to be built in `packages/app-core/src/` to serve every screen in `screens.md`, given the contracts in `repository-contracts.md` and the decisions in `open-questions.md`. This is the answer to "what has to be done in app-core."

Reminder of the package's constraints (`start-roadmap.md` §5, §7): React, but **no** `react-dom`, **no** `react-native`, no visual JSX. May import `@repo/domain`, `@repo/platform`, `@repo/data`, `@repo/i18n`; **never** a concrete adapter (`platform-web`/`-tauri`/`-expo`). React stays a peer dependency — already correct in `packages/app-core/package.json`. Every item below returns data and handlers; it renders nothing.

Everything here is **blocked** on `@repo/domain` (entity types, repository interfaces) and `@repo/data` (repository implementation, gateway) landing first — this file doubles as the build order: domain → data → the providers and bootstrap hook below → stores → query/mutation hooks → selectors.

---

## 1. Providers

No visual JSX — context objects and the provider components that populate them.

| Provider | Supplies | Notes |
|---|---|---|
| Platform provider | The `@repo/platform` service bundle + capability flags | Instantiated by each app with its concrete adapter; app-core only defines and consumes the context |
| Repositories provider | The repository set from `repository-contracts.md` | **Mounted only in the app stage**, once bootstrap reports `ready` — so every consumer can assume repositories exist, never `null` |
| Query-client provider wrapper | TanStack Query context | The `QueryClient` instance itself is built by each app (cache config may reasonably differ by target); app-core wraps it alongside the other providers so screens get one composed provider tree |
| Translation provider | React binding for `@repo/i18n` | `@repo/i18n` itself stays React-free per §5; this is the hook-exposing wrapper |

## 2. Bootstrap-stage hook

Owns the sequence from `start-roadmap.md` §9: resume last workspace → accessibility check → occupancy-lock acquisition → unlock → integrity check → schema-version check → migrations → journal replay → repository construction.

Exposed as one hook returning a discriminated state union so each app renders its own widgets around it without app-core knowing about markup:

```
idle | needs-designation | needs-unlock | migrating | replaying | ready | failed
```

`needs-designation` covers onboarding step 0 (`screens.md`) — choosing or creating the file. Entirely capability-driven: no platform-name check anywhere in this hook, only calls against the injected platform contract.

**Unlock is always interactive** (`open-questions.md` #5): the key is derived from a user-supplied secret at every unlock, on every device — there is no silent device-keyring path. `needs-unlock` is therefore not a rare fallback state, it's the normal path on every cold open.

**Workspace creation sets `timezone`** (`open-questions.md` #3, `domain-model.md`'s `WorkspaceSettings`): the `needs-designation` → `ready` transition for a *new* workspace must capture the timezone once, immutably, as part of creation — not deferred to a later settings screen. `baseCurrency` is not captured here; it's ordinary mutable workspace data, set through `WorkspaceSettingsRepository` like any other post-bootstrap write (defaults reasonably, e.g. to the first account's currency, once accounts exist).

**Judgment call to record**: onboarding steps 1–2 (seed accounts, seed categories) are **not** part of this hook. Once a workspace is created, repositories are constructible — seeding accounts/categories is two ordinary `create` calls (batched, per `repository-contracts.md`) through the normal mutation hooks below, not a bootstrap special case. This keeps the state union above small and keeps "first-run data entry" logic next to the mutation hooks that already exist for the same purpose in Settings.

**Implementation note**: `useWorkspaceBootstrap` (this hook) and `bootstrapReducer`/`bootstrapState` were already built and tested before local mode existed; they're unchanged. What landed is the local `WorkspaceOpener` behind them (`@repo/data`'s `localWorkspaceOpener.ts`) and `apps/desktop`'s wiring (`src/bootstrap/`): `BootstrapStageProviders` mounted first, the bootstrap screens, `AppStageProviders` + router swapped in once `ready`. One divergence from the sequence as described above: `migrating`/`replaying` are **not reachable** through this hook as built — `unlock()`/`create()` each resolve to exactly one `WorkspaceOpenStep`, so a call that internally migrates-then-replays-then-succeeds only ever reports the final `ready`. `apps/desktop` surfaces those two phases as a cosmetic spinner label via a side-channel `onProgress` callback on the opener, not as `BootstrapState` transitions. Making them real states would need either a richer `WorkspaceOpenStep` (a stream of steps per call) or a second callback threaded through this hook — deliberately deferred rather than done speculatively.

## 3. Zustand store factories

Factories consumed through a provider, never module singletons (§5 rationale: test isolation, dependency injection, desktop multi-window). Only two are justified by `screens.md` — everything else in the design's local component state (search text, sort, filter, form drafts, onboarding step index) stays in each screen's own ViewModel, not app-core.

| Store | Holds | Backing screens | Persistence |
|---|---|---|---|
| Preferences store | `themeMode`, `sidebar` mode, amounts-hidden toggle | Settings → Preferences; sidebar (hidden toggle, collapse); every screen reading these display settings | Platform key-value contract directly — device-local, confirmed by `open-questions.md` #4. **Not** the design's `useTweaks`/`postMessage` mechanism, which is Claude Design's own prototype-editing scaffolding and ships nowhere. **`baseCurrency` does not live here** — it moved to `WorkspaceSettingsRepository` (§4/§5 below) since it's workspace data, not a device preference. **`accent` and `density` are dropped** — the design's 4 switchable accents and comfortable/compact toggle aren't v1 product features (`open-questions.md` #11); one fixed accent, one fixed density, no store entry for either. |
| Account-selection store | Currently-scoped account ids (`accSel` in the design) | Overview, Transactions, Recurring | Ephemeral — resets to "all accounts" per session; not persisted in the design and no screen implies otherwise |

Navigation state (which screen, drill-down params like the selected account/investment id) is deliberately **not** a store here: on web/desktop it's owned by `@repo/router`/TanStack Router, on mobile by Expo Router. app-core stays router-agnostic.

## 4. Query hooks

One per read operation in `repository-contracts.md`, unaware of local vs. online mode. Naming mirrors the repository method.

| Hook | Wraps | Backing screens |
|---|---|---|
| `useWorkspaceSettings()` | `WorkspaceSettingsRepository.get` | Settings → Preferences (base currency, read-only timezone display); the base-currency-conversion selector |
| `useAccounts()` | `AccountRepository.list` | Overview, Accounts, account filter (used on Overview/Transactions/Recurring), New transaction/recurring modals |
| `useAccount(id)` | `AccountRepository.getById` | Account detail |
| `useAccountBalanceHistory(id, range)` | `AccountRepository.getBalanceHistory` | Account detail, Overview per-account sparkline, Accounts card 30-day delta |
| `useExchangeRates()` | `ExchangeRateRepository.list` | Settings → Preferences (rate entry); the base-currency-conversion selector |
| `useCategories()` | `CategoryRepository.list` | Every screen with a category picker or breakdown; onboarding step 2 |
| `useTransactions(criteria)` | `TransactionRepository.list` | Overview (MTD + recent), Transactions, Account detail |
| `useRecurringRules(criteria)` | `RecurringRuleRepository.list` | Overview (upcoming), Recurring |
| `useInvestments()` | `InvestmentRepository.list` | Investments |
| `useInvestment(id)` | `InvestmentRepository.getById` | Investment detail |
| `useInvestmentValueHistory(id, range)` | `InvestmentRepository.getValueHistory` | Investment detail (price history panel + snapshot table). **Implemented**: the Investments list also calls this once per position (via `useQueries`, always at `range: '1m'`) to build the portfolio trend — not a new hook, just a second caller, and the shared `range: '1m'` means opening a position from the list hits the same cache entry Investment detail's own default range requests. |

Device-local preferences are read straight from the preferences store (§3) — there is no query hook for them; nothing calls a repository to learn `themeMode`.

## 5. Mutation hooks

One per write operation, always through the repository so the journal-before-database rule (§9) is never bypassed by a shortcut.

| Hook | Wraps | Backing screens |
|---|---|---|
| `useUpdateBaseCurrency()` | `WorkspaceSettingsRepository.setBaseCurrency` | Settings → Preferences |
| `useCreateAccount()`, `useUpdateAccount()` | `AccountRepository.create/update` | Onboarding step 1, New account modal, Account detail "Edit" |
| `useUpsertExchangeRate()` | `ExchangeRateRepository.upsert` | Settings → Preferences |
| `useCreateCategory()`, `useUpdateCategory()`, `useDeleteCategory()` | `CategoryRepository.*` | Onboarding step 2 (batched create), Settings → Categories |
| `useCreateTransaction()`, `useUpdateTransaction()`, `useDeleteTransaction()` | `TransactionRepository.*` | New transaction modal; edit/delete icons in Transactions (present in the design, not yet wired — real target) |
| `useCreateRecurringRule()`, `useUpdateRecurringRule()`, `useDeleteRecurringRule()` | `RecurringRuleRepository.*` | New recurring modal; Recurring screen's active toggle and any edit is `useUpdateRecurringRule` |
| `useCreateInvestment()`, `useUpdateInvestment()`, `useRecordInvestmentValueSnapshot()`, `useDeleteInvestment()` | `InvestmentRepository.*` | Investments "Add position"/delete; Investment detail "Edit", "Record value", delete, and the note field (an ordinary `useUpdateInvestment()` patch) |

Device-local preference writes (theme, accent, density, sidebar, hidden) go straight through the preferences store's own setter (§3) — no mutation hook, no repository, no journal entry; they're not workspace data.

No `useConfirmRecurringOccurrence` or any recurring-firing hook: decided against in `open-questions.md` #8. A recurring rule never produces a transaction on its own; the user books the real thing as an ordinary `useCreateTransaction()` call with no link back to the rule.

## 6. Selectors and logic hooks

Pure functions (plus a thin hook wrapper where they need live query data) computing everything `charts.jsx` and the screen files currently compute inline. Testable without React; reusable by mobile unchanged, since mobile shares this layer but none of the DOM chart components that will eventually render their output.

| Selector | Computes | From | Backing screens |
|---|---|---|---|
| Base-currency conversion | Each account's balance (and any cross-account sum) expressed in `WorkspaceSettings.baseCurrency`, using the matching `ExchangeRate` (identity if the account's currency already is the base) | accounts + exchange rates | Overview total balance, any other cross-account total — this is the fix for the mock's silent multi-currency bug (`open-questions.md` #2) |
| Period totals | Income, expense, net; rate (`net / income`) — the caller bounds the transaction list first, this selector only sums what it's given | transactions in range, bounded by `WorkspaceSettings.timezone` | Overview KPIs (MTD-bounded); **Account detail's Inflow/Outflow/Net KPIs**, reusing the same selector unbounded by date (all-time, per-account — the range bound is `accountTransactionsCriteria`, not a `dateRange`) |
| Account period change | Per-account sum of a date-bounded transaction list, keyed by `AccountId` | transactions in a window (e.g. the Accounts list's past-month window) | **Accounts list**'s 30-day change per account — deliberately *not* derived from `getBalanceHistory`'s series, which has no leading window-start point and reads a single-transaction account's change as zero |
| Category breakdown | Per-category spend total + share, sorted descending | expense transactions (negative-amount) in range | Overview donut, Investments allocation (same shape, different source) |
| Cashflow graph | Income-by-category nodes, expense-by-category + savings nodes, proportional links between them | income/expense transactions (split by amount sign) in range | Overview cashflow panel — **feeds** a chart component (`@repo/ui`, out of scope), this selector only shapes the `{nodes, links}` data |
| Recurring next-occurrence | Next due date per rule, computed from `freq` + `startDate` + "today" in `WorkspaceSettings.timezone` — **replaces the mock's stored `next` field** (`open-questions.md` #7) | recurring rules | Overview "Upcoming"; **Recurring screen's own "Next" column and row order** — called directly per rule, not through the "Upcoming recurring" selector below |
| Upcoming recurring | Active rules sorted by computed next-occurrence ascending, capped to N, scoped to selected accounts | recurring rules + the selector above | Overview "Upcoming" only — **not** the Recurring screen, which must list paused rules too (they carry the active toggle) and has no cap; it sorts the full rule list itself using the next-occurrence selector directly |
| Monthly commitment | Active rules' amounts normalized to a monthly equivalent (Daily ×30.44, Weekly ×4.348, Monthly ×1, Yearly ÷12, each rounded individually then summed) and split into income/expense/net, plus the active count | recurring rules | **Recurring screen's** "monthly committed in/out/net" KPI row (screens.md) — no spec defines the daily/weekly/yearly→monthly conversion; this is a normalized-average choice, not "what fires this calendar month," so a Yearly rule contributes every month instead of reading €0 for eleven of twelve |
| Investment position math | Value (`qty × current`), cost (`qty × avg`), P/L (value − cost), P/L % (a 0..1 ratio) | one investment | Investments table, Investment detail |
| Portfolio totals | Sum of position values/costs across all investments; overall P/L % | investments list | Investments KPIs |
| Allocation | Per-position share of total portfolio value (`{investmentId, share}`, share only — the join against name/color for `Donut`'s `{id, name, value, color}` input happens in the screen's ViewModel, not the selector) | investments list | Investments allocation panel |
| **Implemented** — Portfolio value history | Every position's `getValueHistory` fanned out (via `useQueries`, the same per-entity-history pattern the Accounts list already uses for its sparklines) and date-aligned into one series: `Σ(qty × price)` per date, forward-filling a position past its last snapshot in the window and back-filling one joining the chart mid-window from its earliest snapshot; a position with no snapshots at all in the window contributes a flat `qty × current` | investments list + each position's value history | Investments "30-day portfolio value trend" (screens.md) — the one KPI that has no single repository call behind it, since `getValueHistory` is per-position |
| Money formatting | Locale- and currency-aware formatting of an integer-minor-units amount, sign display, compact notation | amount (minor units) + currency (+ locale from i18n) | Every screen showing a monetary value — currently `fmtMoney` in `ui.jsx`; the *logic* moves here so it's shared with mobile, even though the pixels stay in `@repo/ui`/native |
| **Implemented** — Percent formatting | Locale-aware formatting of a 0..1 ratio via `Intl.NumberFormat({style: 'percent'})`, with optional forced sign display | ratio (+ locale) | Every P/L%/allocation-% display (Overview's category-breakdown legend, Investments/Investment detail) — previously hand-rolled once, at Overview's own `Math.round(share * 100)`% |
| Relative date formatting | "Today", "3d ago", "in 2w", etc., relative to `WorkspaceSettings.timezone` | date + "today" reference | Transaction/recurring rows, upcoming list — same split as money formatting |
| Absolute date formatting | "Sep 18" (optionally with year), via `Intl.DateTimeFormat` pinned to `timeZone: 'UTC'` so a bare calendar day never shifts under the host's local timezone | date (+ locale) | **Ledger Date column, Recurring "Next" column** — a relative label alone is unreadable once the ledger is sorted by amount instead of date |
| Recent period trend | Daily income/expense buckets over the trailing 30 days, bounded by `WorkspaceSettings.timezone`; window start clips to the earliest transaction date if history is shorter than 30 days, rather than padding empty days (`open-questions.md` #17) | transactions in range | Overview `StatTile` income/spending sparklines (`ui-inventory.md` §3 `MiniBar`) |
| Description suggestions | Distinct past `desc` values (case-insensitively deduped, most recent spelling kept), most-recent-first with no query, fuzzy-ranked (`fuse.js`) against a query — the transactions read is bounded to the trailing year, since `TransactionCriteria` has no pagination | transactions in range | New/Edit transaction dialog's description `Autocomplete` (`ui-inventory.md` §1) |

**Rendering-boundary rule, stated explicitly**: for every row above, app-core's job stops at producing plain data (numbers, labeled arrays, discriminated unions) and handlers (the mutation callbacks). The chart primitives ported from `charts.jsx` (`AreaChart`, `Donut`, `Sankey`, `LineChart` — all hand-rolled SVG except `Sankey`, which is `chartjs-chart-sankey`-backed per `open-questions.md` #14) and every visual component in `ui.jsx`/`desktop-shell.jsx` belong to `@repo/ui` on web/desktop and to `apps/mobile`'s own native components — neither is in scope for this file, and app-core must never import either. The component/prop-level continuation of this table is `ui-inventory.md`, which pins each chart's input shape to the selector row here that produces it.

**Gap closed (2026-09-09)**: `MiniBar`'s sparkline input (the Overview `StatTile` income/spending KPIs) previously had no selector producing it — the mock's version (`incomeBars`/`expenseBars` in `DeskDashboard`) is synthetic `Math.sin` noise, not derived from real transactions. Now covered by the "Recent period trend" row above (`open-questions.md` #17).
