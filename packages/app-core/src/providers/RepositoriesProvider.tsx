// @repo/app-core — level 2.

import type { RepositorySet } from '@repo/domain/repositories/repositorySet';
import type { ReactElement, ReactNode } from 'react';
import { RepositoriesContext } from './repositoriesContext';

export type RepositoriesProviderProps = {
  readonly repositories: RepositorySet;
  readonly children: ReactNode;
};

export function RepositoriesProvider({ repositories, children }: RepositoriesProviderProps): ReactElement {
  return <RepositoriesContext.Provider value={repositories}>{children}</RepositoriesContext.Provider>;
}
