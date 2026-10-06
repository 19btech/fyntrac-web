"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@mui/material/styles';
import {
  Box,
  Button,
  ButtonBase,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import SpaceDashboardOutlinedIcon from '@mui/icons-material/SpaceDashboardOutlined';
import TableChartOutlinedIcon from '@mui/icons-material/TableChartOutlined';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import StarBorderRoundedIcon from '@mui/icons-material/StarBorderRounded';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';
import TextFieldsRoundedIcon from '@mui/icons-material/TextFieldsRounded';
import NumbersRoundedIcon from '@mui/icons-material/NumbersRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import FunctionsRoundedIcon from '@mui/icons-material/FunctionsRounded';
import PivotTableChartRoundedIcon from '@mui/icons-material/PivotTableChartRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import CriteriaEditor from './criteria-editor';
import PickerField, { PickerPopover } from './picker-field';
import { AGGREGATIONS } from './pivot';
import { EASE, EASE_CSS, enterSlide, line, radius, surface, tint } from './tokens';

const PANEL_WIDTH = 304;

const RAIL_ITEMS = [
  { id: 'reports', label: 'Reports', icon: SpaceDashboardOutlinedIcon },
  { id: 'data', label: 'Data', icon: TableChartOutlinedIcon, needsReport: true },
  { id: 'properties', label: 'Properties', icon: TuneRoundedIcon, needsReport: true },
];

const TITLES = { reports: 'Reports', data: 'Data', properties: 'Properties' };

function Section({ title, count, hint, children }) {
  return (
    <Box sx={{ '& + &': { mt: 2.5, pt: 2.5, borderTop: `1px solid ${line}` } }}>
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 1.25 }}>
        <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'text.secondary' }}>
          {title}
        </Typography>
        {count != null && <Typography variant="caption" color="text.disabled">{count}</Typography>}
      </Box>
      {children}
      {hint && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, lineHeight: 1.5 }}>
          {hint}
        </Typography>
      )}
    </Box>
  );
}

function FieldRow({ kind, label, onRemove, onClick, children }) {
  const theme = useTheme();
  const isDim = kind === 'dimension' || kind === 'pivot';
  const Icon = { dimension: TextFieldsRoundedIcon, pivot: PivotTableChartRoundedIcon, calc: FunctionsRoundedIcon }[kind] ?? NumbersRoundedIcon;
  return (
    <Box sx={enterSlide}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          pl: 1,
          pr: 0.5,
          py: 0.5,
          mb: 0.75,
          borderRadius: radius.md,
          border: `1px solid ${isDim ? tint(theme, 0.25) : line}`,
          bgcolor: isDim ? tint(theme, 0.05) : surface.raised,
          transition: `border-color 140ms ${EASE_CSS}`,
          '&:hover': { borderColor: isDim ? tint(theme, 0.45) : '#CBD5E1' },
          '&:hover .field-remove': { opacity: 1 },
        }}
      >
        <Icon sx={{ fontSize: 16, color: isDim ? 'primary.main' : 'text.secondary' }} />
        {onClick ? (
          <ButtonBase onClick={onClick} sx={{ flex: 1, minWidth: 0, justifyContent: 'flex-start', borderRadius: '4px' }} title={`Edit ${label}`} aria-label={`Edit ${label}`}>
            <Typography variant="body2" noWrap>{label}</Typography>
          </ButtonBase>
        ) : (
          <Typography variant="body2" noWrap sx={{ flex: 1, minWidth: 0 }} title={label}>{label}</Typography>
        )}
        {children}
        <IconButton
          size="small"
          className="field-remove"
          onClick={onRemove}
          aria-label={`Remove ${label}`}
          sx={{ p: 0.5, opacity: 0.55, transition: 'opacity 140ms' }}
        >
          <CloseRoundedIcon sx={{ fontSize: 15 }} />
        </IconButton>
      </Box>
    </Box>
  );
}

