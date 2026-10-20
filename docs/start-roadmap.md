# Monorepo architecture: Web + Desktop (Tauri) + Mobile (Expo)

> **Document nature**: architecture and code-structure specification. It describes modules, their responsibilities, their boundaries, and the chosen technologies. It contains no business logic, no code example, and no product decision.
>
> **Audience**: an agent tasked with setting up the full repository skeleton (workspaces, empty but correctly configured packages, build toolchains, tests, CI).
>
> This document replaces the previous roadmap.

---

## 1. Overview

Three shippable applications, one repository:

| Application | Target | Runtime | Rendering |
|---|---|---|---|
| `web` | Browser | Vite | DOM |
| `desktop` | Windows / macOS / Linux | Tauri 2 (system WebView) | DOM |
| `mobile` | iOS / Android | Expo / React Native | Native |

`web` and `desktop` share their UI (DOM, same component tree, same router). `mobile` shares **no component** with them: it has its own native presentation layer and its own version of React.

What is shared across the three targets: the domain, data access, application state, translations, design tokens, and platform contracts. By volume, this is the majority of non-UI code.

The application is organised around workspaces, whose storage mode — local or online — is chosen at creation and permanent. Local mode is only available on desktop and mobile. See section 9.

---

## 2. Guiding principles

These five rules drive the whole structure. Violating any one of them compromises sharing.

1. **Capability abstraction, not platform abstraction.** Shared code never asks about the nature of its host. It asks about declared capabilities (can write a file, works offline, has a custom title bar). Adding a fourth target must therefore break nothing.
2. **Sharing stops at the rendering boundary.** Everything that touches the DOM stays on the web and desktop side. Everything that touches React Native stays inside the mobile app. No package contains both.
3. **Two strictly isolated React runtimes.** The mobile app uses the React version imposed by the Expo SDK version. Web and desktop use theirs. Shared packages never depend on React as a direct dependency.
4. **Shared packages are passive, adapters are silent.** Packages declare contracts and implement logic. Applications instantiate, wire, and inject concrete implementations. Those implementations contain no logic: they run primitives. Split rule: if a piece of processing could be written identically in two adapters, it is not in the right place and must move up to the core.
5. **Boundaries are tooled, not documented.** Dependency rules are enforced by the linter and by module resolution, not by developer vigilance.

---

## 3. Technologies

### Common core

| Domain | Technology |
|---|---|
| Package manager | Bun (workspaces + catalogs) |
| Orchestration | Turborepo |
| Language | TypeScript, strict mode |
| Lint and format | Biome |
| Git hooks | Lefthook |
| Schema validation | Zod |
| Journal and file encryption | authenticated encryption library in JavaScript, embedded in the core |
| Client state | Zustand |
| Server state and cache | TanStack Query |
| Internationalization | i18next |
| React optimization | React Compiler (enabled on all three targets) |
| Shared-logic tests | Vitest |

### Per target

