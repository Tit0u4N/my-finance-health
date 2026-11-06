# Contributing to my-finance-health

This document describes the rules for contributing to the project: commits, branches, Pull Requests, and local checks.

## Prerequisites

- **Bun** only — never `npm`, `yarn`, or `pnpm`. Single lockfile: `bun.lock`.
- Install Git hooks via `bun install` (triggers `prepare` → `lefthook install`).

```bash
bun install
```

## General workflow

Day-to-day work never targets `main`: it goes into the **current release branch**, `release/<major>`
(today: **`release/1`**). See [Releases](#releases) for the full model.

1. Create a branch from the current release branch (`git switch -c feat/sankey-chart origin/release/1`).
2. Develop, following the architecture described in [CLAUDE.md](CLAUDE.md) and [docs/code_guideline.md](docs/code_guideline.md).
3. Check locally (see [Local checks](#local-checks)).
4. Commit following [Conventional Commits](#conventional-commits).
5. Open a Pull Request against `release/1` (see [Pull Requests](#pull-requests)).

### Branch naming

Recommended format: `<type>/<short-description>`, e.g. `feat/sankey-chart`, `fix/journal-replay`.

Reserved prefixes:

| Branch | Role |
|---|---|
| `main` | Released code only. Every commit on `main` is a published (or about-to-be-tagged) version. |
| `release/<major>` | Integration branch of a major version (`release/1`, later `release/2`…). All feature and fix PRs target it. |
| `hotfix/<description>` | Urgent fix branched from `main`, merged straight into `main` (see [Hotfixes](#hotfixes)). |

## Conventional Commits

Commit messages **must** follow the [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<optional scope>): <description>
```

- Lowercase, no trailing period.
- Allowed types: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `style`, `perf`, `ci`.
- The format is enforced automatically by the `commit-msg` hook (`scripts/check-commit-message.sh`) — a non-conforming message is rejected.

Examples:

```
feat: add login screen
fix(data): correct journal replay ordering
docs: document contributing guidelines
```

## Pull Requests

- A PR should be **small and focused**: one subject, one PR.
- The PR title doesn't need to follow Conventional Commits, but should stay clear and descriptive.
- The description should explain the **why** of the change, not just the what (the diff already covers the what).
- Target the current release branch (`release/1`), never `main`. A CI check (`branch policy`) rejects
  any PR into `main` whose source is not a `release/*` or `hotfix/*` branch.
- Before opening the PR: `bun run typecheck` and `bun run test` must pass.
- Never bypass hooks (`--no-verify`), and never disable a lint rule without a `// biome-ignore lint/x/y: <reason>` comment.
- A PR that changes architecture (cross-package imports, new `@repo/*` packages) must respect the dependency matrix in [docs/start-roadmap.md](docs/start-roadmap.md) §6 — it is enforced by the linter.

## Releases

### Versioning (Semantic Versioning)

Versions follow [SemVer](https://semver.org/): `MAJOR.MINOR.PATCH`, tagged `vMAJOR.MINOR.PATCH` on `main`.

| Bump | Example | When |
|---|---|---|
| **Major** | `1.0.0` → `2.0.0` | Breaking change for users: incompatible workspace/database format, removed feature, new storage contract. Opens a new `release/<major>` branch. |
| **Minor** | `1.0.0` → `1.1.0` | New features, backward compatible. The usual outcome of merging `release/<major>` into `main`. |
| **Patch** | `1.1.0` → `1.1.1` | Bug fixes only, no new feature. A release PR containing only `fix:` commits, or a [hotfix](#hotfixes). |

So `1.0` is the first major, `1.1` a minor, `1.1.1` a fix/patch. The first release of `release/1` is `v1.0.0`.

Conventional Commit types tell you which bump a release needs: any `!` (breaking) → major; any
`feat` → minor; only `fix`/`perf`/`refactor`/`docs`/… → patch.

### What CI runs where

Full builds are expensive (web/desktop Vite builds, Metro export, and Tauri bundles on four
platforms), so they only run when a release is about to land on `main`:

| Event | lint · typecheck · test | `build` + `bundle` | Desktop bundles (Tauri) |
|---|---|---|---|
| PR into `release/<major>` | ✅ (affected packages) | — | — |
| Push to `release/<major>` | ✅ | — | — |
| PR `release/*` or `hotfix/*` → `main` | ✅ | ✅ | ✅ (when desktop or packages changed) |
| Push to `main` | ✅ | ✅ | ✅ (warms the caches for the next release) |
| Tag `v*` | — | — | ✅ + **draft** GitHub release |

Desktop bundles can still be built on demand from any branch: Actions → Desktop → Run workflow.

### Cutting a release (minor or patch)

1. On the release branch, bump the version everywhere it is declared (the three `apps/*/package.json`,
   `apps/mobile/app.json`, `tauri.conf.json`, `Cargo.toml`, `Cargo.lock`):

   ```bash
   git switch release/1 && git pull
   git switch -c chore/release-1.1.0
   bun run release:version 1.1.0
   git commit -am "chore: release 1.1.0"
   ```

   Open that PR into `release/1` and merge it.
2. Open a PR **`release/1` → `main`** titled `Release 1.1.0`. This is the PR that runs the full builds
   and desktop bundles; it must be green before merging. Merge it with a **merge commit** (not squash),
   so `release/1` and `main` keep a shared history.
3. Tag the merge commit on `main` and push the tag:

   ```bash
   git switch main && git pull
   git tag -a v1.1.0 -m "v1.1.0"
   git push origin v1.1.0
   ```

4. The tag builds the desktop bundles and creates a **draft** GitHub release with generated notes:
   review it, then publish it. Mobile store builds go through EAS ([docs/owner-setup.md](docs/owner-setup.md) §3).
5. `release/1` keeps going: the next PRs target it as before.

### Starting a new major

When a breaking change is ready to start `2.0.0`:

1. Make sure everything that should ship in `1.x` has been released, then create `release/2` from
   `release/1` (or from `main` if `release/1` holds nothing unreleased) and push it.
2. Point new PRs at `release/2` and update the "current release branch" mentions in this file
   (and the repository's default branch, if it was set to the release branch).
3. Release it as above, with `bun run release:version 2.0.0` and tag `v2.0.0`.

`release/1` is then frozen; a critical fix for `1.x` users goes through a hotfix.

### Hotfixes

For an urgent fix that cannot wait for the next release:

1. Branch `hotfix/<description>` from `main`, fix, run `bun run release:version <x.y.z+1>` in the same
   branch.
2. Open a PR `hotfix/<description>` → `main` (full builds run), merge it, tag `v<x.y.z+1>` as above.
3. Merge `main` back into the current release branch (PR `main` → `release/1`) so the fix is not lost.

## Local checks

```bash
bun run lint          # biome check . (lint + format)
bun run lint:fix       # biome check --write .
bun run typecheck      # typecheck the whole monorepo
bun run test           # test the whole monorepo
bun turbo test --filter=<pkg>       # test a single package
bun turbo typecheck --filter=<pkg>  # typecheck a single package
```

Run a single test file with vitest:

```bash
cd packages/domain && bunx vitest run src/foo.test.ts
```

## Git hooks (Lefthook)

Installed automatically via `bun install`. They run:

- **pre-commit**: Biome (write mode) on staged files.
- **pre-push**: `bun run typecheck`.
- **commit-msg**: Conventional Commits validation.

Do not bypass these hooks (`--no-verify`) without an exceptional reason agreed with the team.

## Code conventions

See [docs/code_guideline.md](docs/code_guideline.md) for the full rule set (strict TypeScript, Tailwind v4, MVVM View/ViewModel, testing, etc.). Key points:

- No `any` in production code (`unknown` + narrowing).
- Named exports, no default exports unless required by the framework.
- `@/*` for imports internal to an app, `@repo/*` for packages — never `../../../`.
- Any disabled lint rule needs a `// biome-ignore lint/x/y: <reason>` comment.
