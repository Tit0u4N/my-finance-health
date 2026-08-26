import { describe, expect, it } from 'vitest';
import { PLACEHOLDER } from './placeholder';

describe('scaffolding smoke test', () => {
  it('runs the Vitest wiring of a shared package', () => {
    expect(PLACEHOLDER).toBe(true);
  });
});
