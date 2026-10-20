# my-finance-health

A personal finance tracker shipped as **one application on three targets** — web, desktop and mobile — from a single Bun/Turborepo monorepo.

Your data lives in **workspaces**. Each workspace is stored either as an **encrypted local file** (SQLite + SQLCipher) or on a **remote API**. The storage mode is chosen when the workspace is created and cannot be changed afterwards.

> **Status:** early stage. The architecture, domain model, data layer, shared UI/routes and the screens of the three apps are in place, but the project is not released yet and several manual device walkthroughs are still pending (see [Status and limitations](#status-and-limitations)).

## Features

- **Accounts** — checking, savings, investment and cash accounts, each with its own currency (EUR, USD, GBP) and balance history.
- **Transactions** — searchable, filterable, sortable ledger; amounts are stored as integers in minor units (cents), never floats.
- **Recurring rules** — informational schedule of subscriptions, salary, rent, with monthly commitment totals.
- **Investments** — positions, value snapshots, cost basis, unrealised P/L and allocation.
- **Overview dashboard** — total balance, month-to-date income/expense/net, category breakdown, cashflow Sankey, per-account sparklines.
- **Multi-currency** — a workspace base currency plus manually entered exchange rates for aggregate totals.
- **Settings** — theme, language, categories, base currency, backup / export.
- **Privacy** — encrypted local databases, amounts-hidden toggle, optional biometric unlock on desktop (Touch ID / Windows Hello).

## Targets

| Target  | Shell        | Rendering    | Storage modes  |
|---------|--------------|--------------|----------------|
| Web     | none (SPA)   | DOM          | online         |
| Desktop | Tauri 2      | DOM          | local or online |
| Mobile  | Expo         | React Native | local or online |

Web and desktop share their entire UI (same component tree, same router). Mobile shares **no UI component** with them and runs its own React instance. Local workspaces are portable: a `.mfhdb` file exported from the phone can be opened on desktop, and the reverse.

## Tech stack

- **Common:** Bun (workspaces + catalogs), Turborepo, strict TypeScript, Biome, Lefthook, Zod, Zustand, TanStack Query, i18next, React Compiler, ky, Vitest.
- **Web / desktop:** React 19, Vite, TanStack Router, Tailwind CSS v4, shadcn/ui, Playwright.
- **Desktop:** Tauri 2, a dedicated Rust module for SQLCipher-encrypted SQLite, system keyring, WebdriverIO + tauri-driver.
- **Mobile:** Expo (dev client), Metro, Expo Router, `expo-sqlite` with SQLCipher, `expo-secure-store`, native Argon2id key derivation, Vitest + `vitest-native`, Maestro.

## Repository layout

```
apps/
  web/        Vite + React 19, online mode only
  desktop/    Vite + React 19, Tauri 2 shell (src-tauri/ = Rust), local or online
  mobile/     Expo + React Native, own src/ui, local or online

packages/
  level 0   domain, platform, design-tokens          pure TypeScript, no React
  level 1   data, i18n, platform-web/-tauri/-expo    implementations and adapters
  level 2   app-core                                 React, but no DOM and no react-native
  level 3   ui, routes, router                       DOM only — web + desktop, never mobile
  config    typescript-config, vitest-config

docs/         architecture, guidelines, functional specs
scripts/      commit message validation
```

Shared packages are **never built**: they expose raw TypeScript sources and each app transpiles them with its own toolchain (Vite for web/desktop, Metro for mobile). A change in a package shows up immediately in a running app.

## Architecture in short

Five guiding principles, enforced by the linter rather than by review:

1. **Capability abstraction, not platform abstraction.** Shared code asks about capabilities (`canWriteFile`, `worksOffline`, …), never the platform's name.
2. **Sharing stops at the rendering boundary.** DOM code and React Native code never live in the same package.
3. **Two strictly isolated React runtimes.** Mobile uses the version dictated by the Expo SDK; web/desktop use their own.
4. **Shared packages are passive, adapters are silent.** Platform adapters only run primitives; logic lives in the core.
5. **Boundaries are tooled, not documented.** A violation is a lint failure.

**Data layer.** One repository implementation in `@repo/data`, parameterised by an interchangeable *persistence gateway* (local SQLite or remote API) that exposes a closed, typed set of operations. Everything above it — query hooks, stores, UI — is unaware of the active mode. The local database is a rebuildable projection of an append-only, per-device, individually sealed operations journal.

**Bootstrap / app stages.** Apps first run a bootstrap stage (choose or resume a workspace, unlock, migrate, replay the journal), then mount the app stage only once the workspace is ready. Switching workspaces is a full unmount/remount.

**View / ViewModel.** Any component carrying logic is split into `Component.tsx` (JSX only) and `useComponent.ts` (state, effects, handlers).

Full details: [docs/start-roadmap.md](docs/start-roadmap.md) (architecture spec), [docs/context.md](docs/context.md) (condensed sheet), [docs/code_guideline.md](docs/code_guideline.md) (code rules), [docs/spec/](docs/spec/) (domain model, screens, repository contracts, design system, open questions).

## Getting started

### Prerequisites

- [Bun](https://bun.sh) 1.3+ — the only supported package manager (never `npm`, `yarn` or `pnpm`).
- **Desktop:** the Rust toolchain and the [Tauri 2 prerequisites](https://v2.tauri.app/start/prerequisites/).
- **Mobile:** Xcode (iOS) and/or Android Studio. Expo Go is **not** supported: the app uses native modules and needs a dev build.

### Install

```bash
bun install        # also installs the Git hooks (Lefthook)
```

### Run

```bash
bun turbo dev --filter=web         # web dev server
cd apps/desktop && bun run tauri:dev   # desktop (Tauri)
cd apps/mobile && bun run ios      # or: bun run android (first build / after native changes: bun run prebuild --clean)
```

Mobile native setup and accounts that need the project owner (Apple Developer program, iCloud, signing) are described in [docs/owner-setup.md](docs/owner-setup.md).

## Scripts

```bash
bun run typecheck                    # typecheck everything
bun run test                         # run all unit/integration tests
bun run lint                         # Biome lint + format check
bun run lint:fix                     # Biome with auto-fix
bun run format                       # Biome format
bun turbo test --filter=<pkg>        # test one package or app
bun turbo typecheck --filter=<pkg>   # typecheck one package or app
```

Run a single test file: `cd packages/domain && bunx vitest run src/foo.test.ts`.

## Testing

Shared logic is tested **once**, in its own package; app tests only cover composition and presentation.

| Scope | Tool |
|---|---|
| Domain, data, journal, app-core | Vitest (node) |
| DOM components | Vitest + Testing Library (jsdom) |
| Native components (`apps/mobile`) | Vitest + `vitest-native` + Testing Library Native |
| End-to-end | Playwright (web), WebdriverIO + tauri-driver (desktop), Maestro (mobile) |

Desktop E2E does not work on macOS (the system WebView exposes no WebDriver); run it on Linux.

## Conventions

- Strict TypeScript, no `any` in production code, named exports, `@/*` alias inside an app and `@repo/*` across packages.
- Tailwind v4 with theme tokens only (no arbitrary values); no hardcoded colours on mobile.
- Conventional Commits (`feat: add login screen`), validated by a `commit-msg` hook. Biome runs on staged files at pre-commit and typecheck at pre-push.
- Disabling a lint rule always requires an inline `biome-ignore` with a reason.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the workflow, and [CLAUDE.md](CLAUDE.md) for AI-agent guidance (the repo also ships specialist subagents in `.claude/agents/`).

## Status and limitations

- Local mode bootstrap UI exists on desktop and mobile; the secrets vault is deferred and the migrating / replaying bootstrap states are not yet reachable.
- iCloud container storage on iOS is implemented but waits on a paid Apple Developer account.
- Manual walkthroughs still owed: mobile local mode on a real device, Argon2id unlock timing on hardware, desktop ↔ mobile file portability, and Tauri local mode.

## License

No license file has been added yet.
