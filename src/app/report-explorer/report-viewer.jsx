"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import {
  Alert,
  Box,
  Button,
  ButtonBase,
  Chip,
  Divider,
  IconButton,
  LinearProgress,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
} from '@mui/material';
import { useGridApiRef, GridPreferencePanelsValue } from '@mui/x-data-grid';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import StarBorderRoundedIcon from '@mui/icons-material/StarBorderRounded';
import ViewColumnOutlinedIcon from '@mui/icons-material/ViewColumnOutlined';
import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import FullscreenRoundedIcon from '@mui/icons-material/FullscreenRounded';
import FullscreenExitRoundedIcon from '@mui/icons-material/FullscreenExitRounded';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import FunctionsRoundedIcon from '@mui/icons-material/FunctionsRounded';
import ViewDayOutlinedIcon from '@mui/icons-material/ViewDayOutlined';
import ReportGrid from './report-grid';
import CalcDialog from './calc-dialog';
import AppToast from './app-toast';
import ColumnFilterPopover from './column-filter-popover';
import NumberFilterPopover from './number-filter-popover';
import TextFilterPopover from './text-filter-popover';
import { PeriodFilterPopover } from './period-select';
import SidePanel from './side-panel';
import {
  DEFAULT_ROW_LIMIT,
  MAX_BROWSER_ROWS,
  executeReport,
  fetchAttributes,
  fetchPeriods,
  fetchSources,
  getCachedResult,
  latestPeriodCriterion,
  loadResult,
  pickInitialSource,
  prepareRows,
  resultKey,
} from './report-api';
import PickerField from './picker-field';
import { OPERATOR_LABELS, hiddenByDefault, isGroupedByDefault, isIdentifierField, isPeriodAttribute, summarizePeriods } from './report-registry';
import {
  BLANK,
  MAX_PIVOT_VALUES,
  applyColumnFilters,
  buildColumnMeta,
  buildColumnSpecs,
  buildViewRows,
  calcMeta,
  defaultMetrics,
  distinctValues,
  toCsvBlob,
  toKey,
} from './pivot';
import { calcField, compileFormula } from './formula';
import { EASE_CSS, enterPop, line, radius, shadow, surface, tint } from './tokens';

const isAmount = (m) => m.dataType === 'Double';

// Report's leading columns (in their order, after its first `leadingAfter` columns), then the rest
// as the service lists them. Names match ignoring case and underscores (custom tables vary).
const fieldKey = (name) => String(name).replace(/_/g, '').toLowerCase();
const orderedMeta = (meta, report) => {
  const lead = (report?.leadingColumns || []).map((f) => meta.find((m) => fieldKey(m.field) === fieldKey(f))).filter(Boolean);
  const rest = meta.filter((m) => !lead.includes(m));
  const keep = report?.leadingAfter ?? 0;
  return [...rest.slice(0, keep), ...lead, ...rest.slice(keep)];
};

// Default grouping: every non-amount column that isn't hidden by default.
const defaultDimensions = (meta, report) => {
  const hidden = hiddenByDefault(report, meta.map((m) => m.field));
  return orderedMeta(meta, report).filter((m) => !isAmount(m) && !hidden.has(m.field)).map((m) => m.field);
};

const defaultView = (rawMeta, report) => {
  const meta = orderedMeta(rawMeta, report);
  const grouped = Boolean(report) && isGroupedByDefault(report);
  const hidden = hiddenByDefault(report, meta.map((m) => m.field));
  return {
    // Grouped layouts: the dimensions are the grouping columns and the amount columns are
    // summed metrics; the service groups and sums over every matching record.
    dimensions: grouped ? defaultDimensions(meta, report) : [],
    metrics: grouped
      ? meta.filter((m) => isAmount(m) && !hidden.has(m.field)).map((m) => ({ field: m.field, agg: 'sum' }))
      : defaultMetrics(meta),
    columnFilters: {},
    // Latest first (e.g. newest posting date on top).
    sortModel: report?.defaultSort && meta.some((m) => m.field === report.defaultSort) ? [{ field: report.defaultSort, sort: 'desc' }] : [],
    columnOrder: meta.map((m) => m.field),
    columnVisibilityModel: Object.fromEntries([...hidden].map((f) => [f, false])),
    collapsed: [],
    pivotField: null,
    calcs: report?.defaultCalcs ?? [],
    grouped,
    groupDimensions: null, // remembered while showing individual records
  };
};

const fileSlug = (name) => name.replace(/[^\w-]+/g, '-').replace(/-+/g, '-').toLowerCase();

const swap = (list, index, dir) => {
  const target = index + dir;
  if (index < 0 || target < 0 || target >= list.length) return list;
  const next = [...list];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
};

// Fields shown again (e.g. grouped-by fields once the view switches to records).
const showFields = (model, fields) => {
  const hidden = fields.filter((f) => f && model?.[f] === false);
  return hidden.length ? { ...model, ...Object.fromEntries(hidden.map((f) => [f, true])) } : model;
};

const summarizeValues = (values) =>
  values.length <= 2 ? values.join(', ') : `${values.slice(0, 2).join(', ')} +${values.length - 2}`;

const errorMessage = (err, fallback) => err?.response?.data?.message || err?.message || fallback;

function ToolbarButton({ title, onClick, children, disabled, active }) {
  const theme = useTheme();
  return (
    <Tooltip title={title}>
      <span>
        <IconButton
          size="small"
          aria-label={title}
          onClick={onClick}
          disabled={disabled}
          sx={{
            width: 32,
            height: 32,
            borderRadius: radius.sm,
            color: active ? 'primary.main' : 'text.secondary',
            bgcolor: active ? tint(theme, 0.1) : 'transparent',
            transition: `background-color 140ms ${EASE_CSS}, color 140ms ${EASE_CSS}`,
            '&:hover': { bgcolor: active ? tint(theme, 0.14) : surface.sunken, color: active ? 'primary.main' : 'text.primary' },
          }}
        >
          {children}
        </IconButton>
      </span>
    </Tooltip>
  );
}

