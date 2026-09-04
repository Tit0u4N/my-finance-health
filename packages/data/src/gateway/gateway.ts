// @repo/data — level 1.
// The persistence gateway: a typed, closed set of operations, never a free query
// (start-roadmap.md §9, repository-contracts.md). Local mode implements this over SQLite
// (step 8); online mode implements it over the API (remoteGateway.ts, this pass). Repositories
// compose these five operations — they never add a new gateway shape per entity.

import type { DomainError } from '@repo/domain/primitives/errors';
import type { Result } from '@repo/domain/primitives/result';
import type { GatewayCriteria } from './criteria';
import type { EntityName, EntityRecordMap } from './entityName';

export type GatewayWriteOperation<Name extends EntityName = EntityName> = {
  readonly kind: 'write';
  readonly entity: Name;
  readonly record: EntityRecordMap[Name];
};

export type GatewayDeleteOperation = {
  readonly kind: 'delete';
  readonly entity: EntityName;
  readonly id: string;
};

export type GatewayOperation = GatewayWriteOperation | GatewayDeleteOperation;

export type PersistenceGateway = {
  readCollection<Name extends EntityName>(
    entity: Name,
    criteria: GatewayCriteria,
  ): Promise<Result<readonly EntityRecordMap[Name][], DomainError>>;
  readById<Name extends EntityName>(entity: Name, id: string): Promise<Result<EntityRecordMap[Name], DomainError>>;
  write<Name extends EntityName>(
    entity: Name,
    record: EntityRecordMap[Name],
  ): Promise<Result<EntityRecordMap[Name], DomainError>>;
  delete(entity: EntityName, id: string): Promise<Result<true, DomainError>>;
  /** Local mode: one SQLite transaction. Online mode: one API call — never sequential requests. */
  batch(operations: readonly GatewayOperation[]): Promise<Result<true, DomainError>>;
};
