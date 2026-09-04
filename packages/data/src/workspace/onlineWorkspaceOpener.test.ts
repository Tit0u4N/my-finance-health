// This package's tsconfig carries no DOM lib; this test alone needs the Fetch API's ambient
// types to build a real ky instance with a stubbed `fetch` (see remoteGateway.test.ts).
/// <reference lib="dom" />

import type { Timezone } from '@repo/domain/primitives/dateTime';
import { isErr, isOk } from '@repo/domain/primitives/result';
import { createFakePlatform } from '@repo/platform/fakePlatform';
import ky from 'ky';
import { describe, expect, it } from 'vitest';
import { WORKSPACE_SETTINGS_ID } from '../repositories/workspaceSettingsRepository';
import { createOnlineWorkspaceOpener } from './onlineWorkspaceOpener';
import type { LocalWorkspaceRef, OnlineWorkspaceRef } from './workspaceRef';

const ref: OnlineWorkspaceRef = { mode: 'online', id: 'w1', apiBaseUrl: 'https://api.test', label: 'My workspace' };

/** A minimal in-memory stand-in for the API's workspaceSettings endpoint. */
function fakeServerHttp(initialSettings?: Record<string, unknown>) {
  let stored = initialSettings;
  const fetchImpl = async (input: Request | URL | string, init?: RequestInit): Promise<Response> => {
    const request = input instanceof Request ? input : new Request(input, init);
    if (request.method === 'GET' && request.url.endsWith(`workspaceSettings/${WORKSPACE_SETTINGS_ID}`)) {
      return stored
        ? new Response(JSON.stringify(stored), { status: 200, headers: { 'content-type': 'application/json' } })
        : new Response(null, { status: 404 });
    }
    if (request.method === 'PUT' && request.url.endsWith('workspaceSettings')) {
      stored = await request.clone().json();
      return new Response(JSON.stringify(stored), { status: 200, headers: { 'content-type': 'application/json' } });
    }
    return new Response(null, { status: 404 });
  };
  const instance = ky.create({ prefix: 'https://api.test', fetch: fetchImpl });
  return { instance };
}

describe('createOnlineWorkspaceOpener', () => {
  const platform = createFakePlatform({ now: '2026-01-01T00:00:00.000Z' });

  it('creates a workspace, capturing timezone and baseCurrency, and reaches ready', async () => {
    const http = fakeServerHttp();
    const opener = createOnlineWorkspaceOpener({
      clock: platform.clock,
      random: platform.random,
      createHttpClient: () => http,
    });

    const result = await opener.create(ref, { timezone: 'Europe/Paris' as Timezone, baseCurrency: 'EUR' });
    expect(isOk(result)).toBe(true);
    expect(isOk(result) && result.value.kind).toBe('ready');
  });

  it('open resumes an existing workspace and its repository set is usable', async () => {
    const http = fakeServerHttp({
      id: WORKSPACE_SETTINGS_ID,
      timezone: 'Europe/Paris',
      baseCurrency: 'EUR',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
    const opener = createOnlineWorkspaceOpener({
      clock: platform.clock,
      random: platform.random,
      createHttpClient: () => http,
    });

    const result = await opener.open(ref);
    expect(isOk(result)).toBe(true);
    if (isOk(result) && result.value.kind === 'ready') {
      const settings = await result.value.repositories.workspaceSettings.get();
      expect(isOk(settings) && settings.value.baseCurrency).toBe('EUR');
    }
  });

  it('open reports the underlying not-found error when no workspace exists yet', async () => {
    const opener = createOnlineWorkspaceOpener({
      clock: platform.clock,
      random: platform.random,
      createHttpClient: () => fakeServerHttp(),
    });

    const result = await opener.open(ref);
    expect(isErr(result) && result.error.kind).toBe('not-found');
  });

  it('rejects a local workspace ref — this opener only serves online mode', async () => {
    const opener = createOnlineWorkspaceOpener({
      clock: platform.clock,
      random: platform.random,
      createHttpClient: () => fakeServerHttp(),
    });
    const localRef: LocalWorkspaceRef = { mode: 'local', id: 'l1', path: '/tmp/x.sqlite', label: 'Local' };

    const result = await opener.open(localRef);
    expect(isErr(result) && result.error.kind).toBe('unsupported-capability');
  });
});
