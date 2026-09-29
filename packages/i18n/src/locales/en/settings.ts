// @repo/i18n — level 1.
// The `settings` namespace — the Settings shell and its four screens: Preferences, Categories,
// Database, About (screens.md). `nav` here is the settings rail (Preferences/Categories/Database/
// About) — distinct from `common:nav`, which is the app's main sidebar.

const settings = {
  layout: {
    title: 'Settings',
    subtitle: 'Local preferences · nothing leaves this machine',
  },
  // apps/mobile's Settings tab groups its rows under these two captions (screens-mobile.md) —
  // the desktop nav rail has no equivalent grouping, so these have no desktop counterpart.
  groups: {
    app: 'App',
    support: 'Support',
  },
  identity: {
    subtitle: 'Local · v{{version}}',
  },
  mobile: {
    footer: 'Made with care · Local-first · No telemetry',
  },
  nav: {
    preferences: { label: 'Preferences', sub: 'Theme, currency, layout' },
    categories: { label: 'Categories', sub: 'Income and expenses' },
    database: { label: 'Database', sub: 'File, backups, export' },
    // apps/mobile's counterpart of the desktop-only `database` row: mobile has no file-in-place
    // notion (start-roadmap.md §325) — this is import/export and workspace facts instead.
    data: { label: 'Data', sub: 'Import, export and workspace info' },
    about: { label: 'About', sub: 'Version and credits' },
  },
  preferences: {
    appearancePanel: {
      title: 'Appearance',
      subtitle: 'Applies instantly across the app',
    },
    regionalPanel: {
      title: 'Regional',
    },
    theme: {
      label: 'Theme',
      description: 'Light, dark or follow the system',
      options: {
        light: 'Light',
        dark: 'Dark',
        system: 'Auto',
      },
    },
    sidebar: {
      label: 'Sidebar',
      description: 'Full labels or icons only',
      options: {
        expanded: 'Expanded',
        collapsed: 'Icons only',
      },
    },
    language: {
      label: 'Language',
      description: 'Language used throughout the app',
      options: {
        system: 'System',
      },
    },
    baseCurrency: {
      label: 'Base currency',
      description: 'Display currency for cross-account totals',
    },
    exchangeRates: {
      label: 'Exchange rates',
      description: '1 unit of the currency equals this many units of {{baseCurrency}}',
      missingRateError: 'No rate set yet — totals treat this currency as 1:1.',
      emptyTitle: 'No other currencies',
      emptySubtitle: 'Add an account in another currency and its rate will show up here.',
    },
  },
  categories: {
    addButton: 'Add',
    // apps/mobile's row action buttons are icon-only (no inline "Edit"/"Delete" text label the
    // way desktop's `title=` tooltip can be, per-row on a touch target) — desktop reuses
    // common:action.edit/delete instead, since its icon buttons carry a visible tooltip.
    editAriaLabel: 'Edit {{name}}',
    deleteAriaLabel: 'Delete {{name}}',
    dialog: {
      createTitle: 'New category',
      editTitle: 'Edit category',
      createSubmit: 'Create category',
      nameLabel: 'Name',
      namePlaceholder: 'e.g. Groceries',
      colourLabel: 'Colour',
      colourAriaLabel: 'Category colour',
    },
    deleteDialog: {
      title: 'Delete "{{name}}"?',
      noTransactions: 'This category has no transactions yet.',
    },
    usageWarning_one: '{{count}} transaction uses this category.',
    usageWarning_other: '{{count}} transactions use this category.',
    countLabel_one: '{{count}} category',
    countLabel_other: '{{count}} categories',
    errorCouldNotCreate: 'Could not create the category.',
  },
  database: {
    activeFilePanel: {
      title: 'Active file',
      subtitle: 'Everything lives in this single file',
    },
    metadata: {
      size: 'Size',
      lastOpened: 'Last opened',
      rows: 'Rows',
      timezone: 'Time zone',
      baseCurrency: 'Base currency',
    },
    notAvailableYet: 'Not available yet',
    actions: {
      switchFile: 'Switch file',
      createBackup: 'Create backup',
      // apps/mobile's Data screen — the one real affordance carried over from the old
      // SettingsPlaceholder route, now a real row rather than a placeholder link.
      newWorkspace: 'Set up a new workspace',
    },
    // apps/mobile's Data screen: real read-only workspace facts shown regardless of file
    // capability, above the (desktop-only) file metadata block.
    workspacePanel: {
      title: 'Workspace',
      subtitle: 'This device only',
    },
    sessionPanel: {
      title: 'Session',
      subtitle: 'This device only',
    },
    lockWorkspace: {
      label: 'Lock workspace',
      description: 'Returns to the unlock screen. The passphrase (or biometrics, if enrolled) is needed again.',
    },
    dangerZonePanel: {
      title: 'Danger zone',
      subtitle: 'These actions cannot be undone',
    },
    resetAllData: {
      label: 'Reset all data',
      description: 'Wipes transactions, accounts and investments. The file itself stays on disk.',
    },
    resetEverything: 'Reset everything',
    emptyState: {
      title: 'Not available on this platform',
      subtitle: "Database management needs local file access, which this build doesn't have.",
    },
  },
  about: {
    panelTitle: 'About',
    panelSubtitle: 'My Finance Health for desktop',
    // apps/mobile's own About screen — the desktop wording above is genuinely wrong there, so
    // this is a sibling key rather than an edit to the shared one (same pattern as
    // common:nav.home/activity/invest alongside overview/transactions/investments).
    panelSubtitleMobile: 'My Finance Health for iOS and Android',
    version: 'Version {{version}} · Local build',
    encryptedAtRest: 'Encrypted at rest',
    facts: {
      storage: { label: 'Storage', value: 'SQLite, on this machine' },
      sync: { label: 'Sync', value: 'None — by design' },
      telemetry: { label: 'Telemetry', value: 'None' },
    },
  },
} as const;

export default settings;
