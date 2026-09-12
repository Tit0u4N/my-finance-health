// @repo/app-core — level 2.
// Bootstrap stage: platform and translations context only — no repositories, no query client, no
// stores (app-core-inventory.md §1, start-roadmap.md §9's "platform and translations only").
// There is no preferences store yet at this stage, so the language is the host's system locale —
// the user can only pick a language explicitly once the app stage's Preferences screen exists.
// Mounted before a workspace is open; the app swaps this out for AppStageProviders once bootstrap
// reports `ready`.

import { resolveLanguage } from '@repo/i18n/languages';
import type { Platform } from '@repo/platform/platform';
import type { ReactElement, ReactNode } from 'react';
import { PlatformProvider } from './PlatformProvider';
import { TranslationsProvider } from './TranslationsProvider';

export type BootstrapStageProvidersProps = {
  readonly platform: Platform;
  readonly children: ReactNode;
};

export function BootstrapStageProviders({ platform, children }: BootstrapStageProvidersProps): ReactElement {
  return (
    <PlatformProvider platform={platform}>
      <TranslationsProvider language={resolveLanguage(platform.localization.locale())}>{children}</TranslationsProvider>
    </PlatformProvider>
  );
}
