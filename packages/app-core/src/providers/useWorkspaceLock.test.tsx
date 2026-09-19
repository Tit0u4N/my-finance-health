import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { useWorkspaceLock } from './useWorkspaceLock';
import { WorkspaceLockProvider } from './WorkspaceLockProvider';

describe('useWorkspaceLock', () => {
  it('reports canLock: false with no provider (online mode)', () => {
    const { result } = renderHook(() => useWorkspaceLock());
    expect(result.current).toEqual({ canLock: false });
  });

  it('reports canLock: true and exposes the provided lock function', () => {
    const lock = vi.fn();
    const wrapper = ({ children }: { readonly children: ReactNode }) => (
      <WorkspaceLockProvider lock={lock}>{children}</WorkspaceLockProvider>
    );
    const { result } = renderHook(() => useWorkspaceLock(), { wrapper });

    expect(result.current.canLock).toBe(true);
    if (result.current.canLock) {
      result.current.lock();
    }
    expect(lock).toHaveBeenCalledOnce();
  });
});
