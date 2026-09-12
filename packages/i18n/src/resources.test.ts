// @repo/i18n — level 1.
// Guards against a second language silently drifting from `en` as it grows: every namespace must
// expose the exact same flattened key set (including plural suffixes, e.g. `_one`/`_other`) in
// every language, and no value may be an empty string.

import { describe, expect, it } from 'vitest';
import { NAMESPACES, resources } from './resources';

type Tree = { readonly [key: string]: string | Tree };

function flattenKeys(tree: Tree, prefix = ''): string[] {
  return Object.entries(tree).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof value === 'string' ? [path] : flattenKeys(value as Tree, path);
  });
}

function flattenEntries(tree: Tree, prefix = ''): Array<readonly [string, string]> {
  return Object.entries(tree).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof value === 'string' ? ([[path, value]] as const) : flattenEntries(value as Tree, path);
  });
}

const languages = Object.keys(resources) as ReadonlyArray<keyof typeof resources>;

describe('resource key parity', () => {
  for (const namespace of NAMESPACES) {
    it(`"${namespace}" exposes the same keys in every language`, () => {
      const [first, ...rest] = languages;
      if (!first) {
        throw new Error('no languages configured');
      }
      const referenceKeys = flattenKeys(resources[first][namespace]).toSorted();
      for (const language of rest) {
        const keys = flattenKeys(resources[language][namespace]).toSorted();
        expect(keys, `${language}:${namespace} key set must match ${first}:${namespace}`).toEqual(referenceKeys);
      }
    });
  }
});

describe('resource values', () => {
  for (const language of languages) {
    for (const namespace of NAMESPACES) {
      it(`${language}:${namespace} has no empty string values`, () => {
        const empties = flattenEntries(resources[language][namespace])
          .filter(([, value]) => value.trim().length === 0)
          .map(([key]) => key);
        expect(empties).toEqual([]);
      });
    }
  }
});
