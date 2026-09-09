# Decisions log

> **Status: resolved.** This file was "open questions" during the first spec pass; every item below now carries a decision. Kept as a log — `domain-model.md`, `repository-contracts.md`, and `app-core-inventory.md` reference these by number rather than re-arguing them. Four follow-on decisions (9a–9d) were forced open — 9a and 9b by the answers to #2 and #7/#8 during the spec pass, 9c and 9d by `domain-model.md`'s own remaining open points once the first `@repo/domain`/`@repo/data`/`@repo/app-core` implementation pass landed — and are recorded at the end.

---

### 1. Money representation — **integer minor units**

Decided: money is an integer in minor units (cents), not a float. Formatting to a display string happens only at the presentation edge (the money-formatting selector in `app-core-inventory.md` §6).

**Applies to**: `Account.balance`, `Transaction.amount`, `RecurringRule.amount`, `Investment.avg`/`current`, `InvestmentValueSnapshot.price`, `ExchangeRate.rate` (see 9a).

### 2. Cross-currency aggregation — **convert to a workspace base currency**

Decided: each account keeps its own `currency` (real, per-account field). The workspace has one `baseCurrency`, user-selectable in Settings, mutable at any time. Any total that spans accounts (dashboard total balance, etc.) converts every account's balance into `baseCurrency` before summing.

**New requirement this creates**: a rate to convert with. See decision 9a.

### 3. Timezone / date boundary — **workspace-level, fixed at creation**

Decided: the workspace has one timezone, set when the database is created, immutable afterward. All period boundaries ("this month," "today," relative labels) use it — not the opening device's local timezone. Consistent across devices opening the same workspace from different timezones (the §9 synced-folder scenario).

### 4. Preferences scope — **local device, except base currency**

Decided: `themeMode`, `accent`, `density`, `sidebar` mode, amounts-hidden are per-device settings — platform key-value storage, never synced, no domain entity, no repository. `baseCurrency` (decision 2) is workspace data, not a device preference — it needs a real write path through the workspace's repository/journal like any other workspace field, because it must be consistent for anyone opening the workspace.

**Consequence**: there is no `PreferencesRepository`. There is a small piece of workspace-level settings (base currency + timezone) that does need one — see `repository-contracts.md`'s `WorkspaceSettingsRepository`.

### 5. Key-portability policy — **user-secret-derived key**

