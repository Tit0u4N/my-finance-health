// This package's tsconfig deliberately carries no DOM lib (data is not a rendering package).
// This test alone needs the Fetch API's ambient types (Request/Response/URL) to build a real ky
// instance with a stubbed `fetch`, so it pulls them in per-file rather than for the whole
// package.
/// <reference lib="dom" />

import type { Account } from '@repo/domain/entities/account';
import { isErr, isOk } from '@repo/domain/primitives/result';
import ky from 'ky';
import { describe, expect, it } from 'vitest';
import { createRemoteGateway } from './remoteGateway';

const account: Account = {
  id: 'a1',
  name: 'Everyday',
  type: 'Checking',
  currency: 'EUR',
  balance: 100_000,
  color: '#3b82f6',
  icon: 'wallet',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
} as Account;

type Handler = (request: { readonly url: string; readonly method: string; readonly body: unknown }) => {
  readonly status: number;
  readonly json?: unknown;
};

function gatewayWithFetch(handler: Handler) {
  const fetchImpl = async (input: Request | URL | string, init?: RequestInit): Promise<Response> => {
    const request = input instanceof Request ? input : new Request(input, init);
    const method = request.method;
    const text = method === 'GET' || method === 'DELETE' ? '' : await request.clone().text();
    const body = text ? JSON.parse(text) : undefined;
    const { status, json } = handler({ url: request.url, method, body });
    return new Response(json === undefined ? null : JSON.stringify(json), {
      status,
      headers: json === undefined ? {} : { 'content-type': 'application/json' },
    });
  };

  const instance = ky.create({ prefix: 'https://api.test', fetch: fetchImpl });
  return createRemoteGateway({ http: { instance } });
}

describe('createRemoteGateway', () => {
  it('readCollection posts criteria to /{entity}/query and validates the response', async () => {
    const gateway = gatewayWithFetch(({ url, method }) => {
      expect(url).toBe('https://api.test/account/query');
      expect(method).toBe('POST');
      return { status: 200, json: [account] };
    });

    const result = await gateway.readCollection('account', {});
    expect(isOk(result) && result.value).toEqual([account]);
  });

  it('readCollection turns a malformed record into a validation error', async () => {
    const gateway = gatewayWithFetch(() => ({ status: 200, json: [{ id: 'a1' }] }));

    const result = await gateway.readCollection('account', {});
    expect(isErr(result) && result.error.kind).toBe('validation');
  });

  it('readById maps a 404 to a not-found error carrying the entity and id', async () => {
    const gateway = gatewayWithFetch(() => ({ status: 404 }));

    const result = await gateway.readById('account', 'missing');
    expect(isErr(result) && result.error).toEqual({ kind: 'not-found', entity: 'account', id: 'missing' });
  });

  it('write PUTs the record and returns the parsed response', async () => {
    const gateway = gatewayWithFetch(({ url, method, body }) => {
      expect(url).toBe('https://api.test/account');
      expect(method).toBe('PUT');
      expect(body).toEqual(account);
      return { status: 200, json: account };
    });

    const result = await gateway.write('account', account);
    expect(isOk(result) && result.value).toEqual(account);
  });

  it('delete succeeds on an empty 204 response', async () => {
    const gateway = gatewayWithFetch(({ method }) => {
      expect(method).toBe('DELETE');
      return { status: 204 };
    });

    const result = await gateway.delete('account', 'a1');
    expect(isOk(result)).toBe(true);
  });

  it('batch posts one request for every operation', async () => {
    const gateway = gatewayWithFetch(({ url, method, body }) => {
      expect(url).toBe('https://api.test/batch');
      expect(method).toBe('POST');
      expect((body as { operations: unknown[] }).operations).toHaveLength(2);
      return { status: 200 };
    });

    const result = await gateway.batch([
      { kind: 'write', entity: 'account', record: account },
      { kind: 'delete', entity: 'account', id: 'a2' },
    ]);
    expect(isOk(result)).toBe(true);
  });

  it('maps a 401 to an unauthorized error and a 500 to a network error carrying the status', async () => {
    const unauthorized = gatewayWithFetch(() => ({ status: 401 }));
    const unauthorizedResult = await unauthorized.write('account', account);
    expect(isErr(unauthorizedResult) && unauthorizedResult.error.kind).toBe('unauthorized');

    const serverError = gatewayWithFetch(() => ({ status: 500 }));
    const serverErrorResult = await serverError.write('account', account);
    expect(isErr(serverErrorResult) && serverErrorResult.error).toMatchObject({ kind: 'network', status: 500 });
  });
});
