// @repo/platform-tauri — level 1.

import { describe, expect, it } from 'vitest';
import { createSystemClock } from './clock';

describe('createSystemClock', () => {
  it('returns an ISO 8601 instant', () => {
    const clock = createSystemClock({ systemTimezone: () => 'Europe/Paris' });

    expect(clock.now()).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });

  it('delegates systemTimezone to the injected provider', () => {
    const clock = createSystemClock({ systemTimezone: () => 'Europe/Paris' });

    expect(clock.systemTimezone()).toBe('Europe/Paris');
  });
});
