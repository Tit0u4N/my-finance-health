// @repo/domain — level 0.
// Interface only. `list` takes the full TransactionCriteria in one call — account/date/category/
// sign/text/sort — so Overview's MTD figures and the Transactions ledger's simultaneous filters
// never chain requests (repository-contracts.md).

import type { CreateTransactionInput, Transaction, TransactionPatch } from '../entities/transaction';
import type { TransactionId } from '../primitives/entityId';
import type { DomainError } from '../primitives/errors';
import type { Result } from '../primitives/result';
import type { TransactionCriteria } from './criteria';

export type TransactionRepository = {
  list(criteria: TransactionCriteria): Promise<Result<readonly Transaction[], DomainError>>;
  create(input: CreateTransactionInput): Promise<Result<Transaction, DomainError>>;
  update(id: TransactionId, patch: TransactionPatch): Promise<Result<Transaction, DomainError>>;
  delete(id: TransactionId): Promise<Result<true, DomainError>>;
};
