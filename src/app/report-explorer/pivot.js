/**
 * Client-side shaping for the Report Explorer grid (Community DataGrid has no
 * row grouping, aggregation or pivoting, so we build those rows ourselves).
 *
 * Row kinds produced by buildViewRows():
 *  - 'data'      a raw row (no dimensions) or one aggregated dimension combination
 *  - 'subtotal'  Σ row closing a first-dimension group (2+ dimensions only)
 *  - 'collapsed' a folded first-dimension group, showing its subtotal
 *  - 'total'     grand total, always last
 *
 * Pivoting spreads one field's values across columns: each metric gets a column
 * per pivot value (field `pv|<value>|<metric>`) plus the usual total column.
 */
import { COLUMN_LABELS, NUMERIC_TYPES } from './report-registry';
import { calcField } from './formula';

export const AGGREGATIONS = {
  sum: { label: 'Sum' },
  avg: { label: 'Average' },
  min: { label: 'Min' },
  max: { label: 'Max' },
  count: { label: 'Count' },
};

export const BLANK = '(blank)';
export const MAX_PIVOT_VALUES = 40;

export const toKey = (value) => (value === null || value === undefined || value === '' ? BLANK : String(value));

export const pivotField = (value, metricField) => `pv|${value}|${metricField}`;

export const buildColumnMeta = (attributes) =>
  attributes.map((a) => ({
    field: a.attributeName,
    header: COLUMN_LABELS[a.attributeName] || a.attributeAlias || a.attributeName,
    dataType: a.dataType || 'String',
    numeric: NUMERIC_TYPES.includes(a.dataType),
  }));

// Calculated columns behave like numeric fields everywhere a column is listed.
export const calcMeta = (calc) => ({
  field: calcField(calc.id),
  header: calc.name,
  dataType: 'Double',
  numeric: true,
  calc: true,
  sumWhere: calc.type === 'sumWhere',
  format: calc.format,
});

// Doubles are the natural measures; Integer/Long are often ids or yyyymm periods.
export const defaultMetrics = (meta) =>
  meta.filter((m) => m.dataType === 'Double').map((m) => ({ field: m.field, agg: 'sum' }));

export const distinctValues = (rows, field) => {
  const set = new Set();
  for (let i = 0; i < rows.length; i += 1) set.add(toKey(rows[i][field]));
  return [...set].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
};

export const applyColumnFilters = (rows, columnFilters) => {
  const active = Object.entries(columnFilters).filter(([, vals]) => vals?.length);
  if (!active.length) return rows;
  const sets = active.map(([field, vals]) => [field, new Set(vals)]);
  return rows.filter((row) => sets.every(([field, set]) => set.has(toKey(row[field]))));
};

const compareValues = (a, b) => {
  if (a === b) return 0;
  if (a === null || a === undefined || a === '') return 1;
  if (b === null || b === undefined || b === '') return -1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b), undefined, { numeric: true });
};

const sortBy = (rows, sortModel) => {
  if (!sortModel?.length) return rows;
  const [{ field, sort }] = sortModel;
  const dir = sort === 'desc' ? -1 : 1;
  return [...rows].sort((a, b) => dir * compareValues(a[field], b[field]));
};

// Single pass over the rows for all metrics (sum/avg/min/max/count).
const aggregate = (rows, metrics) => {
  const acc = metrics.map(() => ({ sum: 0, n: 0, records: 0, min: Infinity, max: -Infinity }));
  for (let r = 0; r < rows.length; r += 1) {
    const row = rows[r];
    const weight = row.__records ?? 1; // grouped rows stand for several records
    for (let m = 0; m < metrics.length; m += 1) {
      const raw = row[metrics[m].field];
      if (raw === null || raw === undefined || raw === '') continue;
      const v = typeof raw === 'number' ? raw : Number(raw);
      if (Number.isNaN(v)) continue;
      const a = acc[m];
      a.sum += v;
      a.n += 1;
      a.records += weight;
      if (v < a.min) a.min = v;
      if (v > a.max) a.max = v;
    }
  }
  const out = {};
  metrics.forEach((metric, m) => {
    const a = acc[m];
    switch (metric.agg) {
      case 'avg': out[metric.field] = a.n ? a.sum / a.n : null; break;
      case 'min': out[metric.field] = a.n ? a.min : null; break;
      case 'max': out[metric.field] = a.n ? a.max : null; break;
      case 'count': out[metric.field] = a.records; break;
      default: out[metric.field] = a.sum;
    }
  });
  return out;
};

