import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { BootstrapState } from './bootstrapState';
import { useFirstRunGate } from './useFirstRunGate';
import type { UseWorkspaceBootstrapResult } from './useWorkspaceBootstrap';

const REF = { id: 'ws-1', label: 'One', mode: 'local', path: '/ws-1' } as const;

function makeBootstrap(state: BootstrapState): UseWorkspaceBootstrapResult {
  return {
    chooseAnother: vi.fn(() => Promise.resolve()),
    create: vi.fn(() => Promise.resolve()),
    lock: vi.fn(),
    open: vi.fn(() => Promise.resolve()),
    state,
    unlock: vi.fn(() => Promise.resolve()),
  };
}

const ready = (id: string): BootstrapState => ({
  kind: 'ready',
  ref: { ...REF, id },
  repositories: {} as never,
});

describe('useFirstRunGate', () => {
  it('is not pending for a workspace that was merely unlocked', () => {
    const { result } = renderHook(() => useFirstRunGate(makeBootstrap(ready('ws-1'))));
    expect(result.current.isStarterPending).toBe(false);
  });

  it('is pending once the created workspace is ready, until dismissed', async () => {
    const bootstrap = makeBootstrap(ready('ws-1'));
    const { result, rerender } = renderHook(() => useFirstRunGate(bootstrap));
    await result.current.bootstrap.create(REF, {} as never);
    rerender();
    expect(result.current.isStarterPending).toBe(true);

    result.current.dismissStarter();
    rerender();
    expect(result.current.isStarterPending).toBe(false);
  });

  it('does not fire while the create has not reached ready (a failed create)', async () => {
    const bootstrap = makeBootstrap({ kind: 'failed', error: {} as never });
    const { result, rerender } = renderHook(() => useFirstRunGate(bootstrap));
    await result.current.bootstrap.create(REF, {} as never);
    rerender();
    expect(result.current.isStarterPending).toBe(false);
  });

  it('is cleared by locking', async () => {
    const bootstrap = makeBootstrap(ready('ws-1'));
    const { result, rerender } = renderHook(() => useFirstRunGate(bootstrap));
    await result.current.bootstrap.create(REF, {} as never);
    result.current.bootstrap.lock(REF);
    rerender();
    expect(result.current.isStarterPending).toBe(false);
    expect(bootstrap.lock).toHaveBeenCalledWith(REF);
  });
});
