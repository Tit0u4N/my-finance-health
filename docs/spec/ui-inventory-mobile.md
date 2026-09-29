# UI inventory — mobile (first pass)

Companion to `screens-mobile.md`, mirroring the desktop pass's `ui-inventory.md` — what has to be
built in `apps/mobile/src/ui`, traced back to the screen (or chart) that needs it. `@repo/ui` isn't
reusable here (DOM-only, `biome.json`-enforced) — every primitive below is `apps/mobile`'s own,
consuming `@repo/design-tokens` through `apps/mobile/src/theme/tokens.ts` exactly like the two
primitives that already existed (`Button`, `Badge`).

## 1. Primitives (`apps/mobile/src/ui`)

| Component | Backs | Notes |
|---|---|---|
| `Card` | Every panel on Dashboard and onboarding | Bordered container, `BORDER_RADIUS.xl` — the mock's `Card` (`ui.jsx`) |
| `Avatar` | Account/category icon discs (Dashboard KPIs/activity, onboarding, Activity rows) | `soft` prop for the tinted-disc variant, same `${color}1F` alpha suffix as the mock |
| `AmountValue` | Every money-bearing spot | Native counterpart of `@repo/ui`'s `AmountValue` — same `tone`/`hidden` contract, so the amounts-hidden preference threads the same way on both targets |
| `Badge` | Onboarding's selected-option check, Activity's frequency/next-occurrence pills | Rewritten in the first pass from a single-purpose uppercase label chip into the mock's actual flexible soft-tinted pill (`color`, `icon`, `size`) |
| `Field` | Onboarding step 1's inputs; Activity's ledger search, amount, date and note inputs; Preferences' exchange-rate rows | Labelled `TextInput`, native counterpart of the mock's `Field`. **Extended (Activity pass)**: `label` is now optional (the search box and focal amount are named by their surroundings), plus a leading `icon`, an `onClear` trailing button, `autoFocus`, `returnKeyType`, `accessibilityLabel`, and a `variant: 'default' \| 'focal'` — `focal` being the sheet's oversized centred amount entry (`HEIGHT.focalControl`). **Extended (Accounts + Settings pass)**: an optional `onBlur`, so a typed exchange rate commits on leaving the field (desktop's `Input`'s `onBlur={rate.onCommit}` equivalent). Every addition is optional, so the pre-existing call sites are untouched |
| `Button` | Onboarding actions, sheet footers, empty-state CTAs | **Extended (Activity pass)**: `tone: 'danger'` (a filled destructive confirm — it must not read like the outline Cancel beside it) and an optional leading `icon` tinted with the label. **Extended (Accounts + Settings pass)**: `tone: 'dashed'` — a muted, inviting affordance (dashed border, accent label, transparent fill) for the Accounts list's "Add another account" footer button, which reads as an invitation rather than a real action the way `primary`/`outline`/`danger` do |
| `SectionGroup` | Every Settings screen's row groups ("App"/"Support" on the root menu, the panels on Preferences/Data/About) | Uppercase muted caption above a zero-padding `Card` — the mock's `SectionGroup` (`ui.jsx`). Logic-free |
| `SettingsRow` | Every row inside a `SectionGroup` | Soft icon disc, title/subtitle stack, trailing chevron (or a caller-supplied control) — the mock's `SettingsRow`. Logic-free |
| `OptionGrid` | Preferences' Theme/Language/Base-currency pickers, the New-account sheet's Type grid | Native counterpart of `@repo/ui`'s `OptionGrid` — a single-select icon/label (or glyph, for currency symbols) tile grid, `accessibilityRole="radiogroup"`/`"radio"` in place of base-ui's `RadioGroup`/`Radio` |
| `ColorSwatchPicker` | The category create/edit sheet | Native counterpart of `@repo/ui`'s `ColorSwatchPicker` — a row of tappable colour discs with a ring on the current one, reading `categoricalPaletteHex` straight from `@repo/design-tokens` (not banned on `apps/mobile/**`, unlike `@repo/ui`/`@repo/routes`/`@repo/router`) |
| `Sheet` | Every Activity dialog: create/edit transaction, create/edit rule, option pickers, row actions, delete confirm | React Native's own `Modal` (`animationType="slide"`, transparent) over a `colors.overlay` backdrop: grabber, title row with a close button, scrollable body, pinned footer, `KeyboardAvoidingView`. No new dependency, and no `z-index` scale to respect (unlike `cross-app-pitfalls.md` #1's DOM counterpart) — the OS presents a native modal above the whole app |
| `ConfirmSheet` | Deleting a transaction or a rule | `Sheet` + description + Cancel / destructive confirm. Native stand-in for `@repo/ui`'s `ConfirmDialog` |
| `SegmentedTabs` | Activity's Transactions/Recurring switch, the sheets' expense/income toggle, the date-mode switch | Generic over the value type, with a per-option `tone?: 'positive' \| 'negative'` so the income/expense toggle carries semantic colour on its active state rather than neutral grey (`cross-app-pitfalls.md` #8) |
| `Chip` | Filter chips, the reset chip, category pickers, description suggestions | Pressable pill with `selected` and an optional per-record `color`; a selected chip tints **with** that colour instead of switching to a fixed accent (`cross-app-pitfalls.md` #7) |
| `ChipSelect` | Ledger type/account/category filters, the rule sheet's frequency and account | Closed state is a `Chip` with `ChevronDown`; opens a `Sheet` listing the options with a `Check` on the current one. Native stand-in for `@repo/ui`'s `Select` — a wheel picker would need `@react-native-picker/picker`, not approved for this pass. Its own open/closed boolean is disclosure state, not logic, so it stays single-file |
| `Switch` | A recurring rule's active/paused toggle | Wraps React Native's built-in `Switch` with palette colours and a mandatory `accessibilityLabel` — keeps the platform's real `switch` role, haptics and animation, which a hand-rolled Reanimated version would lose |
| `EmptyState` | "No transactions match", "No recurring rules" | Soft icon disc + title + subtitle + optional action. Unlike `ComingSoon`, every string is passed in already translated — a real product state, not a placeholder |
| `ScreenHeader` | Every tab's title block (`headerShown: false`, so screens draw their own) | Title + optional subtitle + a trailing slot. Extracted from `DashboardScreen`'s inline header in the Activity pass, once a second screen needed the same shape; Dashboard now renders through it |
| `RoundButton` | Activity's header `+`, each row's `MoreVertical` | The mock's `RoundBtn` — icon-only circular pressable with a `fill` (accent, explicit white glyph) and a `ghost` variant, plus a mandatory `accessibilityLabel` since it carries no text |
| `ComingSoon` | The one still-unbuilt tab (Invest) | Placeholder so the tab bar has 5 real routes instead of a differently-shaped nav; not a permanent screen |
| `visuals.ts` | Every account/category icon lookup | `ACCOUNT_TYPE_ICON` + `categoryIcon`, same slugs as desktop's `packages/routes/src/shared/visuals.ts`, `lucide-react-native` instead of `lucide-react`. **Extended (Accounts + Settings pass)**: `ACCOUNT_TYPE_ICON_SLUG`, the persisted-`icon`-string counterpart to `ACCOUNT_TYPE_ICON` a new account's `create` call must write (the field is schema-required but nothing renders it — same slugs as desktop's own `ACCOUNT_TYPE_ICON_SLUG`) |

## 2. Charts (`apps/mobile/src/ui/charts`)

All ported from `@repo/ui/components/charts` — `react-native-svg` in place of a DOM `<svg>`, same
math, except `LineChart` (a fork — see below).

| Component | Backs | Source |
|---|---|---|
| `MiniBar` | Dashboard KPI sparklines | `packages/ui/src/components/charts/MiniBar.tsx` — direct port |
| `Donut` | Dashboard spending breakdown | `packages/ui/src/components/charts/Donut.tsx` — direct port |
| `Sankey` | Dashboard cashflow | **Not** a port of `packages/ui/src/components/charts/Sankey.tsx` — see below |
| `AreaChart` | Accounts list's per-account balance sparkline | `packages/ui/src/components/charts/AreaChart.tsx` — direct port. One porting gotcha: `useId()`'s output contains `:`, invalid inside an SVG `url(#…)` gradient reference, so it's stripped before use |
| `LineChart` (+ `lineChartMath.ts`) | Account detail's "Balance trend" card | **A fork, not a port** — see below |

### Sankey: a real fork, not a port

Desktop's `Sankey` moved to `chartjs-chart-sankey` on a `<canvas>` (`open-questions.md #14`) —
canvas has no react-native-svg equivalent, and pulling in a second charting library (plus a canvas
polyfill) wasn't part of the two dependencies approved for this pass (`react-native-svg`,
`lucide-react-native`). Mobile's `Sankey` instead ports the mock's own original hand-rolled SVG
algorithm (`charts.jsx`), generalized from its 2-column (income/expense) layout to the real
3-column shape `computeCashflowGraph` produces (income → total → expense/savings) — each column
independently stacked, then scaled against one shared `globalTotal` (the largest column's sum) so
flow thickness means the same amount everywhere in the diagram, same principle as the mock's own
`total = Math.max(totalL, totalR)`.

### LineChart: a real fork, not a port

Desktop's `LineChart` (`packages/ui/src/components/charts/LineChart.tsx` +
`useLineChart.ts`) is fluid-width (it measures its container with a `ResizeObserver`) and carries a
pointer-hover crosshair + tooltip. Neither transposes to touch: mobile's version takes an explicit
`width` prop instead, like `MiniBar`/`Donut`/`Sankey`/`AreaChart` already do, and ships with **no
hover interaction** — dropped, not silently omitted (`screens-mobile.md`'s "Accounts + Settings
tabs — dropped or diverged" section records it). The pure scaling/path-building math
(`lineChartMath.ts` — `scalePoints`, `buildSmoothPath`, `buildFillPath`, `buildGridlines`) is
**duplicated** from `packages/ui/src/components/charts/lineChartMath.ts` rather than shared: that
module lives in `@repo/ui` (level 3, DOM-only, banned from `apps/mobile` by `biome.json`), and chart
geometry is presentation, not domain logic (`app-core-inventory.md` §6's rendering-boundary rule
stops `@repo/app-core` at plain data) — the same call `Sankey`'s fork above already made.
`nearestIndex` (the DOM version's pointer-hover snap) is the one function not ported, since nothing
here needs it.

## 3. Icons

Every icon the mock hand-draws as inline SVG paths in `ui.jsx`'s `Icon` component maps onto a
`lucide-react-native` icon, same choices as desktop's own `lucide-react` mapping
(`packages/routes/src/shared/visuals.ts`) — duplicated, not shared, per the DOM/native rendering
boundary. Mapped so far, for Dashboard/onboarding/tab bar: `Home`, `Wallet`, `ArrowLeftRight`,
`TrendingUp`, `Settings`, `Eye`, `EyeOff`, `ArrowDownRight`, `ArrowUpRight`, `Check`, `FilePlus`,
`Folder`. Added by the Activity pass: `Plus` (header action), `Search` (ledger search + its empty
state), `X` (clear/close), `ChevronDown` (`ChipSelect`), `Repeat` (recurring cards and their empty
state), `MoreVertical` (row actions), `Pencil` / `Trash2` (the row-actions sheet). Added by the
Accounts + Settings pass: `ArrowLeft` (every pushed sub-screen's back `RoundButton`), `ChevronRight`
(`SettingsRow`'s default trailing glyph), `Sun` / `Moon` / `Globe` (Preferences' Theme grid),
`Languages` (Preferences' Language grid), `Coins` (the exchange-rates empty state), `SlidersHorizontal`
/ `Tag` / `Database` / `Info` (the Settings root menu's row icons), `Lock` (the "Encrypted" badge,
capability-gated), `FilePlus` (the Data screen's "Set up a new workspace" row — the one real
affordance carried over from the now-deleted `SettingsPlaceholder`). Plus the account-type/category
icon sets (`ACCOUNT_TYPE_ICON`, `ACCOUNT_TYPE_ICON_SLUG`, `categoryIcon`) `visuals.ts` covers.

**Where these live, and why not in `visuals.ts`**: `visuals.ts` maps *data values* — an
`AccountType`, a `Category.name` — onto an icon, which is the thing two targets must agree on. The
icons above are UI affordances chosen by one component, so they are imported from
`lucide-react-native` at their single use site, exactly as `DashboardScreen` already imports `Eye`,
`EyeOff` and the two arrows. Re-exporting them through `visuals.ts` would add a lookup layer with no
second consumer to justify it. The one rule that matters — `lucide-react-native` on native, never
`lucide-react` — is enforced by `biome.json`'s `apps/mobile/**` override at every import site, not by
funnelling them through one module.

## 4. Theme

No new *token package* values in either pass — `apps/mobile/src/theme/tokens.ts` already exposed
everything the mock needs (`SPACING`, `FONT_SIZE`, `BORDER_RADIUS`, `ACCENT`, `COLORS`). The Activity
pass added two entries to the app-local `HEIGHT` scale (`chip: 36`, `focalControl: 64`), which is
`apps/mobile`'s own centralized touch-height constant, not a `@repo/design-tokens` export —
`@repo/design-tokens` states no control heights for either target. `open-questions.md`'s §85 flag
("whether `design-tokens` exports a conversion helper or a dual web/native shape... deferred to the
mobile UI spec pass") is resolved as: no package change — `tokens.ts`'s existing
oklch→hex/rem→dp conversion already covers it, nothing mobile-specific needed there.
