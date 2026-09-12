// @repo/i18n — level 1.
// The `transactions` namespace — Transactions (ledger) screen (screens.md).

const transactions = {
  list: {
    title: 'Transactions',
    scopeSubtitle_one: '{{selected}} of {{count}} account in scope',
    scopeSubtitle_other: '{{selected}} of {{count}} accounts in scope',
    addTransaction: 'New transaction',
    panelTitle: 'All transactions',
    rowCount_one: '{{count}} transaction',
    rowCount_other: '{{count}} transactions',
    searchPlaceholder: 'Search description…',
    typeAriaLabel: 'Type',
    typeAll: 'All types',
    categoryAriaLabel: 'Category',
    categoryAll: 'All categories',
    reset: 'Reset',
    emptyTitle: 'No transactions match',
    emptySubtitle: 'Try a different search, type or category filter.',
    columnAccount: 'Account',
    columnActions: 'Actions',
    actionsAriaLabel: 'Actions — {{name}}',
  },
  dialog: {
    createTitle: 'New transaction',
    editTitle: 'Edit transaction',
    createSubmit: 'Create transaction',
    typeAriaLabel: 'Type',
    amountLabel: 'Amount',
    dateLabel: 'Date',
    descLabel: 'Description',
    descPlaceholder: 'e.g. Carrefour Market',
    categoryLabel: 'Category',
    accountLabel: 'Account',
    noteLabel: 'Note (optional)',
    notePlaceholder: 'Add a note',
    errorCheckDetails: 'Check the transaction details and try again.',
    errorCouldNotCreate: 'Could not create the transaction. Try again.',
  },
  deleteDialog: {
    title: 'Delete "{{name}}"?',
    description: 'This transaction ({{amount}}) will be permanently removed and the account balance updated.',
  },
} as const;

export default transactions;
