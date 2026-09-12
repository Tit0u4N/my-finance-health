// @repo/i18n — level 1.
// French `investments` namespace — see locales/en/investments.ts for the key contract each key must match.

const investments = {
  action: {
    recordValue: 'Enregistrer une valeur',
  },
  kpi: {
    portfolioValue: 'Valeur du portefeuille',
    positionValue: 'Valeur de la position',
    costBasis: "Coût d'acquisition",
    // Kept in English, matching the `en` file — standard finance jargon commonly left
    // untranslated in French finance UIs too.
    profitLoss: 'Unrealised P/L',
    unitProfitLoss: 'Unit P/L',
  },
  list: {
    title: 'Investissements',
    addPosition: 'Ajouter une position',
    subtitle_one: '{{count}} position · {{total}} au total',
    subtitle_other: '{{count}} positions · {{total}} au total',
    portfolioTrendTitle: 'Évolution du portefeuille',
    pastMonth: 'Le mois dernier',
    curveTotal: 'Total',
    curveAriaLabel: 'Courbe',
    allocationTitle: 'Répartition',
    donutCenterLabel: 'Total',
    positionsTitle: 'Positions',
    emptyTitle: 'Aucune position pour le moment',
    emptySubtitle: 'Ajoutez une position pour commencer à suivre votre portefeuille.',
    actionsAriaLabel: 'Actions — {{name}}',
    column: {
      position: 'Position',
      units: 'Unités',
      avgCost: 'Coût moyen',
      current: 'Actuel',
      value: 'Valeur',
      profitLoss: 'P/L',
      allocation: 'Répartition',
      actions: 'Actions',
    },
  },
  createDialog: {
    addTitle: 'Ajouter une position',
    editTitle: 'Modifier la position',
    submitCreate: 'Créer la position',
    nameLabel: 'Nom',
    namePlaceholder: 'ex. ETF Monde (CW8)',
    tickerLabel: 'Symbole',
    tickerPlaceholder: 'ex. CW8',
    unitsLabel: 'Unités',
    avgCostLabel: 'Coût moyen',
    currentPriceLabel: 'Prix actuel',
    colourLabel: 'Couleur',
    colourAriaLabel: 'Couleur de la position',
    errorCheckDetails: 'Vérifiez les informations de la position et réessayez.',
    errorCouldNotAdd: "Impossible d'ajouter la position. Réessayez.",
  },
  recordValueDialog: {
    title: 'Enregistrer une valeur — {{name}}',
    dateLabel: 'Date',
    priceLabel: 'Prix unitaire',
    submit: 'Enregistrer',
    errorCouldNotRecord: "Impossible d'enregistrer la valeur. Réessayez.",
  },
  deleteConfirm: {
    title: 'Supprimer « {{name}} » ?',
    description: 'Cette position et tout son historique de valeur seront définitivement supprimés.',
  },
  detail: {
    eyebrow: 'Investissements · {{ticker}}',
    subtitleUnits_one: '{{count}} unité',
    subtitleUnits_other: '{{count}} unités',
    deletePosition: 'Supprimer la position',
    priceHistoryTitle: 'Historique du prix',
    notesTitle: 'Notes',
    notesPlaceholder: 'Ajoutez une note à propos de cette position…',
    saveNote: 'Enregistrer la note',
    snapshotsTitle: 'Relevés',
    snapshotCount_one: '{{count}} relevé',
    snapshotCount_other: '{{count}} relevés',
    emptyTitle: 'Aucune valeur enregistrée pour le moment',
    emptySubtitle: "Enregistrez une valeur pour commencer à suivre l'historique de prix de cette position.",
    column: {
      price: 'Prix',
      change: 'Variation',
    },
  },
} as const;

export default investments;
