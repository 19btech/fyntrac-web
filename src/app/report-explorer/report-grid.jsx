"use client";

import React, { createContext, memo, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { Box, Button, Divider, IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Typography } from '@mui/material';
import {
  DataGrid,
  GridColumnMenu,
  GridFooterContainer,
  GridPagination,
} from '@mui/x-data-grid';
import FilterListIcon from '@mui/icons-material/FilterList';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import PivotTableChartRoundedIcon from '@mui/icons-material/PivotTableChartRounded';
import FunctionsRoundedIcon from '@mui/icons-material/FunctionsRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import { formatNumber } from './pivot';
import { EASE_CSS, line, lineStrong, surface, tint } from './tokens';

// Grid callbacks are shared with the column-menu/footer slots through context.
const GridActions = createContext(null);
const useGridActions = () => useContext(GridActions);

const isAggregateRow = (row) => row.__kind !== 'data';
const AGGREGATE_LABEL = { subtotal: 'Subtotal', total: 'Total' };

// Columns can only be dragged among their own kind: row dimensions, metrics, calculated
// columns — or, in detail view, any raw field. Pivot value columns are fixed.
export const dragGroupOf = (spec, summary) => {
  if (!spec || spec.group) return null;
  if (spec.kind === 'calc') return 'calc';
  if (!summary) return 'field';
  return spec.kind === 'dimension' ? 'dimension' : 'metric';
};

// Raw-field columns can be filtered/drilled; pivot and calculated columns are derived.
const isRawField = (spec) => spec && (spec.kind === 'dimension' || spec.kind === 'field' || (spec.kind === 'metric' && !spec.group));

function ColumnHeader({ field, title, filterable }) {
  const theme = useTheme();
  const { columnFilters, serverFilterFields, openFilter, specByField, summary, drag, setDrag, dragRef, reorderColumn } = useGridActions();
  const active = Boolean(columnFilters[field]?.length) || Boolean(serverFilterFields?.has(field));
  const group = dragGroupOf(specByField[field], summary);
  const marker = drag && drag.over === field ? (drag.after ? 'after' : 'before') : null;

  // Pointer-driven reordering (not HTML5 drag-and-drop: the grid's numeric headers never
  // start a native drag). Press, move a few pixels, release over another column of the same kind.
  const onPointerDown = (e) => {
    if (!group || e.button !== 0 || e.target.closest('button')) return;
    const startX = e.clientX;
    const startY = e.clientY;
    let dragging = false;

    const onMove = (ev) => {
      if (!dragging) {
        if (Math.abs(ev.clientX - startX) + Math.abs(ev.clientY - startY) < 6) return;
        dragging = true;
        document.body.style.cursor = 'grabbing';
        dragRef.current = { field, group, over: null, after: false };
        setDrag(dragRef.current);
      }
      const target = document.elementFromPoint(ev.clientX, ev.clientY)?.closest('[role="columnheader"][data-field]');
      const over = target?.dataset.field;
      const valid = over && over !== field && dragGroupOf(specByField[over], summary) === group;
      const rect = valid ? target.getBoundingClientRect() : null;
      const next = { field, group, over: valid ? over : null, after: valid && ev.clientX > rect.left + rect.width / 2 };
      const prev = dragRef.current;
      if (prev.over !== next.over || prev.after !== next.after) {
        dragRef.current = next;
        setDrag(next);
      }
    };

    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      if (!dragging) return;
      document.body.style.cursor = '';
      const d = dragRef.current;
      if (d?.over) reorderColumn(d.field, d.over, d.after);
      dragRef.current = null;
      setDrag(null);
      // The release would otherwise also count as a header click (and sort the column).
      const swallow = (ce) => { ce.stopPropagation(); ce.preventDefault(); };
      window.addEventListener('click', swallow, { capture: true, once: true });
      setTimeout(() => window.removeEventListener('click', swallow, { capture: true }), 0);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const dragProps = group ? { onPointerDown } : {};

  return (
    <Box
      {...dragProps}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.25,
        minWidth: 0,
        width: '100%',
        height: '100%',
        position: 'relative',
        cursor: group ? 'grab' : 'default',
        userSelect: 'none',
        touchAction: 'none',
        opacity: drag?.field === field ? 0.45 : 1,
        transition: 'opacity 120ms',
        '&::before': marker ? {
          content: '""',
          position: 'absolute',
          top: 6,
          bottom: 6,
          [marker === 'before' ? 'left' : 'right']: -11,
          width: 3,
          borderRadius: 2,
          bgcolor: 'primary.main',
        } : undefined,
      }}
    >
      <Box className="MuiDataGrid-columnHeaderTitle" title={title} sx={{ flex: 1, minWidth: 0 }}>{title}</Box>
      {filterable && (
        <IconButton
          size="small"
          className={active ? 'col-filter col-filter--active' : 'col-filter'}
          aria-label={`Filter ${title}`}
          aria-pressed={active}
          onClick={(e) => {
            e.stopPropagation();
            openFilter(field, e.currentTarget);
          }}
          sx={{
            p: 0.5,
            color: active ? 'primary.main' : 'text.secondary',
            bgcolor: active ? tint(theme, 0.12) : 'transparent',
            '&:hover': { bgcolor: tint(theme, active ? 0.18 : 0.08) },
          }}
        >
          <FilterListIcon sx={{ fontSize: 17 }} />
        </IconButton>
      )}
    </Box>
  );
}

