import { dataloaderApi, reportingApi } from '../services/api-client';
import { REPORTS, customColumnLabel, findPeriodAttribute, hiddenByDefault, isGroupedByDefault, periodLabel } from './report-registry';

export { findPeriodAttribute };

// Default period for a report (all lookups are tenant-wide):
//  - no periods closed  → the latest accounting period with data;
//  - some periods closed → the current open period, or the latest period with data when none is open.
// "Latest period with data" is the period of the newest posting date loaded (the execution state).
// Lookups are cached for a few minutes (a period closed meanwhile is picked up); failures retry.
const PERIOD_STATE_TTL_MS = 5 * 60 * 1000;
const sessionRequest = (holder, request) => {
  if (holder.promise && Date.now() - holder.at > PERIOD_STATE_TTL_MS) holder.promise = null;
  if (!holder.promise) {
    holder.at = Date.now();
    holder.promise = request().catch((err) => {
      holder.promise = null;
      throw err;
    });
  }
  return holder.promise;
};

// yyyymmdd (or yyyymm) → yyyymm; 0 / missing → null.
const toPeriodId = (value) => {
  const n = Number(value);
  if (!n) return null;
  return n > 999999 ? Math.floor(n / 100) : n;
};

const closedPeriods = {};
const hasClosedPeriods = () => sessionRequest(closedPeriods, async () => {
  const { data } = await dataloaderApi.get('/setting/get/closed/accounting-periods');
  return (Array.isArray(data) ? data : [data].flat().filter(Boolean)).length > 0;
});

const openPeriod = {};
const fetchCurrentOpenPeriod = () => sessionRequest(openPeriod, async () => {
  const { data } = await dataloaderApi.get('/accounting-period/get/current-open-period');
  // A tenant without an open period gets a placeholder (periodId 0): treat it as no period.
  return toPeriodId(data?.periodId);
});

// Posting dates with loaded data (yyyymmdd, newest first).
const postingDateList = {};
const fetchPostingDates = () => sessionRequest(postingDateList, async () => {
  const { data } = await reportingApi.get('/diagnostic/get/event-postingdates');
  return (Array.isArray(data) ? data : [])
    .map((d) => Number(d?.value))
    .filter((d) => d > 0)
    .sort((a, b) => b - a);
});

const latestDataPeriod = {};
const fetchLatestDataPeriod = () => sessionRequest(latestDataPeriod, async () => {
  const { data } = await dataloaderApi.get('/execution/state/get/latest');
  return toPeriodId(data?.executionDate);
});

const logged = (label) => (err) => {
  console.error(label, err);
  return null;
};

export const fetchDefaultPeriod = async () => {
  const closed = await hasClosedPeriods().catch((err) => {
    console.error('Could not load the closed accounting periods:', err);
    return true;
  });
  if (closed) {
    const open = await fetchCurrentOpenPeriod().catch(logged('Could not load the current accounting period:'));
    if (open !== null) return open;
  }
  return fetchLatestDataPeriod().catch(logged('Could not load the latest accounting period:'));
};

// Accounting periods (newest first) for the period picker and for "all periods": the open periods
// up to the latest period with data (the calendar runs decades ahead), the last closed period and
// every month with a posting date.
const periodList = {};
export const fetchPeriods = () => sessionRequest(periodList, async () => {
  const [open, lastClosed, latest, posted] = await Promise.all([
    dataloaderApi.get('/accounting-period/get/open-periods').then(({ data }) => (Array.isArray(data) ? data : [])),
    dataloaderApi.get('/accounting-period/get/last-closed-period').then(({ data }) => data).catch(() => null),
    fetchLatestDataPeriod().catch(() => null),
    fetchPostingDates().catch(() => []),
  ]);
  const postedIds = posted.map(toPeriodId).filter((id) => id !== null);
  const ceiling = Math.max(latest ?? 0, toPeriodId(lastClosed?.periodId) ?? 0);
  // Nothing is posted before the first posting date.
  const floor = postedIds.length ? Math.min(...postedIds) : 0;
  const ids = [...open, lastClosed]
    .map((p) => toPeriodId(p?.periodId))
    .filter((id) => id !== null && id >= floor && (!ceiling || id <= ceiling))
    .concat(postedIds);
  return [...new Set(ids.map(String))].sort().reverse();
});

