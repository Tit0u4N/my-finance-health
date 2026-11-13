import { conflictError } from '@repo/domain/primitives/errors';
import { err, ok } from '@repo/domain/primitives/result';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HEARTBEAT_INTERVAL_MS, startOccupancyHeartbeat } from './occupancyHeartbeat';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

const lost = () => err(conflictError('occupancy lock: this session no longer holds the lock'));

describe('startOccupancyHeartbeat', () => {
  it('beats immediately and then on every interval', async () => {
    const heartbeat = vi.fn(() => Promise.resolve(ok(true as const)));
    const onLost = vi.fn();
    const stop = startOccupancyHeartbeat({ heartbeat }, onLost);
    await vi.advanceTimersByTimeAsync(0);
    expect(heartbeat).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(HEARTBEAT_INTERVAL_MS * 2);
    expect(heartbeat).toHaveBeenCalledTimes(3);
    expect(onLost).not.toHaveBeenCalled();
    stop();
  });

  it('reports a lost lock once and stops beating', async () => {
    const heartbeat = vi.fn().mockResolvedValueOnce(ok(true)).mockResolvedValue(lost());
    const onLost = vi.fn();
    startOccupancyHeartbeat({ heartbeat }, onLost);
    await vi.advanceTimersByTimeAsync(HEARTBEAT_INTERVAL_MS);
    expect(onLost).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(HEARTBEAT_INTERVAL_MS * 4);
    expect(heartbeat).toHaveBeenCalledTimes(2);
    expect(onLost).toHaveBeenCalledTimes(1);
  });

  it('treats a thrown error as transient and retries', async () => {
    const heartbeat = vi.fn().mockRejectedValueOnce(new Error('disk')).mockResolvedValue(ok(true));
    const onLost = vi.fn();
    startOccupancyHeartbeat({ heartbeat }, onLost);
    await vi.advanceTimersByTimeAsync(HEARTBEAT_INTERVAL_MS * 2);
    expect(heartbeat).toHaveBeenCalledTimes(3);
    expect(onLost).not.toHaveBeenCalled();
  });

  it('stops when asked, so a suspended app does not keep beating', async () => {
    const heartbeat = vi.fn(() => Promise.resolve(ok(true as const)));
    const stop = startOccupancyHeartbeat({ heartbeat }, vi.fn());
    await vi.advanceTimersByTimeAsync(0);
    stop();
    await vi.advanceTimersByTimeAsync(HEARTBEAT_INTERVAL_MS * 3);
    expect(heartbeat).toHaveBeenCalledTimes(1);
  });
});
