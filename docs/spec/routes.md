# Routes and router

The DOM route tree for `@repo/routes` and the factory contract for `@repo/router` (`start-roadmap.md` §10: TanStack Router, tree shared between web and desktop, no attempt to share with mobile's Expo Router). Both packages currently hold only `placeholder.ts`. Replaces the mock's own navigation, which is a `tab` + `stack` state pair in `desktop-app.jsx` (`nav.push`/`nav.pop`/`nav.go`), not real URLs — that state machine is what the route tree below formalizes.

---

## 1. URL map

| Path | Screen (`screens.md`) | Loader data |
|---|---|---|
| `/` | Overview | accounts, MTD transactions, recurring, balance history — see §4 |
| `/accounts` | Accounts (list) | accounts, 30-day balance history per account |
| `/accounts/$accountId` | Account detail | the account, its transactions, its balance history for `range` |
| `/transactions` | Transactions (ledger) | transactions matching `search`/`type`/`category`/`sort` (§3) |
| `/recurring` | Recurring | recurring rules |
| `/investments` | Investments (list) | investments |
| `/investments/$investmentId` | Investment detail | the investment, its value history for `range` |
| `/settings/preferences` | Settings → Preferences | workspace settings, exchange rates |
| `/settings/categories` | Settings → Categories | categories (both kinds) |
| `/settings/database` | Settings → Database | file metadata — **desktop-only**, see §5 |
| `/settings/about` | Settings → About | static, no loader |

`/settings` with no sub-path redirects to `/settings/preferences`. Onboarding is not under this tree — it's a separate root layout entirely (§2).

Not modeled as routes: the three creation modals (New transaction/account/recurring). Decision: **local component state, not URL-addressable** (`open-questions.md` #16) — they're transient creation forms with no deep-link or bookmark use case; losing an unsaved draft on refresh is expected, and CLAUDE.md's anti-over-engineering guidance argues against a route (and its inevitable "close" transition edge cases) for something that's really just "is this dialog open."

## 2. Layouts

Three root-level layouts, matching the bootstrap-stage/app-stage split in `app-core-inventory.md` §2:

| Layout | Mounts when | Provides | Contains |
|---|---|---|---|
| **Bootstrap layout** | `app-core-inventory.md` §2 hook is in `idle \| needs-designation \| needs-unlock \| migrating \| replaying \| failed` | Platform + i18n context only — no repositories, no query client cache warmed against real data (per CLAUDE.md: "platform + translations context only") | File/workspace picker, unlock prompt, migration/replay progress, error states |
| **Onboarding layout** | Bootstrap hook reaches `ready` for a **freshly created** workspace with no accounts yet | Full app-stage context (repositories now exist — `app-core-inventory.md` §2's "judgment call": seeding accounts/categories is ordinary mutation-hook calls, not a bootstrap special case) | The 3-step flow (`screens.md` "Bootstrap-adjacent" rows) — not nested under the app shell, since there's nothing to show in a sidebar yet |
| **App layout** | Bootstrap hook `ready` **and** at least one account exists | Full provider tree (`app-core-inventory.md` §1): repositories, query client, translations | `AppShell`/`Sidebar` (`ui-inventory.md` §2) wrapping every path in §1's table |

Workspace switch is a full unmount/remount of the app layout (and everything under it) per CLAUDE.md — not an in-place route transition. The router instance itself is recreated at that point (§6).

**Implementation note (local mode landed) — Bootstrap layout is not a route**: as built, the Bootstrap layout lives outside `@repo/router`/`@repo/routes` entirely, as plain desktop-only components (`apps/desktop/src/bootstrap/`), rendered *before* any router is constructed. Two reasons this diverged from "a root-level layout" as written above: (1) `createAppRouter`'s context requires `repositories`, which don't exist until the workspace is `ready` — there's no router to route within during bootstrap; (2) `@repo/routes` is shared with web, which has no local mode, so a bootstrap layout living there would need capability-gating inside a package this pass didn't otherwise touch. The Onboarding layout (3-step seed accounts/categories) remains entirely unbuilt — out of scope for this pass (see `app-core-inventory.md` §2's implementation note) — a newly created workspace lands directly in the App layout, empty.

## 3. Search params vs. component state

Only state with a real bookmark/share/back-button use case becomes a typed route search param (TanStack Router's `validateSearch`, zod-backed). Everything else stays local component state, exactly as `screens.md` already labels it.

| State | Mock origin | Decision |
|---|---|---|
| Balance/value history range (`7d\|1m\|3m\|1y\|all`) | `range` `useState` in `DeskAccountDetail`/`DeskInvestDetail` | **Search param** on `/accounts/$accountId` and `/investments/$investmentId` (`?range=1m`, default `1m`) — a filtered view worth linking to |
| Ledger search/type/category/sort | `search`, `fType`, `fCat`, `sort` in `DeskTransactions` | **Search param** on `/transactions` — the whole point of a ledger screen is sharing/returning to a specific filtered view; TanStack Router's typed search state is exactly this use case, not a special case. **Implemented** as `q` (not `search`, to avoid a `search.search` field name), `type: 'all'\|'income'\|'expense'` (maps to `TransactionCriteria.amountSign` — `type` was dropped from the criteria shape once `Transaction.type` was eliminated, `repository-contracts.md`), `category` (a plain string id, so a stale/unknown id is zero rows rather than a router error), and `sort` as one `'date:desc'\|'date:asc'\|'amount:desc'\|'amount:asc'` enum rather than two params — see `packages/routes/src/transactions/transactionSearch.ts`. The text field is committed to the URL debounced (250ms, `replace: true`), not on every keystroke, via `shared/useDebouncedSearchParam.ts`. |
| Settings section | `sec` `useState` in `DeskSettings` | **Not a search param** — already a path segment (§1), the more idiomatic fit |
| Account scope (`accSel`) | shared across Overview/Transactions/Recurring | **Not a search param.** Stays the app-core Zustand store already specified in `app-core-inventory.md` §3 ("ephemeral — resets to all accounts per session, not persisted in the design"). Restated here only to head off re-deciding it as a route concern — the store decision stands. |
| Amounts-hidden toggle | `hidden` in `desktop-app.jsx` | **Not a search param** — device-local preference, `app-core-inventory.md` §3 preferences store |
| Modal open/draft state | `modal` `useState` in `desktop-app.jsx` | **Not a search param** — see §1 |

## 4. Loaders vs. query hooks

Every screen listed in §1 gets a route `loader` that calls `queryClient.ensureQueryData(...)` with the **same query key** the screen's `app-core-inventory.md` §4 hook uses — so the loader prefetches on navigation-intent (TanStack Router's default) and the hook's render-time call is a cache hit, not a second fetch. This is the mechanism that keeps `repository-contracts.md`'s one-round-trip-per-screen sizing true in online mode: the loader *is* that one round trip, issued as early as possible.

- Bootstrap-layout routes have no loaders — repositories don't exist yet (`app-core-inventory.md` §2).
- `/` (Overview) loads accounts + current-month transactions + recurring + balance history in parallel (`Promise.all` of `ensureQueryData` calls) — matches `screens.md`'s Overview row, which reads all four.
- `/accounts/$accountId` and `/investments/$investmentId` loaders read `range` off the validated search params (§3) so the prefetched query key already matches what the range-picker will request on first render — no waterfall from "load default range" → "user picks a range" → refetch.
- `/transactions` loader reads `search`/`type`/`category`/`sort` off search params the same way, calling `TransactionRepository.list(criteria)` once with the full criteria — never an unfiltered fetch followed by client-side narrowing (`repository-contracts.md` §"criteria… one call, not a base list plus client-side filtering").

## 5. Target-exclusive routes

**Superseded by implementation** (Accounts + Settings pass): the `.desktop.tsx`/`.web.tsx` suffix proposed below assumed file-based route generation. This repo's route tree is code-based (`routeTree.ts`'s own header says so) and has no per-app generation step to hang a filename suffix on, so `/settings/database` stays a single shared route in **both** targets' tree. Instead it's gated by **capability, not platform name** (CLAUDE.md principle 1): `useSettingsLayout`'s nav rail and `useDatabaseScreen` both check `platform.capabilities.canWriteFile` — true on desktop, false on web — so web's rail renders three entries and desktop four, and the screen itself renders an "unavailable" empty state rather than ever routing there on a platform without file access. If a future screen ever needs an actually different *route tree shape* per target (not just conditional rendering within one shared route), the suffix idea below remains a reasonable starting point.

Original proposal (kept for reference): mirroring the `.web.tsx`/`.ios.tsx` suffix convention CLAUDE.md already establishes for `apps/mobile`, a route file suffixed `.desktop.tsx` or `.web.tsx` would be included only in that app's generated tree, with an unsuffixed file shared — the concrete case being `/settings/database`, meaningless on web since it's online-mode only.

## 6. `@repo/router` factory contract

- **Injected history**: web uses browser history; desktop's factory call accepts a swappable history implementation so it can move to in-memory history later without touching `@repo/routes` (`start-roadmap.md` §10) — the factory takes `history` as a parameter, apps decide, `@repo/router` doesn't hardcode either.
- **Typed router context**: the `QueryClient` instance (built per-app, `app-core-inventory.md` §1) — required by every loader in §4. Repositories are **not** in router context: loaders run before/outside the React provider tree, so the app-stage router instance is itself constructed fresh once bootstrap reaches `ready`, with the repository set closed over at creation time (consistent with the "full remount on workspace switch" rule in §2 — recreating the app layout naturally recreates the router alongside it).
- **Generated tree**: each app runs its own route-tree generation over `@repo/routes`' shared file set (as apps already transpile shared packages with their own toolchain, per CLAUDE.md's "Commands" section); `routeTree.gen.ts` is generated per app, gitignored, never hand-edited.
- **Preload/scroll-restoration options**: shared defaults live in `@repo/router`'s factory (per `start-roadmap.md` §5's `@repo/router` role: "shared preload and scroll-restoration options"); nothing here is new beyond what the roadmap already assigns to this package — no additional decision needed for this pass.

## 7. Implemented — Transactions + Recurring pass

`/transactions` and `/recurring` both ship with full CRUD (create/edit/delete, plus the Recurring `active` toggle), grouped row actions via a new `@repo/ui` `DropdownMenu`, and the sortable-header variant of `Table` — see `app-core-inventory.md` §6 and `ui-inventory.md` for the new primitives.

`RecurringRuleCriteria` has no sort key at all (`{accountIds?}` only), so ordering the Recurring table (by next occurrence) happens in `useRecurringScreen.ts`, not the repository. This is **not** the "filter then client-side narrow" anti-pattern §4 bans — that rule is about *filtering* (the one filter, account scope, does go through criteria); sorting a small, already-fully-fetched list with no server-side sort key is unavoidable client-side work. `computeUpcomingRecurring` is deliberately not reused for this table, since it drops inactive rules and the Recurring screen must show them (they carry the toggle).

Both routes' loaders prefetch with an unscoped (`accountIds: undefined`) criteria — a loader runs outside the React tree and can't reach the account-selection store. Correct on a fresh navigation (the store defaults to `'all'`), one wasted prefetch when the user had already narrowed scope in a prior session — the same compromise `indexRoute`'s own loader comment already documents for Overview.

The account-scope idiom (store → `accountIds | undefined` → `AccountFilter` props) is now `shared/useAccountScope.ts`, used by Overview, Transactions and Recurring alike — previously inlined once, in `useOverviewScreen.ts`.

## 8. Implemented — Investments pass

`/investments` and `/investments/$investmentId` ship last, closing the URL map in §1 and un-disabling the sidebar's final nav entry. Full CRUD on both (add/edit/delete position, "Record value"), per `open-questions.md` #19's precedent and #21's amendment adding `delete` to `InvestmentRepository`.

**Not account-scoped**, unlike Transactions/Recurring/Overview — `screens.md`'s Investments row reads only `investments`, so neither screen uses `useAccountScope` or renders an `AccountFilter`.

**Positions-table sort is local component state, not a search param** — the same reasoning §3 already gives for Recurring's row order: a small, fully-fetched table with no server-side sort key and no real bookmark/share use case. `range` on `/investments/$investmentId` *is* a search param, identical in shape to Account detail's (`?range=1m`, default `1m`, `.catch`-guarded).

**The "30-day portfolio value trend" KPI (screens.md) has no single repository call behind it** — `InvestmentRepository.getValueHistory` is per-position. `useInvestmentsScreen.ts` fans every position's history out via `useQueries` (the exact pattern `useAccountsScreen.ts` already uses for per-account sparklines, at the same `accountsRoute` loader comment's "needs the ids, would make the loader two-wave" reasoning) and reduces them into one series with a new app-core selector, `computePortfolioValueHistory` (`app-core-inventory.md` §6). Both screens default this fan-out to `range: '1m'`, matching Investment detail's own default range, so opening a position from the list hits an already-warm cache entry rather than refetching.

`investmentsRoute`'s loader therefore only prefetches `investments.list()` + workspace settings — same two-wave split as `accountsRoute`, documented there and restated here rather than re-litigated. `investmentDetailRoute` mirrors `accountDetailRoute` exactly: `.catch(() => undefined)` on both the `getById` and `getValueHistory` prefetches, since an unknown id is `useInvestmentDetailScreen`'s `found: false` screen state, not a router error.

**Known limitation, documented not fixed**: `Investment` has no `currency` field (unlike `Account`), so `computePortfolioTotals` sums raw minor units across positions and the portfolio KPIs render in `settings.baseCurrency` — invisible on the EUR-only seed, the same multi-currency gap Overview's own total already carries.

**A real, pre-existing bug found while wiring the first real consumer of `useInvestment`**: the query had no `retry: false`, unlike its `useAccount` twin (which carries an explicit comment explaining why — a not-found id is a deterministic error, and react-query's default 3-retry backoff would leave the not-found guard stuck on its loading state for several seconds). Fixed to match.
