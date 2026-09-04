// @repo/data — level 1.
// A RecurringRule never touches an account balance (open-questions.md #8: purely informational,
// never generates a Transaction) — plain CRUD, no batching needed.

import type { CreateRecurringRuleInput, RecurringRulePatch } from '@repo/domain/entities/recurringRule';
import {
  createRecurringRuleInputSchema,
  recurringRulePatchSchema,
  recurringRuleSchema,
} from '@repo/domain/entities/recurringRule';
import type { RecurringRuleId } from '@repo/domain/primitives/entityId';
import { isErr } from '@repo/domain/primitives/result';
import type { RecurringRuleCriteria } from '@repo/domain/repositories/criteria';
import type { RecurringRuleRepository } from '@repo/domain/repositories/recurringRuleRepository';
import { parseInput, type RepositoryDeps } from './shared';

export function createRecurringRuleRepository({ gateway, clock, random }: RepositoryDeps): RecurringRuleRepository {
  return {
    list: async (criteria: RecurringRuleCriteria) =>
      gateway.readCollection('recurringRule', {
        ...(criteria.accountIds === undefined ? {} : { filter: { accountIds: criteria.accountIds } }),
      }),

    create: (input: CreateRecurringRuleInput) => {
      const parsedInput = parseInput(createRecurringRuleInputSchema, input);
      if (isErr(parsedInput)) {
        return Promise.resolve(parsedInput);
      }
      const now = clock.now();
      const record = recurringRuleSchema.parse({
        ...parsedInput.value,
        id: random.uuid(),
        createdAt: now,
        updatedAt: now,
      });
      return gateway.write('recurringRule', record);
    },

    update: async (id: RecurringRuleId, patch: RecurringRulePatch) => {
      const parsedPatch = parseInput(recurringRulePatchSchema, patch);
      if (isErr(parsedPatch)) {
        return parsedPatch;
      }
      const current = await gateway.readById('recurringRule', id);
      if (isErr(current)) {
        return current;
      }
      const updated = recurringRuleSchema.parse({ ...current.value, ...parsedPatch.value, updatedAt: clock.now() });
      return gateway.write('recurringRule', updated);
    },

    delete: async (id: RecurringRuleId) => gateway.delete('recurringRule', id),
  };
}
