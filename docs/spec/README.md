# Product spec — from the desktop design

> This folder is the first concrete statement of *what the application does*. `docs/start-roadmap.md` and `docs/context.md` describe *how the repo is built* — packages, layers, boundaries — with no business logic and no product decision. This folder fills that gap using a real design as source of truth.

---

## Source

Claude Design project `7722ea98-be3f-45fc-a294-5a245d0490d7`, desktop target, read on 2026-08-31.

Files read, in the order they informed this spec:

| File | What it gave us |
|---|---|
| `data.js` | Entity shapes for accounts, categories, transactions, recurring rules, investments; the mock's synthetic history series |
| `ui.jsx` | Formatting helpers (`fmtMoney`, `fmtDate`, `fmtRelFuture`), currency list, primitive components |
| `desktop-style.css` | Layout/visual only — no product information |
| `desktop-shell.jsx` | Navigation structure, per-type icon/color maps, the `AccountFilter` scoping control |
| `desktop-onboarding.jsx` | The 3-step first-run flow: choose file, add accounts, pick categories |
| `desktop-screens.jsx` | Overview, Accounts, Account detail |
| `desktop-tx.jsx` | Transactions, Recurring, and the three creation dialogs |
| `desktop-invest-settings.jsx` | Investments, Investment detail, Settings (4 sub-sections) |
| `charts.jsx` | Every derived value the UI shows: cashflow sankey, category breakdown, balance/portfolio trends, P/L math |
| `desktop-app.jsx` | How everything is wired: the `ctx` object passed to every screen, navigation, modal state |
| `tweaks-panel.jsx` | **Not part of the product.** Design-tool scaffolding for live-editing the prototype inside Claude Design (`postMessage` protocol to the design host). Its *concept* — a bundle of display preferences (theme, accent, density, currency) — is real; its mechanism is not. See `app-core-inventory.md`. |
| `My Finance Health - Desktop.html` | Composition root; confirms script load order and screen inventory |

Not read: `app.jsx`, `ios-frame.jsx`, `onboarding.jsx`, `screens-*.jsx`, `style.css`, `My Finance Health.html` — the project's mobile/legacy variants, out of scope for this pass (desktop only, per the design URL given) and for the second pass below (mobile screens get their own pass later, by decision).

**Second read, 2026-09-04**: the same 11 desktop files re-read for the rendering layer this folder originally deferred — colors/type/spacing (`ui.jsx`'s `THEMES`/`ACCENTS`, `desktop-style.css`), every component (`ui.jsx`, `desktop-shell.jsx`, `charts.jsx`), and the navigation state `desktop-app.jsx` hand-rolls (`tab`/`stack`/`modal`), now formalized as a real route tree.

## Scope of this pass

Covers the **domain model**, the **`@repo/app-core` work inventory**, the **`@repo/design-tokens` values**, the **`@repo/ui` component inventory**, and the **DOM route tree** (`@repo/routes`/`@repo/router`). Excludes mobile screens — `apps/mobile` shares no component with web/desktop (CLAUDE.md) and needed its own design read.

**Second pass, 2026-09-27**: that mobile design read landed — `screens-mobile.md` and
`ui-inventory-mobile.md`, covering the screens built so far (Dashboard, onboarding; every other tab
is a placeholder). Domain model, repository contracts, and design tokens are unchanged — they were
already platform-agnostic.

## How to read this folder

1. **`domain-model.md`** — entities, fields, invariants. What `@repo/domain` needs to type and validate.
2. **`screens.md`** — one row per screen: purpose, data read, data written, derived values. The bridge between the design and everything downstream.
3. **`repository-contracts.md`** — repository interfaces and the persistence-gateway operation set, sized so each screen costs one round trip in online mode.
4. **`app-core-inventory.md`** — the answer to "what has to be built in `@repo/app-core`": providers, the bootstrap-stage hook, store factories, query/mutation hooks, selectors — each traced back to a screen.
5. **`design-system.md`** — color/type/spacing/radius/shadow/motion tokens for `@repo/design-tokens`, replacing its current scaffold placeholders.
6. **`ui-inventory.md`** — the answer to "what has to be built in `@repo/ui`": shadcn primitives, bespoke composites, and the hand-rolled SVG charts, each traced back to a screen and (for charts) to the app-core selector that feeds it.
7. **`routes.md`** — the DOM route tree and the `@repo/router` factory contract, replacing the mock's `tab`/`stack` navigation state with real URLs.
8. **`open-questions.md`** — decisions the design implies but doesn't settle. Read before any domain type lands; the answers change field types.
9. **`cross-app-pitfalls.md`** — not from the design read: conventions extracted from real bugs found in `apps/desktop` after implementation, stated as rules so the same root causes don't reappear in a new screen, a new `@repo/ui` component, or `apps/mobile`.
10. **`screens-mobile.md`** / **`ui-inventory-mobile.md`** — the mobile equivalent of `screens.md`/`ui-inventory.md`, for the screens built there so far. `apps/mobile` shares no component with web/desktop, so it gets its own inventory rather than reusing `ui-inventory.md`'s (its component choices are DOM-only). Domain model, repository contracts, and design tokens are unchanged — read those same three files for mobile too.
