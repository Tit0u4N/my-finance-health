import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Testing Library is wired per package: @repo/vitest-config must not pull React into a configuration package.
afterEach(() => {
  cleanup();
});

// jsdom doesn't implement ResizeObserver — LineChart (the first @repo/ui component to measure
// its own container) needs the constructor to exist even though this stub never fires a
// callback. Tests cover the fluid-width path through the pure functions in lineChartMath.ts
// instead of trying to simulate a real observed resize.
if (!('ResizeObserver' in globalThis)) {
  class ResizeObserverStub {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  }
  // @ts-expect-error — test-only polyfill, not a full ResizeObserver implementation
  globalThis.ResizeObserver = ResizeObserverStub;
}
