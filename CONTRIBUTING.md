# Contributing to my-finance-health

This document describes the rules for contributing to the project: commits, branches, Pull Requests, and local checks.

## Prerequisites

- **Bun** only — never `npm`, `yarn`, or `pnpm`. Single lockfile: `bun.lock`.
- Install Git hooks via `bun install` (triggers `prepare` → `lefthook install`).

```bash
bun install
```

## General workflow

1. Create a branch from `main`.
2. Develop, following the architecture described in [CLAUDE.md](CLAUDE.md) and [docs/code_guideline.md](docs/code_guideline.md).
3. Check locally (see [Local checks](#local-checks)).
4. Commit following [Conventional Commits](#conventional-commits).
5. Open a Pull Request against `main` (see [Pull Requests](#pull-requests)).

### Branch naming

Recommended format: `<type>/<short-description>`, e.g. `feat/sankey-chart`, `fix/journal-replay`.

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
- Before opening the PR: `bun run typecheck` and `bun run test` must pass.
- Never bypass hooks (`--no-verify`), and never disable a lint rule without a `// biome-ignore lint/x/y: <reason>` comment.
- A PR that changes architecture (cross-package imports, new `@repo/*` packages) must respect the dependency matrix in [docs/start-roadmap.md](docs/start-roadmap.md) §6 — it is enforced by the linter.

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