function AggregationPicker({ value, onChange }) {
  const [anchor, setAnchor] = React.useState(null);
  return (
    <>
      <ButtonBase
        onClick={(e) => setAnchor(e.currentTarget)}
        aria-label="Change aggregation"
        sx={{
          px: 0.75,
          py: 0.25,
          borderRadius: '4px',
          fontSize: '0.72rem',
          fontWeight: 600,
          color: 'text.secondary',
          bgcolor: surface.sunken,
          '&:hover': { color: 'text.primary' },
        }}
      >
        {AGGREGATIONS[value].label}
        <ExpandMoreRoundedIcon sx={{ fontSize: 14, ml: 0.25 }} />
      </ButtonBase>
      <PickerPopover
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        width={220}
        value={value}
        options={Object.entries(AGGREGATIONS).map(([key, { label }]) => ({ value: key, label }))}
        searchPlaceholder="Search aggregations..."
        onSelect={(key) => {
          setAnchor(null);
          onChange(key);
        }}
      />
    </>
  );
}

function FieldPicker({ options, label, onPick, emptyText }) {
  // Top margin leaves room for the floating label above the rows listed before it.
  return (
    <Box sx={{ mt: 2 }}>
      <PickerField
        label={label}
        value={null}
        options={options.map((o) => ({ value: o.field, label: o.header }))}
        emptyText={emptyText}
        onChange={(field) => field && onPick(options.find((o) => o.field === field))}
      />
    </Box>
  );
}

function DataPanel({ meta, dimensions, metrics, pivotField, pivotInfo, calcs, grouped, onGroupedChange, onChange, onNewCalc, onEditCalc, onRemoveCalc }) {
  const header = (field) => meta.find((m) => m.field === field)?.header ?? field;
  const used = new Set([...dimensions, ...metrics.map((m) => m.field), pivotField].filter(Boolean));

  return (
    <>
      {grouped !== null && grouped !== undefined && (
        <Section
          title="Detail level"
          hint={grouped
            ? 'One row per combination of the dimensions below, with the metrics summed across all matching records. Add or remove a dimension to change the grouping.'
            : 'Individual records. Large periods load the first 10,000 — use report filters to narrow down.'}
        >
          <ToggleButtonGroup
            exclusive
            fullWidth
            size="small"
            value={grouped ? 'grouped' : 'records'}
            onChange={(_, v) => v && onGroupedChange(v === 'grouped')}
            sx={{ '& .MuiToggleButton-root': { textTransform: 'none', fontWeight: 700, py: 0.5 } }}
          >
            <ToggleButton value="grouped">Grouped (sum)</ToggleButton>
            <ToggleButton value="records">Records</ToggleButton>
          </ToggleButtonGroup>
        </Section>
      )}
      <Section
        title="Dimensions"
        count={dimensions.length || null}
        hint={dimensions.length
          ? 'Rows are grouped by these columns, in order. Double-click a row to see its records.'
          : 'No grouping — add a dimension to group and sum.'}
      >
          {dimensions.map((field) => (
            <FieldRow
              key={field}
              kind="dimension"
              label={header(field)}
              onRemove={() => onChange({ dimensions: dimensions.filter((d) => d !== field) })}
            />
          ))}
        <FieldPicker
          options={meta.filter((m) => !used.has(m.field))}
          label="Add dimension"
          emptyText="All fields are in use."
          onPick={(o) => onChange({ dimensions: [...dimensions, o.field] })}
        />
      </Section>

      <Section title="Metrics" count={metrics.length || null} hint={!metrics.length && 'Add a numeric field to calculate totals.'}>
          {metrics.map((metric) => (
            <FieldRow
              key={metric.field}
              kind="metric"
              label={header(metric.field)}
              onRemove={() => onChange({ metrics: metrics.filter((m) => m.field !== metric.field) })}
            >
              <AggregationPicker
                value={metric.agg}
                onChange={(agg) => onChange({ metrics: metrics.map((m) => (m.field === metric.field ? { ...m, agg } : m)) })}
              />
            </FieldRow>
          ))}
        <FieldPicker
          options={meta.filter((m) => m.numeric && !used.has(m.field))}
          label="Add metric"
          emptyText="No more numeric fields."
          onPick={(o) => onChange({ metrics: [...metrics, { field: o.field, agg: 'sum' }] })}
        />
      </Section>

      <Section
        title="Pivot columns"
        hint={pivotField
          ? (dimensions.length
            ? `Each metric is split into a column per ${header(pivotField)} value${pivotInfo?.truncated ? ` (first ${pivotInfo.shown} of ${pivotInfo.total})` : ''}, plus a total.`
            : 'Add a row dimension above to see the pivot.')
          : 'Spread a field\'s values across columns, e.g. one column per accounting period.'}
      >
          {pivotField && (
            <FieldRow key={pivotField} kind="pivot" label={header(pivotField)} onRemove={() => onChange({ pivotField: null })} />
          )}
        {!pivotField && (
          <FieldPicker
            // Decimal fields are measures; text and integer fields (e.g. periods) can pivot.
            options={meta.filter((m) => m.dataType !== 'Double' && !used.has(m.field))}
            label="Pivot by field"
            emptyText="No fields left to pivot by."
            onPick={(o) => onChange({ pivotField: o.field })}
          />
        )}
      </Section>

      <Section title="Calculated columns" count={calcs.length || null} hint={!calcs.length && 'Build a column from a formula — differences, ratios, percentages or your own expression.'}>
          {calcs.map((c) => (
            <FieldRow key={c.id} kind="calc" label={c.name} onClick={() => onEditCalc(c.id)} onRemove={() => onRemoveCalc(c.id)} />
          ))}
        <Button
          fullWidth
          variant="outlined"
          size="small"
          startIcon={<AddRoundedIcon />}
          onClick={onNewCalc}
          sx={{ borderStyle: 'dashed', borderColor: line, color: 'text.secondary', py: 0.75, '&:hover': { borderStyle: 'dashed', color: 'primary.main', borderColor: 'primary.main', transform: 'none', boxShadow: 'none', bgcolor: 'transparent' } }}
        >
          New calculated column
        </Button>
      </Section>
    </>
  );
}

