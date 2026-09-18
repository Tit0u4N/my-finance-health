// @repo/data — level 1.
// Turns one GatewayOperation into the single SQL statement that applies it — shared by the local
// gateway's own writes and by journal replay, so a replayed entry and a live write go through
// exactly the same SQL (start-roadmap.md §9: replay must be deterministic and identical to the
// original application).

import type { GatewayOperation } from '../../gateway/gateway';
import { quoteIdent } from './sqlIdent';
import { TABLE_MAPPINGS } from './tableMapping';

export function statementForOperation(operation: GatewayOperation): readonly [string, readonly unknown[]] {
  const mapping = TABLE_MAPPINGS[operation.entity];

  if (operation.kind === 'delete') {
    return [`DELETE FROM ${quoteIdent(mapping.table)} WHERE ${quoteIdent(mapping.keyColumn)} = ?`, [operation.id]];
  }

  const row = mapping.toRow(operation.record);
  const columnNames = mapping.columns.map((column) => column.name);
  const placeholders = columnNames.map(() => '?').join(', ');
  const updateAssignments = columnNames
    .filter((name) => name !== mapping.keyColumn)
    .map((name) => `${quoteIdent(name)} = excluded.${quoteIdent(name)}`)
    .join(', ');
  const sql = `INSERT INTO ${quoteIdent(mapping.table)} (${columnNames.map(quoteIdent).join(', ')}) VALUES (${placeholders}) ON CONFLICT(${quoteIdent(mapping.keyColumn)}) DO UPDATE SET ${updateAssignments}`;
  const params = columnNames.map((name) => row[name]);
  return [sql, params];
}
