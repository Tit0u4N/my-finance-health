# `@repo/ui` inventory

Every component `packages/ui/src/components/` needs to serve `screens.md`, sourced from `ui.jsx`, `desktop-shell.jsx`, and `charts.jsx`. Mirrors `app-core-inventory.md`'s format: one row per unit, traced back to the screens that need it. Per the decision for this pass (`open-questions.md` #12), primitives are **shadcn/ui (base-ui) components restyled with `design-system.md` tokens** — not a transcription of the mock's hand-rolled equivalents, which lack focus management, keyboard nav, and `aria-*` wiring that base-ui already solves.

Reminder of the package's constraints (`start-roadmap.md` §6, §12, CLAUDE.md): DOM only, consumed by web + desktop, never mobile. No import of `@repo/platform` or `@repo/app-core` — every component receives data and handlers through props. No `../../../` imports, no formatting or persistence logic (see §4 below).

---

## 1. Tier 1 — shadcn primitives

Installed via the shadcn CLI (base-ui registry), restyled to `design-system.md`, no logic beyond what base-ui already provides.

| Component | Mock source | Variants/props needed | Backing screens | base-ui gain over the mock |
|---|---|---|---|---|
| `Button` | `ui.jsx` `Button` | tone: `primary \| secondary \| ghost \| destruct \| soft`; size: `sm \| md \| lg`; `icon`/`iconRight`, `fullWidth`, `disabled` | Every screen — creation actions, modal actions, filter chips | Disabled/focus-visible states already exist in `packages/ui` `Button.tsx`; extend variants, don't replace the component |
| `Input` | `ui.jsx` `Field` | `label`, `icon` (leading), `suffix` (trailing) | Every form: transaction/account/recurring modals, onboarding, search box | Native validation states, proper `<label>` association (mock's `Field` already uses `<label>`, keep) |
| `Textarea` | *(not in mock — supersedes the `RichNote` row below)* | `label`, `value`, `onChange`, `error` | Investment detail's note field | **New, implemented** (`Textarea.tsx`): `Input`'s multi-line twin, a plain `<label>` + `<textarea>` pair rather than base-ui's `Field.Control` — that primitive's `render` prop can swap in a `<textarea>`, but its typed props stay pinned to `<input>` (`FieldControlProps extends BaseUIComponentProps<'input', ...>`), and a plain note field has no validity/dirty/touched state worth sharing with a `Field.Root` anyway. |
| `Select` | `ui.jsx` `Select`, `desktop-shell.jsx` `DeskChip` | label, options, native-select fallback vs. base-ui Select | Currency/type/category pickers, filter chips | Keyboard-navigable listbox; mock's `DeskChip` is a bare `<select>` styled as a chip — port as a base-ui `Select` styled to match, not a native select. **Bug fixed**: `role="combobox"` doesn't support name-from-content (WAI-ARIA), so the trigger's own visible text was never its accessible name — every existing Select had no accessible name at all. Added an `ariaLabel` prop (falls back to `label` when set) so a labeled Select now gets a real one too, and an unlabeled compact filter (the ledger's Type/Category selects) can supply one explicitly. |
| `Switch` | `ui.jsx` `Switch` | `checked`, `onCheckedChange` | Recurring rule active toggle, Settings toggles | Mock's `Switch` is a styled `<div onClick>` — no keyboard/`role="switch"` support; base-ui fixes this outright. **Implemented** (`Switch.tsx`): the root needs `inline-flex items-center`, not just `h-*`/`w-*` — a bare `<span>` defaults to `display: inline`, which ignores explicit width/height entirely and silently collapses the track to a sliver; caught only by a live browser check, not by jsdom tests (jsdom doesn't compute layout). |
| `Dialog` | `desktop-shell.jsx` `Modal` | `title`, `subtitle`, `actions` slot, width | New transaction/account/recurring modals | Focus trap, `Esc`-to-close, `aria-modal` — mock reimplements `Esc` by hand and doesn't trap focus |
| `Tabs` | `ui.jsx` `Tabs` | segmented, `tabs[]`, `value`, `onChange` | Transaction type toggle (income/expense) in the New transaction modal | Roving tabindex, `aria-selected`. **Implemented** (`Tabs.tsx`): also backs the New recurring rule modal's income/expense toggle; no `Tabs.Panel` — the panel is the rest of the form, not per-tab content. Active state is base-ui's `data-[active]`, not `data-[selected]`. |
| `Table` | `desktop-shell.jsx` `Table`/`Td` | `head[]` (label, align, width), sortable header variant | Transactions ledger, Recurring rules, Investments positions, Account detail transactions, Investment detail snapshots | Plain semantic table (no base-ui primitive) — keep close to the mock, add `scope="col"`/`<caption>` for a11y the mock skips. **Implemented**: the sortable variant is optional fields on the existing `TableColumn`/`TableProps` (`sortKey`, `sortDirection`, `onSortChange`, and `srOnly` for an icon-only actions column) rather than a separate `SortTh` component — both pre-existing unsorted call sites (Overview, Account detail) compile untouched. |
| `Badge` | `ui.jsx` `Badge` | color, `soft`, size `sm \| md`, optional icon | Recurring frequency tag, category chip, P/L delta, "Encrypted at rest" | No base-ui primitive — plain styled span, port near-verbatim |
| `Tooltip` | *(not in mock)* | — | Sidebar collapsed-mode item labels (mock uses native `title=`, which is worse for keyboard/touch) | New: sidebar icon-only mode needs a real tooltip once collapse persists as a real preference |
| `Popover` | `desktop-shell.jsx` `AccountFilter` (inline) | anchor + content, outside-click + `Esc` dismissal | Account scope filter dropdown | Mock hand-rolls outside-click via a `mousedown` listener; base-ui `Popover` replaces that entirely |
| `Checkbox` | `desktop-shell.jsx` `AccountFilter` rows (custom span) | `checked`, `onCheckedChange` | Account filter multi-select rows, category enable/disable in onboarding | Real focus ring and keyboard toggle where the mock uses a styled `<span>` |
| `DropdownMenu` | *(not in mock)* | — | Transaction row edit/delete affordance (icons present, unwired in the mock — `screens.md`'s Transactions row) | New: the mock's edit/trash icons have no menu; a real implementation should group them rather than two bare icon buttons. **Implemented** (`DropdownMenu.tsx`): compound `{Root, Trigger, Content, Item, Separator}` over base-ui `Menu`, also backing the Recurring row's edit/delete affordance; `Root` supports uncontrolled use since a per-row menu needs no ViewModel state. |

## 2. Tier 2 — bespoke composites

Built from Tier 1 + tokens, no base-ui primitive of their own — presentational, receive all state as props.

| Component | Mock source | Composed from | Backing screens |
|---|---|---|---|
| `AppShell` / `Sidebar` | `desktop-shell.jsx` `Sidebar` | nav item list, collapse state (prop, now real — driven by Settings → Preferences' sidebar-mode control, icon-only rail wraps each item in `Tooltip`), quick-add `Button` | Every app-stage screen (`app-core-inventory.md` §2 `ready` state) |
| `PageHeader` | `desktop-shell.jsx` `PageHeader` | title/subtitle/eyebrow, back button, actions slot | Every screen |
| `Panel` | `desktop-shell.jsx` `Panel` | title/subtitle, right-slot, body | Every screen — the base card |
| `StatTile` | `desktop-shell.jsx` `StatTile` | value, delta `Badge`, optional `MiniBar` sparkline, `hero` variant (accent gradient) | Overview, Transactions, Recurring, Investments, Investment detail, Account detail KPI rows |
| `Content` | `desktop-shell.jsx` `Content` | max-width wrapper, `design-system.md` §8 layout tokens | Every screen (page body wrapper) |
| `DataTable` row helpers | `desktop-shell.jsx` `Td`, `desktop-tx.jsx` `SortTh` | `Table` (Tier 1) + sort-direction icon, mono/strong/color cell variants | Transactions, Recurring, Investments, Account/Investment detail |
| `Avatar` (icon disc) | `ui.jsx` `Avatar` | `Icon`, color, `soft` background variant | Every list row with a category/account/type glyph |
| `EmptyState` | `ui.jsx` `EmptyState` | icon, title, subtitle, optional CTA `Button` | Transactions (no matches), Account detail (no transactions), Recurring (no rules). **Implemented**: also Investments (no positions) and Investment detail (no recorded snapshots) — unspecified by this file originally, since the seed shipped zero investments; both follow the same no-CTA pattern as Transactions/Recurring. |
| `RangePicker` | inlined per-screen in `desktop-screens.jsx`/`desktop-invest-settings.jsx` (`['7d','1m','3m','1y','All']` segmented buttons) | segmented `Button` group, controlled `value`/`onChange` | Account detail, Investment detail |
| `AccountFilter` | `desktop-shell.jsx` `AccountFilter` | `Popover` + `Checkbox` rows + `Avatar` (Tier 1/2) | Overview, Transactions, Recurring |
| `OptionGrid` | `desktop-invest-settings.jsx` `OptionGrid` | icon/label button grid, single-select | Settings → Preferences (theme mode, currency), onboarding step 1 (account type) |
| `CategoryChips` | `desktop-tx.jsx` (inlined category picker in `DeskTxModal`) | toggle-chip row over `Category` list | New transaction modal, New recurring rule modal — **Implemented** (`CategoryChips.tsx`): base-ui `RadioGroup`/`Radio`, same primitive as `OptionGrid`; `value` is always a real selection, filtered by the modal's income/expense `Tabs` |
| `AmountCell` | pattern repeated inline everywhere (`mono`, sign-colored, `tabular-nums`) | `Table`/`Td` cell variant, receives an **already-formatted** string | Every money-bearing table cell |
| `RichNote` | `desktop-shell.jsx` `RichNote` | toolbar `Button` row + `contentEditable` region, **controlled** (see §4) | Investment detail description panel. **Implemented as `Textarea`, not `RichNote`**: `open-questions.md` #15(b)'s still-open half (`document.execCommand`'s deprecated-API replacement) was resolved by dropping rich text from v1 entirely — a plain, logic-free `label`/`value`/`onChange`/`error` multi-line field (`Input.tsx`'s twin), no toolbar, no stored markup, no XSS surface from rendering it back. `RichNote`/`useRichNote` were never built. |

## 3. Tier 3 — charts (hand-rolled SVG, no chart library)

Ported near-verbatim from `charts.jsx` — no charting library dependency, consistent with the mock's own choice. Each input shape is pinned to its `app-core-inventory.md` §6 selector or §4 query hook, so the chart and its data source are specified against one contract.

| Component | Input shape | Source (`app-core-inventory.md`) | Backing screens |
|---|---|---|---|
| `AreaChart` | `{ day: number, value: number }[]` | §4 `useAccountBalanceHistory` (raw series, no selector transform) | Overview per-account sparkline, Accounts card |
| `LineChart` | **Implemented as** `{ value: number, label: string, valueLabel: string }[]`, not `{day,value}[]` — an interactive tooltip needs a date label, and §4's "no formatting logic" rule means `@repo/ui` can't derive one itself, so the screen's ViewModel pre-formats both `label` and `valueLabel`. Fluid-width (measures its own container via `ResizeObserver`, the first in `@repo/ui`), unlike the other fixed-`width` charts here. | §4 `useAccountBalanceHistory` / `useInvestmentValueHistory` | Account detail, Investments portfolio trend, Investment detail |
| `Donut` | `{ id, name, value, color }[]` | §6 Category breakdown selector (Overview) / Allocation selector (Investments) — "same shape, different source" per §6's own note | Overview spending breakdown, Investments allocation |
| `Sankey` | `{ nodes: {id,label,value,color,side}[], links: {source,target,value}[] }` | §6 Cashflow graph selector | Overview cashflow panel |
| `MiniBar` | `number[]` (short recent-values series) | §6 Recent period trend selector — daily income/expense buckets, trailing 30 days, clipped to the earliest transaction if history is shorter (`open-questions.md` #17) | Overview `StatTile` sparklines (income/spending KPIs) |
| `ProgressBar` | `{ value, max, label?, right? }` | — | **Unused**: declared in `charts.jsx` but no screen in `screens.md` consumes it. Keep out of the v1 port; revisit if a future screen needs a bounded-progress visual. |

## 4. Rendering-boundary rules (restated with this design's traps)

- **Props only.** No component imports `@repo/platform` or `@repo/app-core` — enforced by `biome.json`'s `noRestrictedImports` for `packages/ui/**`.
- **No formatting logic.** `fmtMoney`/`fmtDate`/`fmtRelFuture` live in `ui.jsx` in the mock but are already assigned to app-core selectors (`app-core-inventory.md` §6, "Money formatting" / "Relative date formatting" rows). `AmountCell` and every date-bearing cell receive a formatted **string**, never a raw amount + currency pair to format themselves.
- **No persistence.** `RichNote` calls `window.localStorage` directly inside `desktop-shell.jsx`. **Implemented**: replaced by `Textarea`, fully controlled (`value: string`, `onChange(value: string)`), with persistence owned by Investment detail's ViewModel through the real `Investment.note` field (`domain-model.md`) and the ordinary `useUpdateInvestment()` mutation — no new repository operation, no `localStorage`. `document.execCommand`'s deprecation is moot: dropping rich text from v1 means it's never called.
- **Icons**: the mock draws ~50 inline SVG paths in `ui.jsx`'s `Icon` component. Replaced by `lucide-react` (CLAUDE.md convention), one-to-one:

  | Mock name | `lucide-react` | Mock name | `lucide-react` | Mock name | `lucide-react` |
  |---|---|---|---|---|---|
  | `home` | `Home` | `chevD` | `ChevronDown` | `arrowD` | `ArrowDown` |
  | `wallet` | `Wallet` | `chevU` | `ChevronUp` | `arrowL` | `ArrowLeft` |
  | `swap` | `ArrowLeftRight` | `more` | `MoreHorizontal` | `bell` | `Bell` |
  | `trending` | `TrendingUp` | `moreV` | `MoreVertical` | `eye` | `Eye` |
  | `trendDown` | `TrendingDown` | `edit` | `Pencil` | `eyeOff` | `EyeOff` |
  | `settings` | `Settings` | `trash` | `Trash2` | `globe` | `Globe` |
  | `plus` | `Plus` | `sun` | `Sun` | `save` | `Save` |
  | `minus` | `Minus` | `moon` | `Moon` | `download` | `Download` |
  | `x` | `X` | `database` | `Database` | `sparkle` | `Sparkles` |
  | `check` | `Check` | `filePlus` | `FilePlus2` | `lock` | `Lock` |
  | `search` | `Search` | `folder` | `Folder` | `info` | `Info` |
  | `filter` | `Filter` | `repeat` | `Repeat` | `coins` | `Coins` |
  | `sort` | `ArrowUpDown` | `landmark` | `Landmark` | `target` | `Target` |
  | `calendar` | `Calendar` | `piggybank` | `PiggyBank` | `flame` | `Flame` |
  | `chevR` | `ChevronRight` | `banknote` | `Banknote` | `receipt` | `Receipt` |
  | `chevL` | `ChevronLeft` | `arrowUR` | `ArrowUpRight` | `bold`/`italic`/`underline` | `Bold`/`Italic`/`Underline` |
  | | | `arrowDR` | `ArrowDownRight` | `list`/`listOrdered` | `List`/`ListOrdered` |
  | | | `arrowU` | `ArrowUp` | `type`/`eraser` | `Type`/`Eraser` |

- **Explicitly not ported into `@repo/ui`**: the `ctx` god-object from `desktop-app.jsx` (state belongs in app-core stores/hooks or route search params, not a single prop bag); `TweaksPanel`/`useTweaks` (Claude Design's own prototype-editing scaffolding, already ruled out by `docs/spec/README.md`); the "Onboarding / App" phase toggle (a designer-only dev control); the three colored dots in `Sidebar` imitating macOS traffic-light window controls (decorative chrome specific to the prototype — a real desktop titlebar is a Tauri window-decoration concern in `apps/desktop`, not `@repo/ui`, if used at all).
- **View/ViewModel**: because the props-only boundary already pushes state out of this package, most Tier 1/2 components end up logic-free single files (the CLAUDE.md exception for primitives extends naturally to these composites — `Panel`, `StatTile`, `Avatar`, `EmptyState`, `PageHeader`, `Content`, `AmountCell` take props and render, nothing else). The split matters more at the consumption sites (`@repo/routes` screen components) that wire `@repo/app-core` hooks into these props. One composite carries real internal UI state and does need the split within `@repo/ui` itself: `AccountFilter` (`AccountFilter.tsx` / `useAccountFilter.ts` — popover open/close, outside-click). **Implemented**: `RichNote`/`useRichNote` was never built — `Textarea` (above) has no toolbar or internal state to split out, so it stays a single logic-free file like `Input`.
