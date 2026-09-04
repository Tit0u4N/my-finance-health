// @repo/data — level 1.
// The closed set of record types the gateway moves — one name per family in domain-model.md.
// Every gateway operation is parameterized by one of these (repository-contracts.md: "typed and
// closed set of operations", never a free query).

import type { Account } from '@repo/domain/entities/account';
import type { Category } from '@repo/domain/entities/category';
import type { ExchangeRate } from '@repo/domain/entities/exchangeRate';
import type { Investment } from '@repo/domain/entities/investment';
import type { InvestmentValueSnapshot } from '@repo/domain/entities/investmentValueSnapshot';
import type { RecurringRule } from '@repo/domain/entities/recurringRule';
import type { Transaction } from '@repo/domain/entities/transaction';
import type { WorkspaceSettings } from '@repo/domain/entities/workspaceSettings';

export type EntityRecordMap = {
  readonly workspaceSettings: WorkspaceSettings;
  readonly account: Account;
  readonly exchangeRate: ExchangeRate;
  readonly category: Category;
  readonly transaction: Transaction;
  readonly recurringRule: RecurringRule;
  readonly investment: Investment;
  readonly investmentValueSnapshot: InvestmentValueSnapshot;
};

export type EntityName = keyof EntityRecordMap;

export const ENTITY_NAMES: readonly EntityName[] = [
  'workspaceSettings',
  'account',
  'exchangeRate',
  'category',
  'transaction',
  'recurringRule',
  'investment',
  'investmentValueSnapshot',
];
