import { describe, expect, it } from 'vitest';
import { canonicalJsonStringify } from './canonicalJson';

describe('canonicalJsonStringify', () => {
  it('sorts object keys regardless of insertion order', () => {
    expect(canonicalJsonStringify({ b: 1, a: 2 })).toBe(canonicalJsonStringify({ a: 2, b: 1 }));
    expect(canonicalJsonStringify({ b: 1, a: 2 })).toBe('{"a":2,"b":1}');
  });

  it('sorts keys recursively through nested objects and arrays', () => {
    const value = { z: [{ y: 1, x: 2 }], a: { d: 4, c: 3 } };
    expect(canonicalJsonStringify(value)).toBe('{"a":{"c":3,"d":4},"z":[{"x":2,"y":1}]}');
  });

  it('produces byte-identical output across repeated calls', () => {
    const value = { ops: [{ kind: 'write', entity: 'account', record: { id: 'a1', balance: 100 } }], v: 1 };
    expect(canonicalJsonStringify(value)).toBe(canonicalJsonStringify(value));
  });

  it('rejects undefined object properties instead of dropping them', () => {
    expect(() => canonicalJsonStringify({ a: 1, b: undefined })).toThrow(/must not be undefined/);
  });

  it('rejects undefined array elements instead of coercing to null', () => {
    expect(() => canonicalJsonStringify([1, undefined, 3] as unknown[])).toThrow(/must not be undefined/);
  });

  it('rejects NaN and Infinity', () => {
    expect(() => canonicalJsonStringify({ a: Number.NaN })).toThrow(/non-finite/);
    expect(() => canonicalJsonStringify({ a: Number.POSITIVE_INFINITY })).toThrow(/non-finite/);
    expect(() => canonicalJsonStringify({ a: Number.NEGATIVE_INFINITY })).toThrow(/non-finite/);
  });

  it('serializes primitives and null', () => {
    expect(canonicalJsonStringify(null)).toBe('null');
    expect(canonicalJsonStringify(true)).toBe('true');
    expect(canonicalJsonStringify(false)).toBe('false');
    expect(canonicalJsonStringify('hi')).toBe('"hi"');
    expect(canonicalJsonStringify(42)).toBe('42');
    expect(canonicalJsonStringify([])).toBe('[]');
    expect(canonicalJsonStringify({})).toBe('{}');
  });
});