function NoRowsOverlay() {
  const { error, onRetry } = useGridActions();
  const Icon = error ? ErrorOutlineRoundedIcon : InboxOutlinedIcon;
  return (
    <Box sx={{ height: '100%', display: 'grid', placeItems: 'center', p: 3 }}>
      <Box sx={{ textAlign: 'center', maxWidth: 380 }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            mx: 'auto',
            mb: 1.5,
            display: 'grid',
            placeItems: 'center',
            bgcolor: error ? 'rgba(239, 68, 68, 0.08)' : surface.sunken,
            color: error ? 'error.main' : 'text.secondary',
          }}
        >
          <Icon />
        </Box>
        <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
          {error ? 'The report could not be loaded' : 'No records to show'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {error || 'Try widening your report filters or clearing column filters.'}
        </Typography>
        {error && (
          <Button size="small" variant="outlined" startIcon={<RefreshRoundedIcon />} onClick={onRetry} sx={{ mt: 2 }}>
            Retry
          </Button>
        )}
      </Box>
    </Box>
  );
}

function FilterMenuItem({ colDef, onClick }) {
  const { openFilter, specByField } = useGridActions();
  if (!isRawField(specByField[colDef.field])) return null;
  return (
    <MenuItem
      onClick={(e) => {
        onClick(e);
        const header = document.querySelector(`[role="columnheader"][data-field="${CSS.escape(colDef.field)}"]`);
        openFilter(colDef.field, header);
      }}
    >
      <ListItemIcon><FilterListIcon fontSize="small" /></ListItemIcon>
      <ListItemText>Filter</ListItemText>
    </MenuItem>
  );
}

function MoveMenuItems({ colDef, onClick }) {
  const { moveColumn, specByField } = useGridActions();
  const spec = specByField[colDef.field];
  if (!spec || spec.group) return null;
  return (
    <>
      <MenuItem onClick={(e) => { onClick(e); moveColumn(colDef.field, -1); }}>
        <ListItemIcon><ArrowBackRoundedIcon fontSize="small" /></ListItemIcon>
        <ListItemText>Move left</ListItemText>
      </MenuItem>
      <MenuItem onClick={(e) => { onClick(e); moveColumn(colDef.field, 1); }}>
        <ListItemIcon><ArrowForwardRoundedIcon fontSize="small" /></ListItemIcon>
        <ListItemText>Move right</ListItemText>
      </MenuItem>
    </>
  );
}

