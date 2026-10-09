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

**Implemented** (Accounts + Settings pass): `createPreferencesStore.ts` no longer carries `accent`/`density` at all — `Density` is gone as a type, `PersistedPreferences`/`PreferencesState` have no field or setter for either, and `hydratePreferencesStore` only picks the three fields that remain (`themeMode`, `sidebarMode`, `amountsHidden`) out of a persisted blob, so a legacy value written by an older build can't reintroduce them. `SidebarMode` was narrowed from three values to two (`'expanded' | 'collapsed'`) at the same time — the mock's third state, `'hidden'`, had no control, no screen, and no consumer, the same "not an evidenced product feature" reasoning this decision already applies to accent/density. Settings → Preferences ships Theme (3-way) and Sidebar (2-way) as `OptionGrid`s, and Base currency (3-way) + per-currency exchange-rate inputs under a "Regional" panel.

**Implemented** (mobile Accounts + Settings pass, `apps/mobile`): the mobile Preferences screen ships the same reduced axis set — Theme (3-way, `OptionGrid`) and Base currency (3-way) + per-currency exchange-rate inputs, no accent or density control. It goes one step further than desktop on the same reasoning: it ships **no sidebar-mode control at all**, not even a mobile-shaped stand-in — `SidebarMode` is a DOM-only concept (mobile has a tab bar, not a collapsible sidebar), so `usePreferencesScreen.ts` (mobile) never reads or exposes `sidebarMode`/`onSidebarModeChange`. It also drops the mock's tab-bar-style picker (Standard/Icons/Floating) by the identical "prototype-editing scaffolding, not an evidenced product feature" reasoning this decision already applies to accent and density — mobile's tab bar has exactly one style. See `screens-mobile.md`'s "Accounts + Settings tabs — dropped or diverged" section for the full list.

### 12. `@repo/ui` primitives — **shadcn/ui (base-ui), not a port of the mock's components**

Decided: `start-roadmap.md` §12 already specifies `@repo/ui` as "shadcn/ui primitives... Tailwind theme sheet fed by design tokens" — this resolves a latent conflict between that line and the mock, which ships its own hand-rolled `Button`/`Field`/`Select`/`Switch`/`Modal`/`Table`/`Tabs` with no primitive library underneath (no focus trap on `Modal`, no `role="switch"` on `Switch`, outside-click hand-rolled on `AccountFilter`). The roadmap wins: `ui-inventory.md` §1 maps each mock primitive onto its shadcn equivalent, restyled with `design-system.md` tokens, rather than transcribing the mock's version. Primitive library is **base-ui** (MUI's headless library), not Radix — shadcn's CLI supports both; base-ui is the pick for this project.

### 13. Icon set — **`lucide-react`, not the mock's inline SVGs**

Decided: CLAUDE.md already mandates `lucide-react-native` (never `lucide-react`) on mobile, implying the reverse convention on DOM. The mock hand-draws ~50 icons as inline SVG paths in `ui.jsx`'s `Icon` component; `ui-inventory.md` §4 gives the full name mapping onto `lucide-react` equivalents.

### 14. Chart library — **none, except Sankey — `chartjs-chart-sankey`**

Originally decided as: the mock's `AreaChart`/`Donut`/`Sankey`/`LineChart`/`MiniBar` are custom SVG with no charting library dependency — worth keeping rather than introducing one, since a Sankey in particular has no first-class support in most lightweight chart libraries and would force a heavier dependency just for that one panel. That held for `AreaChart`/`Donut`/`LineChart`/`MiniBar`, which stay hand-rolled SVG per `ui-inventory.md` §3, each pinned to the `app-core-inventory.md` §6 selector that produces its input shape.