// All caches here hold one tenant's data: a different tenant starts from empty caches.
let cacheTenant;
export const setReportTenant = (tenant) => {
  const key = tenant ?? '';
  if (cacheTenant === key) return;
  if (cacheTenant !== undefined) {
    delete closedPeriods.promise;
    delete openPeriod.promise;
    delete latestDataPeriod.promise;
    delete periodList.promise;
    delete postingDateList.promise;
    splitValueLists.clear();
    latestPostingDates.clear();
    metaCache.clear();
    resultCache.clear();
    pendingRuns.clear();
    warmedUp = false;
  }
  cacheTenant = key;
};

// Start the session-wide period lookups as soon as the explorer opens.
export const warmPeriods = () => fetchDefaultPeriod().catch(() => null);

// Warm the period lookups early (hovering a card) so opening the report doesn't wait on them.
export const prefetchDefaultPeriod = () => fetchDefaultPeriod().catch(() => null);

// Latest posting date of a source: the service's latest-posting-date endpoint when it has one.
// Remembered per source; a service without the endpoint is asked once per session.
const latestPostingDates = new Map();
let latestPostingDateEndpoint = true;
const fetchServiceLatestPostingDate = async (report, source) => {
  if (!latestPostingDateEndpoint || !report.executePath) return null;
  const path = report.executePath(source).replace('/execute/', '/latest-posting-date/');
  if (latestPostingDates.has(path)) return latestPostingDates.get(path);
  try {
    const { data } = await reportingApi.get(path);
    const date = Number(data?.postingDate ?? data) || null;
    latestPostingDates.set(path, date);
    return date;
  } catch {
    latestPostingDateEndpoint = false;
    return null;
  }
};

const MAX_POSTING_DATE_PROBES = 12;
const postingDateCriterion = (date) => ({
  attributeName: 'postingDate', operator: 'equals', values: '', filters: [String(date)], logicalOperator: 'AND',
});

// The source's latest posting date as a criterion, or null. Without the endpoint, the tenant's
// posting dates are tried newest first; the first one with rows is the default, and its result is
// loaded exactly as the viewer will request it, so opening the report reuses it.
const latestPostingDateCriterion = async (report, source, attributes) => {
  if (!attributes.some((a) => a.attributeName === 'postingDate')) return null;
  const known = await fetchServiceLatestPostingDate(report, source);
  if (known) return postingDateCriterion(known);
  const dates = await fetchPostingDates().catch(() => []);
  const limit = report.rowLimit ?? DEFAULT_ROW_LIMIT;
  const grain = defaultGrain(report, attributes);
  for (const date of dates.slice(0, MAX_POSTING_DATE_PROBES)) {
    const criterion = postingDateCriterion(date);
    const { rows } = await loadResult(report, source, [criterion], { limit, grain });
    if (rows.length) return criterion;
  }
  return null;
};

// Report criterion restricting a report to its default accounting period (or, for
// postingDateDefault reports, its latest posting date), or null.
export const latestPeriodCriterion = async (report, source, attributes) => {
  if (report.postingDateDefault) return latestPostingDateCriterion(report, source, attributes).catch(() => null);
  const attr = findPeriodAttribute(attributes);
  if (!attr) return null;
  const periodId = await fetchDefaultPeriod();
  if (periodId === null || periodId === undefined) return null;
  return {
    attributeName: attr.attributeName,
    operator: 'equals',
    values: '',
    filters: [String(periodId)],
    logicalOperator: 'AND',
  };
};

/**
 * Criteria are sent to the reporting service in the same shape the legacy
 * report pages used: [{ attributeName, operator, values, filters, logicalOperator }].
 */
const toPayload = (criteria, report) =>
  criteria
    .filter(isComplete)
    .map((c) => ({ ...c, attributeName: report?.fieldPaths?.[c.attributeName] ?? c.attributeName, values: '' }));

// The reporting service's filters are limited: equals uses only the first value, numbers are read
// only from unsigned digits (a numeric-looking text id becomes a number, a negative stays text),
// "does not …" operators are rejected and contains/starts with take the value as a regex. So it
// gets only the conditions it applies exactly, as narrowing AND terms (enough to keep a request to
// the selected period), and every condition is applied exactly to the returned rows here.
const NUMERIC_TYPES = new Set(['Integer', 'Long', 'Double', 'Decimal', 'Decimal128', 'Float', 'Number', 'Int32', 'Int64']);
const UNSIGNED_NUMBER = /^\d+(\.\d+)?$/;
const REGEX_SAFE = /^[\w -]+$/;
const isComplete = (c) => c.attributeName && c.operator && c.filters.length > 0;

