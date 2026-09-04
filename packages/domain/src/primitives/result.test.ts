import { describe, expect, it } from 'vitest';
import { err, flatMapResult, isErr, isOk, mapResult, ok, unwrap } from './result';

describe('result', () => {
  it('narrows via isOk/isErr', () => {
    const success = ok(42);
    const failure = err('boom');

    expect(isOk(success)).toBe(true);
    expect(isErr(success)).toBe(false);
    expect(isOk(failure)).toBe(false);
    expect(isErr(failure)).toBe(true);
  });

  it('maps only the success branch', () => {
    expect(mapResult(ok(2), (n) => n * 2)).toEqual(ok(4));
    expect(mapResult(err('boom'), (n: number) => n * 2)).toEqual(err('boom'));
  });

  it('short-circuits flatMap on an error', () => {
    const step = (n: number) => (n > 0 ? ok(n * 2) : err('non-positive'));

    expect(flatMapResult(ok(3), step)).toEqual(ok(6));
    expect(flatMapResult(err('earlier failure'), step)).toEqual(err('earlier failure'));
  });

  it('unwraps a success and throws on a failure', () => {
    expect(unwrap(ok('value'))).toBe('value');
    expect(() => unwrap(err('boom'))).toThrow();
  });
});