// Records behind a set of rows (service-grouped rows stand for several records each).
const recordCount = (rows) => {
  let n = 0;
  for (let i = 0; i < rows.length; i += 1) n += rows[i].__records ?? 1;
  return n;
};

const groupRows = (rows, fields) => {
  const groups = new Map();
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    const key = fields.length === 1 ? toKey(row[fields[0]]) : fields.map((f) => toKey(row[f])).join('\u0001');
    let bucket = groups.get(key);
    if (!bucket) {
      bucket = [];
      groups.set(key, bucket);
    }
    bucket.push(row);
  }
  return groups;
};

/**
 * calcs: compiled calculated columns —
 *   expression: { field, evaluate, refs }
 *   sum where:  { field, kind: 'sumWhere', metric, matchField, valueSet } — the metric summed over
 *               only the records whose matchField is one of the values
 * pivot: { field, values } | null.
 */
export function buildViewRows({ rows, dimensions, metrics, sortModel, collapsed, calcs = [], pivot = null }) {
  const sumWhereCalcs = calcs.filter((c) => c.kind === 'sumWhere');
  const exprCalcs = calcs.filter((c) => c.kind !== 'sumWhere');
  // Fields an expression needs but that aren't shown as metrics are summed behind the scenes.
  const metricFields = new Set(metrics.map((m) => m.field));
  const helperMetrics = [...new Set(exprCalcs.flatMap((c) => c.refs))]
    .filter((f) => !metricFields.has(f) && !f.startsWith('calc:'))
    .map((field) => ({ field, agg: 'sum' }));
  const aggMetrics = [...metrics, ...helperMetrics];
  const pivotOn = pivot && dimensions.length > 0 ? pivot : null;

  // Expressions run after sum-where values exist, so formulas can build on them.
  const withCalcs = (row) => {
    for (let i = 0; i < exprCalcs.length; i += 1) row[exprCalcs[i].field] = exprCalcs[i].evaluate(row);
    return row;
  };

  const sumWhereOver = (members, out) => {
    for (let c = 0; c < sumWhereCalcs.length; c += 1) {
      const calc = sumWhereCalcs[c];
      let total = 0;
      for (let i = 0; i < members.length; i += 1) {
        const m = members[i];
        if (!calc.valueSet.has(toKey(m[calc.matchField]))) continue;
        const v = Number(m[calc.metric]);
        if (!Number.isNaN(v)) total += v;
      }
      out[calc.field] = total;
    }
    return out;
  };

  const summarize = (members) => {
    const out = aggregate(members, aggMetrics);
    sumWhereOver(members, out);
    if (pivotOn) {
      const byValue = groupRows(members, [pivotOn.field]);
      pivotOn.values.forEach((value) => {
        const part = byValue.get(value);
        const agg = part ? aggregate(part, metrics) : null;
        metrics.forEach((m) => { out[pivotField(value, m.field)] = agg ? agg[m.field] : null; });
      });
    }
    return out;
  };

  const total = rows.length && (aggMetrics.length || pivotOn)
    ? [withCalcs({ __id: '__total', __kind: 'total', __count: rows.length, ...summarize(rows) })]
    : [];

  if (!dimensions.length) {
    const detail = calcs.length ? rows.map((row) => withCalcs(sumWhereOver([row], { ...row }))) : rows;
    return [...sortBy(detail, sortModel), ...total];
  }

  const [first] = dimensions;
  const combos = [];
  groupRows(rows, dimensions).forEach((members) => {
    const sample = members[0];
    const row = {
      __id: dimensions.length === 1 ? `d|${toKey(sample[first])}` : `d|${dimensions.map((d) => toKey(sample[d])).join('|')}`,
      __kind: 'data',
      __group: toKey(sample[first]),
      __count: members.length,
      __records: recordCount(members),
      ...summarize(members),
    };
    dimensions.forEach((d) => { row[d] = sample[d]; });
    combos.push(withCalcs(row));
  });

  if (dimensions.length === 1) return [...sortBy(combos, sortModel), ...total];

  // 2+ dimensions: nest under the first dimension with a subtotal per group.
  const sortOnFirst = sortModel?.[0]?.field === first;
  const groupDir = sortOnFirst && sortModel[0].sort === 'desc' ? -1 : 1;
  const innerSort = sortOnFirst ? [] : sortModel;
  const rawByGroup = groupRows(rows, [first]);
  const combosByGroup = groupRows(combos, ['__group']);
  const sortedByGroup = new Map([...combosByGroup].map(([k, list]) => [k, sortBy(list, innerSort)]));
  // Groups follow the sort: by their own key when sorting on the first dimension, otherwise by
  // their top row (so "latest posting date first" also puts the latest period first).
  const sortKey = innerSort?.[0];
  const groupKeys = [...rawByGroup.keys()].sort((a, b) => {
    if (sortOnFirst || !sortKey) return groupDir * compareValues(a, b);
    const dir = sortKey.sort === 'desc' ? -1 : 1;
    const top = (k) => sortedByGroup.get(k)?.[0]?.[sortKey.field];
    return dir * compareValues(top(a), top(b)) || compareValues(a, b);
  });
  const collapsedSet = new Set(collapsed);

  const out = [];
  groupKeys.forEach((groupKey) => {
    const members = rawByGroup.get(groupKey);
    const subtotal = withCalcs({
      __group: groupKey,
      __count: members.length,
      __records: recordCount(members),
      [first]: members[0][first],
      ...summarize(members),
    });
    if (collapsedSet.has(groupKey)) {
      out.push({ ...subtotal, __id: `__collapsed|${groupKey}`, __kind: 'collapsed' });
      return;
    }
    const groupRowsSorted = sortedByGroup.get(groupKey) ?? [];
    out.push(...groupRowsSorted);
    // A subtotal of a single row would just repeat it.
    if (groupRowsSorted.length > 1) out.push({ ...subtotal, __id: `__subtotal|${groupKey}`, __kind: 'subtotal' });
  });
  return [...out, ...total];
}

