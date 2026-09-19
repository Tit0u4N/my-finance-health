// @repo/app-core — level 2.
// App stage: full context — platform, repositories (guaranteed ready), the composed query
// client, and the two store providers (app-core-inventory.md §1, §3). Mounted only once
// bootstrap resolves to `ready`; switching workspace unmounts this wholesale and remounts it,
// never mutates it in place (start-roadmap.md §9).

import type { RepositorySet } from '@repo/domain/repositories/repositorySet';
import type { Platform } from '@repo/platform/platform';
import { type QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactElement, ReactNode } from 'react';
import { resolveActiveLanguage } from '../i18n/resolveActiveLanguage';
import { AccountSelectionProvider } from '../stores/AccountSelectionProvider';
import { PreferencesProvider, usePreferencesStore } from '../stores/PreferencesProvider';
import { PlatformProvider } from './PlatformProvider';
import { RepositoriesProvider } from './RepositoriesProvider';
import { TranslationsProvider } from './TranslationsProvider';
import { usePlatform } from './usePlatform';
import { WorkspaceLockProvider } from './WorkspaceLockProvider';

export type AppStageProvidersProps = {
  readonly platform: Platform;
  readonly repositories: RepositorySet;
  /** Built by each app — cache configuration may reasonably differ by target (app-core-inventory.md §1). */
  readonly queryClient: QueryClient;
  /** Present only when the host can return to the unlock screen without a full remount (local
   *  mode's per-workspace session — open-questions.md #24). Absent for online mode. */
  readonly onLockWorkspace?: () => void;
  readonly children: ReactNode;
};

export function AppStageProviders({
  platform,
  repositories,
  queryClient,
  onLockWorkspace,
  children,
}: AppStageProvidersProps): ReactElement {
  return (
    <PlatformProvider platform={platform}>
      <RepositoriesProvider repositories={repositories}>
        <QueryClientProvider client={queryClient}>
          <PreferencesProvider>
            <PreferredLanguage>
              <WorkspaceLockProvider lock={onLockWorkspace ?? null}>
                <AccountSelectionProvider>{children}</AccountSelectionProvider>
              </WorkspaceLockProvider>
            </PreferredLanguage>
          </PreferencesProvider>
        </QueryClientProvider>
      </RepositoriesProvider>
    </PlatformProvider>
  );
}

// Split out so it can read the preferences store `PreferencesProvider` just mounted above it —
// the same shape as apps/desktop's own `ThemedRouter` (reads a store from inside the tree that
// constructs it).
function PreferredLanguage({ children }: { readonly children: ReactNode }): ReactElement {
  const systemLocale = usePlatform().localization.locale();
  const language = usePreferencesStore((state) => state.language);
  return (
    <TranslationsProvider language={resolveActiveLanguage(language, systemLocale)}>{children}</TranslationsProvider>
  );
}
