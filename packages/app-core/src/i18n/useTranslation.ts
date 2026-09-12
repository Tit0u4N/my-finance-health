// @repo/app-core — level 2.
// The React binding of i18next lives here, not in @repo/i18n (start-roadmap.md §5: "React
// binding: it belongs to level 2") and not in @repo/routes — a single import site keeps exactly
// one react-i18next instance wired across the app (app-core-inventory.md §1's "Translation
// provider" row).

import { NAMESPACES } from '@repo/i18n/resources';
import { useTranslation as useTranslationBase } from 'react-i18next';

// react-i18next only types cross-namespace "ns:key" strings for the namespaces passed as the
// first argument (it defaults to just `defaultNS` otherwise) — every screen in this app uses
// "ns:key" freely across every namespace, so this binds all of them by default rather than
// making every call site pass its own namespace list.
export function useTranslation() {
  return useTranslationBase(NAMESPACES);
}

export { Trans } from 'react-i18next';
