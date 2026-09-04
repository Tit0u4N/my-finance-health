// @repo/domain — level 0.
// The closed error taxonomy every repository and gateway operation reports through a Result
// (repository-contracts.md). Discriminated on `kind`, never an untyped catch.

export type NotFoundError = { readonly kind: 'not-found'; readonly entity: string; readonly id: string };

export type ValidationError = {
  readonly kind: 'validation';
  readonly message: string;
  readonly issues?: readonly string[];
};

export type ConflictError = { readonly kind: 'conflict'; readonly message: string };
export type UnauthorizedError = { readonly kind: 'unauthorized'; readonly message: string };
export type NetworkError = { readonly kind: 'network'; readonly message: string; readonly status?: number };
export type StorageError = { readonly kind: 'storage'; readonly message: string };
export type IntegrityError = { readonly kind: 'integrity'; readonly message: string };
export type UnsupportedCapabilityError = { readonly kind: 'unsupported-capability'; readonly capability: string };

export type DomainError =
  | NotFoundError
  | ValidationError
  | ConflictError
  | UnauthorizedError
  | NetworkError
  | StorageError
  | IntegrityError
  | UnsupportedCapabilityError;

export const notFoundError = (entity: string, id: string): NotFoundError => ({ kind: 'not-found', entity, id });

export const validationError = (message: string, issues?: readonly string[]): ValidationError =>
  issues === undefined ? { kind: 'validation', message } : { kind: 'validation', message, issues };

export const conflictError = (message: string): ConflictError => ({ kind: 'conflict', message });

export const unauthorizedError = (message: string): UnauthorizedError => ({ kind: 'unauthorized', message });

export const networkError = (message: string, status?: number): NetworkError =>
  status === undefined ? { kind: 'network', message } : { kind: 'network', message, status };

export const storageError = (message: string): StorageError => ({ kind: 'storage', message });

export const integrityError = (message: string): IntegrityError => ({ kind: 'integrity', message });

export const unsupportedCapabilityError = (capability: string): UnsupportedCapabilityError => ({
  kind: 'unsupported-capability',
  capability,
});
