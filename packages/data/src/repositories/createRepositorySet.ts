// @repo/data — level 1.
// Assembles the seven repositories into the bundle app-core's repositories provider carries
// (app-core-inventory.md §1). `timezone` is resolved once by the workspace opener, before this
// is called — it never changes for the lifetime of an open workspace (open-questions.md #3).

import type { RepositorySet } from '@repo/domain/repositories/repositorySet';
import { createAccountRepository } from './accountRepository';
import { createCategoryRepository } from './categoryRepository';
import { createExchangeRateRepository } from './exchangeRateRepository';
import { createInvestmentRepository } from './investmentRepository';
import { createRecurringRuleRepository } from './recurringRuleRepository';
import type { RepositoryDepsWithTimezone } from './shared';
import { createTransactionRepository } from './transactionRepository';
import { createWorkspaceSettingsRepository } from './workspaceSettingsRepository';

export function createRepositorySet(deps: RepositoryDepsWithTimezone): RepositorySet {
  return {
    workspaceSettings: createWorkspaceSettingsRepository(deps),
    accounts: createAccountRepository(deps),
    exchangeRates: createExchangeRateRepository(deps),
    categories: createCategoryRepository(deps),
    transactions: createTransactionRepository(deps),
    recurringRules: createRecurringRuleRepository(deps),
    investments: createInvestmentRepository(deps),
  };
}
