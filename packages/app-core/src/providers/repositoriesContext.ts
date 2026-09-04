// @repo/app-core — level 2.
// Mounted only in the app stage, once bootstrap reports `ready` — so every consumer can assume
// repositories exist, never `null` (app-core-inventory.md §1). `undefined`, not a fake set, is
// the "not mounted yet" state: reaching for this outside the app stage is a real programmer
// error, not a case to design a fallback for.

import type { RepositorySet } from '@repo/domain/repositories/repositorySet';
import { createContext } from 'react';

export const RepositoriesContext = createContext<RepositorySet | null>(null);
