// @repo/domain — level 0.
// Interface only — the implementation is @repo/data (start-roadmap.md §9, repository-contracts.md).
// No update operation for `timezone`: it is immutable after workspace creation.

import type { WorkspaceSettings } from '../entities/workspaceSettings';
import type { CurrencyCode } from '../primitives/currency';
import type { DomainError } from '../primitives/errors';
import type { Result } from '../primitives/result';

export type WorkspaceSettingsRepository = {
  get(): Promise<Result<WorkspaceSettings, DomainError>>;
  setBaseCurrency(currency: CurrencyCode): Promise<Result<WorkspaceSettings, DomainError>>;
};
