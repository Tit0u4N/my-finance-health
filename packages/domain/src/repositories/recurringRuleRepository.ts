// @repo/domain — level 0.
// Interface only. `update` covers both an ordinary edit and the Recurring screen's active
// toggle — same operation, RecurringRulePatch is already fully partial (repository-contracts.md).

import type { CreateRecurringRuleInput, RecurringRule, RecurringRulePatch } from '../entities/recurringRule';
import type { RecurringRuleId } from '../primitives/entityId';
import type { DomainError } from '../primitives/errors';
import type { Result } from '../primitives/result';
import type { RecurringRuleCriteria } from './criteria';

export type RecurringRuleRepository = {
  list(criteria: RecurringRuleCriteria): Promise<Result<readonly RecurringRule[], DomainError>>;
  create(input: CreateRecurringRuleInput): Promise<Result<RecurringRule, DomainError>>;
  update(id: RecurringRuleId, patch: RecurringRulePatch): Promise<Result<RecurringRule, DomainError>>;
  delete(id: RecurringRuleId): Promise<Result<true, DomainError>>;
};
