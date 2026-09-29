import { describe, expect, it } from 'vitest';
import { buildSettingsGroups } from './settingsSections';

const INPUT = {
  groupLabels: { app: 'App', support: 'Support' },
  rowLabels: {
    about: { label: 'About', sub: 'Version and credits' },
    categories: { label: 'Categories', sub: 'Income and expenses' },
    data: { label: 'Data', sub: 'Import, export and workspace info' },
    preferences: { label: 'Preferences', sub: 'Theme, currency, layout' },
  },
} as const;

describe('buildSettingsGroups', () => {
  it('groups rows under "App" (Preferences, Categories, Data) and "Support" (About)', () => {
    const groups = buildSettingsGroups(INPUT);
    expect(groups).toHaveLength(2);
    expect(groups[0]?.title).toBe('App');
    expect(groups[0]?.rows.map((row) => row.id)).toEqual(['preferences', 'categories', 'data']);
    expect(groups[1]?.title).toBe('Support');
    expect(groups[1]?.rows.map((row) => row.id)).toEqual(['about']);
  });

  it('always includes the Data row — capability gating happens on the screen it opens, not the menu', () => {
    const groups = buildSettingsGroups(INPUT);
    const appRowIds = groups[0]?.rows.map((row) => row.id) ?? [];
    expect(appRowIds).toContain('data');
  });

  it('every row has a distinct id', () => {
    const groups = buildSettingsGroups(INPUT);
    const ids = groups.flatMap((group) => group.rows.map((row) => row.id));
    expect(new Set(ids).size).toBe(ids.length);
  });
});
