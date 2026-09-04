// @repo/data — level 1.
// What every repository implementation needs: the gateway, id/timestamp generation, and one
// place to translate a Zod validation failure into the domain's ValidationError shape.

import { type IsoDateTime, isoDateTimeSchema, type Timezone } from '@repo/domain/primitives/dateTime';
import type { DomainError } from '@repo/domain/primitives/errors';
import { validationError } from '@repo/domain/primitives/errors';
import type { Result } from '@repo/domain/primitives/result';
import { err, ok } from '@repo/domain/primitives/result';
import type { Clock } from '@repo/platform/services/clock';
import type { RandomService } from '@repo/platform/services/random';
import type { z } from 'zod';
import type { PersistenceGateway } from '../gateway/gateway';

export type RepositoryDeps = {
  readonly gateway: PersistenceGateway;
  readonly clock: Clock;
  readonly random: RandomService;
};

/** Account and Investment history reads bound their range against the workspace timezone (decision 3). */
export type RepositoryDepsWithTimezone = RepositoryDeps & { readonly timezone: Timezone };

/** `clock.now()` returns a plain string (@repo/platform stays domain-free); this brands it where a caller needs `rangeFor`. */
export function nowIso(clock: RepositoryDeps['clock']): IsoDateTime {
  return isoDateTimeSchema.parse(clock.now());
}

/** Every repository's mutation methods validate their input with the matching domain schema first. */
export function parseInput<T>(schema: z.ZodType<T>, input: unknown): Result<T, DomainError> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return err(
      validationError(
        'invalid input',
        parsed.error.issues.map((issue) => issue.message),
      ),
    );
  }
  return ok(parsed.data);
}
