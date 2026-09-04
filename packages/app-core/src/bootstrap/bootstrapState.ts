// @repo/app-core — level 2.
// The state/event unions for the bootstrap-stage sequence (start-roadmap.md §9,
// app-core-inventory.md §2): resume last workspace → accessibility check → occupancy-lock
// acquisition → unlock → integrity check → schema-version check → migrations → journal replay →
// repository construction. `migrating`/`replaying` are reachable states with no implementation
// behind them yet (step 8) — a WorkspaceOpener that cannot serve a mode never produces them.

import type { CreateWorkspaceInput, WorkspaceOpenStep } from '@repo/data/workspace/workspaceOpener';
import type { WorkspaceRef } from '@repo/data/workspace/workspaceRef';
import type { DomainError } from '@repo/domain/primitives/errors';
import type { RepositorySet } from '@repo/domain/repositories/repositorySet';

export type BootstrapState =
  | { readonly kind: 'idle' }
  | { readonly kind: 'needs-designation'; readonly recent: readonly WorkspaceRef[] }
  | { readonly kind: 'needs-unlock'; readonly ref: WorkspaceRef }
  | { readonly kind: 'migrating'; readonly ref: WorkspaceRef }
  | { readonly kind: 'replaying'; readonly ref: WorkspaceRef }
  | { readonly kind: 'ready'; readonly ref: WorkspaceRef; readonly repositories: RepositorySet }
  | { readonly kind: 'failed'; readonly error: DomainError };

export type BootstrapEvent =
  | { readonly type: 'recent-loaded'; readonly recent: readonly WorkspaceRef[] }
  | { readonly type: 'step-resolved'; readonly ref: WorkspaceRef; readonly step: WorkspaceOpenStep }
  | { readonly type: 'failed'; readonly error: DomainError }
  | { readonly type: 'reset' };

export type { CreateWorkspaceInput, WorkspaceOpenStep, WorkspaceRef };
