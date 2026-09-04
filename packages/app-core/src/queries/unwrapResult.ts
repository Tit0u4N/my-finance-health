// @repo/app-core — level 2.
// The bridge between the Result-based data layer (never throws for an expected failure) and
// TanStack Query's throw-to-fail queryFn contract: this is the one place a DomainError is
// thrown, converting it into the query's own `error` field rather than an untyped catch.

import type { DomainError } from '@repo/domain/primitives/errors';
import type { Result } from '@repo/domain/primitives/result';
import { isErr } from '@repo/domain/primitives/result';

export async function unwrapResult<T>(pending: Promise<Result<T, DomainError>>): Promise<T> {
  const result = await pending;
  if (isErr(result)) {
    throw result.error;
  }
  return result.value;
}
