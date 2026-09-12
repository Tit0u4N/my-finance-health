# Screens

One row per screen in the desktop design. Purpose and data needs only — no layout, no component names (that's the `@repo/ui` pass, out of scope here). This table is what makes `app-core-inventory.md` traceable: every hook/selector listed there names the screen row that required it.

Source file per screen noted for cross-reference back to the design.

---

## Bootstrap-adjacent

| Screen | Source | Purpose | Reads | Writes | Local-only UI state |
|---|---|---|---|---|---|
| Onboarding — choose file | `desktop-onboarding.jsx` step 0 | Create or open the workspace file | recent-workspaces list (platform key-value) | — (workspace creation itself) | selected path |
| Onboarding — add accounts | `desktop-onboarding.jsx` step 1 | Seed at least one account before entering the app | — | `Account` (create, one or more) | draft account form, list of accounts added so far |
| Onboarding — pick categories | `desktop-onboarding.jsx` step 2 | Enable/disable the seed category set | seed category list (static, not repository-backed) | `Category` (create the enabled subset) | per-category on/off toggle |

## App stage

| Screen | Source | Purpose | Reads | Writes | Derived values | Local-only UI state |
|---|---|---|---|---|---|---|
| Overview (dashboard) | `desktop-screens.jsx` `DeskDashboard` | Month-to-date financial summary | accounts, transactions (current month, scoped to selected accounts), recurring rules, account balance history | — | total balance; MTD income/expense/net; category spend breakdown (donut); cashflow sankey (income category → expense category + savings); per-account 30-day sparkline; upcoming recurring (next 4 active, scoped) | selected-account filter (shared across screens, see below); amounts-hidden toggle (shared) |
| Accounts (list) | `desktop-screens.jsx` `DeskAccounts` | Browse all accounts as cards | accounts, per-account balance history (30d) | — | 30-day change (delta) per account | — |
| Account detail | `desktop-screens.jsx` `DeskAccountDetail` | One account's trend and full transaction list | one account, its transactions, its balance history (range-selectable: 7d/1m/3m/1y/all) | — | inflow/outflow/net totals for this account | selected range |
| Transactions (ledger) | `desktop-tx.jsx` `DeskTransactions` | Search/filter/sort every transaction | transactions (scoped to selected accounts) | — (edit/delete icons present in the row but not wired to an action in the mock — real mutations, see inventory) | inflow/outflow/net for the current filter | search text, type filter, category filter, sort key+direction |
| Recurring | `desktop-tx.jsx` `DeskRecurring` | Manage recurring rules, see monthly commitment | recurring rules (scoped to selected accounts) | toggle `active` on a rule | monthly committed in/out/net across active rules | — |
| Investments (list) | `desktop-invest-settings.jsx` `DeskInvest` | Portfolio overview | investments | **Implemented** as add/edit/delete position, plus "Record value" (same full-CRUD decision as Transactions/Recurring, decision #19 — the spec's own `app-core-inventory.md` §5 already assigned "Add position" here, so this resolves that inconsistency, not introduces one) | portfolio value, cost basis, unrealised P/L (value − cost), per-position P/L %, allocation % per position, 30-day portfolio value trend | sort key+direction (positions table; local state, not a URL param — no bookmark/share use case for a small, fully-fetched table) |
| Investment detail | `desktop-invest-settings.jsx` `DeskInvestDetail` | One position's price history and notes | one investment, its value-snapshot history (range-selectable) | value snapshot (via "Record value"); free-text note (**implemented** as plain text through the ordinary `useUpdateInvestment()` patch, not the prototype's rich text / `localStorage` — see `open-questions.md` #15); **implemented** also with edit and delete position (delete cascades to its value history) | unit P/L, position value, cost basis | selected range |
| Settings → Preferences | `desktop-invest-settings.jsx` `SetPrefs` | Theme mode, sidebar mode, base currency, exchange rates, language — accent and density dropped, not v1 product features (`open-questions.md` #11) | device-local preferences; workspace base currency; exchange rates | device-local preference writes; `WorkspaceSettingsRepository.setBaseCurrency`; `ExchangeRateRepository.upsert` (`open-questions.md` #2, #4, #9a) | — | — |
| Settings → Categories | `desktop-invest-settings.jsx` `SetCategories` | Manage the category list | categories (both kinds) | create/edit/delete category | — | — |
| Settings → Database | `desktop-invest-settings.jsx` `SetDatabase` | File info, backup, export, danger zone | file metadata (path, size, last-opened, row count) — platform file-system capability, not domain data | trigger backup / export / "reset everything" | — | — |
| Settings → About | `desktop-invest-settings.jsx` `SetAbout` | Static app info | — (hardcoded strings) | — | — | — |

## Modals (triggered from multiple screens)

| Modal | Source | Purpose | Reads | Writes |
|---|---|---|---|---|
| New transaction | `desktop-tx.jsx` `DeskTxModal` | Create a transaction | accounts, categories (filtered by chosen type) | `Transaction` (create) |
| New account | `desktop-tx.jsx` `DeskAccountModal` | Create an account (post-onboarding) | — | `Account` (create) |
| New recurring rule | `desktop-tx.jsx` `DeskRecurringModal` | Create a recurring rule | accounts, categories (filtered by chosen type) | `RecurringRule` (create) |

---

## Cross-screen state

Two pieces of state are shared across screens rather than owned by one — both are candidates for app-core store factories, not per-screen local state:

- **Selected-account filter** (`accSel` in `desktop-app.jsx`): which accounts are currently "in scope." Read by Overview, Transactions, and Recurring. Defaults to all accounts.
- **Amounts-hidden toggle** (`hidden`): privacy blur for every money value on screen. Read by Overview and (implicitly, wherever money renders) other screens; toggled from the sidebar.

Both are pure UI/display state, device-local — neither is written to the domain (`open-questions.md` #4).
