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

Not read: `app.jsx`, `ios-frame.jsx`, `onboarding.jsx`, `screens-*.jsx`, `style.css`, `My Finance Health.html` — the project's mobile/legacy variants, out of scope for this pass (desktop only, per the design URL given).

## Scope of this pass

Covers the **domain model** and the **`@repo/app-core` work inventory**. Deliberately excludes: `@repo/ui` component mapping, the DOM route tree, mobile screens, and design-token adjustments — those are a separate pass once the domain and app-core contracts below are settled.

## How to read this folder

1. **`domain-model.md`** — entities, fields, invariants. What `@repo/domain` needs to type and validate.
2. **`screens.md`** — one row per screen: purpose, data read, data written, derived values. The bridge between the design and everything downstream.
3. **`repository-contracts.md`** — repository interfaces and the persistence-gateway operation set, sized so each screen costs one round trip in online mode.
4. **`app-core-inventory.md`** — the answer to "what has to be built in `@repo/app-core`": providers, the bootstrap-stage hook, store factories, query/mutation hooks, selectors — each traced back to a screen.
5. **`open-questions.md`** — decisions the design implies but doesn't settle. Read before any domain type lands; the answers change field types.
