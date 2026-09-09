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

## 3. Search params vs. component state

Only state with a real bookmark/share/back-button use case becomes a typed route search param (TanStack Router's `validateSearch`, zod-backed). Everything else stays local component state, exactly as `screens.md` already labels it.

| State | Mock origin | Decision |
|---|---|---|
| Balance/value history range (`7d\|1m\|3m\|1y\|all`) | `range` `useState` in `DeskAccountDetail`/`DeskInvestDetail` | **Search param** on `/accounts/$accountId` and `/investments/$investmentId` (`?range=1m`, default `1m`) — a filtered view worth linking to |
| Ledger search/type/category/sort | `search`, `fType`, `fCat`, `sort` in `DeskTransactions` | **Search param** on `/transactions` — the whole point of a ledger screen is sharing/returning to a specific filtered view; TanStack Router's typed search state is exactly this use case, not a special case |
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

No convention currently exists in the repo for this; proposed here, mirroring the `.web.tsx`/`.ios.tsx` suffix convention CLAUDE.md already establishes for `apps/mobile`: a route file suffixed `.desktop.tsx` or `.web.tsx` is included only in that app's generated tree; an unsuffixed file is shared.

Concrete case this pass surfaces: **`/settings/database`** (`screens.md`: "file metadata — platform file-system capability… trigger backup / export / reset everything") is meaningless on web, which is online-mode only (CLAUDE.md: "web… online mode only"). Proposed: `settings.database.desktop.tsx`, present only in desktop's generated tree; web's `/settings` simply has no database entry (three sections, not four, in its `SETTINGS_NAV`-equivalent).

## 6. `@repo/router` factory contract

- **Injected history**: web uses browser history; desktop's factory call accepts a swappable history implementation so it can move to in-memory history later without touching `@repo/routes` (`start-roadmap.md` §10) — the factory takes `history` as a parameter, apps decide, `@repo/router` doesn't hardcode either.
- **Typed router context**: the `QueryClient` instance (built per-app, `app-core-inventory.md` §1) — required by every loader in §4. Repositories are **not** in router context: loaders run before/outside the React provider tree, so the app-stage router instance is itself constructed fresh once bootstrap reaches `ready`, with the repository set closed over at creation time (consistent with the "full remount on workspace switch" rule in §2 — recreating the app layout naturally recreates the router alongside it).
- **Generated tree**: each app runs its own route-tree generation over `@repo/routes`' shared file set (as apps already transpile shared packages with their own toolchain, per CLAUDE.md's "Commands" section); `routeTree.gen.ts` is generated per app, gitignored, never hand-edited.
- **Preload/scroll-restoration options**: shared defaults live in `@repo/router`'s factory (per `start-roadmap.md` §5's `@repo/router` role: "shared preload and scroll-restoration options"); nothing here is new beyond what the roadmap already assigns to this package — no additional decision needed for this pass.
