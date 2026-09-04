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
