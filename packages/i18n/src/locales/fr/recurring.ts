// @repo/i18n — level 1.
// French `recurring` namespace — see locales/en/recurring.ts for the key contract each key must
// match.

const recurring = {
  list: {
    title: 'Récurrent',
    scopeSubtitle_one: '{{selected}} sur {{count}} compte dans le périmètre',
    scopeSubtitle_other: '{{selected}} sur {{count}} comptes dans le périmètre',
    addRule: 'Nouvelle règle',
    kpiIn: 'Entrées mensuelles',
    kpiOut: 'Sorties mensuelles',
    kpiNet: 'Net mensuel',
    kpiActive: 'Règles actives',
    panelTitle: 'Règles',
    rowCount_one: '{{count}} règle',
    rowCount_other: '{{count}} règles',
    emptyTitle: 'Aucune règle récurrente',
    emptySubtitle: "Les règles des comptes dans le périmètre s'affichent ici.",
    columnRule: 'Règle',
    columnAccount: 'Compte',
    columnFrequency: 'Fréquence',
    columnNext: 'Prochaine',
    columnMonthly: 'Mensuel',
    columnActive: 'Active',
    columnActions: 'Actions',
    activeAriaLabel: 'Active — {{name}}',
    actionsAriaLabel: 'Actions — {{name}}',
  },
  dialog: {
    createTitle: 'Nouvelle règle récurrente',
    editTitle: 'Modifier la règle récurrente',
    createSubmit: 'Créer la règle',
    typeAriaLabel: 'Type',
    amountLabel: 'Montant',
    freqLabel: 'Fréquence',
    descLabel: 'Description',
    descPlaceholder: 'ex. Loyer',
    categoryLabel: 'Catégorie',
    accountLabel: 'Compte',
    startDateLabel: 'Date de début',
    errorCheckDetails: 'Vérifiez les informations de la règle et réessayez.',
    errorCouldNotCreate: 'Impossible de créer la règle. Réessayez.',
  },
  deleteDialog: {
    title: 'Supprimer « {{name}} » ?',
    description:
      'Cette règle récurrente sera définitivement supprimée. Les transactions existantes ne sont pas affectées.',
  },
} as const;

export default recurring;