const serviceTerms = (c, numeric) => {
  const values = c.filters.map(String);
  const op = c.operator;
  if (numeric) {
    if (!values.every((v) => UNSIGNED_NUMBER.test(v))) return [];
    if (op === 'equals' || op === '==') {
      if (values.length === 1) return [{ ...c, operator: '==', filters: values }];
      const nums = values.map(Number);
      return [
        { ...c, operator: '>=', filters: [String(Math.min(...nums))] },
        { ...c, operator: '<=', filters: [String(Math.max(...nums))] },
      ];
    }
    return ['>', '>=', '<', '<='].includes(op) && values.length === 1 ? [c] : [];
  }
  if (op === 'equals' && values.length === 1 && !UNSIGNED_NUMBER.test(values[0])) return [c];
  if (['contains', 'starts with', 'ends with'].includes(op) && values.every((v) => REGEX_SAFE.test(v))) return [c];
  return [];
};

const YYYYMMDD_FIELDS = new Set(['postingDate', 'effectiveDate']);
const YYYYMMDD = /^\d{8}$/;
const isServiceNumeric = (c, types) => NUMERIC_TYPES.has(types[c.attributeName])
  || (YYYYMMDD_FIELDS.has(c.attributeName) && c.filters.every((v) => YYYYMMDD.test(String(v))));

const serviceCriteria = (criteria, types) => {
  // Conditions are combined left to right; only those AND-ed after the last OR narrow every result.
  const lastOr = criteria.reduce((at, c, i) => (i > 0 && criteria[i - 1].logicalOperator === 'OR' ? i : at), -1);
  return criteria
    .slice(lastOr + 1)
    .flatMap((c) => serviceTerms(c, isServiceNumeric(c, types)))
    .map((c) => ({ ...c, logicalOperator: 'AND' }));
};

const text = (v) => (v === null || v === undefined ? '' : String(v));
const matches = (row, c, numeric) => {
  const raw = row[c.attributeName];
  const values = c.filters.map(String);
  const lower = text(raw).toLowerCase();
  const asNumber = (v) => (text(v).trim() === '' ? NaN : Number(v));
  const equal = (v) => (numeric && !Number.isNaN(asNumber(raw)) && !Number.isNaN(asNumber(v))
    ? asNumber(raw) === asNumber(v)
    : text(raw) === v);
  const has = (test) => values.some((v) => test(v.toLowerCase()));
  switch (c.operator) {
    case 'equals': case '==': return values.some(equal);
    case 'does not equal': case 'not equal': case '!=': return !values.some(equal);
    case 'contains': return has((v) => lower.includes(v));
    case 'does not contain': return !has((v) => lower.includes(v));
    case 'starts with': return has((v) => lower.startsWith(v));
    case 'ends with': return has((v) => lower.endsWith(v));
    case '>': case '>=': case '<': case '<=': {
      if (raw === null || raw === undefined || raw === '') return false;
      const a = asNumber(raw);
      const b = asNumber(values[0]);
      const cmp = !Number.isNaN(a) && !Number.isNaN(b) ? a - b : text(raw).localeCompare(values[0]);
      return { '>': cmp > 0, '>=': cmp >= 0, '<': cmp < 0, '<=': cmp <= 0 }[c.operator];
    }
    default: return true;
  }
};

const filterRows = (rows, criteria, types) => {
  if (!criteria.length) return rows;
  return rows.filter((row) => criteria.reduce((ok, c, i) => {
    const hit = matches(row, c, NUMERIC_TYPES.has(types[c.attributeName]));
    if (i === 0) return hit;
    return criteria[i - 1].logicalOperator === 'OR' ? ok || hit : ok && hit;
  }, true));
};

// Columns stored inside a sub-document (report.fieldPaths) copied onto each row.
const withFieldPaths = (rows, report) => {
  const paths = Object.entries(report?.fieldPaths || {});
  const periodFrom = report?.periodFrom;
  if (!paths.length && !periodFrom) return rows;
  return rows.map((row) => {
    const out = { ...row };
    paths.forEach(([name, path]) => {
      out[name] = path.split('.').reduce((v, key) => (v == null ? v : v[key]), row);
    });
    if (periodFrom) out.accountingPeriodId = toPeriodId(row[periodFrom]);
    return out;
  });
};

