// @repo/i18n — level 1.
// The `recurring` namespace — Recurring screen (screens.md).

const recurring = {
  list: {
    title: 'Recurring',
    scopeSubtitle_one: '{{selected}} of {{count}} account in scope',
    scopeSubtitle_other: '{{selected}} of {{count}} accounts in scope',
    addRule: 'New rule',
    kpiIn: 'Monthly in',
    kpiOut: 'Monthly out',
    kpiNet: 'Monthly net',
    kpiActive: 'Active rules',
    panelTitle: 'Rules',
    rowCount_one: '{{count}} rule',
    rowCount_other: '{{count}} rules',
    activeCount_one: '{{count}} active rule',
    activeCount_other: '{{count}} active rules',
    emptyTitle: 'No recurring rules',
    emptySubtitle: 'Rules on the accounts in scope will show up here.',
    columnRule: 'Rule',
    columnAccount: 'Account',
    columnFrequency: 'Frequency',
    columnNext: 'Next',
    columnMonthly: 'Monthly',
    columnActive: 'Active',
    columnActions: 'Actions',
    activeAriaLabel: 'Active — {{name}}',
    actionsAriaLabel: 'Actions — {{name}}',
  },
  dialog: {
    createTitle: 'New recurring rule',
    editTitle: 'Edit recurring rule',
    createSubmit: 'Create rule',
    typeAriaLabel: 'Type',
    amountLabel: 'Amount',
    freqLabel: 'Frequency',
    descLabel: 'Description',
    descPlaceholder: 'e.g. Rent',
    categoryLabel: 'Category',
    accountLabel: 'Account',
    startDateLabel: 'Start date',
    errorCheckDetails: 'Check the rule details and try again.',
    errorCouldNotCreate: 'Could not create the rule. Try again.',
  },
  deleteDialog: {
    title: 'Delete "{{name}}"?',
    description: 'This recurring rule will be permanently removed. Existing transactions are not affected.',
  },
} as const;

export default recurring;
