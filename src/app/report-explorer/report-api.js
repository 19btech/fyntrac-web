import { dataloaderApi, reportingApi } from '../services/api-client';
import { REPORTS, customColumnLabel, findPeriodAttribute, hiddenByDefault, isGroupedByDefault } from './report-registry';

export { findPeriodAttribute };

// Default period for a report:
//  - some periods closed → the books have moved on: the current open period;
//  - none closed yet     → the latest period that actually has data in this report.
// The closed check, the open period and the latest period per report/source are cached for a
// few minutes (a period closed meanwhile is picked up). Failed requests are retried next time.
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

const closedPeriods = {};
const hasClosedPeriods = () => sessionRequest(closedPeriods, async () => {
  const { data } = await dataloaderApi.get('/setting/get/closed/accounting-periods');
  return (Array.isArray(data) ? data : [data].flat().filter(Boolean)).length > 0;
});

const openPeriod = {};
const fetchCurrentOpenPeriod = () => sessionRequest(openPeriod, async () => {
  const { data } = await dataloaderApi.get('/accounting-period/get/current-open-period');
  return data?.periodId ?? null;
});

const LATEST_PERIOD_TTL_MS = 5 * 60 * 1000;
const latestPeriods = new Map();
const fetchLatestDataPeriod = (report, source) => {
  if (!report.executePath) return Promise.resolve(null);
  const path = report.executePath(source).replace('/execute', '/latest-period');
  const hit = latestPeriods.get(path);
  if (hit && Date.now() - hit.at < LATEST_PERIOD_TTL_MS) return hit.promise;
  const promise = reportingApi.get(path).then(({ data }) => data?.periodId ?? null);
  latestPeriods.set(path, { promise, at: Date.now() });
  promise.catch(() => latestPeriods.delete(path));
  return promise;
};

export const fetchDefaultPeriod = async (report, source) => {
  try {
    if (!(await hasClosedPeriods())) {
      const latest = await fetchLatestDataPeriod(report, source);
      if (latest !== null && latest !== undefined) return latest;
    }
  } catch (err) {
    console.error('Could not resolve the latest accounting period:', err);
  }
  // Periods are closed, or the latest period with data is unavailable.
  return fetchCurrentOpenPeriod().catch((err) => {
    console.error('Could not load the current accounting period:', err);
    return null;
  });
};

// Accounting periods with data in a report (newest first), for the period picker. Read without
// the report's filters, so every period can be picked. Services without the periods endpoint
// fall back to grouping the report by its period column.
const PERIODS_TTL_MS = 5 * 60 * 1000;
const periodLists = new Map();
export const fetchPeriods = (report, source, field) => {
  if (!report.executePath) return Promise.resolve([]);
  const path = report.executePath(source).replace('/execute', '/periods');
  const hit = periodLists.get(path);
  if (hit && Date.now() - hit.at < PERIODS_TTL_MS) return hit.promise;
  const promise = reportingApi.get(path)
    .then(({ data }) => {
      if (!Array.isArray(data)) throw new Error('Unexpected periods response');
      return data;
    })
    .catch(async () => {
      const { rows } = await executeReport(report, source, [], { limit: 1000, grain: { groupBy: [field], sum: [] } });
      return rows.map((r) => r[field]);
    })
    .then((list) => [...new Set(list.map(String).filter((p) => /^\d{6}$/.test(p)))].sort().reverse());
  periodLists.set(path, { promise, at: Date.now() });
  promise.catch(() => periodLists.delete(path));
  return promise;
};

// All caches here hold one tenant's data: a different tenant starts from empty caches.
let cacheTenant;
export const setReportTenant = (tenant) => {
  const key = tenant ?? '';
  if (cacheTenant === key) return;
  if (cacheTenant !== undefined) {
    delete closedPeriods.promise;
    delete openPeriod.promise;
    latestPeriods.clear();
    periodLists.clear();
    metaCache.clear();
    resultCache.clear();
    pendingRuns.clear();
    warmedUp = false;
  }
  cacheTenant = key;
};

// Start the session-wide period lookups as soon as the explorer opens.
export const warmPeriods = () => hasClosedPeriods().then((closed) => closed && fetchCurrentOpenPeriod()).catch(() => null);

// Warm the period lookups early (hovering a card) so opening the report doesn't wait on them.
export const prefetchDefaultPeriod = (report, source) => fetchDefaultPeriod(report, source).catch(() => null);

// Report criterion restricting a report to its default accounting period, or null.
export const latestPeriodCriterion = async (report, source, attributes) => {
  const attr = findPeriodAttribute(attributes);
  if (!attr) return null;
  const periodId = await fetchDefaultPeriod(report, source);
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
const toPayload = (criteria) =>
  criteria
    .filter((c) => c.attributeName && c.operator && c.filters.length > 0)
    .map((c) => ({ ...c, values: '' }));

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

export const fetchAttributes = (report, source) => (report.attributes
  ? Promise.resolve(report.attributes) // fixed columns: always shown, no request
  : cachedRequest(`attributes|${report.id}|${source?.value ?? ''}|${source?.label ?? ''}`, async () => {
    const { data } = await reportingApi.get(report.attributesPath(source));
    const list = Array.isArray(data) ? data : [];
    // Custom tables: readable display names (the field names themselves are unchanged).
    return report.category === 'custom'
      ? list.map((a) => ({ ...a, attributeAlias: customColumnLabel(a.attributeName, a.attributeAlias) }))
      : list;
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
export const loadResult = (report, source, criteria, { limit, grain }) => {
  const key = resultKey(report, source, criteria, limit, grain);
  return executeShared(key, async () => {
    const result = await executeReport(report, source, criteria, { limit, grain });
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
        report.periodDefault !== false ? prefetchDefaultPeriod(report, source) : null,
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
  `${report.id}|${source?.value ?? ''}|${limit ?? 'all'}|${grain ? `${grain.groupBy}/${grain.sum}` : 'records'}|${JSON.stringify(toPayload(criteria))}`;

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
export const executeReport = async (report, source, criteria, { limit = null, grain = null, fresh = false } = {}) => {
  const started = performance.now();
  const params = { limit: limit || MAX_BROWSER_ROWS };
  if (fresh) params.fresh = 1;
  if (report.defaultSort) params.sort = `${report.defaultSort}:desc`;
  if (grain) {
    params.groupBy = grain.groupBy.join(',');
    params.sum = grain.sum.join(',');
  }
  const response = await reportingApi.post(report.executePath(source), toPayload(criteria), { params });
  let rows = Array.isArray(response.data) ? response.data : [];
  if (grain && response.headers?.['x-grouped'] !== '1') rows = aggregateToGrain(rows, grain.groupBy, grain.sum);
  const total = Number(response.headers?.['x-total-count']);
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
