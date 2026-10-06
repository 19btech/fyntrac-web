/**
 * Catalogue of reports shown in the Report Explorer.
 *
 * Each report describes how to talk to the reporting service:
 *  - attributesPath(source) -> GET, returns [{ attributeName, attributeAlias, dataType }]
 *  - executePath(source)    -> POST criteria list, returns rows
 *  - sources                -> optional static list of { value, label } (e.g. rollforward level)
 *  - sourcesPath            -> optional GET returning [{ value, label }] (e.g. custom table names)
 *  - defaultHidden          -> columns hidden in the default layout
 *  - leadingColumns         -> columns shown first in the default layout, in this order
 *                              (matched ignoring case and underscores)
 *  - leadingAfter           -> keep this many of the service's first columns before leadingColumns
 *  - defaultColumns         -> the report's own columns; any other column the service adds (e.g. the
 *                              journal entries' own attributes) is available but hidden by default
 *  - defaultCalcs           -> calculated columns added to the default layout
 *  - attributes             -> fixed column definitions (no attributes request); the columns show
 *                              even when there is no data
 *  - defaultSort            -> field sorted newest-first by default (the service returns the latest
 *                              records first too, so a partial load is the most recent data)
 *  - periodDefault          -> false to skip the latest-accounting-period pre-filter
 *  - rowLimit               -> rows loaded by default (else DEFAULT_ROW_LIMIT); the rest via "Load all"
 *  - groupedByDefault       -> false to open as individual records. Otherwise the layout groups by
 *                              the visible non-amount columns and sums the amount (decimal) columns,
 *                              done by the service when it supports ?groupBy
 */

export const CATEGORIES = [
  {
    id: 'standard',
    label: 'Standard',
    description: 'Instrument activity, attribute history and balance movements.',
  },
  {
    id: 'accounting',
    label: 'Accounting',
    description: 'Generated journal entries and account-level balances.',
  },
  {
    id: 'custom',
    label: 'Custom Tables',
    description: 'Data stored in your operational and reference custom tables.',
  },
  {
    id: 'control',
    label: 'Control',
    description: 'Errors and controls raised while processing data.',
  },
];

