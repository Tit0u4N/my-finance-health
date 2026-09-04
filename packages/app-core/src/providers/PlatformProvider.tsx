// @repo/app-core — level 2.
// No visual JSX beyond the context provider itself (app-core-inventory.md's rendering-boundary rule).

import type { Platform } from '@repo/platform/platform';
import type { ReactElement, ReactNode } from 'react';
import { PlatformContext } from './platformContext';

export type PlatformProviderProps = {
  readonly platform: Platform;
  readonly children: ReactNode;
};

export function PlatformProvider({ platform, children }: PlatformProviderProps): ReactElement {
  return <PlatformContext.Provider value={platform}>{children}</PlatformContext.Provider>;
}
