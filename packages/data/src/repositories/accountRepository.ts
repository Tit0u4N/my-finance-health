// @repo/data — level 1.
// `balance` is read and written as a plain field here; every place it moves due to a
// transaction lives in transactionRepository.ts instead, composed into the same batch as the
// transaction write.

import type { AccountPatch, CreateAccountInput } from '@repo/domain/entities/account';
import { accountPatchSchema, accountSchema, createAccountInputSchema } from '@repo/domain/entities/account';
import type { AccountId } from '@repo/domain/primitives/entityId';
import { isErr, ok } from '@repo/domain/primitives/result';
import type { AccountRepository } from '@repo/domain/repositories/accountRepository';
import type { HistoryRange } from '@repo/domain/repositories/criteria';
import { rangeFor } from '@repo/domain/time/workspaceTime';
import { computeBalanceHistory } from './balanceHistory';
import { nowIso, parseInput, type RepositoryDepsWithTimezone } from './shared';

export function createAccountRepository({
  gateway,
  clock,
  random,
  timezone,
}: RepositoryDepsWithTimezone): AccountRepository {
  return {
    list: async () => gateway.readCollection('account', {}),

    getById: async (id: AccountId) => gateway.readById('account', id),

    create: (input: CreateAccountInput) => {
      const parsedInput = parseInput(createAccountInputSchema, input);
      if (isErr(parsedInput)) {
        return Promise.resolve(parsedInput);
      }
      const now = clock.now();
      const record = accountSchema.parse({ ...parsedInput.value, id: random.uuid(), createdAt: now, updatedAt: now });
      return gateway.write('account', record);
    },

    update: async (id: AccountId, patch: AccountPatch) => {
      const parsedPatch = parseInput(accountPatchSchema, patch);
      if (isErr(parsedPatch)) {
        return parsedPatch;
      }
      const current = await gateway.readById('account', id);
      if (isErr(current)) {
        return current;
      }
      const updated = accountSchema.parse({ ...current.value, ...parsedPatch.value, updatedAt: clock.now() });
      return gateway.write('account', updated);
    },

    getBalanceHistory: async (id: AccountId, range: HistoryRange) => {
      const account = await gateway.readById('account', id);
      if (isErr(account)) {
        return account;
      }
      const transactions = await gateway.readCollection('transaction', { filter: { accountIds: [id] } });
      if (isErr(transactions)) {
        return transactions;
      }
      const dateRange = rangeFor(range, nowIso(clock), timezone);
      return ok(computeBalanceHistory(account.value.balance, transactions.value, dateRange));
    },
  };
}
