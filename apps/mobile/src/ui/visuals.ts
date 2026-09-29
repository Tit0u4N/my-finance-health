// Per-type/per-name icon lookups — the native counterpart of
// packages/routes/src/shared/visuals.ts. Same slugs, same `lucide-*` icon choices, `lucide-react-native`
// instead of `lucide-react` (docs/code_guideline.md §7): the rendering boundary stops at the DOM,
// so this is duplicated rather than shared, same as every other @repo/ui-facing file mobile owns.
//
// Every key below is quoted: these are AccountType / Category.name values (data), not
// identifiers — quoting them uniformly keeps useNamingConvention from reading them as
// badly-cased variable names (same convention as packages/routes/src/shared/visuals.ts).

import type { AccountType } from '@repo/domain/entities/account';
import {
  ArrowLeftRight,
  Banknote,
  Coins,
  Flame,
  Home,
  Landmark,
  type LucideIcon,
  PiggyBank,
  Receipt,
  Repeat,
  Sparkles,
  TrendingUp,
  Wallet,
} from 'lucide-react-native';

export const ACCOUNT_TYPE_ICON: Record<AccountType, LucideIcon> = {
  Checking: Landmark,
  Savings: PiggyBank,
  Investment: TrendingUp,
  Cash: Banknote,
};

// `Account.icon` (domain-model.md: "redundant with type-derived icon... only type-derived is
// actually used") still has to be *written* on create — accountSchema requires a non-empty
// string. Same slugs packages/routes/src/shared/visuals.ts's `ACCOUNT_TYPE_ICON_SLUG` already
// uses, so a mobile-created account's stored `icon` reads the same as one created on desktop.
export const ACCOUNT_TYPE_ICON_SLUG: Record<AccountType, string> = {
  Checking: 'landmark',
  Savings: 'piggybank',
  Investment: 'trending',
  Cash: 'banknote',
};

const CATEGORY_ICON_BY_NAME: Record<string, LucideIcon> = {
  Salary: Banknote,
  Freelance: Sparkles,
  Interest: Coins,
  Rent: Home,
  Groceries: Receipt,
  Transport: ArrowLeftRight,
  'Eating out': Flame,
  Subscriptions: Repeat,
  Health: PiggyBank,
};

export function categoryIcon(categoryName: string | undefined): LucideIcon {
  return (categoryName && CATEGORY_ICON_BY_NAME[categoryName]) || Wallet;
}
