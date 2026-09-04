// @repo/domain — level 0.
// Cross-entity rules no single Zod schema can express: they need more than one record. Returns
// a Result — these are expected validation failures, never thrown (repository-contracts.md).

import type { Account } from './entities/account';
import type { Category } from './entities/category';
import type { Transaction, TransactionPatch } from './entities/transaction';
import { type ValidationError, validationError } from './primitives/errors';
import { isNegativeMoney, isPositiveMoney } from './primitives/money';
import { err, ok, type Result } from './primitives/result';

/**
 * sign(amount) must agree with the referenced category's kind: positive ⇒ income, negative ⇒
 * expense (domain-model.md's Transaction invariant). Applies identically to a full transaction
 * and to a patch that touches either `amount` or `cat` — the caller resolves the patch against
 * the stored record first.
 */
export function checkAmountMatchesCategoryKind(
  amount: Transaction['amount'],
  category: Category,
): Result<true, ValidationError> {
  if (category.kind === 'income' && !isPositiveMoney(amount)) {
    return err(validationError('a transaction in an income category must have a positive amount'));
  }
  if (category.kind === 'expense' && !isNegativeMoney(amount)) {
    return err(validationError('a transaction in an expense category must have a negative amount'));
  }
  return ok(true);
}

/** The account a transaction references must exist. Composition (fetching it) is the repository's job. */
export function checkTransactionAccountExists(
  accountId: Transaction['acc'],
  account: Account | undefined,
): Result<true, ValidationError> {
  if (!account) {
    return err(validationError(`transaction references an unknown account "${accountId}"`));
  }
  return ok(true);
}

/** True when a patch could change whether the amount/category invariant still holds. */
export function patchTouchesAmountOrCategory(patch: TransactionPatch): boolean {
  return patch.amount !== undefined || patch.cat !== undefined;
}
