// @repo/domain — level 0.
// The bundle app-core's repositories provider carries, mounted only once the bootstrap stage
// reports `ready` (app-core-inventory.md §1).

import type { AccountRepository } from './accountRepository';
import type { CategoryRepository } from './categoryRepository';
import type { ExchangeRateRepository } from './exchangeRateRepository';
import type { InvestmentRepository } from './investmentRepository';
import type { RecurringRuleRepository } from './recurringRuleRepository';
import type { TransactionRepository } from './transactionRepository';
import type { WorkspaceSettingsRepository } from './workspaceSettingsRepository';

export type RepositorySet = {
  readonly workspaceSettings: WorkspaceSettingsRepository;
  readonly accounts: AccountRepository;
  readonly exchangeRates: ExchangeRateRepository;
  readonly categories: CategoryRepository;
  readonly transactions: TransactionRepository;
  readonly recurringRules: RecurringRuleRepository;
  readonly investments: InvestmentRepository;
};