function PropertiesPanel({ report, sources, source, onSourceChange, attributes, criteria, periodFields, loadPeriods, onApplyCriteria, density, onDensityChange }) {
  return (
    <>
      {report.sourceLabel && (
        <Section title={report.sourceLabel}>
          <PickerField
            label={report.sourceLabel}
            value={source?.value ?? null}
            options={sources.map((o) => ({ value: o.value, label: o.label }))}
            emptyText={`No ${report.sourceLabel.toLowerCase()}s available.`}
            onChange={(v) => v && onSourceChange(sources.find((o) => o.value === v))}
          />
        </Section>
      )}

      <Section title="Report filters" count={criteria.length || null}>
        <CriteriaEditor attributes={attributes} criteria={criteria} periodFields={periodFields} loadPeriods={loadPeriods} onApply={onApplyCriteria} />
      </Section>

      <Section title="Row density">
        <ToggleButtonGroup
          exclusive
          fullWidth
          size="small"
          value={density}
          onChange={(_, v) => v && onDensityChange(v)}
          sx={{ '& .MuiToggleButton-root': { textTransform: 'none', fontWeight: 600, py: 0.5 } }}
        >
          <ToggleButton value="compact">Compact</ToggleButton>
          <ToggleButton value="standard">Standard</ToggleButton>
          <ToggleButton value="comfortable">Roomy</ToggleButton>
        </ToggleButtonGroup>
      </Section>
    </>
  );
}

function ReportsPanel({ items, activeKey, onOpen }) {
  const theme = useTheme();
  if (!items.length) {
    return <Typography variant="body2" color="text.secondary" sx={{ p: 1.5 }}>No reports in this tab.</Typography>;
  }
  return (
    <List dense disablePadding>
      {items.map((item) => {
        const selected = item.key === activeKey;
        return (
          <ListItemButton
            key={item.key}
            selected={selected}
            disabled={item.comingSoon}
            onClick={() => onOpen(item)}
            sx={{
              borderRadius: radius.md,
              mb: 0.25,
              py: 0.75,
              pr: 0.75,
              color: 'text.primary',
              '&:hover': { bgcolor: surface.sunken },
              '&.Mui-selected, &.Mui-selected:hover': { bgcolor: tint(theme, 0.08), color: 'primary.main' },
              '&.Mui-selected .MuiListItemText-primary': { color: 'primary.main', fontWeight: 600 },
            }}
          >
            <ListItemText
              primary={item.name}
              secondary={item.comingSoon ? 'Coming soon' : null}
              slotProps={{ primary: { variant: 'body2', noWrap: true }, secondary: { variant: 'caption' } }}
            />
            {item.onToggleFavorite && !item.comingSoon && (
              <IconButton
                size="small"
                aria-label={item.favorite ? `Remove ${item.name} from favorites` : `Add ${item.name} to favorites`}
                onClick={(e) => {
                  e.stopPropagation();
                  item.onToggleFavorite(e);
                }}
                sx={{ p: 0.5 }}
              >
                {item.favorite
                  ? <StarRoundedIcon sx={{ fontSize: 18, color: '#F59E0B' }} />
                  : <StarBorderRoundedIcon sx={{ fontSize: 18 }} />}
              </IconButton>
            )}
            <CheckRoundedIcon sx={{ fontSize: 18, ml: 0.25, color: 'primary.main', visibility: selected ? 'visible' : 'hidden' }} />
          </ListItemButton>
        );
      })}
    </List>
  );
}

