// @repo/app-core — level 2.

import type { ReactElement, ReactNode } from 'react';
import { WorkspaceLockContext } from './workspaceLockContext';

export type WorkspaceLockProviderProps = {
  readonly lock: (() => void) | null;
  readonly children: ReactNode;
};

export function WorkspaceLockProvider({ lock, children }: WorkspaceLockProviderProps): ReactElement {
  return <WorkspaceLockContext.Provider value={lock}>{children}</WorkspaceLockContext.Provider>;
}
