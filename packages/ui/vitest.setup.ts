import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Testing Library is wired per package: @repo/vitest-config must not pull React into a configuration package.
afterEach(() => {
  cleanup();
});