// Period conditions of a report whose period is derived from a yyyymmdd date column, sent as a
// range on that column (202608 -> 20260801..20260831).
const PERIOD_RANGE = {
  '==': (p) => [['>=', p * 100 + 1], ['<=', p * 100 + 31]],
  '>': (p) => [['>', p * 100 + 31]],
  '>=': (p) => [['>=', p * 100 + 1]],
  '<': (p) => [['<', p * 100 + 1]],
  '<=': (p) => [['<=', p * 100 + 31]],
};
const withPeriodFrom = (terms, report) => (report?.periodFrom
  ? terms.flatMap((c) => (c.attributeName === 'accountingPeriodId' && PERIOD_RANGE[c.operator]
    ? PERIOD_RANGE[c.operator](Number(c.filters[0]))
      .map(([operator, value]) => ({ ...c, attributeName: report.periodFrom, operator, filters: [String(value)] }))
    : [c]))
  : terms);

// Report metadata (sources, columns) rarely changes, so it is fetched once per session.
// A failed request is evicted so the next attempt retries.
const metaCache = new Map();
const cachedRequest = (key, request) => {
  if (!metaCache.has(key)) {
    metaCache.set(key, request().catch((err) => {
      metaCache.delete(key);
      throw err;
    }));
  }
  return metaCache.get(key);
};

export const fetchSources = (report) => {
  if (report.sources) return Promise.resolve(report.sources);
  if (!report.sourcesPath) return Promise.resolve([]);
  return cachedRequest(`sources|${report.id}`, async () => {
    const { data } = await reportingApi.get(report.sourcesPath);
    return Array.isArray(data) ? data : [];
  });
};

// Preferred columns first (report.columns), then any other column the service lists.
// Column types as the reports use them (the service reports Mongo types, e.g. Decimal128).
const COLUMN_TYPES = {
  STRING: 'String', NUMBER: 'Double', DECIMAL: 'Double', DECIMAL128: 'Double', DOUBLE: 'Double', FLOAT: 'Double',
  INTEGER: 'Integer', INT32: 'Integer', LONG: 'Long', INT64: 'Long', DATE: 'Date', BOOLEAN: 'String',
};
const columnType = (type) => COLUMN_TYPES[String(type).toUpperCase()] || 'String';
// product_code -> "Product Code"
const humanize = (name) => name.toLowerCase().split('_').filter(Boolean).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

// Preferred columns first (report.columns), then any other column the service lists, named and
// typed the same way.
const withPreferredColumns = (report, source, list) => {
  const preferred = report.columns?.(source) ?? [];
  if (!preferred.length) return list;
  const names = new Set(preferred.map((a) => a.attributeName));
  const extra = list
    .filter((a) => !names.has(a.attributeName))
    .map((a) => ({ ...a, attributeAlias: humanize(a.attributeName), dataType: columnType(a.dataType) }));
  return [...preferred, ...extra];
};

// Custom tables: the table definition's columns, in display order and with their defined types.
const fetchDefinitionColumns = async (source) => {
  const { data } = await dataloaderApi.get(`/fyntrac/custom-table/get/${encodeURIComponent(source.value)}`);
  return [...(data?.data?.columns || [])]
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
    .map((c) => ({ attributeName: c.columnName, attributeAlias: c.columnName, dataType: columnType(c.dataType) }));
};

const fetchServiceAttributes = async (report, source) => {
  const { data } = await reportingApi.get(report.attributesPath(source));
  return Array.isArray(data) ? data : [];
};

export const fetchAttributes = (report, source) => (report.attributes
  ? Promise.resolve(report.attributes) // fixed columns: always shown, no request
  : cachedRequest(`attributes|${report.id}|${source?.value ?? ''}|${source?.label ?? ''}`, async () => {
    if (report.category === 'custom') {
      const defined = await fetchDefinitionColumns(source).catch(() => []);
      const list = defined.length ? defined : await fetchServiceAttributes(report, source);
      // Readable display names (the field names themselves are unchanged).
      return list.map((a) => ({ ...a, attributeAlias: customColumnLabel(a.attributeName, a.attributeAlias) }));
    }
    return withPreferredColumns(report, source, await fetchServiceAttributes(report, source));
  }));