export default function SidePanel({ panel, onPanelChange, hasReport, reportsPanel, dataPanel, propertiesPanel, onResetView }) {
  const theme = useTheme();
  const open = Boolean(panel) && (hasReport || panel === 'reports');
  const shown = panel;

  return (
    <Box sx={{ display: 'flex', height: '100%', borderLeft: `1px solid ${line}`, bgcolor: surface.raised }}>
      {open && (
        <Box sx={{ width: PANEL_WIDTH, height: '100%', display: 'flex', flexDirection: 'column', borderRight: `1px solid ${line}`, overflow: 'hidden' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, height: 52, borderBottom: `1px solid ${line}`, flexShrink: 0 }}>
            <Typography variant="subtitle2">{TITLES[shown]}</Typography>
            <Box sx={{ display: 'flex', gap: 0.25 }}>
              {shown === 'data' && (
                <Tooltip title="Reset to default columns">
                  <IconButton size="small" aria-label="Reset to default columns" onClick={onResetView}>
                    <RestartAltRoundedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              <Tooltip title="Close panel">
                <IconButton size="small" aria-label="Close panel" onClick={() => onPanelChange(null)}>
                  <CloseRoundedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
          <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', overflowX: 'hidden' }}>
            <motion.div
              key={shown}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.16, ease: EASE }}
            >
              <Box sx={{ p: shown === 'reports' ? 1 : 2 }}>
                {shown === 'reports' && <ReportsPanel {...reportsPanel} />}
                {shown === 'data' && dataPanel && <DataPanel {...dataPanel} />}
                {shown === 'properties' && propertiesPanel && <PropertiesPanel {...propertiesPanel} />}
              </Box>
            </motion.div>
          </Box>
        </Box>
      )}

      <Box component="nav" aria-label="Report panels" sx={{ width: 68, py: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
        {RAIL_ITEMS.map(({ id, label, icon: Icon, needsReport }) => {
          const disabled = needsReport && !hasReport;
          const active = open && panel === id;
          return (
            <Tooltip key={id} title={disabled ? 'Open a report first' : ''} placement="left">
              <span>
                <ButtonBase
                  disabled={disabled}
                  onClick={() => onPanelChange(active ? null : id)}
                  aria-pressed={active}
                  aria-label={label}
                  sx={{
                    position: 'relative',
                    width: 56,
                    py: 1,
                    borderRadius: radius.md,
                    flexDirection: 'column',
                    gap: 0.25,
                    color: active ? 'primary.main' : 'text.secondary',
                    bgcolor: active ? tint(theme, 0.08) : 'transparent',
                    opacity: disabled ? 0.4 : 1,
                    transition: `background-color 160ms ${EASE_CSS}, color 160ms ${EASE_CSS}`,
                    '&:hover': { bgcolor: active ? tint(theme, 0.12) : surface.sunken, color: active ? 'primary.main' : 'text.primary' },
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      left: -6,
                      top: 10,
                      bottom: 10,
                      width: 3,
                      borderRadius: 3,
                      bgcolor: 'primary.main',
                      transform: active ? 'scaleY(1)' : 'scaleY(0)',
                      transition: `transform 200ms ${EASE_CSS}`,
                    },
                  }}
                >
                  <Icon sx={{ fontSize: 20 }} />
                  <Typography variant="caption" sx={{ fontSize: '0.68rem', fontWeight: 600 }}>{label}</Typography>
                </ButtonBase>
              </span>
            </Tooltip>
          );
        })}
      </Box>
    </Box>
  );
}
