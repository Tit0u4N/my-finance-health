# Code guidelines for AI agents

> Stack: TypeScript, React, React Native / Expo, Tailwind v4, Turborepo, Bun, Biome.
> To place at the repo root (`AGENTS.md`, `CLAUDE.md`, or `.github/copilot-instructions.md`).
> `[TO CUSTOMIZE]` blocks are the only elements to adapt per project.

---

## 0. Agent conduct rules

- Read neighbouring files BEFORE writing code: consistency with existing code beats personal preference.
- Never introduce a dependency, pattern, or tool that is absent from the project without flagging it explicitly.
- Do not reformat files unrelated to the task.
- No dead code, no comment that paraphrases the code, no `TODO` without an associated issue.
- Never modify `biome.json`, `tsconfig.json`, or the build config to make code pass — fix the code.

### Tooling: absolute rules

- **Bun only.** `bun install`, `bun add`, `bun run`, `bun turbo`. Never `npm`, `yarn`, or `pnpm`.
- **One lockfile only: `bun.lock`.** A `package-lock.json`, `yarn.lock`, or `pnpm-lock.yaml` that appears by accident is deleted, never committed.
- **Biome only.** It handles formatting, linting, and import organization. Never install Prettier, ESLint, or a compatibility plugin between them.
- Imports are organized automatically (`assist.actions.source.organizeImports: on`): never sort them by hand.

### Files outside Biome scope

These paths are excluded from linting and formatting: `dist`, `build`, `out`, `node_modules`, `.turbo`, `.biome`, `.expo`, `.next`, `bun.lock`, and `**/components/ui`.
Generated primitives in `components/ui` stay as-is: do not reformat them by hand, do not add business logic to them.

---

## 1. TypeScript: blocking errors

These rules are at `error` level: code that breaks them does not pass.

### Imports / exports

- `import type` for any type-only import (`useImportType`).
- `export type` for any type-only export (`useExportType`).
- No unused import, no unused variable, no undeclared variable (`noUnusedImports`, `noUnusedVariables`, `noUndeclaredVariables`).
- Always the `@/*` alias for internal imports, never `../../../`.
- Convention: prefer named exports over default exports, except when a framework requires otherwise (route files, entry points).

### Variables and typing

- `const` by default (`useConst`). `let` only for real reassignment, and **never without an explicit type** (`noImplicitAnyLet`).
- Arrays in short form: `string[]`, never `Array<string>` (`useConsistentArrayType`).
- Template literals, never string concatenation (`useTemplate`).
- Function types in short form: `type Handler = (id: string) => void`, not an interface with a call signature (`useShorthandFunctionType`).
- No `void` in a union type or generic (`noConfusingVoidType`).

### Safety

- Always `===` and `!==` (`noDoubleEquals`).
- No assignment inside an expression (`noAssignInExpressions`).
- No `eval()` or global equivalent (`noGlobalEval`).
- Never a committed `debugger` (`noDebugger`).
- Mandatory blocks for `if` / `else` / `for` / `while`, even on one line (`useBlockStatements`).

### Asynchronous

- No floating promise: every `Promise` is `await`ed, `return`ed, or handled explicitly (`noFloatingPromises`).
- An `async` function contains at least one `await`, otherwise it should not be `async` (`useAwait`).
- Explicit error handling on network calls, no empty `try/catch`.

---

## 2. Warnings to treat as errors

`warn` level in the config, but a clean render leaves none.

| Rule | Expectation |
|---|---|
| `noExplicitAny` | no `any` in production code, use `unknown` then narrow. Allowed in test files. |
| `noConsole` | no `console.*`, except in `scripts/` and `cli/` where the rule is disabled. |
| `noExcessiveCognitiveComplexity` | maximum cognitive complexity: **25**. Above that, extract functions or move the logic into the ViewModel. |
| `noShadow` | do not shadow a variable from an outer scope. |
| `noParameterAssign` | never reassign a parameter, create a local variable. |
| `noUnusedFunctionParameters` | remove the parameter, or prefix it `_` if forced by a signature. |
| `noNegationElse` | `if (isValid) { } else { }`, not `if (!isValid) { } else { }`. |
| `useSimplifiedLogicExpression` | simplify redundant boolean conditions. |
| `noAccumulatingSpread` | no spread inside a `reduce` or a loop, mutate a local accumulator. |
| `noDelete` | replace `delete obj.key` with destructuring or a new object. |
| `noDangerouslySetInnerHTML` | avoid. If unavoidable: sanitized content and justification in a comment. |
| `useExhaustiveDependencies` | exhaustive dependency arrays, fix the dependency rather than disabling the rule. |
| `noSvgWithoutTitle`, `useMediaCaption` | accessibility: `<title>` on meaningful SVGs, subtitle tracks on media. |

### Accepted tolerances

These rules are disabled in the config. They remain allowed, without making them a reflex.

