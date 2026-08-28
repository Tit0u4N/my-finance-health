# Project context sheet

> Summary intended as context for an assistant or a new team member. For detail, see the full architecture document.
> Functional domain is not described here: this sheet covers the technical structure.

---

## The project in brief

One application shipped on three targets from a single monorepo: browser, desktop, and mobile. A user's data is grouped into **workspaces**, stored either in an encrypted local file or on a remote API. Mode is chosen at workspace creation and cannot be changed afterwards.

| Target | Shell | Rendering | Available modes |
|---|---|---|---|
| Web | none, SPA | DOM | online |
| Desktop | Tauri 2 | DOM | local or online |
| Mobile | Expo | native | local or online |

Web and desktop share their UI. Mobile shares **no component** with them and has its own version of React.

---

## Technologies

**Common core**: Bun (workspaces and catalogs), Turborepo, strict TypeScript, Biome, Lefthook, Zod, Zustand, TanStack Query, i18next, React Compiler, ky, Vitest.

**Web and desktop**: React 19, Vite, TanStack Router, Tailwind CSS v4, shadcn/ui, Playwright.

**Desktop**: Tauri 2, dedicated Rust module for SQLCipher-encrypted SQLite, system keyring via the `keyring` library, WebdriverIO and tauri-driver.

**Mobile**: Expo SDK, Metro, Expo Router, React Native StyleSheet fed by design tokens, `expo-sqlite` with SQLCipher, `expo-secure-store`, `expo-file-system`, Vitest with `vitest-native`, Maestro.

**Deliberately dropped**: the official Tauri SQL plugin, which does not support SQLCipher. The Stronghold plugin, deprecated. Any styling layer on top of React Native on mobile.

---

## Repository structure

```
apps/        web, desktop (+ src-tauri), mobile (+ its native UI)
packages/
  level 0    domain, platform, design-tokens          pure TypeScript
  level 1    data, i18n, platform-web/-tauri/-expo    implementations
  level 2    app-core                                 React without DOM or native
  level 3    ui, routes, router                       DOM, web and desktop only
  config     typescript-config, vitest-config
```

Shared packages are not built: they expose their TypeScript sources, and each app transpiles them with its own toolchain.

---

## Non-negotiable rules

1. Shared code tests **capabilities**, never a platform. No target-name check outside apps.
2. Sharing stops at the rendering boundary. No package contains both DOM and React Native.
3. No shared package declares React as a direct dependency. `react-native` is never installed at the root.
4. Platform adapters run primitives only. If a piece of processing could be written identically in two adapters, it moves up to the core.
5. `@repo/ui` knows neither the platform nor the app state: everything arrives via props.
6. `@tauri-apps/*` exists only in `platform-tauri` and `apps/desktop`. `expo-*` only in `platform-expo` and `apps/mobile`.
7. Boundaries are enforced by the linter, not by review.

---

## Data model

A **single repository implementation**, in `@repo/data`, sitting on top of an interchangeable **persistence gateway**: local over SQLite, remote over the API. The API hosts no logic — it just brokers between the database and the core. The gateway exposes a typed and closed set of operations, never free-form queries.

Above it, query hooks, stores, and presentation are entirely unaware of the active mode.

**Opening cycle**: the user picks their file, so repositories cannot be built at startup. The application splits into a bootstrap stage (choosing or resuming a workspace, unlocking, migrations, journal replay) and an app stage mounted only once the workspace is ready. Switching workspace is a full unmount followed by a remount.

**File location**: free on desktop, including inside a cloud-synced folder — this usage is supported. On mobile, the database lives in the app-reserved directory only; sharing goes through explicit import and export.

---

## Security and integrity

| Element | Handling |
|---|---|
| Local database | SQLCipher-encrypted. Key held by the native adapter, never exposed to JavaScript. |
| Journal and files | Encrypted by the core, using a JavaScript library embedded in the core. Key derived separately. |
| API key in online mode | System keyring on desktop and mobile. On web, no vault exists: retention limited to the session. |
| Occupancy lock | File next to the database, with device ID, refreshed timestamp, and expiration. Never an internal flag in the database. |
| Operations journal | Append-only, one file per device, entries individually sealed and chained, segmented by rotation. |
| SQLite engine | No persistent sidecar journaling files, clean close on every backgrounding, integrity check at open, rolling backups kept outside the synced folder. |

The database is a **rebuildable projection** from the journal, not the single source of truth. Every write goes to the journal before being applied.

---

## Tests

Shared logic is tested only once, in the packages. App tests cover only composition and presentation.

| Scope | Tool |
|---|---|
| Domain, data, journal, app core | Vitest |
| DOM components | Vitest and Testing Library |
| Native components | Vitest with `vitest-native` |
| End-to-end | Playwright, WebdriverIO, Maestro |

Known limitation: desktop end-to-end tests do not work on macOS — the system WebView exposes no driver.

---

## Code conventions

PascalCase for components and their files, camelCase for other files, kebab-case after `@repo/` for packages, `@/` alias for imports internal to an app.

Full strict mode, no `any`, no unused variable, explicit type imports, `async` and `await` only, errors as discriminated unions, no barrel files, no default exports, Conventional Commits.

No manual memoization: React Compiler is on for all three targets.

---

## Risk points

| Topic | Nature |
|---|---|
| Bun + workspaces + Metro + source-exposed packages | least battle-tested combination in the repo — validate with a minimal spike before investing. |
| SQLCipher on Tauri | the only Rust code in the project, off the beaten track of the ecosystem — validate on all three OSes. |
| Mobile dev build required | consequence of SQLCipher: the generic Expo client is unusable. |
| Local file portability | a device-bound key makes the file unreadable elsewhere. Product decision required. |
| Gateway granularity | too fine-grained and online mode chains network round-trips. |
| Signing certificates and publishing identities | long lead times, kick off very early. |

---

## Out of scope for now

Distributed API in a container with its own database, API key issuance and revocation, per-user authentication, multi-device journal merge, migrating data from one workspace to another, opening several workspaces at once, extracting native components into a dedicated package.

Two safeguards already applied to keep these doors open: client-generated entity IDs, and created/modified timestamps carried by each entity from the first schema.
