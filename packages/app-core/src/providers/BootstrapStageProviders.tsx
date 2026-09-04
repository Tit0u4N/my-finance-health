// @repo/app-core — level 2.
// Bootstrap stage: platform context only — no repositories, no query client, no stores
// (app-core-inventory.md §1, start-roadmap.md §9). Mounted before a workspace is open; the app
// swaps this out for AppStageProviders once bootstrap reports `ready`.

import type { Platform } from '@repo/platform/platform';
import type { ReactElement, ReactNode } from 'react';
import { PlatformProvider } from './PlatformProvider';

export type BootstrapStageProvidersProps = {
  readonly platform: Platform;
  readonly children: ReactNode;
};

export function BootstrapStageProviders({ platform, children }: BootstrapStageProvidersProps): ReactElement {
  return <PlatformProvider platform={platform}>{children}</PlatformProvider>;
}
