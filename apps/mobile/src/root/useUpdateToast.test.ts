import { describe, expect, it, vi } from 'vitest';

vi.mock('expo-updates', () => ({}));
vi.mock('react-native', () => ({ AppState: {} }));

import { shouldCheckForUpdate } from './useUpdateToast';

describe('shouldCheckForUpdate', () => {
  it('waits before checking again right after a check', () => {
    expect(shouldCheckForUpdate(1_000 + 60_000, 1_000)).toBe(false);
  });

  it('checks again once ten minutes have passed', () => {
    expect(shouldCheckForUpdate(1_000 + 10 * 60_000, 1_000)).toBe(true);
  });
});