export const pickInitialSource = (report, list, wanted) =>
  list.find((s) => s.value === (wanted ?? report.defaultSource)) ?? list[0] ?? {};

// Warm everything a report needs before its data (called when a card is hovered).
// Grouping for a report's default layout: visible non-amount columns, summed amounts.
export const defaultGrain = (report, attributes) => {
  if (!isGroupedByDefault(report)) return null;
  const hidden = hiddenByDefault(report, attributes.map((a) => a.attributeName));
  const visible = attributes.filter((a) => !hidden.has(a.attributeName));
  return {
    groupBy: visible.filter((a) => a.dataType !== 'Double').map((a) => a.attributeName),
    sum: visible.filter((a) => a.dataType === 'Double').map((a) => a.attributeName),
  };
};

// A row's own `attributes` map (e.g. journal entry attributes) becomes top-level columns, as on
// the legacy report pages; the row's own fields win on a name clash.
const flattenAttributes = (row) => (row.attributes && typeof row.attributes === 'object' && !Array.isArray(row.attributes)
  ? { ...row.attributes, ...row }
  : row);

export const prepareRows = (rows) => rows.map((row, i) => ({ ...flattenAttributes(row), __id: row._id ?? `r${i}`, __kind: 'data' }));

// Run (or join) an execution and cache its prepared result.
export const loadResult = (report, source, criteria, { limit, grain, onProgress }) => {
  const key = resultKey(report, source, criteria, limit, grain);
  return executeShared(key, async () => {
    const result = await executeReport(report, source, criteria, { limit, grain, onProgress });
    const prepared = { rows: prepareRows(result.rows), total: result.total, elapsedMs: result.elapsedMs };
    setCachedResult(key, prepared);
    return prepared;
  });
};

// Warm everything a report needs (called when a card is hovered). Grouped default layouts
// are small, so their first result is fetched too and opening the report is instant.
export const prefetchReport = (report, sourceValue) => {
  if (!report || report.comingSoon) return Promise.resolve();
  return fetchSources(report)
    .then(async (list) => {
      const source = pickInitialSource(report, list, sourceValue);
      if (report.sourceLabel && !source.value) return;
      const [attributes] = await Promise.all([
        fetchAttributes(report, source),
        report.periodDefault !== false ? prefetchDefaultPeriod() : null,
      ]);
      const grain = defaultGrain(report, attributes);
      if (!grain || sourceValue) return;
      const period = await latestPeriodCriterion(report, source, attributes);
      const criteria = period ? [period] : [];
      if (!getCachedResult(resultKey(report, source, criteria, DEFAULT_ROW_LIMIT, grain))) {
        await loadResult(report, source, criteria, { limit: DEFAULT_ROW_LIMIT, grain });
      }
    })
    .catch(() => {}); // the viewer surfaces errors when the report is actually opened
};

// Warm every report's default layout once per session, one at a time in the background,
// so opening any of them is instant.
let warmedUp = false;
export const warmUpReports = async () => {
  if (warmedUp) return;
  warmedUp = true;
  for (const report of REPORTS) {
    await prefetchReport(report);
  }
};

// Recent results, so reopening a report or switching back is instant. Refresh bypasses it.
const RESULT_TTL_MS = 5 * 60 * 1000;
const RESULT_LIMIT = 8;
const resultCache = new Map();

export const resultKey = (report, source, criteria, limit, grain) =>
  `${report.id}|${source?.value ?? ''}|${limit ?? 'all'}|${grain ? `${grain.groupBy}/${grain.sum}` : 'records'}|${JSON.stringify(toPayload(criteria, report))}`;

export const getCachedResult = (key) => {
  const hit = resultCache.get(key);
  if (!hit || Date.now() - hit.at > RESULT_TTL_MS) return null;
  return hit;
};

export const setCachedResult = (key, value) => {
  resultCache.delete(key);
  resultCache.set(key, { ...value, at: Date.now() });
  while (resultCache.size > RESULT_LIMIT) resultCache.delete(resultCache.keys().next().value);
};

// Rows loaded into the browser by default; the rest load on demand ("Load all").
export const DEFAULT_ROW_LIMIT = 10_000;
// Beyond this the browser itself becomes the bottleneck (memory, parsing).
export const MAX_BROWSER_ROWS = 300_000;

