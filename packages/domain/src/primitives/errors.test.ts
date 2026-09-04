import { describe, expect, it } from 'vitest';
import { networkError, notFoundError, validationError } from './errors';

describe('errors', () => {
  it('builds a not-found error', () => {
    expect(notFoundError('Account', 'a1')).toEqual({ kind: 'not-found', entity: 'Account', id: 'a1' });
  });

  it('omits optional fields rather than setting them to undefined', () => {
    const withoutIssues = validationError('bad input');
    expect(withoutIssues).toEqual({ kind: 'validation', message: 'bad input' });
    expect('issues' in withoutIssues).toBe(false);

    const withIssues = validationError('bad input', ['amount must be an integer']);
    expect(withIssues.issues).toEqual(['amount must be an integer']);
  });

  it('builds a network error with an optional status', () => {
    expect(networkError('timed out')).toEqual({ kind: 'network', message: 'timed out' });
    expect(networkError('not found', 404)).toEqual({ kind: 'network', message: 'not found', status: 404 });
  });
});