**Revised for `Sankey`**: the hand-rolled version's free-form node/link layout didn't reliably read as three distinct columns (income sources → total → expense/savings), which is the one thing a cashflow Sankey has to communicate. `Sankey` now renders via [`chartjs-chart-sankey`](https://www.npmjs.com/package/chartjs-chart-sankey) (`chart.js` + `chartjs-chart-sankey` added to `@repo/ui`'s dependencies), with each node pinned to a fixed column (0/1/2) instead of left to the library's topological auto-layout, and every node always labeled with its amount on both the income and outcome sides — not just on hover. `ProgressBar` is declared in `charts.jsx` but consumed by no screen — excluded from the v1 port.

### 15. `RichNote` — **controlled component; persistence and rich-text mechanism both deferred**

Decided: the mock's `RichNote` (Investment detail description panel) writes `window.localStorage` directly and uses `document.execCommand` for formatting commands. Per the rendering-boundary rule, `@repo/ui`'s `RichNote` becomes fully controlled (`value`/`onChange`) with no storage of its own.

**(a) Resolved (2026-09-09)**: `Investment.note`, string, optional, added to `domain-model.md`. Persisted through the ordinary `useUpdateInvestment()` mutation hook (`app-core-inventory.md` §5) — no new repository operation needed, `note` is just another field on the existing `update(id, patch)`.

**(b) Resolved (2026-09-12, fourth pass — see #20)**: rich text dropped from v1 entirely. `RichNote`/`document.execCommand` are never built; the note field is a plain `Textarea`, sidestepping the deprecated-API question rather than answering it.

### 16. Route/search-param addressability — **range and ledger filters are search params; scope, hidden-toggle, and modals are not**

Decided (`routes.md` §3): `range` on Account/Investment detail and the Transactions ledger's `search`/`type`/`category`/`sort` become typed TanStack Router search params — real filtered views worth bookmarking or sharing. Account scope (`accSel`) stays the `app-core-inventory.md` §3 Zustand store (already decided there as ephemeral, non-persisted — restated, not reopened); the amounts-hidden toggle stays the preferences store; the three creation modals stay local component state, not routes — transient drafts with no deep-link use case, and CLAUDE.md's anti-over-engineering guidance argues against a route for "is this dialog open."

---

## Second-pass follow-on decisions (2026-09-09)

### 17. Recent-period-trend selector (`MiniBar` data gap) — **30-day daily buckets, clipped to first transaction**

`app-core-inventory.md` §6 flagged a gap: the Overview `StatTile` income/spending sparklines (`MiniBar`, `ui-inventory.md` §3) had no backing selector — the mock's `incomeBars`/`expenseBars` are synthetic `Math.sin` noise, not derived data.

Decided: a new selector, **Recent period trend**, computes daily income and expense buckets (sum of positive-amount / negative-amount transactions per day) for the trailing 30 days, bounded by `WorkspaceSettings.timezone` (same timezone rule as every other period boundary, decision #3). If the account/workspace has fewer than 30 days of transaction history, the window starts at the earliest transaction's date instead of padding with empty leading days — the bucket count shrinks, it never shows fabricated zero-days before real data begins.

Added to `app-core-inventory.md` §6 as a new selector row and to `ui-inventory.md` §3's `MiniBar` row, replacing the "no backing selector exists yet" flag.

---

## Third-pass follow-on decisions (2026-09-12)

### 18. Recurring "monthly committed" KPI — **normalized monthly average, not calendar-month occurrences**

`screens.md`'s Recurring row wants "monthly committed in/out/net across active rules," but nothing in the spec set defines how a `Daily`/`Weekly`/`Yearly` rule converts to a monthly figure.

Decided: a new selector, **Monthly commitment**, normalizes every active rule's amount by a fixed occurrence-per-month factor (Daily ×30.44, Weekly ×4.348, Monthly ×1, Yearly ÷12 — each rounded to the nearest minor unit individually, then summed, so the per-row "Monthly" column always adds up to the KPI exactly). Rejected alternative: counting only occurrences that actually land in the current calendar month — correct in the moment, but a Yearly rule would then read €0 for eleven months out of twelve, understating real commitment and making the KPI jump discontinuously as months turn over. The normalized average is stable and every active rule always contributes something.

Added to `app-core-inventory.md` §6 as `computeMonthlyCommitment`/`toMonthlyAmount`.

### 19. Transactions/Recurring write scope — **full CRUD on both screens**

`screens.md` lists only "toggle active" as a Recurring write and leaves the ledger's row edit/delete icons unwired in the mock — but all six create/update/delete mutation hooks (transactions and recurring rules both) already existed unused in `@repo/app-core` from an earlier pass.

Decided: both screens ship full CRUD — a creation modal, a per-row edit dialog, and a per-row delete confirm, in addition to the Recurring active toggle — consistent with the Accounts/Settings pass's "wire every write for real" decision. Row actions are grouped behind a new `DropdownMenu` (`ui-inventory.md`'s already-reserved row) rather than left as bare icon buttons. A transaction edit that changes category across income/expense always re-derives and re-sends the amount's sign from the newly picked category, never trusting the previous sign — otherwise `checkAmountMatchesCategoryKind` rejects the patch.

---

## Fourth-pass follow-on decisions (2026-09-12)

### 20. Investment note field — **plain text, not rich text**

The Investment detail description panel needed a real editor (`RichNote`'s persistence half was resolved in #15(a); the rich-text mechanism, #15(b), stayed open pending an implementation-time call).

Decided: plain multi-line text via a new `Textarea` primitive, not a `contentEditable` toolbar. No deprecated `document.execCommand` call to replace, no stored-markup rendering (so no XSS surface from rendering a user's own note back), no new dependency. Closes #15(b). Revisit only if a future pass has a concrete need for bold/lists/etc. in a note field.

### 21. `InvestmentRepository` write scope — **add `delete`**

`repository-contracts.md`'s original `InvestmentRepository` row had no `delete` — positions could be created and edited but never removed, unlike every other entity (`Category`/`Transaction`/`RecurringRule` all have one).

Decided: add `delete(id)`, cascading to every `InvestmentValueSnapshot` for that position in the same `gateway.batch(...)` call — a position can never outlive or underlive its own value history. Consistent with #19's full-CRUD precedent for Transactions/Recurring. Amends `repository-contracts.md` and `domain-model.md`.

### 22. Two data-layer bugs, found and fixed while wiring the first real consumers

`InvestmentRepository` (`packages/data`) had zero consumers before this pass — its bugs were unreachable, but both would have surfaced immediately once real screens called it.

- **Same-day snapshot silently dropped from every range.** `getValueHistory` passed `rangeFor`'s date-only bounds (`'2026-09-12'`) straight into the gateway's date-range filter, which compares them lexicographically against a snapshot's full instant (`'2026-09-12T09:00:00.000Z'`) — `'...T09:00:00.000Z' <= '2026-09-12'` is `false`, so a snapshot recorded earlier the same day never appeared in any range, including "all." Fixed by widening the bounds to day boundaries (`T00:00:00.000Z` / `T23:59:59.999Z`) inside `investmentRepository.ts`, not the gateway (the gateway's comparison is correct for `IsoDateTime`-only callers; only this repository was passing it a bare `IsoDate`).
- **Backdated snapshot silently overwrote a more recent price.** `recordValueSnapshot` unconditionally set `Investment.current` to the new snapshot's price, even when the snapshot's date was earlier than the latest one already on record. Fixed: `current` only advances when the new snapshot is the newest on record; a backdated entry is still written (nothing about *recording* a value ever fails), it just doesn't move `current`. Refines, doesn't contradict, `domain-model.md`'s "one fact, two rows" framing of `recordValueSnapshot`.

Both are covered by new integration tests in `repositories.integration.test.ts`.

---

## Fifth-pass follow-on decisions (2026-09-18)

### 23. Biometric unlock (`apps/desktop`) — **opt-in, per-device, amends #5, not #4**

Decision #5 was "the key is derived from a user-supplied secret at every unlock … never a silent device-keyring unlock." Decision #4 (project memory, `project-local-mode-scope`) deferred `SecretsService`/`hasSecretVault` on desktop for exactly that reason: nothing in local mode needed to read an OS keyring.

Decided: `apps/desktop` may store a **copy** of the workspace passphrase in the OS keyring (macOS Keychain / Windows Credential Manager), bound to a biometric check (Touch ID / Windows Hello) via the third-party `tauri-plugin-biometry` (no official Tauri 2 desktop biometric plugin exists). This is opt-in per workspace per device — a checkbox on the unlock and create forms — and is **narrower** than #5's silent-keyring-unlock ban, not a repeal of it:

- The passphrase remains the **only** key material. Argon2id derivation and the SQLCipher key never change; the keyring only holds a plaintext copy of the same secret the user would otherwise type.
- **Portability is unaffected.** A workspace file copied to a device with no enrolled entry is still unopenable without the typed passphrase — the convenience is device-local, never travels with the file.
- **`hasSecretVault` stays `false`.** This is a new, narrower capability, `hasBiometricUnlock` (`@repo/platform/services/biometricUnlock.ts`), independent of the general-purpose keyring #4 deferred — that one (for a future online-mode API key) is still not built.
- A stale entry (passphrase changed out of band, corrupted keyring item) self-heals: an unlock attempt whose secret was released biometrically, if it then fails, forgets the stored entry so the next launch falls back to a clean passphrase prompt rather than looping.

**Signing requirement (found while testing):** the plugin writes to macOS's data-protection keychain (`kSecUseDataProtectionKeychain`, needed for biometric-bound `SecAccessControl`), which requires a code-signed app carrying a `keychain-access-groups` entitlement. An unsigned `bun tauri dev` binary fails the write with `errSecMissingEntitlement` (-34018), and `has()`/`get()` then degrade silently to `false`/`null`. So Touch ID can only be exercised end-to-end with a signed build; the passphrase path is unaffected.

Not built: a Settings-screen toggle (enable/disable lives only on the unlock/create forms, per the bootstrap-only scope decision 4 already set for this pass), and no equivalent on mobile (`expo-local-authentication` is the eventual counterpart, unbuilt — `start-roadmap.md` §8).

### 24. Manual "Lock workspace" (`apps/desktop`, Settings → Database)

Testing #23 surfaced a gap: once unlocked, the only way back to the unlock screen (to retest a biometric prompt, or just to step away from the machine) was quitting and relaunching `apps/desktop`. `needs-unlock` was already a normal `BootstrapState` — nothing about it required a cold start — so this closes that gap rather than adding a new concept.

Decided: `useWorkspaceBootstrap` (`@repo/app-core`) gains `lock(ref)`, a pure state transition back to `needs-unlock` for the same ref (new `locked` event on the existing reducer — `bootstrapState.ts`/`bootstrapReducer.ts`). It carries no I/O: releasing the actual session (occupancy lock, SQL connection) stays the host's job, the same split `onSessionOpen` already established. `apps/desktop`'s `useLocalApp.ts` closes the `LocalWorkspaceSession` first, then calls `bootstrap.lock(ref)`.

The action reaches Settings → Database (not Preferences — `screens.md`'s existing "Active file"/"Danger zone" panels are where local-file-session actions already live) through a new capability-shaped context, `WorkspaceLockContext`/`useWorkspaceLock()` in `@repo/app-core/providers`: `AppStageProviders` takes an optional `onLockWorkspace` prop, absent for online mode (`canLock: false`) — the same "capability, not platform name" shape as `PlatformCapabilities`, just scoped to the session rather than the platform, since the lock action doesn't exist until a workspace is actually open.

### 25. Mobile local mode: where the file lives, and how it travels (`apps/mobile`)

`start-roadmap.md` §9 ("Mobile case") already ruled out opening a file in place on mobile; this records the concrete shape chosen when `@repo/platform-expo` landed (2026-10-07), including the user's request to be able to put the data in iCloud.

Decided:
- **The workspace lives in the app sandbox**, under `Documents/MyFinanceHealth/workspaces/<uuid>/` (`sandboxWorkspacePath`, `@repo/data/workspace/workspaceTransfer.ts`). `expo-file-system`'s plugin sets `UIFileSharingEnabled`, so the folder is browsable from the iOS Files app ("On My iPhone"). Paths in the recent-workspaces list are **relative to `Documents/`**, because the iOS container's absolute path changes across updates and reinstalls.
- **iCloud (and Google Drive, a USB drive, a desktop-synced folder…) is reached through explicit export/import, not a live container.** Settings → Data → *Export workspace* opens the system folder picker and copies the `.mfhdb`, `.mfhmeta` and journal segments into a dated subfolder (`<name> YYYY-MM-DD HHmm/`); the bootstrap screen's *Import a workspace* picks a folder and copies the files back into the sandbox. Picking an iCloud Drive folder in either flow is what "save to iCloud" means. A live iCloud container was rejected: it needs a custom Swift module, iCloud entitlements, is iOS-only, and syncing a live SQLCipher file is exactly the risk §9 designs around (a sync service copying the file mid-write). The `.mfhlock` is never exported; the database is copied first and the journal last, so a copy slightly ahead of its database is repaired by replay.
- **A picked folder is addressed through an opaque `external:<n>` token** inside the file-system adapter, never as its raw URI: the core does `/` string arithmetic on paths, and an Android SAF `content://` URI cannot be extended by appending `/name`. The grant is session-only on iOS, so `canResumeLocation` is `false`.
- **Text search runs in JS, not in SQL.** `expo-sqlite` cannot register a scalar function from JavaScript, so `localGateway` filters the `text` criterion in JS (`toLowerCase().includes`, then `limit`) — the same matcher `memoryGateway` uses — and the `mfh_lower` obligation is dropped from the `SqlDriver` contract. Desktop's Rust `mfh_lower` registration is now unused but harmless.
- **The journal key derivation is `argon2idAsync`** (identical output) so a phone's JS thread keeps rendering while the 64 MiB derivation runs. The SQLCipher key is derived the same way on mobile, in JS, byte-compatible with `sql.rs` (Argon2id v0x13, raw `x'<hex>'` key, SQLCipher 4 defaults, rollback journal).

Not built: biometric unlock on mobile (`expo-local-authentication` + `expo-secure-store`, #23's counterpart), deleting a workspace, and import of a workspace that sits one folder deeper than the picked one.

**Open risk, measured on no device yet:** Argon2id at 64 MiB × 3 iterations runs twice per unlock in pure JS on Hermes and may take several seconds. If it does, the fix is a native KDF behind the same `SqlDriver`/`deriveJournalKey` contracts — not a change to the cost parameters, which are part of every existing file's `.mfhmeta`.
