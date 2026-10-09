// @repo/data — level 1.
// PersistenceGateway over SQLite (start-roadmap.md §9's "local mode implements this over SQLite"
// — this is that implementation). Behaviourally equivalent to memoryGateway.ts by construction:
// the same filter/sort/limit semantics, a filter naming a column the entity's table lacks always
// excludes every row (`WHERE 0`), and writes go through the operations journal first, exactly as
// §9 requires ("journal write before database application").

import { type DomainError, notFoundError, storageError } from '@repo/domain/primitives/errors';
import { err, isErr, ok, type Result } from '@repo/domain/primitives/result';
import type { SqlDriver } from '@repo/platform/services/sqlDriver';
import type { OperationsJournal } from '../local/journal/operationsJournal';
import { pointerUpsertStatement } from '../local/sql/journalPointer';
import { quoteIdent } from '../local/sql/sqlIdent';
import { statementForOperation } from '../local/sql/statements';
import { type EntityTableMapping, TABLE_MAPPINGS } from '../local/sql/tableMapping';
import type { GatewayCriteria, GatewayFilter, GatewaySort } from './criteria';
import type { EntityRecordMap } from './entityName';
import type { GatewayOperation, PersistenceGateway } from './gateway';

function hasColumn(mapping: EntityTableMapping, name: string): boolean {
  return mapping.columns.some((column) => column.name === name);
}

function textColumnsFor(mapping: EntityTableMapping): readonly string[] {
  return (['desc', 'note'] as const).filter((name) => hasColumn(mapping, name));
}

type WhereClause = { readonly clause: string; readonly params: readonly unknown[] };
type Condition = { readonly sql: string; readonly params: readonly unknown[] };

/** A filter naming a column this entity's table doesn't have contributes a literal `0` — the
 * same "no such field, never matches" outcome memoryGateway's per-field matchers produce for a
 * record that lacks the field. */
function unsupportedColumn(): Condition {
  return { sql: '0', params: [] };
}

function accountCondition(mapping: EntityTableMapping, accountIds: GatewayFilter['accountIds']): Condition | null {
  if (!accountIds || accountIds.length === 0) {
    return null;
  }
  if (!hasColumn(mapping, 'acc')) {
    return unsupportedColumn();
  }
  return { sql: `${quoteIdent('acc')} IN (${accountIds.map(() => '?').join(', ')})`, params: accountIds };
}

function categoryCondition(mapping: EntityTableMapping, categoryId: GatewayFilter['categoryId']): Condition | null {
  if (categoryId === undefined) {
    return null;
  }
  return hasColumn(mapping, 'cat') ? { sql: `${quoteIdent('cat')} = ?`, params: [categoryId] } : unsupportedColumn();
}

function investmentCondition(
  mapping: EntityTableMapping,
  investmentId: GatewayFilter['investmentId'],
): Condition | null {
  if (investmentId === undefined) {
    return null;
  }
  return hasColumn(mapping, 'investmentId')
    ? { sql: `${quoteIdent('investmentId')} = ?`, params: [investmentId] }
    : unsupportedColumn();
}

function amountSignCondition(mapping: EntityTableMapping, amountSign: GatewayFilter['amountSign']): Condition | null {
  if (amountSign === undefined) {
    return null;
  }
  if (!hasColumn(mapping, 'amount')) {
    return unsupportedColumn();
  }
  return { sql: `${quoteIdent('amount')} ${amountSign === 'positive' ? '>' : '<'} 0`, params: [] };
}

/**
 * Text search runs in JS over the rows SQL already narrowed, never as a SQL function: SQLite's
 * built-in `lower()` is ASCII-only, and not every SqlDriver can register a Unicode-aware one
 * (expo-sqlite cannot). `toLowerCase().includes` is exactly memoryGateway's own matcher, so the
 * two gateways agree by construction. An entity with no text column never matches, like any other
 * filter naming a column the table lacks.
 */
function textMatcher(
  mapping: EntityTableMapping,
  text: GatewayFilter['text'],
): ((row: Record<string, unknown>) => boolean) | null {
  if (!text) {
    return null;
  }
  const textColumns = textColumnsFor(mapping);
  if (textColumns.length === 0) {
    return () => false;
  }
  const needle = text.toLowerCase();
  return (row) =>
    textColumns
      .map((name) => (typeof row[name] === 'string' ? row[name] : ''))
      .join(' ')
      .toLowerCase()
      .includes(needle);
}

function dateRangeCondition(mapping: EntityTableMapping, dateRange: GatewayFilter['dateRange']): Condition | null {
  if (!dateRange) {
    return null;
  }
  if (!hasColumn(mapping, 'date')) {
    return unsupportedColumn();
  }
  const parts: string[] = [];
  const params: unknown[] = [];
  if (dateRange.start !== undefined) {
    parts.push(`${quoteIdent('date')} >= ?`);
    params.push(dateRange.start);
  }
  if (dateRange.end !== undefined) {
    parts.push(`${quoteIdent('date')} <= ?`);
    params.push(dateRange.end);
  }
  return parts.length === 0 ? null : { sql: parts.join(' AND '), params };
}

