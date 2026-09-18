// @repo/data — level 1.
// Local mode's schema, defined once here (start-roadmap.md §9: "the database schema and
// migrations are defined once in @repo/data. Each native platform only provides the
// request-execution driver"). v1 is the baseline — one table per entity, typed columns (this
// pass's scope decision, not a generic JSON-doc projection), no foreign keys: `memoryGateway`
// tolerates dangling references and journal replay has no guaranteed insert order, so an FK
// would break behavioural equivalence between the two gateways.

import { ENTITY_NAMES } from '../../gateway/entityName';
import { quoteIdent } from './sqlIdent';
import { type ColumnType, type EntityTableMapping, TABLE_MAPPINGS } from './tableMapping';

const SQL_TYPE: Readonly<Record<ColumnType, string>> = { text: 'TEXT', integer: 'INTEGER', real: 'REAL' };

function createTableStatement(mapping: EntityTableMapping): string {
  const columns = mapping.columns
    .map((column) => {
      const parts = [quoteIdent(column.name), SQL_TYPE[column.type]];
      if (column.name === mapping.keyColumn) {
        parts.push('PRIMARY KEY');
      } else if (!column.nullable) {
        parts.push('NOT NULL');
      }
      return parts.join(' ');
    })
    .join(', ');
  return `CREATE TABLE ${quoteIdent(mapping.table)} (${columns})`;
}

/** Holds the last-applied journal sequence (start-roadmap.md §9: "the database keeps the pointer
 * to the last applied entry") — a generic key/value table so future local-only bookkeeping has a
 * home without another migration. */
const STATE_TABLE_STATEMENT = `CREATE TABLE ${quoteIdent('mfh_state')} (${quoteIdent('key')} TEXT PRIMARY KEY, ${quoteIdent('value')} TEXT NOT NULL)`;

const INDEX_STATEMENTS: readonly string[] = [
  `CREATE INDEX ${quoteIdent('idx_transaction_date')} ON ${quoteIdent('transaction')} (${quoteIdent('date')})`,
  `CREATE INDEX ${quoteIdent('idx_transaction_acc_date')} ON ${quoteIdent('transaction')} (${quoteIdent('acc')}, ${quoteIdent('date')})`,
  `CREATE INDEX ${quoteIdent('idx_transaction_cat')} ON ${quoteIdent('transaction')} (${quoteIdent('cat')})`,
  `CREATE INDEX ${quoteIdent('idx_transaction_amount')} ON ${quoteIdent('transaction')} (${quoteIdent('amount')})`,
  `CREATE INDEX ${quoteIdent('idx_investmentValueSnapshot_investmentId_date')} ON ${quoteIdent('investmentValueSnapshot')} (${quoteIdent('investmentId')}, ${quoteIdent('date')})`,
  `CREATE INDEX ${quoteIdent('idx_recurringRule_acc')} ON ${quoteIdent('recurringRule')} (${quoteIdent('acc')})`,
  `CREATE INDEX ${quoteIdent('idx_recurringRule_cat')} ON ${quoteIdent('recurringRule')} (${quoteIdent('cat')})`,
];

export type Migration = { readonly version: number; readonly statements: readonly string[] };

export const SCHEMA_VERSION = 1;

export const MIGRATIONS: readonly Migration[] = [
  {
    version: 1,
    statements: [
      ...ENTITY_NAMES.map((entity) => createTableStatement(TABLE_MAPPINGS[entity])),
      STATE_TABLE_STATEMENT,
      ...INDEX_STATEMENTS,
    ],
  },
];
