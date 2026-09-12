# Domain model

Extracted from `data.js` and the screens that read it. Destined for `@repo/domain`: types, Zod schemas, the error taxonomy, repository contracts (interfaces only — implementation is `@repo/data`, see `repository-contracts.md`).

Every entity below carries a client-generated `id` and `createdAt`/`updatedAt` from its first schema version, per the non-negotiable precaution in `start-roadmap.md` §17 — this is not visible in the mock (which uses short static ids like `a1`, `t01`) but is mandatory from day one.

All money fields are **integers in minor units** (cents) — decision `open-questions.md` #1. The mock's floats (`-54.20`, `3400.00`) are display-only shorthand; the domain type is never a float.

---

## WorkspaceSettings

Workspace-level facts that aren't owned by any single entity — one record per workspace, not a list. New in this revision (`open-questions.md` #9b).

| Field | Type | Notes |
|---|---|---|
| `timezone` | IANA timezone string | Set once, at workspace creation. **Immutable** (`open-questions.md` #3) — every period boundary ("this month," "today," relative labels) is computed against it, never the opening device's local timezone. |
| `baseCurrency` | `'EUR' \| 'USD' \| 'GBP'` | The currency cross-account totals convert into. User-editable anytime via Settings (`open-questions.md` #2, #4). Not a device preference — it's workspace data, so it travels with the workspace across devices/opens. |

---

## Account

One financial account the user tracks (bank account, cash, brokerage).

| Field | Type | Notes |
|---|---|---|
| `id` | string | client-generated |
| `name` | string | user-chosen, e.g. "Everyday" |
| `type` | `'Checking' \| 'Savings' \| 'Investment' \| 'Cash'` | drives icon + color in the UI (`ACC_ICON`, `ACC_COLOR` in `desktop-shell.jsx`); no `'Investment'`-typed account exists in the mock data even though the type is declared — investment holdings live in the separate `Investment` entity below, not as an account balance |
| `currency` | `'EUR' \| 'USD' \| 'GBP'` | Real per-account field — confirmed by `open-questions.md` #2. Not necessarily the workspace's `baseCurrency`. |
| `balance` | integer, minor units | current balance; in the mock this is a **stored** field, not derived from transactions |
| `color` | string (hex) | user-facing accent for this account; mock hardcodes it per account, decoupled from `type`-based color |
| `icon` | string | icon key; redundant with `type`-derived icon in the shell (`ACC_ICON`) — mock sets both, only `type`-derived is actually used on desktop |
| `last4` | string, optional | last 4 digits of a card/account number, cosmetic only |

**Invariant**: `balance` must always equal the sum of all `Transaction.amount` for this account (mock does not enforce this — it hand-authors both independently). **Decided** (first `@repo/data` implementation pass): `balance` is a **maintained running total**, not derived on read. Every `TransactionRepository.create`/`update`/`delete` composes the transaction write with a `balance` adjustment into the same `gateway.batch()` — one atomic operation, never two round trips. Deriving on read was rejected: the closed gateway operation set (`repository-contracts.md`) has no aggregate/sum primitive, so it would mean fetching every transaction on an account just to render its balance, which is exactly the round-trip-chaining failure mode §9 warns online mode against. `AccountRepository.getBalanceHistory` still derives its series on read, by replaying transactions backward from this maintained balance — see "Account balance history" below; only the current balance itself is stored.

---

## ExchangeRate

The manually-entered conversion rate used to bring a non-base-currency account into `WorkspaceSettings.baseCurrency` for aggregate totals. New in this revision (`open-questions.md` #9a).

| Field | Type | Notes |
|---|---|---|
| `currency` | `'EUR' \| 'USD' \| 'GBP'` | the non-base currency this rate converts *from*; acts as the record's key — one current rate per currency, not a history |
| `rateToBase` | integer, scaled by `RATE_SCALE = 1_000_000` (6 decimal places) | how many units of `baseCurrency` one unit of `currency` is worth. **Decided** (first `@repo/data` implementation pass): integer fixed-point at 1e6, e.g. 1 USD = 0.923400 EUR is stored as `923400`. Six decimals give enough precision for account-level conversion without float drift; `rateFromDecimal`/`rateToDecimal` in `@repo/domain/primitives/rate.ts` convert to and from the decimal a settings form displays. User-entered, no external source (`open-questions.md` #9a). |
| `updatedAt` | timestamp | when the user last entered/confirmed this rate |

Deliberately **not** a time series: this only serves live aggregate totals (dashboard total balance, etc.), not historical restatement of past periods in a different rate. No `Account`/`Transaction` conversion happens at write time — conversion is applied only at read time, in the base-currency-conversion selector (`app-core-inventory.md` §6). If a workspace never holds a non-base-currency account, no `ExchangeRate` record is ever needed.

---

## Category

A label for classifying transactions and recurring rules, always one of two kinds.

| Field | Type | Notes |
|---|---|---|
| `id` | string | client-generated |
| `name` | string | e.g. "Groceries" |
| `color` | string (hex) | |
| `kind` | `'income' \| 'expense'` | **not a stored field in the mock** — it's structural, encoded by which of two separate arrays (`categories.income`, `categories.expense`) the category lives in. Model it as an explicit field; every consumer (transactions, recurring rules, onboarding) needs it to filter category pickers by the current entry's type. |

Seed set from onboarding (`desktop-onboarding.jsx`): income = Salary, Freelance, Interest; expense = Rent, Groceries, Transport, Eating out, Subscriptions, Health. Presented at onboarding as pre-populated and individually toggleable — the user starts from this list, not from zero.

---

## Transaction

A single recorded money movement.

| Field | Type | Notes |
|---|---|---|
| `id` | string | client-generated |
| `date` | ISO datetime string | |
| `desc` | string | free text |
| `amount` | integer, minor units, signed | positive = income, negative = expense. **No separate `type` field** — eliminated per `open-questions.md` #6. Income/expense is read off this sign. |
| `cat` | Category id | |
| `acc` | Account id | |
| `note` | string, optional | not in `data.js`, but the transaction-creation dialog (`DeskTxModal`) collects an optional note field not present in the fixture — include it |

**Invariants**: `sign(amount)` matches `categories[cat].kind` (positive amount ⇒ `kind === 'income'`, negative ⇒ `'expense'`); `acc` references an existing account.

---

## RecurringRule

A template that describes an expected schedule (subscriptions, salary, rent) — informational only, never generates a `Transaction` by itself (`open-questions.md` #8).

| Field | Type | Notes |
|---|---|---|
| `id` | string | |
| `desc` | string | |
| `amount` | integer, minor units, signed | same sign convention as `Transaction.amount`; no `type` field, same elimination as above (`open-questions.md` #6) |
| `freq` | `'Daily' \| 'Weekly' \| 'Monthly' \| 'Yearly'` | |
| `cat` | Category id | |
| `acc` | Account id | |
| `startDate` | ISO date string | **New field**, not in the mock. Anchor date the occurrence schedule is computed from — required because `next` is no longer a stored field (`open-questions.md` #7); without an anchor, `freq` alone can't determine which day of the month/week an occurrence falls on. |
| `active` | boolean | paused rules are kept, not deleted (toggle switch in the Recurring screen) |

**Not stored**: `next` (computed from `freq` + `startDate` + "today," using `WorkspaceSettings.timezone` — a selector, see `app-core-inventory.md` §6). **Not modeled**: any link from `RecurringRule` to the `Transaction`(s) a user later books for it — decided against in `open-questions.md` #8.

---

## Investment (position)

One held position (a security, tracked by average cost and current price rather than as a stream of buy/sell transactions). Confirmed sufficient — no lot/buy-sell history — by `open-questions.md` #9.

| Field | Type | Notes |
|---|---|---|
| `id` | string | |
| `name` | string | e.g. "World ETF (CW8)" |
| `ticker` | string | |
| `qty` | number | units held; not a minor-unit money field, fractional units are plausible |
| `avg` | integer, minor units | average cost per unit — cost basis is `qty * avg` |
| `current` | integer, minor units | current price per unit — value is `qty * current` |
| `color` | string (hex) | |
| `note` | string, optional | free-text description, edited via the Investment detail panel's Notes field. **Implemented** as plain text, not rich text (`open-questions.md` #15, fully resolved on implementation — `RichNote`/`document.execCommand` dropped from v1 in favour of a plain `Textarea`, closing the part of #15 left open by the previous pass) |

**Implemented**: `InvestmentRepository.delete(id)` also exists, cascading to every `InvestmentValueSnapshot` for that position in the same batch (`repository-contracts.md`) — a position can be created and edited per the original contract, and, per the implementation pass's full-CRUD decision (matching decision #19 for Transactions/Recurring), removed as well.

### InvestmentValueSnapshot

A user-entered, point-in-time price record, confirmed manual-only by `open-questions.md` #9 (no market-data feed).

| Field | Type | Notes |
|---|---|---|
| `id` | string | |
| `investmentId` | Investment id | |
| `date` | ISO datetime | |
| `price` | integer, minor units | per-unit price at that date |

Recording a snapshot is expected to also update `Investment.current` to the same value — the two are the same fact at two points in the data model (a running "current" field for cheap reads, a history for the trend chart), not independent state. **Implemented refinement**: this only holds when the recorded snapshot is the newest one on record for that position — a backdated snapshot (an entry logged after the fact, for a date earlier than the latest existing one) is still written, but does **not** move `current`, so a forgotten price entered late can never silently overwrite a more recent one.

---

## Account balance history

`dayBalances[accountId]` in `data.js` is synthesized for the sparkline/area charts, not real data, and — unlike investments — gets no snapshot entity. Decided in the first spec pass: **derive on read**, by replaying `Transaction` rows chronologically from a known starting balance. Every account's transaction history is complete by construction (the app is the only way to add a transaction), so there's no gap a snapshot would need to paper over, unlike investments where price movement happens independently of any recorded event. No new entity.