export const REPORTS = [
  {
    id: 'transaction-activity',
    category: 'standard',
    name: 'Transaction Activity',
    description: 'Shows all transaction movements for each instrument over time.',
    attributesPath: () => '/transaction-activity/get/attributes',
    executePath: () => '/transaction-activity/execute',
    defaultHidden: ['effectiveDate', 'originalPeriodId', 'batchId', 'instrumentId', 'attributeId'],
    defaultSort: 'postingDate',
  },
  {
    // Current version of every instrument attribute (InstrumentAttribute where endDate is null),
    // one column per attribute configured in Attributes.
    // Service contract: GET /attribute-history/get/attributes, POST /attribute-history/execute
    // (criteria body; optional ?limit, ?groupBy, ?sum — same as the other reports).
    id: 'attribute-history',
    category: 'standard',
    name: 'Attribute History',
    description: 'Current value of every instrument attribute — the latest version of each.',
    attributesPath: () => '/attribute-history/get/attributes',
    executePath: () => '/attribute-history/execute',
    groupedByDefault: false, // one row per instrument attribute: grouping wouldn't reduce it
    periodDefault: false, // versions stay current across periods; a period filter would hide them
    rowLimit: 2_500, // wide rows: load a fast first slice, the rest via "Load all"
    leadingColumns: ['postingDate', 'intEffectiveDate'],
    defaultSort: 'postingDate',
    defaultHidden: ['periodId', 'batchId', 'versionId', 'source', 'TRANSACTIONDATE', 'INVOICE_NUMBER', 'REFERENCE_INVOICE_NUMBER', 'DURATION'],
  },
  {
    // Errors and warnings logged to the Errors collection by model runs and data loads.
    // Service contract: POST /error-report/execute (criteria body; optional ?limit, ?sort).
    id: 'error-report',
    category: 'control',
    name: 'Error Report',
    description: 'Errors and warnings logged by model runs and data loads, newest first.',
    executePath: () => '/error-report/execute',
    attributes: [
      { attributeName: 'loggedAt', attributeAlias: 'Logged At', dataType: 'String' },
      { attributeName: 'executionDate', attributeAlias: 'Execution Date', dataType: 'Date' },
      { attributeName: 'jobId', attributeAlias: 'Job Id', dataType: 'String' },
      { attributeName: 'code', attributeAlias: 'Code', dataType: 'String' },
      { attributeName: 'severity', attributeAlias: 'Severity', dataType: 'String' },
      { attributeName: 'message', attributeAlias: 'Message', dataType: 'String' },
    ],
    groupedByDefault: false,
    periodDefault: false,
    defaultSort: 'loggedAt',
  },
  {
    id: 'balance-rollforward',
    category: 'standard',
    name: 'Balance Rollforward',
    description: 'Summarizes opening balances, period movements, and closing balances.',
    sourceLabel: 'Level',
    sources: [
      { value: 'attribute-rollforward', label: 'Attribute Level' },
      { value: 'instrument-rollforward', label: 'Instrument Level' },
      { value: 'tenant-rollforward', label: 'Tenant Level' },
    ],
    // Tenant level is small (one row per metric a period), so it opens instantly.
    defaultSource: 'tenant-rollforward',
    defaultSort: 'postingDate',
    attributesPath: (source) => `/${source.value}/get/attributes`,
    executePath: (source) => `/${source.value}/execute`,
  },
  {
    id: 'journal-entry',
    category: 'accounting',
    name: 'Journal Entry',
    description: 'Lists all generated accounting entries for the selected period.',
    attributesPath: () => '/jeReport/get/attributes',
    executePath: () => '/jeReport/execute',
    // The entries' own attributes (their `attributes` map) come as extra columns:
    // offered as dimensions and filters, hidden by default.
    defaultColumns: ['accountingPeriodId', 'postingDate', 'instrumentId', 'attributeId', 'transactionName', 'glAccountNumber', 'glAccountName', 'glAccountType', 'glAccountSubType', 'debitAmount', 'creditAmount', 'isReclass', 'batchId'],
    defaultHidden: ['batchId', 'glAccountSubType', 'instrumentId', 'attributeId', 'isReclass'],
    defaultSort: 'postingDate',
  },
  {
    // Same journal entries as the Journal Entry report, summarised by GL account.
    // Uses the Journal Entry endpoints, so no extra service endpoint is needed.
    id: 'trial-balance',
    category: 'accounting',
    name: 'Trial Balance',
    description: 'Debit and credit totals and the resulting balance for each GL account.',
    attributesPath: () => '/jeReport/get/attributes',
    executePath: () => '/jeReport/execute',
    defaultColumns: ['accountingPeriodId', 'postingDate', 'instrumentId', 'attributeId', 'transactionName', 'glAccountNumber', 'glAccountName', 'glAccountType', 'glAccountSubType', 'debitAmount', 'creditAmount', 'isReclass', 'batchId'],
    defaultHidden: ['postingDate', 'transactionName', 'instrumentId', 'attributeId', 'batchId', 'isReclass'],
    defaultSort: 'accountingPeriodId',
    defaultCalcs: [
      { id: 'tb-balance', name: 'Balance', expression: '[debitAmount] - [creditAmount]', format: 'number', template: 'custom' },
    ],
  },
  {
    id: 'custom-operational-data',
    category: 'custom',
    name: 'Operational Activity',
    description: 'Presents data extracted from operational custom tables.',
    sourceLabel: 'Table',
    sourcesPath: '/custom-operational-data/get/table-names',
    attributesPath: (source) => `/custom-operational-data/get/attributes/${source.label}`,
    executePath: (source) => `/custom-operational-data/execute/${source.value}`,
    // The table's own first column, then posting / effective date and instrument / sub instrument.
    leadingAfter: 1,
    leadingColumns: ['postingDate', 'effectiveDate', 'instrumentId', 'attributeId'],
    defaultSort: 'postingDate',
  },
  {
    id: 'custom-ref-data',
    category: 'custom',
    name: 'Reference Meta Data',
    description: 'Shows the structure and stored values of reference-data tables.',
    sourceLabel: 'Table',
    sourcesPath: '/custom-ref-data/get/table-names',
    attributesPath: (source) => `/custom-ref-data/get/attributes/${source.label}`,
    executePath: (source) => `/custom-ref-data/execute/${source.value}`,
  },
];

export const getReport = (id) => REPORTS.find((r) => r.id === id);

export const isGroupedByDefault = (report) => report.groupedByDefault !== false;

