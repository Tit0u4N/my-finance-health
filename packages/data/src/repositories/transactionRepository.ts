// @repo/data — level 1.
// The one repository where a write is never a single gateway call: every create/update/delete
// composes the transaction write with an account-balance adjustment into one batch, honouring
// the "balance is a maintained running total" decision (domain-model.md) and the
// sign(amount)-matches-category.kind invariant (@repo/domain/invariants).

import { accountSchema } from '@repo/domain/entities/account';
import type { CreateTransactionInput, TransactionPatch } from '@repo/domain/entities/transaction';
import {
  createTransactionInputSchema,
  transactionPatchSchema,
  transactionSchema,
} from '@repo/domain/entities/transaction';
import { checkAmountMatchesCategoryKind, patchTouchesAmountOrCategory } from '@repo/domain/invariants';
import type { TransactionId } from '@repo/domain/primitives/entityId';
import { addMoney, negateMoney, subtractMoney } from '@repo/domain/primitives/money';
import { isErr, ok } from '@repo/domain/primitives/result';
import type { TransactionCriteria } from '@repo/domain/repositories/criteria';
import type { TransactionRepository } from '@repo/domain/repositories/transactionRepository';
import type { GatewayCriteria } from '../gateway/criteria';
import type { GatewayOperation } from '../gateway/gateway';
import { parseInput, type RepositoryDeps } from './shared';

// Every field here is optional on both sides but declared without `| undefined`
// (exactOptionalPropertyTypes), so each is spread in only when actually present.
function toGatewayCriteria(criteria: TransactionCriteria): GatewayCriteria {
  return {
    filter: {
      ...(criteria.accountIds === undefined ? {} : { accountIds: criteria.accountIds }),
      ...(criteria.categoryId === undefined ? {} : { categoryId: criteria.categoryId }),
      ...(criteria.amountSign === undefined ? {} : { amountSign: criteria.amountSign }),
      ...(criteria.text === undefined ? {} : { text: criteria.text }),
      ...(criteria.dateRange === undefined ? {} : { dateRange: criteria.dateRange }),
    },
    ...(criteria.sort === undefined ? {} : { sort: criteria.sort }),
  };
}

export function createTransactionRepository({ gateway, clock, random }: RepositoryDeps): TransactionRepository {
  return {
    list: async (criteria: TransactionCriteria) => gateway.readCollection('transaction', toGatewayCriteria(criteria)),

    create: async (input: CreateTransactionInput) => {
      const parsedInput = parseInput(createTransactionInputSchema, input);
      if (isErr(parsedInput)) {
        return parsedInput;
      }
      const account = await gateway.readById('account', parsedInput.value.acc);
      if (isErr(account)) {
        return account;
      }
      const category = await gateway.readById('category', parsedInput.value.cat);
      if (isErr(category)) {
        return category;
      }
      const invariantCheck = checkAmountMatchesCategoryKind(parsedInput.value.amount, category.value);
      if (isErr(invariantCheck)) {
        return invariantCheck;
      }

      const now = clock.now();
      const record = transactionSchema.parse({
        ...parsedInput.value,
        id: random.uuid(),
        createdAt: now,
        updatedAt: now,
      });
      const updatedAccount = accountSchema.parse({
        ...account.value,
        balance: addMoney(account.value.balance, record.amount),
        updatedAt: now,
      });

      const batchResult = await gateway.batch([
        { kind: 'write', entity: 'transaction', record },
        { kind: 'write', entity: 'account', record: updatedAccount },
      ]);
      return isErr(batchResult) ? batchResult : ok(record);
    },

    update: async (id: TransactionId, patch: TransactionPatch) => {
      const parsedPatch = parseInput(transactionPatchSchema, patch);
      if (isErr(parsedPatch)) {
        return parsedPatch;
      }
      const current = await gateway.readById('transaction', id);
      if (isErr(current)) {
        return current;
      }
      const merged = { ...current.value, ...parsedPatch.value };
      // Spreading an optional-field patch over the full record still leaves `.cat`/`.amount`
      // typed as possibly-undefined (a known TS spread limitation) — resolved explicitly here,
      // ahead of the one place that distinction matters before the final schema parse below.
      const mergedCat = parsedPatch.value.cat ?? current.value.cat;
      const mergedAmount = parsedPatch.value.amount ?? current.value.amount;

      if (patchTouchesAmountOrCategory(parsedPatch.value)) {
        const category = await gateway.readById('category', mergedCat);
        if (isErr(category)) {
          return category;
        }
        const invariantCheck = checkAmountMatchesCategoryKind(mergedAmount, category.value);
        if (isErr(invariantCheck)) {
          return invariantCheck;
        }
      }

      const now = clock.now();
      const updated = transactionSchema.parse({ ...merged, updatedAt: now });
      const oldAccount = await gateway.readById('account', current.value.acc);
      if (isErr(oldAccount)) {
        return oldAccount;
      }

      let accountOperations: readonly GatewayOperation[];
      if (current.value.acc === updated.acc) {
        const delta = subtractMoney(updated.amount, current.value.amount);
        const rebalanced = accountSchema.parse({
          ...oldAccount.value,
          balance: addMoney(oldAccount.value.balance, delta),
          updatedAt: now,
        });
        accountOperations = [{ kind: 'write', entity: 'account', record: rebalanced }];
      } else {
        const newAccount = await gateway.readById('account', updated.acc);
        if (isErr(newAccount)) {
          return newAccount;
        }
        const revertedOld = accountSchema.parse({
          ...oldAccount.value,
          balance: addMoney(oldAccount.value.balance, negateMoney(current.value.amount)),
          updatedAt: now,
        });
        const creditedNew = accountSchema.parse({
          ...newAccount.value,
          balance: addMoney(newAccount.value.balance, updated.amount),
          updatedAt: now,
        });
        accountOperations = [
          { kind: 'write', entity: 'account', record: revertedOld },
          { kind: 'write', entity: 'account', record: creditedNew },
        ];
      }

      const batchResult = await gateway.batch([
        ...accountOperations,
        { kind: 'write', entity: 'transaction', record: updated },
      ]);
      return isErr(batchResult) ? batchResult : ok(updated);
    },

    delete: async (id: TransactionId) => {
      const current = await gateway.readById('transaction', id);
      if (isErr(current)) {
        return current;
      }
      const account = await gateway.readById('account', current.value.acc);
      if (isErr(account)) {
        return account;
      }
      const now = clock.now();
      const revertedAccount = accountSchema.parse({
        ...account.value,
        balance: addMoney(account.value.balance, negateMoney(current.value.amount)),
        updatedAt: now,
      });

      const batchResult = await gateway.batch([
        { kind: 'delete', entity: 'transaction', id },
        { kind: 'write', entity: 'account', record: revertedAccount },
      ]);
      return isErr(batchResult) ? batchResult : ok(true as const);
    },
  };
}
