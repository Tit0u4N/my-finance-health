// @repo/app-core — level 2.
// React binding for @repo/i18n (app-core-inventory.md §1: "@repo/i18n itself stays React-free per
// §5; this is the hook-exposing wrapper"). Mounted in both stages — bootstrap gets it directly
// from the platform's system locale (routes.md §2's "Platform + i18n context only"), the app
// stage re-mounts it once the user's stored language preference is known (AppStageProviders.tsx).

import { createI18n } from '@repo/i18n/createI18n';
import type { Language } from '@repo/i18n/languages';
import type { ReactElement, ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';

export type TranslationsProviderProps = {
  readonly language: Language;
  readonly children: ReactNode;
};

export function TranslationsProvider({ language, children }: TranslationsProviderProps): ReactElement {
  // The instance is built once per mount, from whichever language is current at that time — a
  // stage remount (bootstrap → app stage) is exactly when the resolved language can change, and
  // start-roadmap.md §9 already treats that boundary as a full unmount/remount, never a mutation.
  const [instance] = useState(() => createI18n(language));

  useEffect(() => {
    void instance.changeLanguage(language);
  }, [instance, language]);

  return <I18nextProvider i18n={instance}>{children}</I18nextProvider>;
}