// Identifier columns (one value per instrument / line): too many distinct values to suggest
// in filters — type them instead.
// Accounting period columns (yyyymm): by field name first (periodId, accountingPeriodId, …) then by label.
const PERIOD_NAME = /^(accounting_?)?period_?id$|^accounting_?period$/i;
const PERIOD_LABEL = /accounting\s*period/i;
export const isPeriodAttribute = (name, alias) => PERIOD_NAME.test(name || '') || PERIOD_LABEL.test(alias || '');
export const findPeriodAttribute = (attributes) =>
  attributes.find((a) => PERIOD_NAME.test(a.attributeName)) ??
  attributes.find((a) => PERIOD_LABEL.test(a.attributeAlias || ''));

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
// 202608 → "Aug 2026"
export const periodLabel = (period) => {
  const s = String(period);
  const month = Number(s.slice(4, 6));
  return month >= 1 && month <= 12 ? `${MONTHS[month - 1]} ${s.slice(0, 4)}` : s;
};
// Every period of a year, so selecting a year also covers months that get data later.
export const yearPeriods = (year) => MONTHS.map((_, i) => `${year}${String(i + 1).padStart(2, '0')}`);
// Selected periods for display: a full year reads as "2026", the rest as periods, newest first.
export const summarizePeriods = (values) => {
  const set = new Set(values.map(String));
  const years = [...new Set([...set].map((v) => v.slice(0, 4)))].sort().reverse();
  return years.flatMap((y) => {
    const months = yearPeriods(y);
    return months.every((m) => set.has(m)) ? [y] : months.filter((m) => set.has(m)).reverse();
  }).concat([...set].filter((v) => !/^\d{6}$/.test(v)));
};

// Columns hidden in a report's default layout: its defaultHidden list, plus any column outside
// its defaultColumns (when given).
export const hiddenByDefault = (report, fields) => {
  const hidden = new Set(report?.defaultHidden || []);
  if (report?.defaultColumns) {
    const own = new Set(report.defaultColumns);
    fields.forEach((f) => { if (!own.has(f)) hidden.add(f); });
  }
  return hidden;
};

export const isIdentifierField = (field) => /^(instrument|attribute|batch|version|source)Id$/i.test(field);

// Column labels used on every report, whatever the service calls them.
export const COLUMN_LABELS = {
  attributeId: 'Sub Instrument Id',
};

// Custom tables name their columns freely (postingDate, posting_date, Product_Code, …). Their
// display names: the standard columns get the usual labels, others read with spaces for underscores.
const STANDARD_LABELS = {
  postingdate: 'Posting Date',
  effectivedate: 'Effective Date',
  instrumentid: 'Instrument Id',
  attributeid: 'Sub Instrument Id',
  subinstrumentid: 'Sub Instrument Id',
};
export const customColumnLabel = (name, alias) => {
  const label = alias || name || '';
  return STANDARD_LABELS[String(name).replace(/_/g, '').toLowerCase()]
    ?? label.replace(/_+/g, ' ').replace(/\s+/g, ' ').trim();
};

export const categoryLabel = (id) => CATEGORIES.find((c) => c.id === id)?.label ?? id;

// Filter conditions. Every field offers the four text conditions (several comma-separated values
// allowed: "equals A, B" = A or B; "does not equal A, B" = neither); numbers and dates also
// offer comparisons.
export const TEXT_OPERATORS = ['contains', 'does not contain', 'equals', 'does not equal'];
const COMPARISONS = ['>', '>=', '<', '<='];
export const OPERATORS = {
  String: TEXT_OPERATORS,
  Double: [...TEXT_OPERATORS, ...COMPARISONS],
  Integer: [...TEXT_OPERATORS, ...COMPARISONS],
  Long: [...TEXT_OPERATORS, ...COMPARISONS],
  Date: [...TEXT_OPERATORS, ...COMPARISONS],
};

// Readable names for conditions, including ones saved by earlier versions.
export const OPERATOR_LABELS = {
  contains: 'contains',
  'does not contain': 'does not contain',
  equals: 'equals',
  'does not equal': 'does not equal',
  'not equal': 'does not equal',
  '==': 'equals',
  '!=': 'does not equal',
  '>': 'greater than',
  '>=': 'at least',
  '<': 'less than',
  '<=': 'at most',
  'starts with': 'starts with',
  'ends with': 'ends with',
};

// "a, b ,c" → ['a', 'b', 'c'] (also used for values typed or pasted together).
export const splitValues = (values) => [...new Set(values.flatMap((v) => String(v).split(',')).map((v) => v.trim()).filter(Boolean))];

export const NUMERIC_TYPES = ['Double', 'Integer', 'Long'];