| | Web | Desktop | Mobile |
|---|---|---|---|
| Framework | React 19 | React 19 | React (version imposed by Expo) |
| Bundler | Vite | Vite | Metro |
| Native shell | none | Tauri 2 (Rust) | Expo SDK |
| Router | TanStack Router | TanStack Router | Expo Router |
| Style | Tailwind CSS v4 | Tailwind CSS v4 | React Native StyleSheet fed by tokens |
| Components | shadcn/ui | shadcn/ui | native library local to the app |
| HTTP client | ky | ky | ky |
| Local persistence | not applicable | SQLite encrypted with SQLCipher, dedicated Rust module | SQLite encrypted with SQLCipher via `expo-sqlite` |
| Available modes | online only | local or online | local or online |
| Secrets vault | none | system keyring via the `keyring` library | `expo-secure-store` |
| Biometric unlock | none | `tauri-plugin-biometry` (Touch ID / Windows Hello, opt-in — `docs/spec/open-questions.md` #23) | `expo-local-authentication`, not built |
| File system | not available | Tauri `fs` and `dialog` plugins | `expo-file-system` (files and folder picker) |
| Key-value storage | `localStorage` | `localStorage` | `expo-sqlite/kv-store` |
| UI tests | Vitest + Testing Library | Vitest + Testing Library | Vitest + `vitest-native` + Testing Library Native |
| End-to-end tests | Playwright | WebdriverIO + tauri-driver | Maestro |
| Distribution | Static CDN | Signed bundles + Tauri updater | EAS Build and EAS Update |

---

## 4. Target tree

```
<repo>/
├── apps/
│   ├── web/
│   ├── desktop/
│   │   └── src-tauri/
│   └── mobile/
│       └── src/ui/              <- native components, not shared
├── packages/
│   ├── domain/                  <- level 0, pure TypeScript
│   ├── platform/                <- level 0, platform contracts
│   ├── design-tokens/           <- level 0, design values
│   ├── data/                    <- level 1, data-access implementations
│   ├── i18n/                    <- level 1, translation resources
│   ├── platform-web/            <- level 1, browser adapter
│   ├── platform-tauri/          <- level 1, Tauri adapter
│   ├── platform-expo/           <- level 1, Expo adapter
│   ├── app-core/                <- level 2, React without DOM or native
│   ├── ui/                      <- level 3, DOM components
│   ├── routes/                  <- level 3, DOM route tree
│   ├── router/                  <- level 3, DOM router factory
│   ├── typescript-config/
│   └── vitest-config/
├── turbo.json
├── biome.json
├── lefthook.yml
└── package.json
```

---

## 5. Role of each module

### Level 0: foundations, pure TypeScript

No runtime dependency. No React, no DOM, no React Native, no Tauri, no Expo. These packages are importable by anything, including a future backend service.

| Package | Purpose | Contains | Never contains |
|---|---|---|---|
| `@repo/domain` | Describe what the application manipulates, independently of any technology. | Domain types and entities, validation schemas, result type and error taxonomy as discriminated unions, data-repository contracts. | Network call, SQL query, hook, component. |
| `@repo/platform` | Describe what a host platform must be able to do. | Interfaces of platform services (key-value storage, secrets, file system, SQL driver, localization, external link opening, updates, window controls), capability declarations, fake platform factory for tests. | Any real implementation, any import of `@tauri-apps/*` or `expo-*`. |
| `@repo/design-tokens` | Be the single source of truth for visual values. | Colors, typographic scales, spacings, radii, animation durations, exported as raw data. | Style sheet, utility class, component. |

Attention point on `@repo/design-tokens`: it is the only visual artefact shared between the DOM world and the native world. It is consumed on one side to feed the Tailwind theme, on the other to feed the native style system. It must therefore depend on neither of them.

### Level 1: implementations and adapters

| Package | Purpose | Contains | Never contains |
|---|---|---|---|
| `@repo/data` | Implement the repositories defined by the domain, once, on top of an interchangeable persistence gateway. | Single repository implementation, gateway contract, local gateway and remote gateway, database schema, migration definitions, operations journal and replay, occupancy-lock protocol, workspace bootstrap sequence, wiring factories. | Creation of an HTTP client instance or of a SQL driver: both are provided by the application. |
| `@repo/i18n` | Centralize translations and i18next configuration. | Resources per namespace and per language, i18next initialization, strict typing of keys. | React binding: it belongs to level 2. |
| `@repo/platform-web` | Implement platform contracts with browser APIs. | Browser storage, localization, link opening, web capability declarations. | Anything unavailable in a browser. |
| `@repo/platform-tauri` | Implement platform contracts with Tauri plugins. | Storage, secrets, file system, SQL driver, window controls, updates, system localization. | Any business logic. This is the only package in the repository allowed to import `@tauri-apps/*`. |
| `@repo/platform-expo` | Implement platform contracts with Expo modules. | Storage, secrets, file system, SQL driver, localization, file sharing. | Any business logic. This is the only package allowed to import `expo-*`. |

The three platform adapters implement the same interface and are interchangeable from the caller's point of view. They only differ in the capabilities they declare and in the optional services they provide or not.

### Level 2: React application core

| Package | Purpose | Contains | Never contains |
|---|---|---|---|
| `@repo/app-core` | Provide the entire React layer that does not need to know what it is displayed on. | Context providers (platform, repositories, query client, translation), Zustand store factories, query and mutation hooks, reusable logic hooks, selectors. | `react-dom`, `react-native`, any visual JSX, any layout. |

This is the trickiest package in the repository. It depends on React but must not depend on any renderer. It declares React as a peer dependency only, never as a direct dependency. It is consumed by all three applications, each with its own React instance.

Zustand stores here are exposed as factories and consumed via a context provider, never as module singletons. Three reasons: isolation between tests, injection of platform dependencies into the store, and support for multi-window on desktop where each window is a separate JavaScript context.

### Level 3: DOM presentation, reserved for web and desktop

| Package | Purpose | Contains | Never contains |
|---|---|---|---|
| `@repo/ui` | Provide the DOM component library, without any knowledge of the application. | shadcn/ui primitives, composed components, Tailwind theme sheet fed by design tokens, composition slots for platform-specific elements. | Import of `@repo/platform`, `@repo/app-core`, or `@repo/data`. Components receive everything via props. |
| `@repo/routes` | Contain the route tree shared between web and desktop. | Route files, layouts, data loaders, route groups. Suffix convention for the few routes exclusive to one target. | Router instantiation. |
| `@repo/router` | Build a configured router instance. | Router factory, router context typing, shared preload and scroll-restoration options. | Choice of navigation history, which is injected by the application. |

The mobile application consumes none of these three packages.

### Configuration packages

`@repo/typescript-config` and `@repo/vitest-config` provide the base configurations inherited by all others. They provide distinct variants for the DOM context and the native context. Biome is not packaged: a single `biome.json` at the root holds the rules and carries the per-directory `overrides` that materialize the matrix in section 6.

### Applications

| Application | Own responsibilities |
|---|---|
| `apps/web` | Final composition, instantiation of the query client, the web platform, the HTTP client from the connection profile, and the router. Online mode only. Entry point, global style sheet, Vite config. |
| `apps/desktop` | Same composition, with the Tauri platform and resolution of the configured mode. Additionally contains the Rust project, the Tauri config, permissions, the encrypted-database module, icons, and platform-specific window elements. |
| `apps/mobile` | Same composition, with the Expo platform and resolution of the configured mode, plus **its entire presentation layer**: Expo Router navigation, screens, native components, native theme built from design tokens. No native-component package is extracted as long as there is only one mobile application. |

---

## 6. Dependency graph

```
        apps/web        apps/desktop            apps/mobile
            │                │                       │
            ├── ui ──────────┤                       ├── src/ui  (native, local)
            ├── router ──────┤                       │
            ├── routes ──────┤                       │
            │                │                       │
            └──── app-core ──┴───────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
      data         i18n     platform-{web|tauri|expo}
        │            │            │
        └────────────┴────────────┘
                     │
        ┌────────────┼────────────┐
     domain      platform    design-tokens
```

### Authorization matrix

| From \ To | domain | platform | tokens | data | i18n | platform-* | app-core | ui | routes/router |
|---|---|---|---|---|---|---|---|---|---|
| `domain` | | | | no | no | no | no | no | no |
| `platform` | no | | | no | no | no | no | no | no |
| `design-tokens` | no | no | | no | no | no | no | no | no |
| `data` | yes | yes | no | | no | **no** | no | no | no |
| `i18n` | yes | no | no | no | | no | no | no | no |
| `platform-*` | yes | yes | no | no | no | | no | no | no |
| `app-core` | yes | yes | no | yes | yes | **no** | | no | no |
| `ui` | no | **no** | yes | no | no | no | **no** | | no |
| `routes` / `router` | yes | yes | no | no | yes | no | yes | yes | |
| `apps/*` | yes | yes | yes | yes | yes | its own only | yes | per target | per target |

The three structural bans, to be enforced by the linter:

1. No shared package imports a concrete platform adapter. Only applications know them.
2. `@repo/ui` knows neither the platform nor the app state. It remains testable and viewable in isolation.
3. `@tauri-apps/*` and `expo-*` exist respectively only in `platform-tauri` plus `apps/desktop`, and `platform-expo` plus `apps/mobile`.

---

## 7. Isolation of the two React runtimes

This is the most delicate technical constraint of the repository. Two React instances cannot coexist in a single bundle, and Expo dictates the React version tied to its SDK.

Rules to apply from the start:

- Any shared package that uses React declares it as a **peer** dependency and as a dev dependency, never as a direct dependency. This concerns `@repo/app-core`, and only it.
- No shared package imports `react-dom` or `react-native`. Level-3 packages may import `react-dom`; they are not consumed by mobile.
- `react-native` is never installed at the root of the repository, only in `apps/mobile`.
- **Bun catalogs** are used to freeze two distinct sets of versions: one for the DOM toolchain, one for the Expo toolchain. Expo-toolchain versions are aligned by Expo's checker, never chosen by hand.
- On the Vite side, `react` and `react-dom` resolution is explicitly deduplicated to the application's modules.
- On the Metro side, the monorepo configuration must watch the repo root, restrict module lookup to the app then root directories, disable hierarchical lookup to guarantee a single React instance, and enable resolution via the `exports` field since shared packages expose sources.

### Internal publishing strategy

Shared packages are not built: they directly expose their TypeScript sources, and each app transpiles them with its own chain. Consequences the setup agent must assume:

- No intermediate build step, therefore hot reload across package boundaries and no prior build command before testing a change.
- Each app's transform configuration must include the paths of shared packages, otherwise the packages' TypeScript is not processed.
- Packages stay private and non-publishable as-is, which is acceptable here.

---

## 8. Platform layer

The platform contract distinguishes mandatory services from optional services. A missing optional service is signalled by a capability set to false, never by an exception at call time.

| Service | Web | Desktop | Mobile |
|---|---|---|---|
| Configured HTTP client | provided by the app | provided by the app | provided by the app |
| Key-value storage | available | available | available |
| Secrets | no | system keyring | system keyring |
| Encrypted SQL driver | absent | available | available |
| File system | absent | available | available, in the app sandbox |
| User file selection | absent | native dialog, free location | folder picker (`expo-file-system`), with import into the app workspace |
| Resume of a remembered location | absent | available, subject to persistent authorization | not applicable, the file lives inside the app |
| Cryptographic random generation | available | available | available |
| System localization | available | available | available |
| Application update | not applicable | available | via the Expo update channel |
| Window controls | absent | available | not applicable |
| Notifications | available | available | available |

Two services deserve a note, as they illustrate the silent-adapter principle.

**HTTP client.** The contract carries a pre-configured `ky` instance, provided by the app: base URL, headers, retry policy, timeouts, plugins. The core builds requests, validates responses, and translates errors. Since `ky` sits on `fetch`, it works as-is on all three targets. If desktop needs to bypass origin restrictions, the app provides an instance whose underlying `fetch` implementation is the one from the Tauri HTTP plugin: the core sees no difference.

**File system.** The provided implementation is limited to primitives: read, write, delete, list, resolve a path, open a picker. Naming, logical tree, serialization, atomic writing, cleanup, and quotas belong to the core.

The application consumes these services through the context provided by `@repo/app-core`. Shared code tests a capability before taking an optional path. No condition on the platform name is allowed outside applications themselves.

---

## 9. Data layer

The application's unit of work is a **workspace**: a data set, with a storage mode chosen at its creation and **immutable** thereafter. The mode is therefore neither a consequence of the platform nor a runtime-adjustable setting.

| Mode | Source of truth | Designated by the user | Availability |
|---|---|---|---|
| Local | encrypted SQLite file | location chosen at creation, file found again at subsequent openings | desktop and mobile |
| Online | remote database served by the API | address and API key entered at creation | all three targets |

### One repository implementation, two gateways

The API hosts no logic: it exposes persistence and acts as an interface between the database and the core, which remains the sole rule-holder. The two modes therefore present the same data shape and the same operations.

A structural choice follows: **there is only one repository implementation**, in `@repo/data`, parameterized by a **persistence gateway**. Only two gateways differ.

| Layer | Role | Number of implementations |
|---|---|---|
| Repositories | access rules, operation composition, validation, error translation | one, shared |
| Persistence gateway | execution of elementary read, write, and batch operations | two, local and remote |

This shape avoids duplicating data-access logic between the two modes, which would have been the main drift risk of the project.

The gateway exposes a **typed and closed** set of operations: read a collection with criteria, read by ID, write, delete, execute an atomic batch. It never exposes a free query. Passing arbitrary SQL to the API would give full database access to anyone holding a key, and would forfeit any possibility of independent evolution on either side.

Two behavioural differences must be planned from the gateway definition, otherwise online mode will be slow and fragile: operation granularity, which must allow retrieving a coherent set in a single round trip rather than a chain, and batch semantics, which correspond to a transaction locally and to a single call on the API side.

Above it, nothing changes: the query layer of `@repo/app-core`, the stores, and the presentation are entirely unaware of the active mode.

### Opening cycle

Since local mode requires the user to pick a location, **repositories cannot be built at application startup**. This is the heaviest structural consequence of the choice, and must be taken into account from the start.

The application therefore splits into two stages:

| Stage | Contents | Available context |
|---|---|---|
| Bootstrap | choose or resume a workspace, create, pick file, enter address and key, unlock, migrations | platform and translations only |
| Application | all business screens | full context, repositories guaranteed ready |

The application stage is only mounted once the workspace is open and verified. It therefore never has to handle the case of a missing or uninitialised repository, which eliminates an entire class of defensive conditions in screens. Switching workspace is a full unmount followed by a remount, never an in-place mutation.

The bootstrap sequence belongs to the core: resume of the last known workspace, accessibility check, occupancy-lock acquisition, cryptographic unlock, integrity check, schema-version check, migration application, replay of unapplied journal entries, then repository construction. Apps only provide primitives and presentation.

### Workspace designation

| Mode | At creation | On subsequent openings |
|---|---|---|
| Local | the user picks a file location | resume from the recent-workspaces list, or new file designation |
| Online | the user enters the API address and its key | resume of the saved workspace |

The recent-workspaces list falls under the key-value storage contract; the API key falls under the secrets contract.

Three technical consequences to handle explicitly:

**Mobile cannot open a file in place.** Mobile systems sandbox storage: a file picked from the document manager is provided as a copy, and the embedded SQLite engine works in the app-reserved directory. The desktop notion of location designation is therefore not transposable there. The retained mobile behaviour is import of the file into the app workspace on creation or resume, and explicit export when the user wants to retrieve their file — plus, where the system offers one, creation directly inside the app's own synced folder (iOS iCloud Drive container, see "Workspace in a synced folder" → "Mobile case"). The platform contract exposes this difference as a capability, not as a special case coded in the core.

**The encryption key becomes file-specific, not device-specific.** A portable workspace encrypted by a key kept in the local keyring is no longer openable elsewhere. Two consistent policies exist, and the choice must be explicit: either the key stays tied to the device and the file is unreadable elsewhere, or it is derived from a user-supplied secret at opening and the file stays portable at the cost of an unlock. The second policy is the only one compatible with truly nomadic file usage. Contract and core are identical in both cases; only the policy changes.

**Persistent access to a chosen location is not guaranteed on macOS.** Access authorization for a file outside the sandbox does not survive restart without a bookmark mechanism. Resuming a recent workspace must plan for this case and re-prompt for file designation rather than fail.

### Workspace in a synced folder

Since the user can put their file wherever they want on desktop, a workspace will end up in a folder synced by a cloud service. This usage is **assumed and supported**, subject to the safeguards described here.

The risk is real but poorly distributed. Concurrent write from two devices is a rare case in normal use. The actual danger lies elsewhere: a sync service copies the file during a write, does not honour engine locking, and only resolves conflicts at the whole-file level. Without precautions, the incident manifests as silent corruption, detected long after the fact. The safeguards below therefore aim first at detection and recovery; preventing concurrency is only the first step.

#### Occupancy lock

The lock is not held in the database. An internal flag would modify the whole file, would only propagate at the end of a full sync, and would itself conflict.

The lock is a **file next to the database**, distinct and tiny, containing the device ID, a session ID, and a periodically refreshed timestamp while in use. It syncs quickly, independently of the database, and a conflict on it is inconsequential.

| Situation at opening | Behaviour |
|---|---|
| No lock | acquire the lock, normal open |
| Lock from the same device | resume, previous unclean shutdown reported |
| Lock from another device, recent timestamp | explicit warning, open read-only or defer to the user |
| Lock from another device, stale timestamp | acquire the lock after confirmation |

Expiration is mandatory: without it, an abrupt shutdown or a lost connection leaves the workspace inaccessible permanently. The lock is released on clean close, and its residual presence is never blocking on its own.

#### Operations journal

Every operation that modifies data is first written to an **append-only journal**, then applied to the database. The database becomes a rebuildable projection and ceases to be the single source of truth.

| Rule | Reason |
|---|---|
| One journal file per device, never a shared file | two concurrent appends on the same file are exactly what sync cannot merge |
| Each entry carries a sortable ID, the device ID, a timestamp, and the full operation | condition for deterministic replay and later merge |
| Each entry is individually sealed | a single-block encrypted file cannot be extended by append |
| The database keeps the pointer to the last applied entry | allows replaying only the delta at opening |
| Journal write before database application | ensures no acknowledged operation is lost |

What the journal brings immediately: full reconstruction after corruption, resume after abrupt shutdown, and traceability. What it prepares without delivering: multi-device merge, since journals from distinct devices are by construction mergeable.

What the journal does not solve: two devices writing simultaneously produce two divergent projections until merge is implemented. The lock therefore remains necessary.

#### Journal encryption

The journal contains data and must be protected at the same level as the database. Three forms were considered; only one is compatible with an append-only file.

| Form | Verdict | Reason |
|---|---|---|
| Single-block encrypted file | rejected | append would force rewriting the whole file at a cost growing with history. An interruption during rewrite would destroy the journal — that is, the recovery mechanism itself. In a synced folder, every write would resend the whole file. |
| Values encrypted field by field | rejected | per-field overhead, delicate key-ID handling, and most importantly structure left in the clear: touched entities, operation types, frequency. This form is only justified when a third party must handle the file without reading it, which is not the case here. |
| Entry by entry, individually sealed | **retained** | constant-cost append, independent decryption of each entry, localized corruption, truncated entry detectable and discardable. |

The retained form imposes four rules:

| Rule | Reason |
|---|---|
| Entry chaining: the sequence number and the previous entry's hash enter the authenticated data | without a link between entries, deletion, reordering, or truncation of the journal would remain invisible. The journal must be tamper-evident, not just confidential. |
| Key derived separately from the database key, from the same original secret | reusing a key for another purpose and another algorithm is a classic mistake |
| Length prefix and seal per entry | allows detecting and discarding an entry partially written during an abrupt shutdown |
| Segmentation by size rotation | makes compaction after snapshot possible and limits the volume returned by the sync service on each write |

Only a minimal header remains in the clear: format version, cryptographic suite, and derivation elements. The device ID is carried by the segment file name, which is enough for future merge without exposing more.

The core produces the entire recorded frame: deterministic serialization of the operation, sequence number, previous entry's hash, assembly of the authenticated data, seal, length prefix, segment choice. None of this format is delegated.

Journal and file encryption relies on an **authenticated encryption library in JavaScript, embedded in the core**, not on a platform primitive. This choice is deliberate and justified by the retained threat model: protection targets the stolen, copied, or synced-folder-recovered file, not an already-compromised app process. Three benefits follow.

| Benefit | Scope |
|---|---|
| No additional native dependency on mobile | only SQLCipher remains to integrate |
| Rigorously identical behaviour across the three runtimes | a journal sealed on desktop reads unambiguously on mobile |
| No risk of implementation drift between platforms | the format has only one implementation |

This split is asymmetric and deliberately so: the database key never crosses the native boundary, the journal and file key lives in the core. The two keys are derived separately from the same original secret, and the second gives no access to the first.

#### Engine precautions

Three settings follow directly from the file living in a synced folder.

| Precaution | Reason |
|---|---|
| No journaling mode with persistent sidecar files | sidecar files sync separately from the database and can arrive out of sync, which is enough to corrupt the whole. The database must be a single file at rest. |
| Clean close and consolidation on every backgrounding or exit | the at-rest state must always be consistent, since sync can trigger at any time |
| Integrity check at opening, before any write | detects corruption from a partial sync before it spreads |

Two additional safety mechanisms: a file hash captured at opening and checked periodically, to detect that a remote version replaced the file under the app, and rolling backups kept **outside the synced folder**, in the app space.

#### Mobile case

Mobile cannot open a file in place in a folder the user picks, so by default the database lives in the app-reserved directory and sharing goes through explicit import and export. One exception: a folder the **system itself** syncs and hands to the app — iCloud Drive's app container on iOS — is a real directory the engine can open in place. The platform contract exposes it as `FileSystemService.syncedDirectory()` (null where none exists, e.g. Android), and a workspace created there falls under every safeguard of this section, exactly as a desktop workspace in a synced folder does (`open-questions.md` #25). The journal exists on mobile in both cases, for reconstruction and future merge.

Security point to assume explicitly for online mode: on web, there is no system vault. An API key there is exposed to the browser context, regardless of storage method. The web platform's secrets contract declares this capability as absent, and the core applies a degraded policy for this target accordingly: the key is only kept for the session, never persisted. This behaviour follows from the capability declaration; it is not hardcoded for web.

### Schema and migrations

The database schema and migrations are defined once in `@repo/data`. Each native platform only provides the request-execution driver, via the platform contract. Migrations are embedded in the application and applied after database unlock, only in local mode.

### Local database encryption

The local databases on desktop and mobile are encrypted with SQLCipher, which applies AES-256 to the entire file.

**This encryption cannot be performed by the core.** It operates inside the SQLite engine, upstream of anything JavaScript sees. Responsibility is therefore split:

| Responsibility | Holder |
|---|---|
| Key policy: generation at first opening, length, rotation, unlock conditions | core |
| Opening sequence: unlock, integrity check, migration application, repository exposure | core |
| Secret holding and storage | platform adapter |
| Actual database opening with the key | platform adapter |

The contract exposed to the core is therefore "unlock the database" and not "open the database with this key". The core drives the sequence without ever handling database crypto material. This is a security constraint as much as an architectural one: on desktop, a key transiting through the app bridge would live in WebView memory, which would negate part of the encryption benefit.

**Mobile implementation.** `expo-sqlite` embeds SQLCipher. Activation goes through an option of its config plugin; the key is supplied immediately after opening the database. Two constraints to integrate from the start: prior native generation is mandatory, so development happens on a development build and not on the generic Expo client, and support covers Android, iOS, and macOS only.

**Desktop implementation.** Tauri's official SQL plugin sits on sqlx and does not support SQLCipher. The request has been open since 2022 and is still unresolved in versions released in 2026. Community forks exist but are poorly maintained, and pulling them into the build chain creates a fragile dependency. The chosen path is a Rust module local to the desktop app, sitting on the SQLCipher-embedded variant of the SQLite library, exposing exactly the command surface expected by the platform contract. Three costs to assume: SQLCipher compilation at build, larger build time and binary size, and heightened vigilance on cross-compilation.

**Secret storage.** The secret lives in the operating-system keyring: `expo-secure-store` on mobile, `keyring` library on desktop. The Tauri Stronghold plugin is dropped — it is deprecated and will disappear in version 3.

Two guard modes are possible, to pick according to the required level:

| Mode | Operation | Protects against | Cost to the user |
|---|---|---|---|
| Key tied to the device | random secret generated on first launch, kept in the keyring | file copy, disk access, exfiltrated backup | none |
| Key derived from a user secret | derivation at each opening by a slow key-derivation function | additionally, compromised local session | unlock at every launch |

Device-tied mode is the default choice. The second mode grafts onto the same contract without core changes; only the policy changes.

### File encryption

Files stored outside the database are not covered by SQLCipher. Their encryption **belongs entirely to the core**, library included: the core encrypts bytes before handing them to the file system and decrypts them on read. The adapter only sees opaque bytes and does not know they are encrypted. The platform only provides random generation here.

Two regimes coexist depending on the file's nature: single-block seal for files written at once, entry-by-entry seal for append-only files, including the operations journal. The second is detailed in section 9.

The split is therefore asymmetric, and for a precise reason: database encryption is delegated because it is internal to the engine and its key must not cross the native boundary; file encryption is centralized because the format belongs to it and cross-platform portability is paramount.

---

## 10. Navigation

Navigation is the second point where mobile diverges completely.

| | Web and Desktop | Mobile |
|---|---|---|
| Library | TanStack Router | Expo Router |
| Route definition | shared package `@repo/routes`, tree generated per app | mobile app directory |
| Dependency injection | typed router context | React root providers |
| Data loading | route loaders | query hooks on screen mount |

No attempt is made to share route definitions between DOM and native: the models are too far apart and the gain would be negative. What is shared is the layer just below, namely the query hooks and screen logic provided by `@repo/app-core`.

Between web and desktop, on the other hand, the route tree is entirely shared. The few target-exclusive routes are distinguished by a file-name convention and excluded by each app's generation configuration. The navigation history is injected by the app and not hardcoded in the factory, in order to be able to switch desktop to an in-memory history without touching shared code.

---

## 11. React Compiler

The React Compiler is enabled on all three applications.

- Web and desktop: Babel plugin wired into the Vite chain, in automatic mode, targeting React 19.
- Mobile: activation through Expo config; the SDK's Babel chain handles the rest.
- Since shared packages are consumed as sources, each app applies the compiler to the full graph it compiles. Shared-package paths must therefore be explicitly included in the transform scope of both chains.

Consequences on code conventions, to record in the repo guide:

- No manual memoization. The compiler handles it, and adding it by hand harms its analysis.
- React rules must be respected strictly, otherwise the compiler silently ignores the affected component.
- Plan a dedicated static check for compiler rules in the lint chain, in addition to Biome which does not cover them all.

---

## 12. Style and theme

| Layer | Web and Desktop | Mobile |
|---|---|---|
| Source of values | `@repo/design-tokens` | `@repo/design-tokens` |
| Engine | Tailwind CSS v4, theme declared in CSS | React Native StyleSheet |
| Components | shadcn/ui in `@repo/ui` | native library in `apps/mobile` |
| Dark mode | theme variables | same token set, selection at the native theme level |

On mobile, no styling layer is introduced on top. Native style sheets consume design tokens directly, which guarantees visual consistency with DOM targets without creating a dependency between the two worlds.

Constraint to respect on the Tailwind v4 side: source scanning must explicitly include the directories of shared packages containing JSX, otherwise classes used in these packages are absent from the production bundle even though everything works in development.

---

## 13. Test strategy

| Scope | Tool | Location |
|---|---|---|
| Domain, data, i18n | Vitest, Node environment | in each package |
| React app core | Vitest, jsdom environment | in `app-core` |
| DOM components | Vitest and Testing Library | in `ui` and DOM apps |
| Native components | Vitest, `vitest-native` plugin, and Testing Library Native | in `apps/mobile` |
| Web end-to-end | Playwright | in `apps/web` |
| Desktop end-to-end | WebdriverIO and tauri-driver | in `apps/desktop` |
| Mobile end-to-end | Maestro | in `apps/mobile` |

Two structural points:

- Shared logic is tested **only once**, in the packages. App tests cover only composition and presentation. This is the main benefit of the architecture.
- The mobile target runs on the same runner as the rest of the repo. The `vitest-native` plugin loads the real React Native JavaScript and mocks only the native boundary, so `@repo/vitest-config` stays the single source of test configuration. The plugin is still young: if it breaks on a React Native upgrade, falling back to jest-expo affects `apps/mobile` alone.
- Shared-logic tests rely on the fake platform provided by `@repo/platform` and on an in-memory SQLite database for the local variant of repositories. No shared test starts Tauri or a simulator.

Known limitation: desktop end-to-end tests do not work on macOS — the system WebView does not expose a WebDriver. Plan this execution on Linux only.

---

## 14. Build chain and continuous integration

Turborepo orchestrates everything with a per-package task graph. Points to respect at setup:

- Explicitly declare the environment variables consumed by each task; Turborepo 2 is strict on this.
- Declare each task's outputs so that caching is effective, including native bundles.
- Enable remote caching from installation; the benefit is mainly noticeable on Rust and native tasks.
- Development tasks are marked persistent and not cached.

Delivery chains:

| Target | Trigger | Chain |
|---|---|---|
| Web | merge on the integration branch | build then CDN deployment, with fallback to the single entry point for client-side routing |
| Desktop | version tag | matrix across the three systems, Rust build with cache, signing, notarization on macOS, publication of the update artefact |
| Mobile | version tag | EAS Build for binaries, EAS Update for application patches |

Three items to prepare very early, as lead times are long: the desktop signing certificate, mobile publishing identities, and Tauri update-mechanism signing keys.

---

## 15. Code conventions

| Element | Convention |
|---|---|
| Components | PascalCase |
| Component files | PascalCase |
| Other files | camelCase |
| Types and interfaces | PascalCase, no prefix |
| Hooks | `use` prefix, camelCase |
| Packages | `@repo/` followed by kebab-case |

TypeScript and style rules, enforced by Biome:

- Full strict mode, no `any` type, no unused variable or parameter.
- Type imports and exports explicitly marked as such.
- `@/` alias for imports internal to an app, `@repo/` for packages.
- `async` functions with explicit `await`, no unhandled promise.
- Error handling by discriminated unions, never by untyped catch.
- No barrel files, no default export.
- Conventional Commits, feature branches merged into the integration branch.

An import-restriction rule is configured per directory to materialize the matrix from section 6. A violation must fail lint, not only review.

---

## 16. Setup order

Recommended sequence for the agent in charge of scaffolding. Each step is independently verifiable.

| Step | Contents | Validation criterion |
|---|---|---|
| 1 | Repository root: Bun workspaces, catalogs, Turborepo, Biome, Lefthook, configuration packages | Lint and typecheck tasks pass on an empty repository |
| 2 | Level-0 packages, empty but configured and typed | Typecheck and empty tests pass |
| 3 | Web app: Vite, React, Tailwind, React Compiler, one demo route | Development and production build work |
| 4 | `@repo/ui` and shadcn integration in monorepo mode, wiring of design tokens | A component consumed by web, present in the production bundle |
| 5 | `@repo/platform` then `@repo/platform-web`, wired into the web app | The platform is accessible from a component; the fake platform works in tests |
| 6 | `@repo/routes` and `@repo/router`, tree generation on the web side | Typed navigation works, generated tree ignored by version control |
| 7 | `@repo/app-core` and `@repo/data`: repositories, gateway contract, remote gateway, bootstrap stage, `@repo/i18n` | A full route/repository/gateway/query/component flow, tested against an online workspace |
| 8 | Desktop app: Vite, Tauri, permissions, platform adapter, Rust SQLCipher module, system keyring, local gateway, file designation, lock and journal | Local workspace created at a chosen location, closed, reopened from the recent list, database rebuilt from the journal after deliberate deletion, file unreadable outside the app |
| 9 | Mobile app: Expo, Metro in monorepo mode, development build, platform adapter, encrypted database, file import and export, navigation skeleton | App launched on a simulator, single React instance verified, local workspace created then exported and reimported |
| 10 | Full test chains then CI and delivery | All Turborepo tasks green on the three targets |

Step 9 is the riskiest: the Bun + workspaces + Metro + source-exposed packages combination is the least battle-tested in the repo. Minimal validation of that chain is recommended as soon as step 2 ends, with a dummy shared package consumed by an empty Expo app, before investing in later steps.

Step 8 carries the project's second risk: desktop database encryption falls outside the Tauri ecosystem's beaten tracks and involves specific Rust code. It is recommended to validate separately, before step 8, that an encrypted database opens, migrates, and reads from the app on all three target operating systems.

---

## 17. Out of scope, to handle later

These topics are identified but deliberately excluded from the initial setup. They are listed here so that the architecture does not close the door on them, not to be implemented now.

| Topic | Nature | Existing hook |
|---|---|---|
| Distribution of the API in a container, embedding the service and its database | infrastructure | the connection profile already accepts an arbitrary address |
| API-key issuance, rotation, and revocation by that container | infrastructure and security | the key is already treated as a secret carried by the secrets contract |
| Per-user authentication, replacing or complementing the API key | app-level | reserved slot in the router context and dedicated route group |
| Synchronization between a local workspace and an online workspace | app-level | the two gateways already share a single contract |
| Merge of journals from multiple devices sharing the same synced folder | app-level | the per-device journal format is already in place, only merge is missing |
| Automatic conflict resolution in the event of proven concurrent writes | app-level | the occupancy lock makes the case rare but does not eliminate it |
| Data resumption from one workspace to another, import and export | app-level | the schema is defined once, independently of the mode |
| Simultaneous opening of multiple workspaces | structural | the bootstrap stage already isolates a workspace's lifecycle |
| Extraction of native components into a dedicated package | structural | relevant only from a second mobile app onward |

Two precautions to take right now to keep these doors open, without implementing anything: client-generated entity IDs rather than database-generated ones, and created/modified timestamps carried by every entity from the first schema. The cost is zero today; retrofitting on deployed data is costly.