/**
 * The visible column layout, shared by the grid and the CSV export so both
 * always agree. Returns { columns, groups, labelField }.
 */
export function buildColumnSpecs({ meta, dimensions, metrics, columnOrder, columnVisibilityModel, calcs, pivot }) {
  const byField = Object.fromEntries(meta.map((m) => [m.field, m]));
  const metricByField = Object.fromEntries(metrics.map((m) => [m.field, m]));
  const summary = dimensions.length > 0;
  const columns = [];
  const groups = [];

  const metricSpec = (m, field, header, group) => ({
    field,
    header,
    kind: 'metric',
    numeric: true,
    dataType: m.agg === 'count' ? 'Integer' : 'Double',
    metricField: m.field,
    group,
  });
  const metricHeader = (m) => {
    const base = byField[m.field]?.header ?? m.field;
    return summary && m.agg !== 'sum' ? `${base} (${AGGREGATIONS[m.agg].label})` : base;
  };
  // Hidden columns stay in the list (flagged) so the grid's column chooser can show them again.
  const calcSpecs = calcs
    .map((c) => ({ field: c.field, header: c.name, kind: 'calc', numeric: true, dataType: 'Double', format: c.format, calcId: c.id, hidden: columnVisibilityModel[c.field] === false }));

  if (summary) {
    dimensions.filter((d) => byField[d]).forEach((d) => {
      columns.push({ field: d, header: byField[d].header, kind: 'dimension', numeric: byField[d].numeric, dataType: byField[d].dataType });
    });
    const shownMetrics = metrics.filter((m) => byField[m.field]);
    if (pivot && shownMetrics.length) {
      pivot.values.forEach((value) => {
        const groupId = `pv:${value}`;
        const children = shownMetrics.map((m) => {
          const spec = metricSpec(m, pivotField(value, m.field), metricHeader(m), groupId);
          columns.push(spec);
          return spec.field;
        });
        groups.push({ groupId, headerName: value, children });
      });
      const children = shownMetrics.map((m) => {
        const spec = metricSpec(m, m.field, metricHeader(m), 'pv:__total');
        columns.push(spec);
        return spec.field;
      });
      groups.push({ groupId: 'pv:__total', headerName: 'Total', children });
    } else {
      shownMetrics.forEach((m) => columns.push(metricSpec(m, m.field, metricHeader(m))));
    }
    columns.push(...calcSpecs);
  } else {
    columnOrder
      .filter((f) => byField[f])
      .forEach((f) => {
        const m = byField[f];
        const hidden = columnVisibilityModel[f] === false;
        columns.push(metricByField[f]
          ? { ...metricSpec(metricByField[f], f, m.header), dataType: m.dataType, hidden }
          : { field: f, header: m.header, kind: 'field', numeric: m.numeric, dataType: m.dataType, hidden });
      });
    columns.push(...calcSpecs);
  }

  const labelField = summary
    ? (dimensions.length > 1 ? dimensions[1] : dimensions[0])
    : columns.find((c) => !c.numeric && !c.hidden)?.field;
  return { columns, groups, labelField };
}

