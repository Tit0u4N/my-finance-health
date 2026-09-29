// Pure section/row model for SettingsScreen.tsx's root menu, reshaped from
// packages/routes/src/settings/useSettingsLayout.ts's flat nav rail into the mobile mock's
// "App"/"Support" grouping. Takes already-translated labels — like every other pure helper in this
// app, it never calls `t()` itself, so it is testable without a translations provider.
//
// Unlike desktop's nav rail, the Data row is never filtered out here by capability: it stays
// reachable (deep link, back-stack) and the *screen* it opens renders the capability-gated empty
// state instead (`useDataScreen.ts`) — a row that silently disappears the moment file access is
// false would read as a missing feature rather than a "not on this platform yet" one.

export type SettingsSectionId = 'preferences' | 'categories' | 'data' | 'about';

export type SettingsSectionRow = {
  readonly id: SettingsSectionId;
  readonly label: string;
  readonly sub: string;
};

export type SettingsGroup = {
  readonly title: string;
  readonly rows: readonly SettingsSectionRow[];
};

export type SettingsSectionsInput = {
  readonly groupLabels: { readonly app: string; readonly support: string };
  readonly rowLabels: Readonly<Record<SettingsSectionId, { readonly label: string; readonly sub: string }>>;
};

export function buildSettingsGroups({ groupLabels, rowLabels }: SettingsSectionsInput): readonly SettingsGroup[] {
  return [
    {
      rows: [
        { id: 'preferences', ...rowLabels.preferences },
        { id: 'categories', ...rowLabels.categories },
        { id: 'data', ...rowLabels.data },
      ],
      title: groupLabels.app,
    },
    { rows: [{ id: 'about', ...rowLabels.about }], title: groupLabels.support },
  ];
}
