// @repo/app-core — level 2.

import type { RepositorySet } from '@repo/domain/repositories/repositorySet';
import { useContext } from 'react';
import { RepositoriesContext } from './repositoriesContext';

export function useRepositories(): RepositorySet {
  const repositories = useContext(RepositoriesContext);
  if (!repositories) {
    throw new Error('useRepositories must be called within the app stage (RepositoriesProvider)');
  }
  return repositories;
}