Decided: the encryption key is derived from a user-supplied secret at every unlock (§9's second guard mode), not tied to the device. The file stays portable — matches the onboarding design's "Open an existing file … from a backup or another device" option. Cost: the bootstrap-stage hook always prompts for a passphrase on unlock, on every device, every launch — never a silent device-keyring unlock.

### 6. Transaction/RecurringRule `type` field — **eliminated**

Decided: neither `Transaction` nor `RecurringRule` stores a `type` field. Income vs. expense is derived from the sign of `amount` (and must agree with the referenced `Category.kind` — a validation invariant, not a second source of truth). One fact, one field.

### 7. Recurring rule `next` — **computed, not stored**

Decided: `RecurringRule` does not store `next`. The next occurrence date is a selector output, computed from `freq` + an anchor date + "today" (per decision 3's workspace timezone). This requires `RecurringRule` to carry an anchor/start date — added to `domain-model.md` as `startDate`, since the mock's `next` field can no longer supply this.

No reschedule/skip mechanism is implied — consistent with decision 8, since nothing needs to "advance" a value that isn't stored.

### 8. Recurring rules → transactions — **purely informational, never automatic**

Decided: a `RecurringRule` never creates a `Transaction` by itself, automatically or via a "confirm" action. It exists only to inform the Overview "Upcoming" list and the Recurring screen. When a recurring charge or income actually happens, the user records it the ordinary way — a normal `Transaction`, with no link back to the rule that predicted it.

**Consequence**: no `useConfirmRecurringOccurrence` hook, no watermark/idempotency logic, no link field between `Transaction` and `RecurringRule`.

### 9. Investment history — **manual snapshots only, no market-data feed**

Decided: `InvestmentValueSnapshot` (proposed in `domain-model.md`) is user-entered only, via the design's "Record value" action, whenever the user chooses to. No automatic price fetching — no market-data platform capability is added. The single-position/average-cost model (matching the mock) is accepted as sufficient; full buy/sell lot history is not modeled.

---

## Follow-on decisions (forced open by the above)

### 9a. Exchange rate source — **manual entry**

Decision 2 requires a rate to convert non-base-currency account balances with. Decided: manual entry, the same pattern as investment snapshots — the user enters/updates a rate by hand. No external rate API (would add a network dependency even to local-mode workspaces, and no such platform capability exists in `start-roadmap.md` §8's service table), no static/hardcoded rate (wrong over time).

**Minimal model adopted**: one current rate per non-base currency (`ExchangeRate: { currency, rateToBase, updatedAt }`), not a full rate history — this only serves live aggregate totals, not historical restatement. If historical multi-currency reporting is ever needed, this can grow into a snapshot history later without a redesign (same shape `InvestmentValueSnapshot` already establishes). New entity added to `domain-model.md`.

### 9b. Workspace settings as a real thing

Decisions 3 and 4 both attach a fact to "the workspace" that isn't `Account`/`Category`/etc. data: `timezone` (immutable) and `baseCurrency` (mutable). Formalized as a `WorkspaceSettings` record in `domain-model.md`, with its own narrow repository in `repository-contracts.md`.

### 9c. Account balance storage — **maintained running total**

`domain-model.md` left open whether `Account.balance` is a stored running total or derived on read from `Transaction` rows. Decided, during the first `@repo/domain`/`@repo/data`/`@repo/app-core` implementation pass: **stored**, updated atomically inside the same `gateway.batch()` as every transaction create/update/delete. Deriving on read was rejected — the closed gateway operation set has no aggregate/sum primitive, so every balance read would mean fetching every transaction on the account first, which is exactly the round-trip-chaining failure mode §9 warns online mode against. `AccountRepository.getBalanceHistory` still derives its bounded series on read, by replaying transactions backward from this maintained balance (`@repo/data/repositories/balanceHistory.ts`) — only the current balance itself is a stored field.

### 9d. Exchange rate fixed-point convention — **1e6 scale**

`domain-model.md` left `ExchangeRate.rateToBase`'s fixed-point convention "TBD". Decided: integer scaled by `RATE_SCALE = 1_000_000` (6 decimal places) — e.g. 1 USD = 0.923400 EUR is stored as `923400`. Six decimals are enough precision for account-level totals without float drift; `@repo/domain/primitives/rate.ts` exposes `rateFromDecimal`/`rateToDecimal` to convert to and from the decimal a settings form displays.

---

## UI-pass decisions (2026-09-04)

Forced by the second design read, scoped to `design-system.md`, `ui-inventory.md`, and `routes.md` — the rendering-layer pass `README.md` originally deferred.

### 10. Design-token source of truth — **the mock's palette replaces the current scaffold**

Decided: `packages/design-tokens/src/*.ts` currently holds generic placeholder values (a minimal oklch palette, a 6-step type ramp, 4 radii) never tied to any design. The mock's `THEMES`/`ACCENTS` in `ui.jsx` and `desktop-style.css` become canonical (`design-system.md`). The package's existing **oklch** format is kept — the mock's hex/rgba values are converted losslessly at implementation time (`culori` or `colorjs.io`), not hand-converted, since oklch is a re-encoding of the same colors, not a re-decision.

**Flagged, not decided**: `design-tokens` also feeds `apps/mobile`'s native `StyleSheet` (`start-roadmap.md` §12), which can't consume oklch strings directly. Whether the package exports a conversion helper or a dual web/native shape is deferred to the mobile UI spec pass (`design-system.md` §10) — recorded here so it isn't silently assumed away.

### 11. Theming scope — **theme mode only, no accent presets, no density**

Decided: of the mock's three theming axes (light/dark/system, 4 switchable accents, comfortable/compact density), only theme mode ships as a real product feature. One fixed brand accent (the mock's `indigo` preset), one fixed (comfortable) density.

**Why**: the other two axes exist in the mock as `TweaksPanel` — the design tool's own prototype-editing scaffolding (`README.md`'s "Not part of the product" note on `tweaks-panel.jsx`) — not as evidenced product requirements. Shipping them would mean a runtime CSS-variable-swapping layer and a density scale threaded through every spacing/row-height value in `@repo/ui`, for a feature nobody asked for.

**Consequence**: `app-core-inventory.md` §3's preferences store drops `accent` and `density`; `screens.md`'s Settings → Preferences row drops the accent-picker and density-picker sub-rows; `design-system.md` has no accent-preset or density-scale tokens.

### 12. `@repo/ui` primitives — **shadcn/ui (base-ui), not a port of the mock's components**

Decided: `start-roadmap.md` §12 already specifies `@repo/ui` as "shadcn/ui primitives... Tailwind theme sheet fed by design tokens" — this resolves a latent conflict between that line and the mock, which ships its own hand-rolled `Button`/`Field`/`Select`/`Switch`/`Modal`/`Table`/`Tabs` with no primitive library underneath (no focus trap on `Modal`, no `role="switch"` on `Switch`, outside-click hand-rolled on `AccountFilter`). The roadmap wins: `ui-inventory.md` §1 maps each mock primitive onto its shadcn equivalent, restyled with `design-system.md` tokens, rather than transcribing the mock's version. Primitive library is **base-ui** (MUI's headless library), not Radix — shadcn's CLI supports both; base-ui is the pick for this project.

