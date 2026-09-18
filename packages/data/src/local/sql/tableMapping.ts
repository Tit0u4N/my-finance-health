// @repo/data — level 1.
// One row shape per entity, hand-written rather than derived by reflection — "typed columns per
// entity" (this pass's scope decision): each table is real SQL, not a generic JSON-doc
// projection. `fromRow` re-parses every row through the entity's own zod schema, so a row a
// future migration leaves malformed can never leak upward as an `EntityRecordMap` value without
// validation (mirrors `readWorkspaceMeta`'s "return null/err rather than trust the file" stance).
//
// `entity`/`record`/`row` are handled as the loose, always-valid `EntityName`/
// `EntityRecordMap[EntityName]` union and narrowed with a runtime-safe cast inside each mapping
// — the same widening `recordKey.ts` documents: entity and record are always a matching pair at
// every call site, but TypeScript cannot express that correlation once collected into one
// `Record<EntityName, ...>`.

import type { Account } from '@repo/domain/entities/account';
import { accountSchema } from '@repo/domain/entities/account';
import type { Category } from '@repo/domain/entities/category';
import { categorySchema } from '@repo/domain/entities/category';
import type { ExchangeRate } from '@repo/domain/entities/exchangeRate';
import { exchangeRateSchema } from '@repo/domain/entities/exchangeRate';
import type { Investment } from '@repo/domain/entities/investment';
import { investmentSchema } from '@repo/domain/entities/investment';
import type { InvestmentValueSnapshot } from '@repo/domain/entities/investmentValueSnapshot';
import { investmentValueSnapshotSchema } from '@repo/domain/entities/investmentValueSnapshot';
import type { RecurringRule } from '@repo/domain/entities/recurringRule';
import { recurringRuleSchema } from '@repo/domain/entities/recurringRule';
import type { Transaction } from '@repo/domain/entities/transaction';
import { transactionSchema } from '@repo/domain/entities/transaction';
import type { WorkspaceSettings } from '@repo/domain/entities/workspaceSettings';
import { workspaceSettingsSchema } from '@repo/domain/entities/workspaceSettings';
import { type DomainError, integrityError } from '@repo/domain/primitives/errors';
import { err, ok, type Result } from '@repo/domain/primitives/result';
import type { z } from 'zod';
import type { EntityName, EntityRecordMap } from '../../gateway/entityName';

export type ColumnType = 'text' | 'integer' | 'real';
export type ColumnDef = { readonly name: string; readonly type: ColumnType; readonly nullable?: boolean };

export type EntityTableMapping = {
  readonly entity: EntityName;
  readonly table: string;
  readonly keyColumn: string;
  readonly columns: readonly ColumnDef[];
  toRow(record: EntityRecordMap[EntityName]): Record<string, unknown>;
  fromRow(row: Record<string, unknown>): Result<EntityRecordMap[EntityName], DomainError>;
};

/** SQL NULL decodes to JS `null`, but every optional field in these schemas is `.optional()`
 * (expects `undefined`, not `null`) — the one normalization every `fromRow` needs before parsing. */
function omitNulls(row: Record<string, unknown>): Record<string, unknown> {
  const normalized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    if (value !== null) {
      normalized[key] = value;
    }
  }
  return normalized;
}

function parseRow<Schema extends z.ZodType>(
  entity: EntityName,
  schema: Schema,
  row: Record<string, unknown>,
): Result<z.infer<Schema>, DomainError> {
  const parsed = schema.safeParse(omitNulls(row));
  return parsed.success
    ? ok(parsed.data)
    : err(integrityError(`local gateway: stored "${entity}" row failed validation`));
}

const workspaceSettingsMapping: EntityTableMapping = {
  entity: 'workspaceSettings',
  table: 'workspaceSettings',
  keyColumn: 'id',
  columns: [
    { name: 'id', type: 'text' },
    { name: 'timezone', type: 'text' },
    { name: 'baseCurrency', type: 'text' },
    { name: 'createdAt', type: 'text' },
    { name: 'updatedAt', type: 'text' },
  ],
  toRow: (record) => {
    const settings = record as WorkspaceSettings;
    return {
      id: settings.id,
      timezone: settings.timezone,
      baseCurrency: settings.baseCurrency,
      createdAt: settings.createdAt,
      updatedAt: settings.updatedAt,
    };
  },
  fromRow: (row) => parseRow('workspaceSettings', workspaceSettingsSchema, row),
};

const accountMapping: EntityTableMapping = {
  entity: 'account',
  table: 'account',
  keyColumn: 'id',
  columns: [
    { name: 'id', type: 'text' },
    { name: 'name', type: 'text' },
    { name: 'type', type: 'text' },
    { name: 'currency', type: 'text' },
    { name: 'balance', type: 'integer' },
    { name: 'color', type: 'text' },
    { name: 'icon', type: 'text' },
    { name: 'last4', type: 'text', nullable: true },
    { name: 'createdAt', type: 'text' },
    { name: 'updatedAt', type: 'text' },
  ],
  toRow: (record) => {
    const account = record as Account;
    return {
      id: account.id,
      name: account.name,
      type: account.type,
      currency: account.currency,
      balance: account.balance,
      color: account.color,
      icon: account.icon,
      last4: account.last4 ?? null,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    };
  },
  fromRow: (row) => parseRow('account', accountSchema, row),
};