// Client-side equivalent of the service's ?groupBy/&sum, for services that ignore those params.
export const aggregateToGrain = (rows, groupBy, sum) => {
  const groups = new Map();
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    const key = groupBy.map((f) => String(row[f] ?? '')).join('');
    let g = groups.get(key);
    if (!g) {
      g = { _id: key, __records: 0 };
      groupBy.forEach((f) => { g[f] = row[f]; });
      sum.forEach((f) => { g[f] = 0; });
      groups.set(key, g);
    }
    g.__records += 1;
    sum.forEach((f) => {
      const v = Number(row[f]);
      if (!Number.isNaN(v)) g[f] += v;
    });
  }
  return [...groups.values()];
};

/**
 * limit: max rows to return (null = all). grain: { groupBy, sum } to get one row per group with
 * summed amounts instead of individual records. Services that support it report the full match
 * count in X-Total-Count; otherwise total = rows returned.
 */
// Index of a condition with several unsigned numbers (e.g. periods) that narrows every result, or -1.
// The service would get them as one min..max range, which can be far more data than one request
// handles, so each value is fetched separately instead.
const MAX_SPLIT_VALUES = 36;
const MAX_ALL_PERIODS = 240;
const splitIndex = (criteria, types, maxValues = MAX_SPLIT_VALUES) => {
  const lastOr = criteria.reduce((at, c, i) => (i > 0 && criteria[i - 1].logicalOperator === 'OR' ? i : at), -1);
  return criteria.findIndex((c, i) => i > lastOr
    && NUMERIC_TYPES.has(types[c.attributeName])
    && (c.operator === 'equals' || c.operator === '==')
    && c.filters.length > 1 && c.filters.length <= maxValues
    && c.filters.every((v) => UNSIGNED_NUMBER.test(String(v))));
};

// Groups from separate requests, combined: same key → amounts and record counts added.
const mergeGroups = (lists, groupBy, sum) => {
  const groups = new Map();
  lists.flat().forEach((row) => {
    const key = groupBy.map((f) => String(row[f] ?? '')).join('\u0001');
    const g = groups.get(key);
    if (!g) {
      groups.set(key, { ...row, _id: key });
      return;
    }
    g.__records = (g.__records || 0) + (row.__records || 0);
    sum.forEach((f) => {
      const v = Number(row[f]);
      if (!Number.isNaN(v)) g[f] = (Number(g[f]) || 0) + v;
    });
  });
  return [...groups.values()];
};

const splitValueLists = new Map();
const fetchSplitValues = (split, periodTerms) => {
  const payload = toPayload(serviceCriteria(periodTerms, { accountingPeriodId: 'Integer' }));
  const key = `${split.valuesPath}|${JSON.stringify(payload)}`;
  if (!splitValueLists.has(key)) {
    const promise = reportingApi.post(split.valuesPath, payload)
      .then(({ data }) => [...new Set((Array.isArray(data) ? data : []).map((r) => r?.[split.field]).filter((v) => v !== null && v !== undefined).map(String))]);
    splitValueLists.set(key, promise);
    promise.catch(() => splitValueLists.delete(key));
  }
  return splitValueLists.get(key);
};

