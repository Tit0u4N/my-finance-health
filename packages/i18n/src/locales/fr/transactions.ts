// @repo/i18n — level 1.
// French `transactions` namespace — see locales/en/transactions.ts for the key contract each key
// must match.

const transactions = {
  list: {
    title: 'Transactions',
    scopeSubtitle_one: '{{selected}} sur {{count}} compte dans le périmètre',
    scopeSubtitle_other: '{{selected}} sur {{count}} comptes dans le périmètre',
    addTransaction: 'Nouvelle transaction',
    panelTitle: 'Toutes les transactions',
    rowCount_one: '{{count}} transaction',
    rowCount_other: '{{count}} transactions',
    searchPlaceholder: 'Rechercher une description…',
    typeAriaLabel: 'Type',
    typeAll: 'Tous les types',
    categoryAriaLabel: 'Catégorie',
    categoryAll: 'Toutes les catégories',
    reset: 'Réinitialiser',
    emptyTitle: 'Aucune transaction ne correspond',
    emptySubtitle: 'Essayez une autre recherche, un autre type ou une autre catégorie.',
    columnAccount: 'Compte',
    columnActions: 'Actions',
    actionsAriaLabel: 'Actions — {{name}}',
  },
  dialog: {
    createTitle: 'Nouvelle transaction',
    editTitle: 'Modifier la transaction',
    createSubmit: 'Créer la transaction',
    typeAriaLabel: 'Type',
    amountLabel: 'Montant',
    dateLabel: 'Date',
    descLabel: 'Description',
    descPlaceholder: 'ex. Carrefour Market',
    categoryLabel: 'Catégorie',
    accountLabel: 'Compte',
    noteLabel: 'Note (facultatif)',
    notePlaceholder: 'Ajouter une note',
    errorCheckDetails: 'Vérifiez les informations de la transaction et réessayez.',
    errorCouldNotCreate: 'Impossible de créer la transaction. Réessayez.',
  },
  deleteDialog: {
    title: 'Supprimer « {{name}} » ?',
    description: 'Cette transaction ({{amount}}) sera définitivement supprimée et le solde du compte sera mis à jour.',
  },
} as const;

export default transactions;