const exchangeRateMapping: EntityTableMapping = {
  entity: 'exchangeRate',
  table: 'exchangeRate',
  keyColumn: 'currency',
  columns: [
    { name: 'currency', type: 'text' },
    { name: 'rateToBase', type: 'integer' },
    { name: 'updatedAt', type: 'text' },
  ],
  toRow: (record) => {
    const rate = record as ExchangeRate;
    return { currency: rate.currency, rateToBase: rate.rateToBase, updatedAt: rate.updatedAt };
  },
  fromRow: (row) => parseRow('exchangeRate', exchangeRateSchema, row),
};

const categoryMapping: EntityTableMapping = {
  entity: 'category',
  table: 'category',
  keyColumn: 'id',
  columns: [
    { name: 'id', type: 'text' },
    { name: 'name', type: 'text' },
    { name: 'color', type: 'text' },
    { name: 'kind', type: 'text' },
    { name: 'createdAt', type: 'text' },
    { name: 'updatedAt', type: 'text' },
  ],
  toRow: (record) => {
    const category = record as Category;
    return {
      id: category.id,
      name: category.name,
      color: category.color,
      kind: category.kind,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  },
  fromRow: (row) => parseRow('category', categorySchema, row),
};

const transactionMapping: EntityTableMapping = {
  entity: 'transaction',
  table: 'transaction',
  keyColumn: 'id',
  columns: [
    { name: 'id', type: 'text' },
    { name: 'date', type: 'text' },
    { name: 'desc', type: 'text' },
    { name: 'amount', type: 'integer' },
    { name: 'cat', type: 'text' },
    { name: 'acc', type: 'text' },
    { name: 'note', type: 'text', nullable: true },
    { name: 'createdAt', type: 'text' },
    { name: 'updatedAt', type: 'text' },
  ],
  toRow: (record) => {
    const transaction = record as Transaction;
    return {
      id: transaction.id,
      date: transaction.date,
      desc: transaction.desc,
      amount: transaction.amount,
      cat: transaction.cat,
      acc: transaction.acc,
      note: transaction.note ?? null,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
    };
  },
  fromRow: (row) => parseRow('transaction', transactionSchema, row),
};

const recurringRuleMapping: EntityTableMapping = {
  entity: 'recurringRule',
  table: 'recurringRule',
  keyColumn: 'id',
  columns: [
    { name: 'id', type: 'text' },
    { name: 'desc', type: 'text' },
    { name: 'amount', type: 'integer' },
    { name: 'freq', type: 'text' },
    { name: 'cat', type: 'text' },
    { name: 'acc', type: 'text' },
    { name: 'startDate', type: 'text' },
    { name: 'active', type: 'integer' },
    { name: 'createdAt', type: 'text' },
    { name: 'updatedAt', type: 'text' },
  ],
  toRow: (record) => {
    const rule = record as RecurringRule;
    return {
      id: rule.id,
      desc: rule.desc,
      amount: rule.amount,
      freq: rule.freq,
      cat: rule.cat,
      acc: rule.acc,
      startDate: rule.startDate,
      active: rule.active ? 1 : 0,
      createdAt: rule.createdAt,
      updatedAt: rule.updatedAt,
    };
  },
  fromRow: (row) => {
    const active = (row as { readonly active?: unknown }).active;
    const normalized = { ...row, active: active === 1 || active === true };
    return parseRow('recurringRule', recurringRuleSchema, normalized);
  },
};

const investmentMapping: EntityTableMapping = {
  entity: 'investment',
  table: 'investment',
  keyColumn: 'id',
  columns: [
    { name: 'id', type: 'text' },
    { name: 'name', type: 'text' },
    { name: 'ticker', type: 'text' },
    { name: 'qty', type: 'real' },
    { name: 'avg', type: 'integer' },
    { name: 'current', type: 'integer' },
    { name: 'color', type: 'text' },
    { name: 'note', type: 'text', nullable: true },
    { name: 'createdAt', type: 'text' },
    { name: 'updatedAt', type: 'text' },
  ],
  toRow: (record) => {
    const investment = record as Investment;
    return {
      id: investment.id,
      name: investment.name,
      ticker: investment.ticker,
      qty: investment.qty,
      avg: investment.avg,
      current: investment.current,
      color: investment.color,
      note: investment.note ?? null,
      createdAt: investment.createdAt,
      updatedAt: investment.updatedAt,
    };
  },
  fromRow: (row) => parseRow('investment', investmentSchema, row),
};

const investmentValueSnapshotMapping: EntityTableMapping = {
  entity: 'investmentValueSnapshot',
  table: 'investmentValueSnapshot',
  keyColumn: 'id',
  columns: [
    { name: 'id', type: 'text' },
    { name: 'investmentId', type: 'text' },
    { name: 'date', type: 'text' },
    { name: 'price', type: 'integer' },
    { name: 'createdAt', type: 'text' },
    { name: 'updatedAt', type: 'text' },
  ],
  toRow: (record) => {
    const snapshot = record as InvestmentValueSnapshot;
    return {
      id: snapshot.id,
      investmentId: snapshot.investmentId,
      date: snapshot.date,
      price: snapshot.price,
      createdAt: snapshot.createdAt,
      updatedAt: snapshot.updatedAt,
    };
  },
  fromRow: (row) => parseRow('investmentValueSnapshot', investmentValueSnapshotSchema, row),
};

export const TABLE_MAPPINGS: Readonly<Record<EntityName, EntityTableMapping>> = {
  workspaceSettings: workspaceSettingsMapping,
  account: accountMapping,
  exchangeRate: exchangeRateMapping,
  category: categoryMapping,
  transaction: transactionMapping,
  recurringRule: recurringRuleMapping,
  investment: investmentMapping,
  investmentValueSnapshot: investmentValueSnapshotMapping,
};
