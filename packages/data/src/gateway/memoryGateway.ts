// @repo/data — level 1.
// The gateway test double every repository, and the repositories.integration test, runs
// against (start-roadmap.md §13: "no shared test starts Tauri or a simulator"). `batch` mutates
// a clone and only commits it on success, which is the rollback — the live store is never left
// half-written.

import type { DomainError } from '@repo/domain/primitives/errors';
import { notFoundError } from '@repo/domain/primitives/errors';
import { err, ok, type Result } from '@repo/domain/primitives/result';
import type { GatewayCriteria, GatewayFilter } from './criteria';
import { ENTITY_NAMES, type EntityName, type EntityRecordMap } from './entityName';
import type { GatewayOperation, PersistenceGateway } from './gateway';
import { recordKeyOf } from './recordKey';

type Store = { [Name in EntityName]: Map<string, EntityRecordMap[Name]> };

export type MemoryGatewaySeed = { readonly [Name in EntityName]?: readonly EntityRecordMap[Name][] };

function createEmptyStore(): Store {
  return {
    workspaceSettings: new Map(),
    account: new Map(),
    exchangeRate: new Map(),
    category: new Map(),
    transaction: new Map(),
    recurringRule: new Map(),
    investment: new Map(),
    investmentValueSnapshot: new Map(),
  };
}

function cloneStore(store: Store): Store {
  return {
    workspaceSettings: new Map(store.workspaceSettings),
    account: new Map(store.account),
    exchangeRate: new Map(store.exchangeRate),
    category: new Map(store.category),
    transaction: new Map(store.transaction),
    recurringRule: new Map(store.recurringRule),
    investment: new Map(store.investment),
    investmentValueSnapshot: new Map(store.investmentValueSnapshot),
  };
}

// `entity` and `record` are always a matching pair at runtime; see recordKey.ts for why the
// types stay this loose. This is the single place that widened pairing is written into a Map.
function setInStore(store: Store, entity: EntityName, record: EntityRecordMap[EntityName]): void {
  const map = store[entity] as Map<string, unknown>;
  map.set(recordKeyOf(entity, record), record);
}

function seedStore(store: Store, seed: MemoryGatewaySeed | undefined): void {
  if (!seed) {
    return;
  }
  for (const entity of ENTITY_NAMES) {
    const records = seed[entity];
    if (!records) {
      continue;
    }
    for (const record of records) {
      setInStore(store, entity, record);
    }
  }
}

// A named shape rather than Record<string, unknown>: dot access on an index-signature type is a
// tsconfig error here (noPropertyAccessFromIndexSignature), and this way biome's useLiteralKeys
// and that rule agree instead of fighting each other. Every field is optional/unknown because a
// given entity only ever carries a subset of them (an Account has neither `acc` nor `date`).
type FilterableRecord = {
  readonly acc?: unknown;
  readonly cat?: unknown;
  readonly investmentId?: unknown;
  readonly amount?: unknown;
  readonly desc?: unknown;
  readonly note?: unknown;
  readonly date?: unknown;
};

function matchesAccountFilter(record: FilterableRecord, accountIds: GatewayFilter['accountIds']): boolean {
  if (!accountIds || accountIds.length === 0) {
    return true;
  }
  return typeof record.acc === 'string' && accountIds.includes(record.acc);
}

function matchesAmountSignFilter(record: FilterableRecord, amountSign: GatewayFilter['amountSign']): boolean {
  if (amountSign === undefined) {
    return true;
  }
  if (typeof record.amount !== 'number') {
    return false;
  }
  return amountSign === 'positive' ? record.amount > 0 : record.amount < 0;
}

function matchesTextFilter(record: FilterableRecord, text: GatewayFilter['text']): boolean {
  if (!text) {
    return true;
  }
  const needle = text.toLowerCase();
  const desc = typeof record.desc === 'string' ? record.desc : '';
  const note = typeof record.note === 'string' ? record.note : '';
  return `${desc} ${note}`.toLowerCase().includes(needle);
}

function matchesDateRangeFilter(record: FilterableRecord, dateRange: GatewayFilter['dateRange']): boolean {
  if (!dateRange) {
    return true;
  }
  if (typeof record.date !== 'string') {
    return false;
  }
  if (dateRange.start !== undefined && record.date < dateRange.start) {
    return false;
  }
  return dateRange.end === undefined || record.date <= dateRange.end;
}

function matchesFilter(record: FilterableRecord, criteria: GatewayCriteria): boolean {
  const filter = criteria.filter;
  if (!filter) {
    return true;
  }
  return (
    matchesAccountFilter(record, filter.accountIds) &&
    (filter.categoryId === undefined || record.cat === filter.categoryId) &&
    (filter.investmentId === undefined || record.investmentId === filter.investmentId) &&
    matchesAmountSignFilter(record, filter.amountSign) &&
    matchesTextFilter(record, filter.text) &&
    matchesDateRangeFilter(record, filter.dateRange)
  );
}

function sortRecords<Name extends EntityName>(
  records: readonly EntityRecordMap[Name][],
  sort: NonNullable<GatewayCriteria['sort']>,
): readonly EntityRecordMap[Name][] {
  const factor = sort.direction === 'asc' ? 1 : -1;
  return [...records].sort((a, b) => {
    const left = (a as Record<string, unknown>)[sort.key];
    const right = (b as Record<string, unknown>)[sort.key];
    if (typeof left === 'number' && typeof right === 'number') {
      return (left - right) * factor;
    }
    if (typeof left === 'string' && typeof right === 'string') {
      return left.localeCompare(right) * factor;
    }
    return 0;
  });
}

function readCollectionImpl<Name extends EntityName>(
  store: Store,
  entity: Name,
  criteria: GatewayCriteria,
): readonly EntityRecordMap[Name][] {
  const all = [...store[entity].values()];
  const filtered = all.filter((record) => matchesFilter(record as FilterableRecord, criteria));
  const sorted = criteria.sort ? sortRecords(filtered, criteria.sort) : filtered;
  return criteria.limit === undefined ? sorted : sorted.slice(0, criteria.limit);
}

function applyOperations(store: Store, operations: readonly GatewayOperation[]): void {
  for (const operation of operations) {
    if (operation.kind === 'write') {
      setInStore(store, operation.entity, operation.record);
    } else {
      store[operation.entity].delete(operation.id);
    }
  }
}

export function createMemoryGateway(seed?: MemoryGatewaySeed): PersistenceGateway {
  let store = createEmptyStore();
  seedStore(store, seed);

  return {
    readCollection: (entity, criteria) => Promise.resolve(ok(readCollectionImpl(store, entity, criteria))),

    readById: (entity, id) => {
      const record = store[entity].get(id);
      const result: Result<EntityRecordMap[typeof entity], DomainError> = record
        ? ok(record)
        : err(notFoundError(entity, id));
      return Promise.resolve(result);
    },

    write: (entity, record) => {
      const next = cloneStore(store);
      setInStore(next, entity, record);
      store = next;
      return Promise.resolve(ok(record));
    },

    delete: (entity, id) => {
      const next = cloneStore(store);
      next[entity].delete(id);
      store = next;
      return Promise.resolve(ok(true as const));
    },

    batch: (operations) => {
      const next = cloneStore(store);
      applyOperations(next, operations);
      store = next;
      return Promise.resolve(ok(true as const));
    },
  };
}
