// @repo/i18n — level 1.
// The `investments` namespace — Investments (list) and Investment detail (screens.md).

const investments = {
  action: {
    recordValue: 'Record value',
  },
  kpi: {
    portfolioValue: 'Portfolio value',
    positionValue: 'Position value',
    costBasis: 'Cost basis',
    // Kept in English in both locales — standard finance jargon, commonly left untranslated in
    // French finance UIs too; see the `fr` file for the same call.
    profitLoss: 'Unrealised P/L',
    unitProfitLoss: 'Unit P/L',
  },
  list: {
    title: 'Investments',
    addPosition: 'Add position',
    subtitle_one: '{{count}} position · {{total}} total',
    subtitle_other: '{{count}} positions · {{total}} total',
    portfolioTrendTitle: 'Portfolio trend',
    pastMonth: 'Past month',
    curveTotal: 'Total',
    curveAriaLabel: 'Curve',
    allocationTitle: 'Allocation',
    donutCenterLabel: 'Total',
    positionsTitle: 'Positions',
    emptyTitle: 'No positions yet',
    emptySubtitle: 'Add a position to start tracking your portfolio.',
    actionsAriaLabel: 'Actions — {{name}}',
    column: {
      position: 'Position',
      units: 'Units',
      avgCost: 'Avg cost',
      current: 'Current',
      value: 'Value',
      profitLoss: 'P/L',
      allocation: 'Allocation',
      actions: 'Actions',
    },
  },
  createDialog: {
    addTitle: 'Add position',
    editTitle: 'Edit position',
    submitCreate: 'Create position',
    nameLabel: 'Name',
    namePlaceholder: 'e.g. World ETF (CW8)',
    tickerLabel: 'Ticker',
    tickerPlaceholder: 'e.g. CW8',
    unitsLabel: 'Units',
    avgCostLabel: 'Avg cost',
    currentPriceLabel: 'Current price',
    colourLabel: 'Colour',
    colourAriaLabel: 'Position colour',
    errorCheckDetails: 'Check the position details and try again.',
    errorCouldNotAdd: 'Could not add the position. Try again.',
  },
  recordValueDialog: {
    title: 'Record value — {{name}}',
    dateLabel: 'Date',
    priceLabel: 'Price per unit',
    submit: 'Save value',
    errorCouldNotRecord: 'Could not record the value. Try again.',
  },
  deleteConfirm: {
    title: 'Delete "{{name}}"?',
    description: 'This position and its entire value history will be permanently removed.',
  },
  detail: {
    eyebrow: 'Investments · {{ticker}}',
    subtitleUnits_one: '{{count}} unit',
    subtitleUnits_other: '{{count}} units',
    deletePosition: 'Delete position',
    priceHistoryTitle: 'Price history',
    notesTitle: 'Notes',
    notesPlaceholder: 'Add a note about this position…',
    saveNote: 'Save note',
    snapshotsTitle: 'Snapshots',
    snapshotCount_one: '{{count}} snapshot',
    snapshotCount_other: '{{count}} snapshots',
    emptyTitle: 'No recorded values yet',
    emptySubtitle: "Record a value to start tracking this position's price history.",
    column: {
      price: 'Price',
      change: 'Change',
    },
  },
} as const;

export default investments;
