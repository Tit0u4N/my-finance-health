// @repo/data — level 1.
// Online-mode PersistenceGateway: the same five operations, executed against the API through
// the app-provided ky instance (start-roadmap.md §8: "the core builds requests ... and
// translates errors"). `batch` is one POST call, never sequential requests, so local and remote
// stay behaviourally equivalent (repository-contracts.md).

import { accountSchema } from '@repo/domain/entities/account';
import { categorySchema } from '@repo/domain/entities/category';
import { exchangeRateSchema } from '@repo/domain/entities/exchangeRate';
import { investmentSchema } from '@repo/domain/entities/investment';
import { investmentValueSnapshotSchema } from '@repo/domain/entities/investmentValueSnapshot';
import { recurringRuleSchema } from '@repo/domain/entities/recurringRule';
import { transactionSchema } from '@repo/domain/entities/transaction';
import { workspaceSettingsSchema } from '@repo/domain/entities/workspaceSettings';
import type { DomainError } from '@repo/domain/primitives/errors';
import {
  conflictError,
  networkError,
  notFoundError,
  unauthorizedError,
  validationError,
} from '@repo/domain/primitives/errors';
import type { Result } from '@repo/domain/primitives/result';
import { err, isErr, ok } from '@repo/domain/primitives/result';
import type { HttpClientService } from '@repo/platform/services/httpClient';
import { isHTTPError } from 'ky';
import type { z } from 'zod';
import type { GatewayCriteria } from './criteria';
import type { EntityName, EntityRecordMap } from './entityName';
import type { GatewayOperation, PersistenceGateway } from './gateway';

const ENTITY_SCHEMAS: { readonly [Name in EntityName]: z.ZodType<EntityRecordMap[Name]> } = {
  workspaceSettings: workspaceSettingsSchema,
  account: accountSchema,
  exchangeRate: exchangeRateSchema,
  category: categorySchema,
  transaction: transactionSchema,
  recurringRule: recurringRuleSchema,
  investment: investmentSchema,
  investmentValueSnapshot: investmentValueSnapshotSchema,
};

function parseRecord<Name extends EntityName>(entity: Name, data: unknown): Result<EntityRecordMap[Name], DomainError> {
  const parsed = ENTITY_SCHEMAS[entity].safeParse(data);
  if (!parsed.success) {
    return err(
      validationError(
        `invalid ${entity} payload from the API`,
        parsed.error.issues.map((issue) => issue.message),
      ),
    );
  }
  return ok(parsed.data);
}

type RequestLabel = { readonly entity: string; readonly id?: string };

function toDomainError(label: RequestLabel, error: unknown): DomainError {
  if (isHTTPError(error)) {
    const status = error.response.status;
    if (status === 404 && label.id !== undefined) {
      return notFoundError(label.entity, label.id);
    }
    if (status === 401 || status === 403) {
      return unauthorizedError(`request for ${label.entity} was rejected (${status})`);
    }
    if (status === 409) {
      return conflictError(`conflicting write for ${label.entity}`);
    }
    if (status === 400 || status === 422) {
      return validationError(`the API rejected the ${label.entity} payload (${status})`);
    }
    return networkError(`request for ${label.entity} failed`, status);
  }
  if (error instanceof Error) {
    return networkError(error.message);
  }
  return networkError(`unknown network error while contacting ${label.entity}`);
}

async function runRequest<T>(label: RequestLabel, task: () => Promise<T>): Promise<Result<T, DomainError>> {
  try {
    return ok(await task());
  } catch (error) {
    return err(toDomainError(label, error));
  }
}

export function createRemoteGateway({ http }: { readonly http: HttpClientService }): PersistenceGateway {
  const client = http.instance;

  return {
    readCollection: async (entity, criteria: GatewayCriteria) => {
      const response = await runRequest({ entity }, () => client.post(`${entity}/query`, { json: criteria }).json());
      if (isErr(response)) {
        return response;
      }
      if (!Array.isArray(response.value)) {
        return err(validationError(`expected an array payload for ${entity}`));
      }
      const records: EntityRecordMap[typeof entity][] = [];
      for (const row of response.value) {
        const parsed = parseRecord(entity, row);
        if (isErr(parsed)) {
          return parsed;
        }
        records.push(parsed.value);
      }
      return ok(records);
    },

    readById: async (entity, id) => {
      const response = await runRequest({ entity, id }, () => client.get(`${entity}/${encodeURIComponent(id)}`).json());
      if (isErr(response)) {
        return response;
      }
      return parseRecord(entity, response.value);
    },

    write: async (entity, record) => {
      const response = await runRequest({ entity }, () => client.put(entity, { json: record }).json());
      if (isErr(response)) {
        return response;
      }
      return parseRecord(entity, response.value);
    },

    delete: async (entity, id) => {
      const response = await runRequest({ entity, id }, () => client.delete(`${entity}/${encodeURIComponent(id)}`));
      if (isErr(response)) {
        return response;
      }
      return ok(true as const);
    },

    batch: async (operations: readonly GatewayOperation[]) => {
      const response = await runRequest({ entity: 'batch' }, () => client.post('batch', { json: { operations } }));
      if (isErr(response)) {
        return response;
      }
      return ok(true as const);
    },
  };
}