- `noForEach`: `forEach` is allowed, `map` / `filter` / `for...of` are still more readable.
- `noVoid`: the `void` operator is allowed, useful to mark a promise deliberately ignored.
- `noBarrelFile`: `index.ts` re-export files are allowed, keep them for package boundaries.
- `noArrayIndexKey`: index as `key` is allowed, avoid it whenever the list may be reordered.
- `useNodejsImportProtocol`: the `node:` prefix is not required.
- `useKeyWithClickEvents`, `useKeyWithMouseEvents`, `noLabelWithoutControl`: not enforced, keyboard accessibility remains to be ensured manually.

---

## 3. Naming conventions

| Element | Accepted formats |
|---|---|
| Variables | `camelCase`, `PascalCase`, `CONSTANT_CASE` |
| Functions | `camelCase`, `PascalCase` |
| Types and interfaces | `PascalCase`, no `I` prefix |
| Enum members | `PascalCase`, `CONSTANT_CASE` |
| Files | `camelCase`, `kebab-case`, `PascalCase`, ASCII only |

Additional team conventions:

- Components: `PascalCase.tsx`. Hooks: `useXxx.ts`.
- Booleans: `isXxx`, `hasXxx`, `canXxx`, `shouldXxx`.
- Handlers: `handleXxx` in the ViewModel, exposed as `onXxx` prop.
- Test files: `xxxx.test.ts` or `xxxx.test.tsx`, next to the file under test.

---

## 4. Architecture: view / logic split (MVVM)

Any component carrying logic is split into two files:

```
ComponentName.tsx     : View, rendering only
useComponentName.ts   : ViewModel, all logic
```

**View (`.tsx`), allowed only:**

- The rendering JSX
- Animations
- The call to the ViewModel hook and the destructuring of its return

**ViewModel (`.ts`), everything else:**

- `useState`, `useEffect`, `useMemo`, `useCallback`
- Data fetching and service calls
- Event handlers, navigation, forms
- Returns a flat object containing exactly what the View needs

**Model / services:** data access isolated in a dedicated layer or shared package. Never an HTTP call directly in a component.

**Exception:** UI primitives with no logic (Button, Card, Input, Badge) stay in a single file.

```tsx
// View
export function UserProfile({ userId }: { userId: string }) {
  const { user, isLoading, handleEdit } = useUserProfile(userId);

  if (isLoading) {
    return <Skeleton />;
  }

  return <Profile user={user} onEdit={handleEdit} />;
}

// ViewModel
export function useUserProfile(userId: string) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // all the logic here
  return { user, isLoading, handleEdit };
}
```

---

## 5. React

- Hooks are called at the top level of the component or hook: never inside a condition, a loop, a callback, or after an early `return` (`useHookAtTopLevel`, `error` level).
- Exhaustive dependencies. Do not remove a dependency to silence the warning: fix the dependency, memoize with `useCallback` / `useMemo`, or move the value out of the component.
- No effect to derive state: compute directly during render.
- A component does one thing. If a View exceeds about a hundred lines of JSX, split into subcomponents.
- Childless tags self-closing: `<div />` (`useSelfClosingElements`).
- If React Compiler is active on the app, do not add `useMemo` / `useCallback` by reflex: only when a measured performance need exists.

---

## 6. Tailwind v4 styling

- Import: `@import "tailwindcss"`, never `@tailwind base/components/utilities`.
- Theme configuration in CSS via `@theme inline { }`, not in a `tailwind.config.js`.
- Custom variants in CSS syntax: `@custom-variant dark (&:is(.dark *));`.
- PostCSS plugin: `@tailwindcss/postcss`, not `tailwindcss` directly.
- Dark mode based on the `.dark` class plus CSS variables in `oklch`. Never duplicate a component for dark theme.
- No arbitrary values (`w-[437px]`, `text-[#1a1a1a]`): go through theme custom properties.
- Conditional class merging with `cn()` (clsx + tailwind-merge). Component variants with CVA.
- Class sorting is automatic (`useSortedClasses`, safe fix) on `className`, `class`, `classList`, and inside `clsx`, `cva`, `tw`, `cn`, `twMerge`, `twJoin`. Never sort by hand.
- A homemade utility function that receives classes must be added to the rule's `functions` list, otherwise its classes will never be sorted.

---

## 7. React Native / Expo

Keep this section only if the project ships a native app.

- File-based routing: `_layout.tsx` for layouts, `index.tsx` for screens, `+not-found.tsx` for the fallback. Route groups in parentheses: `(tabs)/`, `(auth)/`.
- Typed routes: build links with the router's `href` type, not with free strings.
- No hardcoded color: `useColor()` theme hook and `Colors` object (light and dark variants).
- Centralized global constants: `HEIGHT`, `FONT_SIZE`, `BORDER_RADIUS`, `SPACING`.
- Animations with `react-native-reanimated`: `useSharedValue` and `useAnimatedStyle`, no legacy `Animated`.
- Platform divergence: prefer a `.web.tsx` / `.ios.tsx` suffixed file over scattered `Platform.OS` checks. A `Platform.OS` test remains acceptable for a one-off style tweak.
- Icons: `lucide-react-native` on native, `lucide-react` on web. Never one in the other.
- Never a `react-dom` import or a DOM API on native, never a `react-native` import on web.
- New Architecture enabled: check compatibility of any native dependency before proposing it.

---