// onProgress(text): the step being fetched when a report needs several requests.
export const executeReport = async (report, source, criteria, { limit = null, grain = null, fresh = false, onProgress } = {}) => {
  const started = performance.now();
  const params = { limit: limit || MAX_BROWSER_ROWS };
  if (fresh) params.fresh = 1;
  if (report.defaultSort) params.sort = `${report.defaultSort}:desc`;
  if (grain) {
    params.groupBy = grain.groupBy.join(',');
    params.sum = grain.sum.join(',');
  }
  const active = criteria.filter(isComplete);
  const types = Object.fromEntries((await fetchAttributes(report, source).catch(() => [])).map((a) => [a.attributeName, a.dataType]));

  // One request: rows matching `part`, filtered exactly and (unless the service did) grouped.
  const fetchOne = async (part) => {
    const payload = toPayload(withPeriodFrom(serviceCriteria(part, types), report), report);
    const response = await reportingApi.post(report.executePath(source), payload, { params });
    let rows = withFieldPaths(Array.isArray(response.data) ? response.data : [], report);
    const grouped = response.headers?.['x-grouped'] === '1';
    if (!grouped) rows = filterRows(rows, part, types);
    if (grain && !grouped) rows = aggregateToGrain(rows, grain.groupBy, grain.sum);
    return { rows, total: Number(response.headers?.['x-total-count']) };
  };

  let stage = ''; // the period being fetched, prefixed to the per-value progress
  // report.splitBy: one request per value of its field (e.g. per metric) within the period conditions.
  const split = report.splitBy && (!report.splitBy.when || report.splitBy.when(source)) ? report.splitBy : null;
  const fetchPart = async (part) => {
    const periodTerms = part.filter((c) => c.attributeName === 'accountingPeriodId');
    if (!split || !periodTerms.length || part.some((c) => c.logicalOperator === 'OR')) return fetchOne(part);
    const own = part.find((c) => c.attributeName === split.field && c.operator === 'equals');
    const values = own ? own.filters.map(String) : await fetchSplitValues(split, periodTerms).catch(() => []);
    if (values.length < 2) return fetchOne(part);
    const pieces = [];
    let loaded = 0;
    for (const [i, value] of values.entries()) {
      onProgress?.(`${stage ? `${stage} · ` : ''}${value} (${i + 1} of ${values.length})`);
      const term = { attributeName: split.field, operator: 'equals', values: '', filters: [value], logicalOperator: 'AND' };
      const piece = await fetchOne(own ? part.map((c) => (c === own ? term : c)) : [...part, term]);
      pieces.push(piece.rows);
      loaded += piece.rows.length;
      if (!grain && limit && loaded >= limit) break; // records view: enough rows for the first pages
    }
    return { rows: grain ? mergeGroups(pieces, grain.groupBy, grain.sum) : pieces.flat(), total: NaN };
  };

  // No period condition narrowing the result: "all periods" means every period with data, fetched
  // one by one (the service loads a whole request into memory, and has no unfiltered query).
  const periodAttr = report.periodDefault !== false && findPeriodAttribute(Object.keys(types).map((attributeName) => ({ attributeName })));
  if (periodAttr && splitIndex(active, types) === -1) {
    const lastOr = active.reduce((n, c, i) => (i > 0 && active[i - 1].logicalOperator === 'OR' ? i : n), -1);
    const narrowed = active.some((c, i) => i > lastOr && c.attributeName === periodAttr.attributeName);
    const periods = narrowed ? [] : await fetchPeriods().catch(() => []);
    if (periods.length) {
      active.unshift({ attributeName: periodAttr.attributeName, operator: 'equals', values: '', filters: periods, logicalOperator: 'AND' });
    }
  }

  const at = splitIndex(active, types, MAX_ALL_PERIODS);
  let rows;
  let total;
  if (at === -1) {
    ({ rows, total } = await fetchPart(active));
  } else {
    // One at a time: the service holds each response in memory.
    const parts = [];
    let loaded = 0;
    const values = active[at].filters;
    const isPeriod = findPeriodAttribute([{ attributeName: active[at].attributeName }]);
    for (const [i, value] of values.entries()) {
      stage = `${isPeriod ? periodLabel(value) : value} (${i + 1} of ${values.length})`;
      onProgress?.(stage);
      const part = await fetchPart(active.map((c, i) => (i === at ? { ...c, filters: [value] } : c)));
      parts.push(part);
      loaded += part.rows.length;
      if (!grain && limit && loaded >= limit) break; // records view: enough rows for the first page set
    }
    rows = grain ? mergeGroups(parts.map((p) => p.rows), grain.groupBy, grain.sum) : parts.flatMap((p) => p.rows);
    total = parts.every((p) => Number.isFinite(p.total) && p.total > 0) ? parts.reduce((n, p) => n + p.total, 0) : NaN;
  }
  return {
    rows,
    total: Number.isFinite(total) && total > 0 ? total : rows.length,
    elapsedMs: Math.round(performance.now() - started),
  };
};

// In-flight executions, shared so a hover prefetch and the viewer's own request don't both run.
const pendingRuns = new Map();
export const executeShared = (key, run) => {
  if (!pendingRuns.has(key)) {
    pendingRuns.set(key, run().finally(() => setTimeout(() => pendingRuns.delete(key), 0)));
  }
  return pendingRuns.get(key);
};

export const saveBlob = (blob, fileName) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
