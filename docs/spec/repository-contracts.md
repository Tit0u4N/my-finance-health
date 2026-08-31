# Repository contracts

Repository interfaces belong in `@repo/domain` (contract only); the single implementation, parameterized by the local/remote persistence gateway, lives in `@repo/data` (`start-roadmap.md` §9). This file sizes both layers against `screens.md` so online mode never chains round-trips per screen (§9 risk point).

Error handling: every operation returns a discriminated union, never throws for an expected failure (not-found, validation, conflict). Reserve exceptions for programmer error.

---

## Repositories (domain-level contract)

One repository per entity family from `domain-model.md`, each exposing access rules and composition — not raw CRUD, but the operations screens actually need:

| Repository | Operations | Backing screens |
|---|---|---|
| `WorkspaceSettingsRepository` | `get()`, `setBaseCurrency(currency)` | Settings → Preferences (base currency), any screen showing a cross-account total. `timezone` is set once, at workspace creation, and has no update operation — it's immutable (`open-questions.md` #3). |
| `AccountRepository` | `list()`, `getById(id)`, `create(input)`, `update(id, patch)`, `getBalanceHistory(id, range)` | Overview, Accounts, Account detail, onboarding step 1, New account modal |
| `ExchangeRateRepository` | `list()`, `upsert(currency, rateToBase)` | Settings → Preferences (rate entry, alongside base currency); the base-currency-conversion selector reads via `list()` |
| `CategoryRepository` | `list()` (both kinds), `create(input)`, `update(id, patch)`, `delete(id)` | onboarding step 2, Settings → Categories, both creation modals |
| `TransactionRepository` | `list(criteria)` — criteria: account ids, date range, category, free-text search, sort; `create(input)`, `update(id, patch)`, `delete(id)` | Overview (recent + MTD), Transactions, Account detail |
| `RecurringRuleRepository` | `list(criteria)` — criteria: account ids; `create(input)`, `update(id, patch)` (covers edits and the active toggle), `delete(id)` | Overview (upcoming), Recurring, New recurring modal |
| `InvestmentRepository` | `list()`, `getById(id)`, `create(input)`, `update(id, patch)`, `getValueHistory(id, range)`, `recordValueSnapshot(id, snapshot)` | Investments, Investment detail |

`TransactionRepository.list` criteria dropped `type` as a filter dimension — since `Transaction.type` no longer exists (`open-questions.md` #6), "income only" / "expense only" filtering is expressed as an amount-sign predicate instead, same criteria shape, no gateway change.

No `PreferencesRepository`: device-local settings (theme, accent, density, sidebar, amounts-hidden) never reach a repository at all — they're read/written directly against the platform key-value contract from the app-core preferences store (`open-questions.md` #4, `app-core-inventory.md` §3).

Every `list` with criteria (`TransactionRepository.list`, `RecurringRuleRepository.list`) must accept the criteria as one call, not a base list plus client-side filtering — `screens.md`'s Transactions screen filters by account, category, and text simultaneously, and Overview's MTD figures need a date-bounded query. Filtering after a full unfiltered fetch is exactly the round-trip-chaining failure mode §9 warns about.

`getBalanceHistory` / `getValueHistory` take an explicit range (`7d | 1m | 3m | 1y | all`, matching the design's range picker) so the gateway can bound the query rather than returning full history and slicing client-side.

---

## Persistence gateway (typed, closed operation set)

Per §9, the gateway is not a query language — it's a fixed set of: read a collection with criteria, read by id, write, delete, atomic batch. The repositories above compose these; they don't add new gateway shapes per entity.

| Gateway operation | Used for |
|---|---|
| `readCollection(entity, criteria)` | every `list(...)` above |
| `readById(entity, id)` | `getById`, single-account/investment fetches |
| `write(entity, record)` | every `create`/`update`/`upsert`/`setBaseCurrency` |
| `delete(entity, id)` | `delete` operations |
| `batch(operations[])` | multi-step writes that must be atomic — e.g. onboarding step 1 (several `Account` creates) or step 2 (several `Category` creates); `recordValueSnapshot` writing both the `InvestmentValueSnapshot` and the `Investment.current` update (`domain-model.md` notes these are one fact written twice) |

`readCollection` criteria must express: entity type, filter predicates (account/category/amount-sign/date-range/text), sort, and — for history reads — a range. This is the one place granularity has to be decided consciously: `getBalanceHistory` and `getValueHistory` are still `readCollection` calls against a snapshot/derived series, not a new gateway primitive, provided the criteria shape can express "one account/investment, bounded date range, sorted." `WorkspaceSettingsRepository.get()` and `ExchangeRateRepository.list()` are both small, unfiltered `readCollection`/`readById` calls — no special-casing needed.

**Local mode**: `batch` maps to a SQLite transaction. **Online mode**: `batch` maps to a single API call — the API must accept a batch payload, not simulate atomicity via multiple sequential requests, or the two gateways stop being behaviorally equivalent.

---

## What's out of scope here

Schema/migration definitions, the operations-journal format, and the occupancy-lock protocol are `@repo/data` internals already fully specified in `start-roadmap.md` §9 — this file only fixes the *shape* repositories present to `@repo/app-core`, not how `@repo/data` fulfills it.