## 8. Monorepo (Turborepo + Bun)

- Shared packages must be **built** before apps see the changes. After modifying a package, run the filtered build before testing in an app.
- Any dependency used by multiple apps goes in a shared package, never duplicated app by app.
- An app never imports a source file from another app: sharing goes through a package.
- Path resolution: bundlers configured with a root at the monorepo level resolve from there, not from the app folder.

```bash
bun install
bun turbo dev --filter=<app>
bun turbo build --filter=<package>   # mandatory after modifying a shared package
bun turbo test --filter=<app>
bun run lint
bun run format
```

**[TO CUSTOMIZE]** List of apps and shared packages.

---

## 9. Formatting (Biome, non-negotiable)

| Setting | Value |
|---|---|
| Indentation | 2 spaces, never tabs |
| Line width | 120 characters |
| Line endings | `LF` |
| JS/TS quotes | single |
| JSX attribute quotes | double |
| Semicolons | always |
| Trailing commas | `all` in JS/TS, none in JSON |
| Arrow-function parens | always: `(x) => x` |
| Bracket same line | `false` |
| Bracket spacing | `true` |
| Quoted properties | only when necessary |
| JSX attribute position | automatic |
| JSON | 2 spaces, no trailing comma |

Formatting is never discussed in review: the tool applies it.

---

## 10. Tests

- File naming: `xxxx.test.ts` / `xxxx.test.tsx`, next to the file under test. `.spec.ts` files get the same tolerances but the project convention is `.test.ts`.
- `any` is allowed in test files only.
- No committed focused test: `it.only` / `describe.only` is an **error** (`noFocusedTests`).
- No skipped test without a reason: `it.skip` triggers a warning, to justify with a comment or to remove.
- No duplicate test hook in the same block (`noDuplicateTestHooks`), no `export` from a test file (`noExportsInTest`).
- Test observable behaviour, not internal implementation. Any ViewModel or service logic is testable and tested.
- `describe` names the unit under test, `it` describes the expected behaviour in one sentence.

---

## 11. Git and workflow

```
main                : production, default branch
develop             : integration, PR target
dev/<issue>-<slug>  : new feature
fix/<issue>-<slug>  : fix
```

- Commits in Conventional Commits format, lowercase, no trailing period: `feat: add login screen`.
- Allowed types: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `style`, `perf`, `ci`.
- One PR = one intent. Description: context, what changes, how to test.
- Biome respects `.gitignore`: a file ignored by Git is neither linted nor formatted.
- **[TO CUSTOMIZE]** Required reviewer count.

---

## 12. Disabling a lint rule

Always motivate the exception, never silent suppression.

```ts
// Single line
// biome-ignore lint/suspicious/noExplicitAny: type provided by an untyped external lib

/** Whole file, at the top of the file */
/** biome-ignore-all lint/suspicious/noConsole: tooling script run in CI */
```

- The reason after the colon is mandatory and explains the why, without repeating the rule name.
- Minimum scope: one line rather than one file, one file rather than an exclusion in `biome.json`.

---

## 13. Anti-patterns to refuse

| Do not | Do |
|---|---|
| `npm install`, `yarn add`, `pnpm add` | `bun install`, `bun add` |
| Second lockfile committed | `bun.lock` only |
| Prettier or ESLint added alongside Biome | Biome alone |
| Linter config modified to make code pass | fix the code |
| `import { User } from './types'` | `import type { User } from './types'` |
| `let count = 0` with no reassignment | `const count = 0` |
| `let value` with no explicit type | `let value: string \| null` |
| `value == null` | `value === null` |
| `console.log(...)` in application code | remove, or dedicated logger |
| `debugger`, `it.only` committed | never |
| Unused import or variable left in place | remove |
| Unawaited promise | `await`, `return` or explicit `.catch()` |
| Spread inside a `reduce` | locally mutated accumulator |
| Hook called inside an `if` or after a `return` | call at top level |
| Dependency removed to silence lint | fix the dependency or memoize |
| `// biome-ignore` without a reason | motivated exception, minimum scope |
| Function with complexity > 25 | extract named functions |
| Utility classes sorted by hand | let Biome sort |
| Tailwind arbitrary values | theme custom properties |
| `@tailwind base` or `tailwind.config.js` | `@import "tailwindcss"` and `@theme inline` |
| Hardcoded colors on native | `useColor()` or `Colors` object |
| `lucide-react` on native | `lucide-react-native` |
| Business logic in the `.tsx` | move to the ViewModel |
| HTTP call in a component | go through the service layer |
| App importing another app's source | go through a shared package |
| Testing an app without rebuilding the modified package | `bun turbo build --filter=<package>` first |

---

## 14. Checklist before delivering a task

1. Typecheck passes.
2. `bun run lint` and `bun run format` report neither error nor warning.
3. Tests pass, new behaviours are covered, no forgotten `only` or `skip`.
4. No `any`, `console.log`, `debugger`, unused import or variable.
5. View / ViewModel split is respected.
6. No lint rule disabled without a written reason.
7. No dependency added without explicit mention in the response.
8. Shared package modified: filtered build run before testing.
9. Commit message follows Conventional Commits.