// Drops fields that no longer exist (e.g. a saved view after a table changed).
export const sanitizeView = (view, meta) => {
  const known = new Set(meta.map((m) => m.field));
  const order = (view.columnOrder || []).filter((f) => known.has(f));
  return {
    ...view,
    dimensions: (view.dimensions || []).filter((f) => known.has(f)),
    metrics: (view.metrics || []).filter((m) => known.has(m.field) && AGGREGATIONS[m.agg]),
    columnFilters: Object.fromEntries(Object.entries(view.columnFilters || {}).filter(([f]) => known.has(f))),
    sortModel: (view.sortModel || []).filter((s) => known.has(s.field) || s.field.startsWith('calc:')),
    columnOrder: [...order, ...meta.map((m) => m.field).filter((f) => !order.includes(f))],
    pivotField: known.has(view.pivotField) ? view.pivotField : null,
    calcs: Array.isArray(view.calcs) ? view.calcs : [],
  };
};

export const formatNumber = (value, dataType, format) => {
  if (value === null || value === undefined || value === '') return '';
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);
  if (format === 'percent') return `${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
  if (dataType !== 'Double') return String(value);
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const AGGREGATE_LABELS = { subtotal: 'Subtotal', collapsed: 'Subtotal', total: 'Total' };

const FORMULA_START = /^[=+\-@\t\r]/;
const PLAIN_NUMBER = /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/;

const csvCell = (value) => {
  if (value === null || value === undefined) return '';
  let s = typeof value === 'number' ? String(Math.round(value * 1e6) / 1e6) : String(value);
  // Excel / Sheets run cells starting with = + - @ as formulas (CSV injection); prefix text with '
  // so it stays text. Plain numbers such as "-12.5" are left alone.
  if (typeof value !== 'number' && FORMULA_START.test(s) && !PLAIN_NUMBER.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/**
 * Builds the CSV as a Blob in chunks, yielding between them so large exports keep
 * the page responsive and can report progress. Same output as toCsv().
 */
export const toCsvBlob = async ({ columns: allColumns, groups = [], labelField }, rows, onProgress = () => {}) => {
  const CHUNK = 5000;
  const columns = allColumns.filter((c) => !c.hidden);
  const groupName = Object.fromEntries(groups.map((g) => [g.groupId, g.headerName]));
  const parts = ['﻿', columns.map((c) => csvCell(c.group ? `${groupName[c.group]} · ${c.header}` : c.header)).join(',')];
  for (let start = 0; start < rows.length; start += CHUNK) {
    const end = Math.min(start + CHUNK, rows.length);
    let chunk = '';
    for (let i = start; i < end; i += 1) {
      const row = rows[i];
      chunk += `\r\n${columns.map((c) => {
        if (c.field === labelField && row.__kind && row.__kind !== 'data') return csvCell(AGGREGATE_LABELS[row.__kind]);
        return csvCell(row[c.field]);
      }).join(',')}`;
    }
    parts.push(chunk);
    onProgress(end / rows.length);
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  return new Blob(parts, { type: 'text/csv;charset=utf-8' });
};

/**
 * CSV of the given rows and column specs. Pivot columns get "<value> · <metric>"
 * headers; subtotal/total rows are labelled in the label column.
 */
export const toCsv = ({ columns: allColumns, groups = [], labelField }, rows) => {
  const columns = allColumns.filter((c) => !c.hidden);
  const groupName = Object.fromEntries(groups.map((g) => [g.groupId, g.headerName]));
  const header = columns.map((c) => csvCell(c.group ? `${groupName[c.group]} · ${c.header}` : c.header));
  const lines = [header.join(',')];
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    lines.push(columns.map((c) => {
      if (c.field === labelField && row.__kind && row.__kind !== 'data') return csvCell(AGGREGATE_LABELS[row.__kind]);
      return csvCell(row[c.field]);
    }).join(','));
  }
  // BOM so Excel opens UTF-8 (e.g. € or accented names) correctly
  return `﻿${lines.join('\r\n')}`;
};
