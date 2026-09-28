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
| `Avatar` | Account/category icon discs (Dashboard KPIs/activity, onboarding) | `soft` prop for the tinted-disc variant, same `${color}1F` alpha suffix as the mock |
| `AmountValue` | Every money-bearing spot | Native counterpart of `@repo/ui`'s `AmountValue` — same `tone`/`hidden` contract, so the amounts-hidden preference threads the same way on both targets |
| `Badge` | Onboarding's selected-option check, future KPI deltas | Rewritten this pass from a single-purpose uppercase label chip (whose only caller, the removed landing placeholder, is gone) into the mock's actual flexible soft-tinted pill (`color`, `icon`, `size`) |
| `Field` | Onboarding step 1's account name/balance inputs | Labelled `TextInput`, native counterpart of the mock's `Field` |
| `ComingSoon` | The 4 not-yet-built tabs | Placeholder so the tab bar has 5 real routes instead of a differently-shaped nav; not a permanent screen |
| `SettingsPlaceholder` | Settings tab | One real affordance (`Link` into onboarding) so that route isn't dead code |
| `visuals.ts` | Every account/category icon lookup | `ACCOUNT_TYPE_ICON` + `categoryIcon`, same slugs as desktop's `packages/routes/src/shared/visuals.ts`, `lucide-react-native` instead of `lucide-react` |

## 2. Charts (`apps/mobile/src/ui/charts`)

All three ported from `@repo/ui/components/charts` — `react-native-svg` in place of a DOM `<svg>`,
same math.

| Component | Backs | Source |
|---|---|---|
| `MiniBar` | Dashboard KPI sparklines | `packages/ui/src/components/charts/MiniBar.tsx` — direct port |
| `Donut` | Dashboard spending breakdown | `packages/ui/src/components/charts/Donut.tsx` — direct port |
| `Sankey` | Dashboard cashflow | **Not** a port of `packages/ui/src/components/charts/Sankey.tsx` — see below |

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

## 3. Icons

Every icon the mock hand-draws as inline SVG paths in `ui.jsx`'s `Icon` component maps onto a
`lucide-react-native` icon, same choices as desktop's own `lucide-react` mapping
(`packages/routes/src/shared/visuals.ts`) — duplicated, not shared, per the DOM/native rendering
boundary. Only the subset Dashboard/onboarding/tab bar actually use has been mapped so far:
`Home`, `Wallet`, `ArrowLeftRight`, `TrendingUp`, `Settings`, `Eye`, `EyeOff`, `ArrowDownRight`,
`ArrowUpRight`, `Check`, `FilePlus`, `Folder`, plus the account-type/category icon sets
(`ACCOUNT_TYPE_ICON`, `categoryIcon`) `visuals.ts` already covers.

## 4. Theme

No new tokens this pass — `apps/mobile/src/theme/tokens.ts` already exposed everything the mock
needs (`SPACING`, `FONT_SIZE`, `BORDER_RADIUS`, `ACCENT`, `COLORS`). `open-questions.md`'s §85 flag
("whether `design-tokens` exports a conversion helper or a dual web/native shape... deferred to the
mobile UI spec pass") is resolved as: no package change — `tokens.ts`'s existing
oklch→hex/rem→dp conversion already covers it, nothing mobile-specific needed there.
