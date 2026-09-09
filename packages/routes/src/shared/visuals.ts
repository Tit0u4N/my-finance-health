// @repo/routes — level 3.
// Per-type/per-name icon lookups the mock hardcodes in desktop-shell.jsx (`ACC_ICON`, `catIcon`).
// Account.icon and a category-icon field don't exist on the domain entities (domain-model.md:
// "redundant with type-derived icon in the shell... only type-derived is actually used on
// desktop") — this is presentation-only, so it lives here, not in @repo/domain.
//
// Every key below is quoted: these are AccountType / Category.name values (data), not
// identifiers — quoting them uniformly (the way "Eating out" has no choice but to be) keeps
// useNamingConvention from reading the rest as badly-cased variable names.

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
} from 'lucide-react';

export const ACCOUNT_TYPE_ICON: Record<AccountType, LucideIcon> = {
  Checking: Landmark,
  Savings: PiggyBank,
  Investment: TrendingUp,
  Cash: Banknote,
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
