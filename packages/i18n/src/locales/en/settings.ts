// @repo/i18n — level 1.
// The `settings` namespace — the Settings shell and its four screens: Preferences, Categories,
// Database, About (screens.md). `nav` here is the settings rail (Preferences/Categories/Database/
// About) — distinct from `common:nav`, which is the app's main sidebar.

const settings = {
  layout: {
    title: 'Settings',
    subtitle: 'Local preferences · nothing leaves this machine',
  },
  nav: {
    preferences: { label: 'Preferences', sub: 'Theme, currency, layout' },
    categories: { label: 'Categories', sub: 'Income and expenses' },
    database: { label: 'Database', sub: 'File, backups, export' },
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
    },
    notAvailableYet: 'Not available yet',
    actions: {
      switchFile: 'Switch file',
      createBackup: 'Create backup',
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
