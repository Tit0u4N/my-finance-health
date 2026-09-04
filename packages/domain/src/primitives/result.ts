// @repo/domain — level 0.
// Expected failures are values, never exceptions (repository-contracts.md). Every repository
// and gateway operation returns a Result instead of throwing for not-found, validation, or
// conflict outcomes; exceptions stay reserved for programmer error.

export type Ok<T> = { readonly ok: true; readonly value: T };
export type Err<E> = { readonly ok: false; readonly error: E };
export type Result<T, E> = Ok<T> | Err<E>;

export const ok = <T>(value: T): Ok<T> => ({ ok: true, value });
export const err = <E>(error: E): Err<E> => ({ ok: false, error });

export const isOk = <T, E>(result: Result<T, E>): result is Ok<T> => result.ok;
export const isErr = <T, E>(result: Result<T, E>): result is Err<E> => !result.ok;

/** Transforms the success value, passing an error result through unchanged. */
export const mapResult = <T, U, E>(result: Result<T, E>, transform: (value: T) => U): Result<U, E> =>
  isOk(result) ? ok(transform(result.value)) : result;

/** Chains a Result-returning step, so a failed earlier step short-circuits without calling `transform`. */
export const flatMapResult = <T, U, E>(result: Result<T, E>, transform: (value: T) => Result<U, E>): Result<U, E> =>
  isOk(result) ? transform(result.value) : result;

/** Unwraps a Result the caller has already proven successful, or throws — for tests and invariants only. */
export const unwrap = <T, E>(result: Result<T, E>): T => {
  if (isErr(result)) {
    throw new Error(`unwrap called on an error result: ${JSON.stringify(result.error)}`);
  }
  return result.value;
};