function FilterChip({ kind, label, title, onClick, onDelete }) {
  const theme = useTheme();
  const server = kind === 'server';
  return (
    <Box sx={enterPop}>
      <Tooltip title={title}>
        <Chip
          size="small"
          icon={server ? <FilterAltOutlinedIcon /> : undefined}
          label={label}
          onClick={onClick}
          onDelete={onDelete}
          deleteIcon={<CloseRoundedIcon />}
          sx={{
            height: 26,
            borderRadius: '13px',
            fontWeight: 500,
            border: `1px solid ${server ? tint(theme, 0.3) : line}`,
            bgcolor: server ? tint(theme, 0.06) : surface.raised,
            color: 'text.primary',
            '& .MuiChip-icon': { fontSize: 15, color: 'primary.main', ml: 0.75 },
            '& .MuiChip-deleteIcon': { fontSize: 15, color: 'text.secondary', '&:hover': { color: 'text.primary' } },
            '&:hover': { bgcolor: server ? tint(theme, 0.1) : surface.sunken },
          }}
        />
      </Tooltip>
    </Box>
  );
}

export default function ReportViewer({
  report,
  activeKey,
  favorite,
  onToggleFavorite,
  onExport,
  panel,
  onPanelChange,
  reportsPanel,
}) {
  const theme = useTheme();
  const apiRef = useGridApiRef();
  const requestId = useRef(0);

  // Each open starts from the report's default layout; only data is
  // cached between opens, so coming back is still instant.
  const [sources, setSources] = useState([]);
  const [source, setSource] = useState(null);
  const [attributes, setAttributes] = useState([]);
  const [criteria, setCriteria] = useState([]);
  const [view, setView] = useState(() => defaultView([], report));
  const [rows, setRows] = useState([]);
  // Rows loaded vs. rows matching the filters (the service may return a first slice only).
  const baseRowLimit = report.rowLimit ?? DEFAULT_ROW_LIMIT;
  const [rowLimit, setRowLimit] = useState(baseRowLimit);
  const [totalRows, setTotalRows] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [density, setDensity] = useState('compact');
  const [fullscreen, setFullscreen] = useState(false);
  const [filterTarget, setFilterTarget] = useState(null); // { field, anchor } — value checklist
  const [numberFilter, setNumberFilter] = useState(null); // { field, anchor } — amount condition
  const [textFilter, setTextFilter] = useState(null); // { field, anchor } — text / id / date condition
  const [periodFilter, setPeriodFilter] = useState(null); // { field, anchor } — accounting period multi-select
  const [downloadAnchor, setDownloadAnchor] = useState(null);
  const pageModelRef = useRef({ page: 0, pageSize: 100 });
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
  const [calcDialog, setCalcDialog] = useState({ open: false, calc: null });
  const [runCount, setRunCount] = useState(0);
  // Reports start on the latest accounting period.
  const applyPeriodDefault = useRef(report.periodDefault !== false);

  const showToast = useCallback((message, severity = 'success') => setToast({ open: true, message, severity }), []);
  const meta = useMemo(() => buildColumnMeta(attributes), [attributes]);
  const metaByField = useMemo(() => Object.fromEntries(meta.map((m) => [m.field, m])), [meta]);
  const header = useCallback((field) => metaByField[field]?.header ?? field, [metaByField]);
  const sourceMissing = Boolean(report.sourceLabel) && !source?.value;

  // Grouped layouts: the service groups by the dimensions (plus pivot / filtered columns) and
  // sums the metrics. Min/max/average can't be rebuilt from group sums, so those use records.
  const grain = useMemo(() => {
    if (!view.grouped || !meta.length) return null;
    if (view.metrics.some((m) => m.agg !== 'sum' && m.agg !== 'count')) return null;
    const sumWhere = view.calcs.filter((c) => c.type === 'sumWhere');
    const calcRefs = view.calcs.filter((c) => c.type !== 'sumWhere').flatMap((c) => compileFormula(c.expression, meta).refs || []);
    const known = (f) => Boolean(metaByField[f]);
    return {
      // Sum-where match fields are grouped behind the scenes (like pivot) so each group can be split by them.
      groupBy: [...new Set([...view.dimensions, view.pivotField, ...Object.keys(view.columnFilters), ...sumWhere.map((c) => c.matchField)])].filter((f) => f && known(f)),
      sum: [...new Set([...view.metrics.map((m) => m.field), ...calcRefs, ...sumWhere.map((c) => c.metric)])].filter(known),
    };
  }, [view, meta, metaByField]);
  const grainKey = grain ? `${grain.groupBy}/${grain.sum}` : 'records';

  // Any in-flight request is stale once the viewer unmounts.
  useEffect(() => () => { requestId.current += 1; }, []);

  // 1. Sources (rollforward level / custom table), then pick the initial one.
  useEffect(() => {
    let cancelled = false;
    fetchSources(report)
      .then((list) => {
        if (cancelled) return;
        setSources(list);
        setSource(pickInitialSource(report, list));
      })
      .catch((err) => {
        console.error('Error fetching report sources:', err);
        if (cancelled) return;
        setError(errorMessage(err, `Could not load ${report.sourceLabel?.toLowerCase() ?? 'source'} list.`));
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [report]);

  // 2. Attributes for the selected source drive the columns.
  useEffect(() => {
    if (!source) return undefined;
    if (sourceMissing) {
      setLoading(false);
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    setError('');
    fetchAttributes(report, source)
      .then(async (attrs) => {
        const periodCriterion = applyPeriodDefault.current ? await latestPeriodCriterion(report, source, attrs) : null;
        if (cancelled) return;
        applyPeriodDefault.current = false;
        const nextMeta = buildColumnMeta(attrs);
        const base = defaultView(nextMeta, report);
        if (periodCriterion) setCriteria([periodCriterion]);
        setAttributes(attrs);
        setView(base);
        if (!attrs.length) setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching attributes:', err);
        if (cancelled) return;
        setError(errorMessage(err, 'Could not load report columns.'));
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [report, source, sourceMissing]);

  const run = useCallback(
    async (nextCriteria = criteria, { force = false, limit = rowLimit, grainOverride } = {}) => {
      if (!source || sourceMissing) return;
      const id = ++requestId.current;
      const useGrain = grainOverride === undefined ? grain : grainOverride;
      const key = resultKey(report, source, nextCriteria, limit, useGrain);
      const hit = !force && getCachedResult(key);
      if (hit) {
        // Recently fetched (or prefetched on hover) with the same filters: show it instantly.
        setRows(hit.rows);
        setTotalRows(hit.total);
        setElapsedMs(hit.elapsedMs);
        setRunCount((n) => n + 1);
        setError('');
        setLoading(false);
        return;
      }
      setLoading(true);
      setError('');
      try {
        const result = force
          ? await (async () => {
              const r = await executeReport(report, source, nextCriteria, { limit, grain: useGrain, fresh: true });
              return { rows: prepareRows(r.rows), total: r.total, elapsedMs: r.elapsedMs };
            })()
          : await loadResult(report, source, nextCriteria, { limit, grain: useGrain });
        if (id !== requestId.current) return; // a newer run (or unmount) superseded this one
        setRows(result.rows);
        setTotalRows(result.total);
        setElapsedMs(result.elapsedMs);
        setRunCount((n) => n + 1);
      } catch (err) {
        if (id !== requestId.current) return;
        console.error('Error executing report:', err);
        setRows([]);
        setError(errorMessage(err, 'Failed to execute report.'));
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    },
    [report, source, sourceMissing, criteria, rowLimit, grain]
  );

  // A different grouping level (e.g. a hidden column shown) needs data at that level.
  const lastGrainKey = useRef(grainKey);
  useEffect(() => {
    if (lastGrainKey.current === grainKey) return;
    lastGrainKey.current = grainKey;
    if (attributes.length) run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grainKey]);

  // 3. Run once the columns for a source are known.
  useEffect(() => {
    if (attributes.length) run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attributes]);

  // Esc leaves full screen.
  useEffect(() => {
    if (!fullscreen) return undefined;
    const overlayOpen = Boolean(filterTarget || numberFilter || textFilter || periodFilter || downloadAnchor || calcDialog.open);
    const onKey = (e) => e.key === 'Escape' && !overlayOpen && setFullscreen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fullscreen, filterTarget, numberFilter, textFilter, periodFilter, downloadAnchor, calcDialog.open]);

  const filteredRows = useMemo(() => applyColumnFilters(rows, view.columnFilters), [rows, view.columnFilters]);

  const compiledCalcs = useMemo(() => {
    // Sum-where columns can be referenced by expressions, so they join the formula fields.
    const formulaMeta = [...meta, ...view.calcs.filter((c) => c.type === 'sumWhere').map(calcMeta)];
    return view.calcs
      .map((c) => {
        const field = calcField(c.id);
        if (c.type === 'sumWhere') {
          return metaByField[c.metric] && metaByField[c.matchField] && c.values?.length
            ? { ...c, field, kind: 'sumWhere', valueSet: new Set(c.values), refs: [] }
            : { error: 'Fields no longer available' };
        }
        return { ...c, field, ...compileFormula(c.expression, formulaMeta) };
      })
      .filter((c) => !c.error);
  }, [view.calcs, meta, metaByField]);
  const allMeta = useMemo(() => [...meta, ...view.calcs.map(calcMeta)], [meta, view.calcs]);

  // Values offered by "Sum where": from the loaded rows when they carry the field, otherwise a
  // one-field grouping from the service (cheap: one row per value).
  // Accounting period columns get the period / year multi-select instead of a text condition.
  const periodFields = useMemo(
    () => new Set(attributes.filter((a) => isPeriodAttribute(a.attributeName, a.attributeAlias)).map((a) => a.attributeName)),
    [attributes]
  );
  const loadPeriods = useCallback(
    () => fetchPeriods(report, source, [...periodFields][0]),
    [report, source, periodFields]
  );
  // Load them in the background once the columns are known, so the picker opens instantly.
  useEffect(() => {
    if (periodFields.size) loadPeriods().catch(() => {});
  }, [periodFields, loadPeriods]);

  const loadFieldValues = useCallback(async (field) => {
    if (isIdentifierField(field)) return []; // tens of thousands of ids: nothing useful to suggest
    if (rows.length && rows[0][field] !== undefined) return distinctValues(rows, field);
    const result = await loadResult(report, source, criteria, { limit: 1000, grain: { groupBy: [field], sum: [] } });
    return distinctValues(result.rows, field);
  }, [rows, report, source, criteria]);

  const pivotInfo = useMemo(() => {
    if (!view.pivotField) return null;
    const all = distinctValues(filteredRows, view.pivotField);
    return { field: view.pivotField, values: all.slice(0, MAX_PIVOT_VALUES), total: all.length, shown: Math.min(all.length, MAX_PIVOT_VALUES), truncated: all.length > MAX_PIVOT_VALUES };
  }, [filteredRows, view.pivotField]);
  const activePivot = view.dimensions.length && pivotInfo ? pivotInfo : null;

  const viewRows = useMemo(
    () => buildViewRows({ rows: filteredRows, ...view, calcs: compiledCalcs, pivot: activePivot }),
    [filteredRows, view, compiledCalcs, activePivot]
  );
  const specs = useMemo(
    () => buildColumnSpecs({ ...view, meta, calcs: compiledCalcs, pivot: activePivot }),
    [view, meta, compiledCalcs, activePivot]
  );
  const dataRowCount = useMemo(() => viewRows.filter((r) => r.__kind === 'data').length, [viewRows]);
  // Page resets when the shape changes, not when a group is expanded/collapsed.
  const gridResetKey = `${view.dimensions.join(',')}|${JSON.stringify(view.columnFilters)}|${view.pivotField}|${source?.value ?? ''}|${JSON.stringify(criteria)}|${view.grouped}`;

  const patchView = useCallback((patch) => setView((prev) => ({ ...prev, ...patch })), []);

  const setColumnFilter = useCallback(
    (field, values) =>
      setView((prev) => {
        const columnFilters = { ...prev.columnFilters };
        if (values.length) columnFilters[field] = values;
        else delete columnFilters[field];
        return { ...prev, columnFilters, collapsed: [] };
      }),
    []
  );

  const gridActions = useMemo(
    () => ({
      elapsedMs,
      error,
      // Columns failed → reload them (a new source object re-runs that step); otherwise re-run the data.
      onRetry: () => (attributes.length ? run(undefined, { force: true }) : setSource((prev) => (prev ? { ...prev } : prev))),
      sourceCount: rows.length,
      shownCount: filteredRows.length,
      rowUnit: grain ? 'groups' : 'records',
      openFilter: (field, anchor) => {
        if (periodFields.has(field)) setPeriodFilter({ field, anchor });
        else if (metaByField[field]?.dataType === 'Double') setNumberFilter({ field, anchor });
        else setTextFilter({ field, anchor });
      },
      serverFilterFields: new Set(criteria.map((c) => c.attributeName)),
      reorderColumn: (from, to, after) =>
        setView((prev) => {
          const moveIn = (list, keyOf = (x) => x) => {
            const item = list.find((x) => keyOf(x) === from);
            const rest = list.filter((x) => keyOf(x) !== from);
            const at = rest.findIndex((x) => keyOf(x) === to);
            if (!item || at < 0) return list;
            rest.splice(after ? at + 1 : at, 0, item);
            return rest;
          };
          if (from.startsWith('calc:')) return { ...prev, calcs: moveIn(prev.calcs, (c) => calcField(c.id)) };
          if (prev.dimensions.includes(from)) return { ...prev, dimensions: moveIn(prev.dimensions) };
          if (prev.dimensions.length) return { ...prev, metrics: moveIn(prev.metrics, (m) => m.field) };
          return { ...prev, columnOrder: moveIn(prev.columnOrder) };
        }),
      moveColumn: (field, dir) =>
        setView((prev) => {
          if (prev.dimensions.includes(field)) {
            return { ...prev, dimensions: swap(prev.dimensions, prev.dimensions.indexOf(field), dir) };
          }
          if (prev.dimensions.length) {
            const index = prev.metrics.findIndex((m) => m.field === field);
            return { ...prev, metrics: swap(prev.metrics, index, dir) };
          }
          const visible = prev.columnOrder.filter((f) => prev.columnVisibilityModel[f] !== false);
          const neighbour = visible[visible.indexOf(field) + dir];
          if (!neighbour) return prev;
          const order = [...prev.columnOrder];
          const a = order.indexOf(field);
          const b = order.indexOf(neighbour);
          [order[a], order[b]] = [order[b], order[a]];
          return { ...prev, columnOrder: order };
        }),
      editCalc: (id) => setCalcDialog({ open: true, calc: view.calcs.find((c) => c.id === id) ?? null }),
      pivotBy: (field) =>
        setView((prev) => {
          // A pivot needs at least one row dimension; borrow the first other categorical column.
          const rowDim = prev.dimensions.length
            ? prev.dimensions
            : [prev.columnOrder.find((f) => f !== field && !metaByField[f]?.numeric)].filter(Boolean);
          return { ...prev, pivotField: field, dimensions: rowDim.filter((d) => d !== field), collapsed: [] };
        }),
      removeColumn: (field) =>
        setView((prev) => field.startsWith('calc:')
          ? { ...prev, calcs: prev.calcs.filter((c) => calcField(c.id) !== field) }
          : prev.dimensions.length
            ? {
                ...prev,
                dimensions: prev.dimensions.filter((d) => d !== field),
                metrics: prev.metrics.filter((m) => m.field !== field),
              }
            : { ...prev, columnVisibilityModel: { ...prev.columnVisibilityModel, [field]: false } }
        ),
      drillDown: (field, target) =>
        setView((prev) => {
          const index = prev.dimensions.indexOf(field);
          const dimensions =
            index >= 0
              ? [...prev.dimensions.slice(0, index + 1), target, ...prev.dimensions.slice(index + 1)]
              : [field, target];
          return {
            ...prev,
            dimensions,
            metrics: prev.metrics.filter((m) => !dimensions.includes(m.field)),
            collapsed: [],
          };
        }),
    }),
    [elapsedMs, error, run, rows.length, filteredRows.length, view.calcs, metaByField, attributes.length, criteria, periodFields, grain]
  );

  // Double-click a row to see the records behind it.
  //  - grouped layout: switch to individual records, filtered on the server by the row's
  //    dimension values (all of them for a row, the first for a subtotal), so every record is included
  //  - records already loaded: filter to the row's dimension values over the loaded rows
  const drillToRecords = useCallback(
    (row) => {
      const dims = row.__kind === 'data' ? view.dimensions : view.dimensions.slice(0, 1);
      if (grain) {
        const blankDims = dims.filter((f) => toKey(row[f]) === BLANK);
        const extra = dims
          .filter((f) => !blankDims.includes(f))
          .filter((f) => !(metaByField[f]?.numeric && Number.isNaN(Number(row[f]))))
          .map((f) => ({
            attributeName: f,
            operator: metaByField[f]?.numeric ? '==' : 'equals',
            values: '',
            filters: [toKey(row[f])],
            logicalOperator: 'AND',
          }));
        const next = [...criteria.filter((c) => !extra.some((e) => e.attributeName === c.attributeName)), ...extra];
        setCriteria(next);
        setRowLimit(baseRowLimit);
        setView((prev) => ({
          ...prev,
          grouped: false,
          groupDimensions: prev.dimensions,
          dimensions: [],
          pivotField: null,
          collapsed: [],
          sortModel: [],
          columnFilters: { ...prev.columnFilters, ...Object.fromEntries(blankDims.map((f) => [f, [BLANK]])) },
          columnVisibilityModel: showFields(prev.columnVisibilityModel, prev.dimensions),
        }));
        lastGrainKey.current = 'records';
        run(next, { limit: baseRowLimit, grainOverride: null });
        showToast(`Showing the ${Number(row.__records || 0).toLocaleString()} records behind that row.`, 'info');
        return;
      }
      setView((prev) => {
        const columnFilters = { ...prev.columnFilters };
        dims.forEach((d) => { columnFilters[d] = [toKey(row[d])]; });
        return { ...prev, dimensions: [], pivotField: null, columnFilters, collapsed: [], sortModel: [], columnVisibilityModel: showFields(prev.columnVisibilityModel, prev.dimensions) };
      });
      showToast('Showing the records behind that row. Remove a filter chip to widen it again.', 'info');
    },
    [view.dimensions, grain, metaByField, criteria, run, showToast, baseRowLimit]
  );

  const toggleGroup = useCallback(
    (key) =>
      setView((prev) => ({
        ...prev,
        collapsed: prev.collapsed.includes(key) ? prev.collapsed.filter((k) => k !== key) : [...prev.collapsed, key],
      })),
    []
  );

  const applyCriteria = (next) => {
    const kept = next.filter((c) => c.attributeName && c.operator && c.filters.length);
    setCriteria(kept);
    setRowLimit(baseRowLimit);
    run(kept, { limit: baseRowLimit });
  };

  const removeCriterion = (index) => applyCriteria(criteria.filter((_, i) => i !== index));

  const changeSource = (next) => {
    if (next.value === source?.value) return;
    requestId.current += 1; // drop any run for the previous source
    applyPeriodDefault.current = report.periodDefault !== false;
    setRowLimit(baseRowLimit);
    setCriteria([]);
    setRows([]);
    setElapsedMs(null);
    setSource(next);
  };

  const truncated = totalRows > rows.length;
  const tooManyForBrowser = totalRows > MAX_BROWSER_ROWS;

  const loadAll = () => {
    setRowLimit(null);
    run(criteria, { limit: null });
  };

  /**
   * CSV export as a background job (status shows next to the tabs; the file lands
   * in the Exported tab and downloads when ready). Both kinds respect report
   * filters, column filters, drill-downs, grouping, pivot and calculated columns.
   *   page → the grid page currently on screen
   *   all  → every page; fetches the remaining records first if only a slice is loaded
   */
  const startExport = (kind) => {
    setDownloadAnchor(null);
    const name = report.name;
    const viewSnapshot = view;
    const calcsSnapshot = compiledCalcs;
    const metaSnapshot = meta;
    const scopeLabel = kind === 'page' ? 'Current page' : 'All pages';
    const pageModel = pageModelRef.current;

    const build = async (onProgress) => {
      let viewRowsForExport = viewRows;
      let specsForExport = specs;
      if (kind === 'page') {
        const body = viewRows.filter((r) => r.__kind !== 'total');
        const start = pageModel.page * pageModel.pageSize;
        const totalRow = viewRows.find((r) => r.__kind === 'total');
        viewRowsForExport = [...body.slice(start, start + pageModel.pageSize), ...(totalRow ? [totalRow] : [])];
      } else if (!truncated && viewSnapshot.collapsed.length) {
        viewRowsForExport = buildViewRows({ rows: filteredRows, ...viewSnapshot, collapsed: [], calcs: calcsSnapshot, pivot: activePivot });
      } else if (truncated) {
        if (tooManyForBrowser) {
          throw new Error(`${totalRows.toLocaleString()} records match — too many to export at once. Narrow the report filters (max ${MAX_BROWSER_ROWS.toLocaleString()}).`);
        }
        onProgress(0.02);
        const full = await executeReport(report, source, criteria, { limit: null, grain });
        onProgress(0.45);
        const allRows = applyColumnFilters(prepareRows(full.rows), viewSnapshot.columnFilters);
        const all = viewSnapshot.pivotField ? distinctValues(allRows, viewSnapshot.pivotField) : [];
        const pivot = viewSnapshot.pivotField && viewSnapshot.dimensions.length
          ? { field: viewSnapshot.pivotField, values: all.slice(0, MAX_PIVOT_VALUES) }
          : null;
        viewRowsForExport = buildViewRows({ rows: allRows, ...viewSnapshot, collapsed: [], calcs: calcsSnapshot, pivot });
        specsForExport = buildColumnSpecs({ ...viewSnapshot, meta: metaSnapshot, calcs: calcsSnapshot, pivot });
        onProgress(0.55);
      }
      const base = kind === 'all' && truncated ? 0.55 : 0;
      const blob = await toCsvBlob(specsForExport, viewRowsForExport, (p) => onProgress(base + p * (1 - base)));
      return { blob, rowCount: viewRowsForExport.filter((r) => r.__kind === 'data').length };
    };

    onExport({
      name: `${name} — ${scopeLabel}`,
      reportName: name,
      kind,
      fileName: `${fileSlug(name)}-${kind === 'page' ? `page-${pageModel.page + 1}` : 'all-pages'}-${new Date().toISOString().slice(0, 10)}.csv`,
      build,
    });
    showToast(kind === 'all' && truncated
      ? `Exporting all ${totalRows.toLocaleString()} records — track progress in the Exported tab.`
      : 'Export started — it will download when ready.', 'info');
  };

  const saveCalc = (calc) => {
    setView((prev) => {
      const exists = prev.calcs.some((c) => c.id === calc.id);
      return { ...prev, calcs: exists ? prev.calcs.map((c) => (c.id === calc.id ? calc : c)) : [...prev.calcs, calc] };
    });
    setCalcDialog({ open: false, calc: null });
  };

  const removeCalc = (id) => {
    patchView({ calcs: view.calcs.filter((c) => c.id !== id) });
    setCalcDialog({ open: false, calc: null });
  };

  const onSortModelChange = useCallback((sortModel) => patchView({ sortModel }), [patchView]);
  // Grouped layouts always show the fields they are grouped / pivoted by and their metrics, even
  // ones the report hides by default (e.g. after drilling down to Instrument Id).
  const gridVisibility = useMemo(
    () => (view.dimensions.length
      ? showFields(view.columnVisibilityModel, [...view.dimensions, view.pivotField, ...view.metrics.map((m) => m.field)])
      : view.columnVisibilityModel),
    [view.dimensions, view.pivotField, view.metrics, view.columnVisibilityModel]
  );
  // Hiding a grouped column from the column chooser removes it from the grouping instead.
  const onColumnVisibilityModelChange = useCallback((model) => setView((prev) => {
    if (!prev.dimensions.length) return { ...prev, columnVisibilityModel: model };
    const hiddenNow = (f) => model[f] === false;
    const layoutFields = new Set([...prev.dimensions, prev.pivotField, ...prev.metrics.map((m) => m.field)]);
    const dimensions = prev.dimensions.filter((d) => !hiddenNow(d));
    const rest = Object.fromEntries(Object.entries(model).filter(([f]) => !layoutFields.has(f)));
    return {
      ...prev,
      dimensions: dimensions.length ? dimensions : prev.dimensions, // keep at least one grouping
      metrics: prev.metrics.filter((m) => !hiddenNow(m.field)),
      pivotField: hiddenNow(prev.pivotField) ? null : prev.pivotField,
      columnVisibilityModel: { ...prev.columnVisibilityModel, ...rest },
      collapsed: [],
    };
  }), []);

  const openColumns = () => {
    if (view.dimensions.length) onPanelChange('data');
    else apiRef.current?.showPreferences(GridPreferencePanelsValue.columns);
  };

  const filterColumn = filterTarget && metaByField[filterTarget.field];
  const filterValues = useMemo(() => {
    if (!filterTarget) return [];
    const { [filterTarget.field]: _ignored, ...others } = view.columnFilters;
    return distinctValues(applyColumnFilters(rows, others), filterTarget.field);
  }, [filterTarget, rows, view.columnFilters]);

  const chips = [
    ...criteria.map((c, index) => ({
      key: `c${index}-${c.attributeName}`,
      kind: 'server',
      label: `${header(c.attributeName)} ${OPERATOR_LABELS[c.operator] ?? c.operator} ${summarizeValues(periodFields.has(c.attributeName) && ['equals', '=='].includes(c.operator) ? summarizePeriods(c.filters) : c.filters)}`,
      title: `Report filter: ${header(c.attributeName)} ${OPERATOR_LABELS[c.operator] ?? c.operator} ${c.filters.join(', ')}`,
      onClick: () => onPanelChange('properties'),
      onDelete: () => removeCriterion(index),
    })),
    ...Object.entries(view.columnFilters).map(([field, values]) => ({
      key: `f-${field}`,
      kind: 'column',
      label: `${header(field)} ∈ ${summarizeValues(values)}`,
      title: `Column filter: ${header(field)} is one of ${values.join(', ')}`,
      onClick: (e) => setFilterTarget({ field, anchor: e.currentTarget }),
      onDelete: () => setColumnFilter(field, []),
    })),
  ];
  const columnFilterCount = Object.keys(view.columnFilters).length;

  const content = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        minHeight: 0,
        flex: 1,
        px: 3,
        pt: 2,
        pb: 2,
        gap: 1.5,
        bgcolor: surface.raised,
        ...(fullscreen && {
          position: 'fixed',
          inset: 0,
          zIndex: theme.zIndex.modal,
          boxShadow: shadow.lg,
          animation: `reportFullscreenIn 200ms ${EASE_CSS}`,
          '@keyframes reportFullscreenIn': { from: { opacity: 0, transform: 'scale(0.985)' }, to: { opacity: 1, transform: 'none' } },
        }),
      }}
    >
      {/* Title row */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Box sx={{ minWidth: 0, flex: 1, display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, minWidth: 0 }}>
            <Typography variant="h6" component="h2" noWrap sx={{ fontSize: '1.125rem' }}>{report.name}</Typography>
            <Tooltip title={favorite ? 'Remove from favorites' : 'Add to favorites'}>
              <IconButton size="small" aria-label={favorite ? 'Remove from favorites' : 'Add to favorites'} aria-pressed={favorite} onClick={onToggleFavorite}>
                {favorite ? <StarRoundedIcon sx={{ color: '#F59E0B', fontSize: 20 }} /> : <StarBorderRoundedIcon sx={{ fontSize: 20 }} />}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Table / level selector sits with the actions, before the row count */}
        {report.sourceLabel && (
          <Box sx={{ width: 260, alignSelf: 'center' }}>
            <PickerField
              label={report.sourceLabel === 'Table' ? 'Select Table' : `Select ${report.sourceLabel}`}
              value={source?.value ?? null}
              options={sources.map((o) => ({ value: o.value, label: o.label }))}
              emptyText={`No ${report.sourceLabel.toLowerCase()}s available.`}
              onChange={(v) => v && changeSource(sources.find((o) => o.value === v))}
            />
          </Box>
        )}

        {/* Toolbar */}
        <Box
          role="toolbar"
          aria-label="Report actions"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.25,
            p: 0.5,
            border: `1px solid ${line}`,
            borderRadius: radius.md,
            bgcolor: surface.raised,
            boxShadow: shadow.xs,
            alignSelf: 'center',
          }}
        >
          <Typography variant="caption" color="text.secondary" sx={{ px: 1, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
            {loading ? 'Loading…' : `${dataRowCount.toLocaleString()} rows`}
            {!loading && truncated && (
              <Box component="span" sx={{ color: 'warning.dark', fontWeight: 600 }}> · partial</Box>
            )}
          </Typography>
          <Divider orientation="vertical" flexItem sx={{ mx: 0.25, my: 0.5 }} />
          <ToolbarButton title={view.dimensions.length ? 'Dimensions & metrics' : 'Show / hide columns'} onClick={openColumns}>
            <ViewColumnOutlinedIcon fontSize="small" />
          </ToolbarButton>
          <ToolbarButton title="New calculated column" onClick={() => setCalcDialog({ open: true, calc: null })} disabled={!meta.some((m) => m.numeric)}>
            <FunctionsRoundedIcon fontSize="small" />
          </ToolbarButton>
          <ToolbarButton title="Report filters" onClick={() => onPanelChange('properties')} active={criteria.length > 0}>
            <FilterAltOutlinedIcon fontSize="small" />
          </ToolbarButton>
          <ToolbarButton title="Refresh" onClick={() => run(undefined, { force: true })} disabled={loading || sourceMissing}>
            <RefreshRoundedIcon fontSize="small" sx={{ animation: loading ? 'reportSpin 0.9s linear infinite' : 'none', '@keyframes reportSpin': { to: { transform: 'rotate(360deg)' } } }} />
          </ToolbarButton>
          <Divider orientation="vertical" flexItem sx={{ mx: 0.25, my: 0.5 }} />
          <ToolbarButton title="Download CSV" onClick={(e) => setDownloadAnchor(e.currentTarget)} disabled={sourceMissing || !viewRows.length}>
            <FileDownloadOutlinedIcon fontSize="small" />
          </ToolbarButton>
          <ToolbarButton title={fullscreen ? 'Exit full screen (Esc)' : 'Full screen'} onClick={() => setFullscreen((f) => !f)} active={fullscreen}>
            {fullscreen ? <FullscreenExitRoundedIcon fontSize="small" /> : <FullscreenRoundedIcon fontSize="small" />}
          </ToolbarButton>
        </Box>
      </Box>

      {/* Active filters */}
      {chips.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, alignItems: 'center', flexShrink: 0 }}>
          {chips.map(({ key, ...chip }) => <FilterChip key={key} {...chip} />)}
          {columnFilterCount > 1 && (
            <Button size="small" onClick={() => patchView({ columnFilters: {}, collapsed: [] })} sx={{ py: 0.25, px: 1, minWidth: 0 }}>
              Clear column filters
            </Button>
          )}
        </Box>
      )}

      {error && rows.length > 0 && (
        <Alert severity="error" onClose={() => setError('')} action={<Button color="inherit" size="small" onClick={() => run(undefined, { force: true })}>Retry</Button>}>
          {error}
        </Alert>
      )}
      {truncated && !loading && (
        <Alert
          severity="info"
          variant="outlined"
          sx={{ py: 0, alignItems: 'center', borderRadius: radius.md, bgcolor: 'rgba(2,136,209,0.04)', ...enterPop }}
          action={
            <Tooltip title={tooManyForBrowser ? `More than ${MAX_BROWSER_ROWS.toLocaleString()} records — add report filters to narrow it down` : ''}>
              <span>
                <Button size="small" onClick={loadAll} disabled={tooManyForBrowser} sx={{ fontWeight: 700 }}>
                  Load all {totalRows.toLocaleString()}
                </Button>
              </span>
            </Tooltip>
          }
        >
          Showing the first <b>{rows.length.toLocaleString()}</b> of <b>{totalRows.toLocaleString()}</b> matching {grain ? 'groups' : 'records'} for speed.
          Totals and groupings cover the loaded records; “All pages” exports include every record.
        </Alert>
      )}
      {sourceMissing && !loading && sources.length === 0 && !error && (
        <Alert severity="info">There are no {report.sourceLabel.toLowerCase()}s available for this report yet.</Alert>
      )}

      {/* Grid */}
      <Box sx={{ position: 'relative', flex: 1, minHeight: 320 }}>
        {loading && rows.length > 0 && (
          <LinearProgress sx={{ position: 'absolute', top: 0, left: 1, right: 1, zIndex: 2, height: 2, borderRadius: '10px 10px 0 0' }} />
        )}
        <Box sx={{ position: 'absolute', inset: 0 }}>
          <ReportGrid
            apiRef={apiRef}
            meta={meta}
            specs={specs}
            rows={viewRows}
            dimensions={view.dimensions}
            metrics={view.metrics}
            pivotFieldName={view.pivotField}
            columnFilters={view.columnFilters}
            sortModel={view.sortModel}
            onSortModelChange={onSortModelChange}
            columnVisibilityModel={gridVisibility}
            onColumnVisibilityModelChange={onColumnVisibilityModelChange}
            resetKey={gridResetKey}
            onToggleGroup={toggleGroup}
            onRowDrill={drillToRecords}
            drillable={view.dimensions.length > 0}
            actions={gridActions}
            loading={loading && rows.length === 0}
            density={density}
            pageModelRef={pageModelRef}
          />
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', flex: 1, minHeight: 0, minWidth: 0 }}>
      {content}

      <SidePanel
        panel={panel}
        onPanelChange={onPanelChange}
        hasReport
        reportsPanel={reportsPanel}
        onResetView={() => setView((prev) => ({ ...defaultView(meta, report), calcs: prev.calcs }))}
        dataPanel={{
          meta,
          dimensions: view.dimensions,
          metrics: view.metrics,
          pivotField: view.pivotField,
          pivotInfo,
          calcs: view.calcs,
          grouped: view.grouped,
          onGroupedChange: (grouped) => {
            setRowLimit(baseRowLimit);
            setView((prev) => (grouped
              ? { ...prev, grouped: true, dimensions: prev.groupDimensions?.length ? prev.groupDimensions : defaultDimensions(meta, report), groupDimensions: null, collapsed: [] }
              : { ...prev, grouped: false, groupDimensions: prev.dimensions, dimensions: [], pivotField: null, collapsed: [], columnVisibilityModel: showFields(prev.columnVisibilityModel, prev.dimensions) }));
          },
          // A field picked as a dimension, metric or pivot is shown even if the default layout hides it.
          onChange: (patch) => setView((prev) => {
            const picked = [...(patch.dimensions || []), ...(patch.metrics || []).map((m) => m.field), patch.pivotField]
              .filter((f) => f && prev.columnVisibilityModel?.[f] === false);
            const columnVisibilityModel = picked.length
              ? { ...prev.columnVisibilityModel, ...Object.fromEntries(picked.map((f) => [f, true])) }
              : prev.columnVisibilityModel;
            return { ...prev, ...patch, columnVisibilityModel, collapsed: [] };
          }),
          onNewCalc: () => setCalcDialog({ open: true, calc: null }),
          onEditCalc: (id) => setCalcDialog({ open: true, calc: view.calcs.find((c) => c.id === id) ?? null }),
          onRemoveCalc: (id) => patchView({ calcs: view.calcs.filter((c) => c.id !== id) }),
        }}
        propertiesPanel={{
          report,
          sources,
          source,
          onSourceChange: changeSource,
          attributes,
          criteria,
          periodFields,
          loadPeriods,
          onApplyCriteria: applyCriteria,
          density,
          onDensityChange: setDensity,
        }}
      />

      <TextFilterPopover
        anchorEl={textFilter?.anchor ?? null}
        column={textFilter && metaByField[textFilter.field]}
        current={textFilter ? criteria.find((c) => c.attributeName === textFilter.field) : null}
        loadValues={loadFieldValues}
        onApply={({ operator, values }) => {
          const field = textFilter.field;
          const others = criteria.filter((c) => c.attributeName !== field);
          applyCriteria(values.length
            ? [...others, { attributeName: field, operator, values: '', filters: values, logicalOperator: 'AND' }]
            : others);
          setTextFilter(null);
        }}
        onClose={() => setTextFilter(null)}
      />

      <PeriodFilterPopover
        anchorEl={periodFilter?.anchor ?? null}
        column={periodFilter && metaByField[periodFilter.field]}
        current={periodFilter ? criteria.find((c) => c.attributeName === periodFilter.field) : null}
        loadPeriods={loadPeriods}
        onApply={(values) => {
          const field = periodFilter.field;
          const others = criteria.filter((c) => c.attributeName !== field);
          applyCriteria(values.length
            ? [...others, { attributeName: field, operator: 'equals', values: '', filters: values, logicalOperator: 'AND' }]
            : others);
          setPeriodFilter(null);
        }}
        onClose={() => setPeriodFilter(null)}
      />

      <NumberFilterPopover
        anchorEl={numberFilter?.anchor ?? null}
        column={numberFilter && metaByField[numberFilter.field]}
        current={numberFilter ? criteria.filter((c) => c.attributeName === numberFilter.field) : []}
        onApply={(conditions) => {
          const field = numberFilter.field;
          const others = criteria.filter((c) => c.attributeName !== field);
          applyCriteria([
            ...others,
            ...conditions.map((c) => ({ attributeName: field, operator: c.operator, values: '', filters: [String(c.value)], logicalOperator: 'AND' })),
          ]);
          setNumberFilter(null);
        }}
        onClose={() => setNumberFilter(null)}
      />

      <ColumnFilterPopover
        anchorEl={filterTarget?.anchor ?? null}
        column={filterColumn}
        values={filterValues}
        selected={filterTarget ? view.columnFilters[filterTarget.field] : undefined}
        onApply={(values) => {
          setColumnFilter(filterTarget.field, values);
          setFilterTarget(null);
        }}
        onClose={() => setFilterTarget(null)}
      />

      <Menu
        anchorEl={downloadAnchor}
        open={Boolean(downloadAnchor)}
        onClose={() => setDownloadAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { mt: 0.5, boxShadow: shadow.lg, border: `1px solid ${line}` } } }}
      >
        <MenuItem onClick={() => startExport('page')}>
          <ListItemIcon><ViewDayOutlinedIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="Current page (CSV)" secondary="The rows on this page, as shown" />
        </MenuItem>
        <MenuItem onClick={() => startExport('all')}>
          <ListItemIcon><DescriptionOutlinedIcon fontSize="small" /></ListItemIcon>
          <ListItemText
            primary="All pages (CSV)"
            secondary={truncated ? `Full report — all ${totalRows.toLocaleString()} records, filtered & drilled as shown` : 'Full report — every page, filtered & drilled as shown'}
          />
        </MenuItem>
      </Menu>

      <CalcDialog
        open={calcDialog.open}
        calc={calcDialog.calc}
        meta={allMeta}
        sampleRow={viewRows[0]}
        loadValues={loadFieldValues}
        onSave={saveCalc}
        onDelete={removeCalc}
        onClose={() => setCalcDialog({ open: false, calc: null })}
      />

      <AppToast toast={toast} onClose={() => setToast((t) => ({ ...t, open: false }))} />
    </Box>
  );
}
