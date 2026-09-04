// @repo/app-core — level 2.
// App stage: full context — platform, repositories (guaranteed ready), the composed query
// client, and the two store providers (app-core-inventory.md §1, §3). Mounted only once
// bootstrap resolves to `ready`; switching workspace unmounts this wholesale and remounts it,
// never mutates it in place (start-roadmap.md §9).

import type { RepositorySet } from '@repo/domain/repositories/repositorySet';
import type { Platform } from '@repo/platform/platform';
import { type QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactElement, ReactNode } from 'react';
import { AccountSelectionProvider } from '../stores/AccountSelectionProvider';
import { PreferencesProvider } from '../stores/PreferencesProvider';
import { PlatformProvider } from './PlatformProvider';
import { RepositoriesProvider } from './RepositoriesProvider';

export type AppStageProvidersProps = {
  readonly platform: Platform;
  readonly repositories: RepositorySet;
  /** Built by each app — cache configuration may reasonably differ by target (app-core-inventory.md §1). */
  readonly queryClient: QueryClient;
  readonly children: ReactNode;
};

export function AppStageProviders({
  platform,
  repositories,
  queryClient,
  children,
}: AppStageProvidersProps): ReactElement {
  return (
    <PlatformProvider platform={platform}>
      <RepositoriesProvider repositories={repositories}>
        <QueryClientProvider client={queryClient}>
          <PreferencesProvider>
            <AccountSelectionProvider>{children}</AccountSelectionProvider>
          </PreferencesProvider>
        </QueryClientProvider>
      </RepositoriesProvider>
    </PlatformProvider>
  );
}
