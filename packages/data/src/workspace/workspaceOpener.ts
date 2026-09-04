// @repo/data — level 1.
// The port the bootstrap-stage hook (@repo/app-core) drives (start-roadmap.md §9,
// app-core-inventory.md §2): resume/open an existing workspace, unlock it if needed, or create a
// new one. `migrating`/`replaying` are local-mode steps (schema migration, journal replay) with
// no implementation behind them yet (step 8) — a WorkspaceOpener that cannot serve a mode simply
// never returns those steps; which opener to use is picked by capability, not by platform name.

import type { CurrencyCode } from '@repo/domain/primitives/currency';
import type { Timezone } from '@repo/domain/primitives/dateTime';
import type { DomainError } from '@repo/domain/primitives/errors';
import type { Result } from '@repo/domain/primitives/result';
import type { RepositorySet } from '@repo/domain/repositories/repositorySet';
import type { WorkspaceRef } from './workspaceRef';

export type WorkspaceOpenStep =
  | { readonly kind: 'needs-unlock' }
  | { readonly kind: 'migrating' }
  | { readonly kind: 'replaying' }
  | { readonly kind: 'ready'; readonly repositories: RepositorySet };

export type CreateWorkspaceInput = {
  /** Captured once, immutably, as part of creation (open-questions.md #3). */
  readonly timezone: Timezone;
  /** An ordinary initial value, not a foundational commitment like `timezone` (app-core-inventory.md §2). */
  readonly baseCurrency: CurrencyCode;
  /** Present only for a local workspace whose key is user-secret-derived (open-questions.md #5). */
  readonly secret?: string;
};

export type WorkspaceOpener = {
  open(ref: WorkspaceRef): Promise<Result<WorkspaceOpenStep, DomainError>>;
  /** Supplies the passphrase once `open` reports `needs-unlock` — the normal path on every cold local open. */
  unlock(ref: WorkspaceRef, secret: string): Promise<Result<WorkspaceOpenStep, DomainError>>;
  create(ref: WorkspaceRef, input: CreateWorkspaceInput): Promise<Result<WorkspaceOpenStep, DomainError>>;
};