function CalcMenuItem({ colDef, onClick }) {
  const { editCalc, specByField } = useGridActions();
  const spec = specByField[colDef.field];
  if (spec?.kind !== 'calc') return null;
  return (
    <MenuItem onClick={(e) => { onClick(e); editCalc(spec.calcId); }}>
      <ListItemIcon><FunctionsRoundedIcon fontSize="small" /></ListItemIcon>
      <ListItemText>Edit formula</ListItemText>
    </MenuItem>
  );
}

function RemoveMenuItem({ colDef, onClick }) {
  const { removeColumn, specByField } = useGridActions();
  const spec = specByField[colDef.field];
  if (!spec) return null;
  return (
    <MenuItem onClick={(e) => { onClick(e); removeColumn(spec.metricField && spec.group ? spec.metricField : colDef.field); }}>
      <ListItemIcon><DeleteOutlineRoundedIcon fontSize="small" /></ListItemIcon>
      <ListItemText>{spec.group ? 'Remove metric' : 'Remove'}</ListItemText>
    </MenuItem>
  );
}

function PivotMenuItem({ colDef, onClick }) {
  const { pivotBy, pivotFieldName, specByField } = useGridActions();
  const spec = specByField[colDef.field];
  // Text and integer fields (e.g. accounting periods) that aren't row dimensions can become pivot columns.
  if (!spec || spec.dataType === 'Double' || spec.kind !== 'field' || colDef.field === pivotFieldName) return null;
  return (
    <MenuItem onClick={(e) => { onClick(e); pivotBy(colDef.field); }}>
      <ListItemIcon><PivotTableChartRoundedIcon fontSize="small" /></ListItemIcon>
      <ListItemText>Pivot into columns</ListItemText>
    </MenuItem>
  );
}

