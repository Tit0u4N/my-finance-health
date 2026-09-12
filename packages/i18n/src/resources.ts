// @repo/i18n — level 1.
// Assembles the per-language resource bundles and declares i18next's strict key typing
// (start-roadmap.md §5's "strict typing of keys") via module augmentation. The augmentation lives
// in a real module rather than an ambient .d.ts — a consumer only ever includes this package's
// `src`, so a declaration reached by import graph is what actually travels with it.

import enAccounts from './locales/en/accounts';
import enCommon from './locales/en/common';
import enInvestments from './locales/en/investments';
import enOverview from './locales/en/overview';
import enRecurring from './locales/en/recurring';
import enSettings from './locales/en/settings';
import enTransactions from './locales/en/transactions';
import frAccounts from './locales/fr/accounts';
import frCommon from './locales/fr/common';
import frInvestments from './locales/fr/investments';
import frOverview from './locales/fr/overview';
import frRecurring from './locales/fr/recurring';
import frSettings from './locales/fr/settings';
import frTransactions from './locales/fr/transactions';

const en = {
  common: enCommon,
  overview: enOverview,
  accounts: enAccounts,
  transactions: enTransactions,
  recurring: enRecurring,
  investments: enInvestments,
  settings: enSettings,
};

const fr = {
  common: frCommon,
  overview: frOverview,
  accounts: frAccounts,
  transactions: frTransactions,
  recurring: frRecurring,
  investments: frInvestments,
  settings: frSettings,
};

export const resources = { en, fr } as const;

export const NAMESPACES = [
  'common',
  'overview',
  'accounts',
  'transactions',
  'recurring',
  'investments',
  'settings',
] as const;
export type Namespace = (typeof NAMESPACES)[number];
// No `: Namespace` annotation — that would widen the literal to the full 7-way union, and
// CustomTypeOptions.defaultNS below needs the literal 'common' for t()'s key inference to scope
// unprefixed keys to the common namespace instead of the union of every namespace's own keys.
export const DEFAULT_NAMESPACE = 'common' as const;

// Keys are typed off the English bundle only — `fr` (and any future language) must match it at
// runtime, which resources.test.ts's key-parity check enforces; nothing here requires the two to
// be the same TypeScript type, so one language landing ahead of another never blocks a typecheck.
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: typeof DEFAULT_NAMESPACE;
    resources: typeof en;
  }
}