### 13. Icon set — **`lucide-react`, not the mock's inline SVGs**

Decided: CLAUDE.md already mandates `lucide-react-native` (never `lucide-react`) on mobile, implying the reverse convention on DOM. The mock hand-draws ~50 icons as inline SVG paths in `ui.jsx`'s `Icon` component; `ui-inventory.md` §4 gives the full name mapping onto `lucide-react` equivalents.

### 14. Chart library — **none; hand-rolled SVG, ported from `charts.jsx`**

Decided: the mock's `AreaChart`/`Donut`/`Sankey`/`LineChart`/`MiniBar` are custom SVG with no charting library dependency — worth keeping rather than introducing one, since a Sankey in particular has no first-class support in most lightweight chart libraries and would force a heavier dependency just for that one panel. `ui-inventory.md` §3 ports these near-verbatim, each pinned to the `app-core-inventory.md` §6 selector that produces its input shape. `ProgressBar` is declared in `charts.jsx` but consumed by no screen — excluded from the v1 port.

### 15. `RichNote` — **controlled component; persistence and rich-text mechanism both deferred**

Decided: the mock's `RichNote` (Investment detail description panel) writes `window.localStorage` directly and uses `document.execCommand` for formatting commands. Per the rendering-boundary rule, `@repo/ui`'s `RichNote` becomes fully controlled (`value`/`onChange`) with no storage of its own.

**(a) Resolved (2026-09-09)**: `Investment.note`, string, optional, added to `domain-model.md`. Persisted through the ordinary `useUpdateInvestment()` mutation hook (`app-core-inventory.md` §5) — no new repository operation needed, `note` is just another field on the existing `update(id, patch)`.

**Still flagged, not decided**: (b) `document.execCommand` is deprecated; its replacement (a minimal manual toolbar, or a small controlled-rich-text library) is an implementation-time call, not fixed here.

### 16. Route/search-param addressability — **range and ledger filters are search params; scope, hidden-toggle, and modals are not**

Decided (`routes.md` §3): `range` on Account/Investment detail and the Transactions ledger's `search`/`type`/`category`/`sort` become typed TanStack Router search params — real filtered views worth bookmarking or sharing. Account scope (`accSel`) stays the `app-core-inventory.md` §3 Zustand store (already decided there as ephemeral, non-persisted — restated, not reopened); the amounts-hidden toggle stays the preferences store; the three creation modals stay local component state, not routes — transient drafts with no deep-link use case, and CLAUDE.md's anti-over-engineering guidance argues against a route for "is this dialog open."

---

## Second-pass follow-on decisions (2026-09-09)

### 17. Recent-period-trend selector (`MiniBar` data gap) — **30-day daily buckets, clipped to first transaction**

`app-core-inventory.md` §6 flagged a gap: the Overview `StatTile` income/spending sparklines (`MiniBar`, `ui-inventory.md` §3) had no backing selector — the mock's `incomeBars`/`expenseBars` are synthetic `Math.sin` noise, not derived data.

Decided: a new selector, **Recent period trend**, computes daily income and expense buckets (sum of positive-amount / negative-amount transactions per day) for the trailing 30 days, bounded by `WorkspaceSettings.timezone` (same timezone rule as every other period boundary, decision #3). If the account/workspace has fewer than 30 days of transaction history, the window starts at the earliest transaction's date instead of padding with empty leading days — the bucket count shrinks, it never shows fabricated zero-days before real data begins.

Added to `app-core-inventory.md` §6 as a new selector row and to `ui-inventory.md` §3's `MiniBar` row, replacing the "no backing selector exists yet" flag.
