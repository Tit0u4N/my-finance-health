// @repo/data — level 1.
// Deterministic canonical JSON for the operations journal (start-roadmap.md §9): the same
// logical value must always serialize to the exact same bytes, because the sealed payload's
// authenticity depends on the plaintext being reproducible, and a rebuild must produce a
// byte-identical record from the same input. Recursively sorts object keys — JSON.stringify's
// key order is an engine convention, not a spec guarantee — and rejects `undefined` and
// non-finite numbers outright rather than silently coercing them to `null` the way
// `JSON.stringify` does: a silently dropped or corrupted field in a journal entry is a
// correctness bug, not a cosmetic one.

export function canonicalJsonStringify(value: unknown): string {
  return serialize(value);
}

function serialize(value: unknown): string {
  if (value === null) {
    return 'null';
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new Error(`canonicalJsonStringify: non-finite number is not representable (${value})`);
    }
    return JSON.stringify(value);
  }
  if (typeof value === 'string') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => serializeArrayItem(item)).join(',')}]`;
  }
  if (typeof value === 'object') {
    return serializeObject(value as Record<string, unknown>);
  }
  throw new Error(`canonicalJsonStringify: unsupported value of type "${typeof value}"`);
}

function serializeArrayItem(item: unknown): string {
  // A JSON array turns `undefined` into `null`; canonical JSON must not hide a missing entry.
  if (item === undefined) {
    throw new Error('canonicalJsonStringify: array elements must not be undefined');
  }
  return serialize(item);
}

function serializeObject(obj: Record<string, unknown>): string {
  const keys = Object.keys(obj).sort();
  const entries = keys.map((key) => {
    const fieldValue = obj[key];
    if (fieldValue === undefined) {
      throw new Error(`canonicalJsonStringify: property "${key}" must not be undefined`);
    }
    return `${JSON.stringify(key)}:${serialize(fieldValue)}`;
  });
  return `{${entries.join(',')}}`;
}