function buildWhere(mapping: EntityTableMapping, filter: GatewayFilter | undefined): WhereClause {
  if (!filter) {
    return { clause: '', params: [] };
  }
  const conditions = [
    accountCondition(mapping, filter.accountIds),
    categoryCondition(mapping, filter.categoryId),
    investmentCondition(mapping, filter.investmentId),
    amountSignCondition(mapping, filter.amountSign),
    dateRangeCondition(mapping, filter.dateRange),
  ].filter((condition): condition is Condition => condition !== null);

  if (conditions.length === 0) {
    return { clause: '', params: [] };
  }
  return {
    clause: `WHERE ${conditions.map((condition) => condition.sql).join(' AND ')}`,
    params: conditions.flatMap((condition) => condition.params),
  };
}

/** No sort, or a sort key this table has no column for (memoryGateway's comparator then returns
 * `0` for every pair, leaving insertion order untouched) ⇒ `rowid`, SQLite's own insertion order. */
function buildOrderBy(mapping: EntityTableMapping, sort: GatewaySort | undefined): string {
  if (sort && hasColumn(mapping, sort.key)) {
    return `ORDER BY ${quoteIdent(sort.key)} ${sort.direction === 'asc' ? 'ASC' : 'DESC'}`;
  }
  return 'ORDER BY rowid';
}

async function commit(
  driver: SqlDriver,
  journal: OperationsJournal,
  ops: readonly GatewayOperation[],
): Promise<Result<true, DomainError>> {
  const position = await journal.append(ops);
  if (isErr(position)) {
    return position;
  }
  await driver.execute('BEGIN IMMEDIATE');
  try {
    for (const operation of ops) {
      const [sql, params] = statementForOperation(operation);
      await driver.execute(sql, params);
    }
    const [pointerSql, pointerParams] = pointerUpsertStatement(position.value.sequence);
    await driver.execute(pointerSql, pointerParams);
    await driver.execute('COMMIT');
    return ok(true as const);
  } catch (error) {
    await driver.execute('ROLLBACK').catch(() => undefined);
    // The journal is already ahead of the database at this point — safe by construction, since
    // the pointer never advanced: the next open replays this same entry (local/sql/replay.ts).
    return err(storageError(`local gateway: failed to apply operations (${String(error)})`));
  }
}

export type CreateLocalGatewayDeps = {
  readonly driver: SqlDriver;
  readonly journal: OperationsJournal;
};

export function createLocalGateway({ driver, journal }: CreateLocalGatewayDeps): PersistenceGateway {
  // One connection: interleaved BEGIN/COMMIT pairs from concurrent writes would corrupt each
  // other, so every write is serialized behind this promise chain rather than run in parallel.
  let tail: Promise<void> = Promise.resolve();
  function serialize<T>(job: () => Promise<T>): Promise<T> {
    const runAfter = tail.then(job);
    tail = runAfter.then(
      () => undefined,
      () => undefined,
    );
    return runAfter;
  }

  const applyOps = (ops: readonly GatewayOperation[]): Promise<Result<true, DomainError>> =>
    serialize(() => commit(driver, journal, ops));

  return {
    readCollection: async (entity, criteria: GatewayCriteria) => {
      const mapping = TABLE_MAPPINGS[entity];
      const { clause, params } = buildWhere(mapping, criteria.filter);
      const orderBy = buildOrderBy(mapping, criteria.sort);
      const matchesText = textMatcher(mapping, criteria.filter?.text);
      // A text filter is applied after the query, so SQL's LIMIT would cut rows the filter might
      // have kept — it is applied in JS after the filter instead.
      const limitInSql = criteria.limit !== undefined && matchesText === null;
      const sql = `SELECT * FROM ${quoteIdent(mapping.table)} ${clause} ${orderBy}${limitInSql ? ' LIMIT ?' : ''}`;
      const finalParams = limitInSql ? [...params, criteria.limit] : params;

      const result = await driver.execute(sql, finalParams);
      const rows = matchesText ? result.rows.filter(matchesText) : result.rows;
      const records: EntityRecordMap[typeof entity][] = [];
      for (const row of criteria.limit === undefined ? rows : rows.slice(0, criteria.limit)) {
        const parsed = mapping.fromRow(row);
        if (isErr(parsed)) {
          return parsed;
        }
        records.push(parsed.value as EntityRecordMap[typeof entity]);
      }
      return ok(records);
    },

    readById: async (entity, id) => {
      const mapping = TABLE_MAPPINGS[entity];
      const sql = `SELECT * FROM ${quoteIdent(mapping.table)} WHERE ${quoteIdent(mapping.keyColumn)} = ?`;
      const result = await driver.execute(sql, [id]);
      const row = result.rows[0];
      if (!row) {
        return err(notFoundError(entity, id));
      }
      const parsed = mapping.fromRow(row);
      return isErr(parsed) ? parsed : ok(parsed.value as EntityRecordMap[typeof entity]);
    },

    write: async (entity, record) => {
      const operation = { kind: 'write', entity, record } as GatewayOperation;
      const result = await applyOps([operation]);
      return isErr(result) ? result : ok(record);
    },

    delete: async (entity, id) => applyOps([{ kind: 'delete', entity, id }]),

    batch: (operations) => applyOps(operations),
  };
}