function DrillDownMenuItem({ colDef, onClick }) {
  const { meta, dimensions, metrics, drillDown, specByField, pivotFieldName } = useGridActions();
  const [anchor, setAnchor] = useState(null);
  const field = colDef.field;
  const spec = specByField[field];

  // Metric, pivot and calculated columns can't be drilled; dimensions can't drill into themselves.
  if (!isRawField(spec) || spec.kind === 'metric' || (dimensions.length && spec.numeric && !dimensions.includes(field))) return null;
  const targets = meta.filter((m) => !dimensions.includes(m.field) && m.field !== field && m.field !== pivotFieldName && !metrics.some((x) => x.field === m.field));
  if (!targets.length) return null;

  return (
    <>
      <Divider />
      <MenuItem onClick={(e) => setAnchor(e.currentTarget)} onMouseEnter={(e) => setAnchor(e.currentTarget)}>
        <ListItemIcon><AccountTreeOutlinedIcon fontSize="small" /></ListItemIcon>
        <ListItemText>Drill down</ListItemText>
        <ChevronRightIcon fontSize="small" sx={{ ml: 2, color: 'text.secondary' }} />
      </MenuItem>
      <Menu
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{ paper: { sx: { maxHeight: 360, minWidth: 220 } } }}
      >
        <Typography variant="caption" color="text.secondary" sx={{ px: 2, py: 0.5, display: 'block' }}>
          {dimensions.includes(field) ? 'Break down by' : `Group by ${colDef.headerName}, then by`}
        </Typography>
        {targets.map((t) => (
          <MenuItem
            key={t.field}
            dense
            onClick={(e) => {
              setAnchor(null);
              onClick(e);
              drillDown(field, t.field);
            }}
          >
            {t.header}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

function ReportColumnMenu(props) {
  return (
    <GridColumnMenu
      {...props}
      slots={{
        columnMenuFilterItem: FilterMenuItem,
        columnMenuColumnsItem: null,
        columnMenuCalcItem: CalcMenuItem,
        columnMenuMoveItem: MoveMenuItems,
        columnMenuRemoveItem: RemoveMenuItem,
        columnMenuPivotItem: PivotMenuItem,
        columnMenuDrillItem: DrillDownMenuItem,
      }}
      slotProps={{
        columnMenuCalcItem: { displayOrder: 15 },
        columnMenuMoveItem: { displayOrder: 20 },
        columnMenuRemoveItem: { displayOrder: 30 },
        columnMenuPivotItem: { displayOrder: 35 },
        columnMenuDrillItem: { displayOrder: 40 },
      }}
    />
  );
}

function ReportFooter() {
  const { elapsedMs, sourceCount, shownCount, rowUnit = 'records' } = useGridActions();
  return (
    <GridFooterContainer sx={{ px: 1.5, minHeight: 48, borderTop: `1px solid ${line}` }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, color: 'text.secondary' }}>
        {elapsedMs != null && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <AccessTimeRoundedIcon sx={{ fontSize: 16 }} />
            <Typography variant="caption">Query {elapsedMs.toLocaleString()} ms</Typography>
          </Box>
        )}
        <Typography variant="caption">
          {shownCount === sourceCount
            ? `${sourceCount.toLocaleString()} ${rowUnit}`
            : `${shownCount.toLocaleString()} of ${sourceCount.toLocaleString()} ${rowUnit}`}
        </Typography>
      </Box>
      <GridPagination />
    </GridFooterContainer>
  );
}

const getRowId = (row) => row.__id;
const getRowClassName = ({ row }) => `report-row--${row.__kind}`;
// No columns (e.g. column definitions failed to load) shows the same message/Retry as no rows.
const GRID_SLOTS = { columnMenu: ReportColumnMenu, footer: ReportFooter, noRowsOverlay: NoRowsOverlay, noColumnsOverlay: NoRowsOverlay };
const GRID_SLOT_PROPS = { loadingOverlay: { variant: 'skeleton', noRowsVariant: 'skeleton' } };
const PAGE_SIZES = [25, 50, 100];

function ReportGrid({
  meta,
  specs,
  rows,
  dimensions,
  metrics,
  pivotFieldName,
  columnFilters,
  sortModel,
  onSortModelChange,
  columnVisibilityModel,
  onColumnVisibilityModelChange,
  onToggleGroup,
  onRowDrill,
  actions,
  loading,
  density,
  apiRef,
  resetKey,
  pageModelRef,
  drillable,
}) {
  const theme = useTheme();
  const summary = dimensions.length > 0;
  const nested = dimensions.length > 1;
  const { columns: columnSpecs, groups, labelField } = specs;
  const specByField = useMemo(() => Object.fromEntries(columnSpecs.map((c) => [c.field, c])), [columnSpecs]);

  const columns = useMemo(() => columnSpecs.map((spec) => {
    const { field, header, numeric } = spec;
    const isGroupColumn = nested && field === dimensions[0];
    return {
      field,
      headerName: header,
      type: numeric ? 'number' : 'string',
      // Flex fills the grid exactly (scrollbar included); minWidth keeps headers readable
      // and lets wide reports scroll horizontally instead of squashing.
      flex: numeric ? 1 : 1.25,
      minWidth: Math.min(260, Math.max(numeric ? 130 : 150, header.length * 7 + 56)),
      align: numeric ? 'right' : 'left',
      headerAlign: numeric ? 'right' : 'left',
      sortable: true,
      renderHeader: () => <ColumnHeader field={field} title={header} filterable={isRawField(spec)} />,
      valueFormatter: numeric ? (value) => formatNumber(value, spec.dataType, spec.format) : undefined,
      rowSpanValueGetter: isGroupColumn
        ? (value, row) => (row.__kind === 'total' ? '__total' : row.__group)
        : (value, row) => row.__id,
      renderCell: ({ row, formattedValue }) => {
        if (isGroupColumn && row.__kind !== 'total') {
          const isCollapsed = row.__kind === 'collapsed';
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 600, alignSelf: 'flex-start', pt: 0.5 }}>
              <IconButton
                size="small"
                onClick={() => onToggleGroup(row.__group)}
                aria-label={isCollapsed ? 'Expand group' : 'Collapse group'}
                aria-expanded={!isCollapsed}
                sx={{ p: 0.25 }}
              >
                <KeyboardArrowDownIcon
                  fontSize="small"
                  sx={{ transition: `transform 180ms ${EASE_CSS}`, transform: isCollapsed ? 'rotate(-90deg)' : 'none' }}
                />
              </IconButton>
              {formattedValue ?? row[field] ?? ''}
            </Box>
          );
        }
        if (field === labelField && isAggregateRow(row)) {
          const label = row.__kind === 'collapsed' ? `${(row.__records ?? row.__count).toLocaleString()} records` : AGGREGATE_LABEL[row.__kind];
          return (
            <Box component="span" sx={{ color: 'primary.main', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
              <Box component="span" sx={{ fontSize: '0.9em', opacity: 0.8 }}>Σ</Box> {label}
            </Box>
          );
        }
        return formattedValue ?? row[field] ?? '';
      },
    };
  }), [columnSpecs, nested, dimensions, labelField, onToggleGroup]);

  const columnGroupingModel = useMemo(
    () => groups.map((g) => ({ groupId: g.groupId, headerName: g.headerName, headerAlign: 'center', children: g.children.map((field) => ({ field })) })),
    [groups]
  );

  // Paginate body rows ourselves so the grand total row is repeated on every page.
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 100 });
  const bodyRows = useMemo(() => rows.filter((r) => r.__kind !== 'total'), [rows]);
  const totalRow = useMemo(() => rows.find((r) => r.__kind === 'total'), [rows]);
  // New shape (filters, dimensions, report) → back to page 1; expanding/collapsing keeps the page.
  useEffect(() => setPaginationModel((p) => ({ ...p, page: 0 })), [resetKey]);
  useEffect(() => {
    setPaginationModel((p) => {
      const lastPage = Math.max(0, Math.ceil(bodyRows.length / p.pageSize) - 1);
      return p.page > lastPage ? { ...p, page: lastPage } : p;
    });
  }, [bodyRows.length]);
  if (pageModelRef) pageModelRef.current = paginationModel; // lets "Current page" exports find this page
  const pageRows = useMemo(() => {
    const start = paginationModel.page * paginationModel.pageSize;
    const slice = bodyRows.slice(start, start + paginationModel.pageSize);
    return totalRow ? [...slice, totalRow] : slice;
  }, [bodyRows, totalRow, paginationModel]);

  const [drag, setDrag] = useState(null); // { field, group, over, after } while a header is dragged
  const dragRef = useRef(null);

  const contextValue = useMemo(
    () => ({ ...actions, meta, dimensions, metrics, columnFilters, specByField, pivotFieldName, summary, drag, setDrag, dragRef }),
    [actions, meta, dimensions, metrics, columnFilters, specByField, pivotFieldName, summary, drag]
  );

  const sx = useMemo(() => ({
    '--DataGrid-rowBorderColor': line,
    border: `1px solid ${line}`,
    borderRadius: '10px',
    bgcolor: surface.raised,
    boxShadow: '0 1px 3px rgba(15, 23, 42, 0.06), 0 8px 24px -16px rgba(15, 23, 42, 0.18)',
    fontSize: '0.84rem',
    fontVariantNumeric: 'tabular-nums',
    overflow: 'hidden',
    '& .MuiDataGrid-columnHeaders, & .MuiDataGrid-columnHeader, & .MuiDataGrid-filler': { bgcolor: surface.page },
    '& .MuiDataGrid-columnHeader': { borderRight: `1px solid ${line}`, px: 1.25 },
    '& .MuiDataGrid-columnHeader--filledGroup .MuiDataGrid-columnHeaderTitleContainer': { borderBottom: `1px solid ${line}` },
    '& .MuiDataGrid-columnHeader--filledGroup .MuiDataGrid-columnHeaderTitle': { color: 'text.primary', fontWeight: 700 },
    '& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within, & .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': { outline: 'none' },
    '& .MuiDataGrid-columnHeader:focus-visible, & .MuiDataGrid-cell:focus-visible': { outline: `2px solid ${tint(theme, 0.5)}`, outlineOffset: -2 },
    '& .MuiDataGrid-columnHeaderTitle': {
      whiteSpace: 'normal', lineHeight: 1.25, fontWeight: 700, fontSize: '0.8rem', color: 'text.primary',
      overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
    },
    '& .MuiDataGrid-columnHeaderTitleContainerContent': { width: '100%' },
    '& .MuiDataGrid-columnSeparator': { color: 'transparent' },
    '& .MuiDataGrid-columnHeader:hover .MuiDataGrid-columnSeparator': { color: lineStrong },
    // Filter buttons stay quiet until the header is hovered or a filter is active
    '& .col-filter': { opacity: 0, transition: `opacity 140ms ${EASE_CSS}, background-color 140ms` },
    '& .MuiDataGrid-columnHeader:hover .col-filter, & .col-filter--active, & .col-filter:focus-visible': { opacity: 1 },
    '& .MuiDataGrid-cell': { px: 1.25, color: 'text.primary' },
    // Row-spanning placeholders are plain flex items; stop them shrinking when columns overflow.
    '& .MuiDataGrid-row > *': { flexShrink: 0 },
    '& .MuiDataGrid-row:hover': { bgcolor: tint(theme, 0.04) },
    '& .report-row--data:hover': { cursor: drillable ? 'zoom-in' : 'default' },
    '& .report-row--subtotal, & .report-row--collapsed': {
      bgcolor: surface.page, fontWeight: 600,
      '&:hover': { bgcolor: surface.sunken },
    },
    '& .report-row--total': {
      bgcolor: tint(theme, 0.06), fontWeight: 700,
      '& .MuiDataGrid-cell': { borderTop: `1px solid ${tint(theme, 0.35)}` },
      '&:hover': { bgcolor: tint(theme, 0.08) },
    },
    ...(nested && { [`& .MuiDataGrid-cell[data-field="${dimensions[0]}"]`]: { borderRight: `1px solid ${line}`, bgcolor: surface.raised } }),
    '& .MuiDataGrid-overlayWrapper': { minHeight: 260 },
    // TablePagination's toolbar (52px) is taller than the 48px footer and grew its own scrollbar.
    '& .MuiTablePagination-root': { overflow: 'hidden' },
    '& .MuiTablePagination-toolbar': { minHeight: 48 },
  }), [theme, drillable, nested, dimensions]);

  return (
    <GridActions.Provider value={contextValue}>
      <DataGrid
        apiRef={apiRef}
        rows={pageRows}
        columns={columns}
        columnGroupingModel={columnGroupingModel.length ? columnGroupingModel : undefined}
        getRowId={getRowId}
        loading={loading}
        density={density}
        rowSpanning={nested}
        sortingMode="server"
        sortModel={sortModel}
        onSortModelChange={onSortModelChange}
        columnVisibilityModel={columnVisibilityModel}
        onColumnVisibilityModelChange={onColumnVisibilityModelChange}
        disableColumnFilter
        disableRowSelectionOnClick
        columnHeaderHeight={columnGroupingModel.length ? 44 : 56}
        paginationMode="server"
        rowCount={bodyRows.length}
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        pageSizeOptions={PAGE_SIZES}
        getRowClassName={getRowClassName}
        onRowDoubleClick={({ row }) => drillable && row.__kind !== 'total' && onRowDrill(row)}
        slots={GRID_SLOTS}
        slotProps={GRID_SLOT_PROPS}
        sx={sx}
      />
    </GridActions.Provider>
  );
}

export default memo(ReportGrid);
