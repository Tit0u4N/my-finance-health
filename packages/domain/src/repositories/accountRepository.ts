// @repo/domain — level 0.
// Interface only. `getBalanceHistory` is bounded by `range` so the gateway never over-fetches
// (repository-contracts.md). `balance` itself is a maintained field (this pass's decision on
// domain-model.md's open question) — there is no separate "recompute balance" operation here.

import type { Account, AccountPatch, CreateAccountInput } from '../entities/account';
import type { IsoDate } from '../primitives/dateTime';
import type { AccountId } from '../primitives/entityId';
import type { DomainError } from '../primitives/errors';
import type { Money } from '../primitives/money';
import type { Result } from '../primitives/result';
import type { HistoryRange } from './criteria';

export type AccountBalancePoint = { readonly date: IsoDate; readonly balance: Money };

export type AccountRepository = {
  list(): Promise<Result<readonly Account[], DomainError>>;
  getById(id: AccountId): Promise<Result<Account, DomainError>>;
  create(input: CreateAccountInput): Promise<Result<Account, DomainError>>;
  update(id: AccountId, patch: AccountPatch): Promise<Result<Account, DomainError>>;
  getBalanceHistory(id: AccountId, range: HistoryRange): Promise<Result<readonly AccountBalancePoint[], DomainError>>;
};
