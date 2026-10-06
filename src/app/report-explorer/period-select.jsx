"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { alpha, useTheme } from '@mui/material/styles';
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  Popover,
  TextField,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import { periodLabel, summarizePeriods, yearPeriods } from './report-registry';
import { line, radius, shadow } from './tokens';

const CHECKBOX_SX = { p: 0.5, mr: 1 };

// Every period with data is ticked: the same as no period filter.
const coversAll = (selection, periods) => periods.length > 0 && periods.every((p) => selection.includes(p));
// A selection to store: ticking everything means "no filter"; a year whose periods are all
// ticked becomes the whole year (so it reads "2026" and covers months that get data later).
const normalize = (selection, periods) => {
  if (coversAll(selection, periods)) return [];
  const years = [...new Set(selection.map((p) => String(p).slice(0, 4)))];
  return [...new Set(years.flatMap((y) => {
    const inYear = selection.filter((p) => String(p).startsWith(y));
    return periods.filter((p) => p.startsWith(y)).every((p) => inYear.includes(p)) ? [...inYear, ...yearPeriods(y)] : inYear;
  }))];
};

/**
 * Accounting periods (yyyymm) grouped by year, newest first. Tick single periods or a whole
 * year — a year selects all twelve of its periods, so months that get data later are included.
 *   periods: ['202608', '202607', …]   value / onChange: selected periods
 */
function PeriodList({ periods, loading, value, onChange }) {
  const theme = useTheme();
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(() => new Set());
  const selected = useMemo(() => new Set(value), [value]);

  const years = useMemo(() => {
    const byYear = new Map();
    periods.forEach((p) => {
      const y = p.slice(0, 4);
      if (!byYear.has(y)) byYear.set(y, []);
      byYear.get(y).push(p);
    });
    return [...byYear.entries()].map(([year, list]) => ({ year, periods: list }));
  }, [periods]);

  // Open the latest year, and any year with a selection, when the list first loads.
  useEffect(() => {
    if (!years.length) return;
    setExpanded(new Set([years[0].year, ...value.map((v) => String(v).slice(0, 4))]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [years]);

  const q = search.trim().toLowerCase();
  const visible = q
    ? years
      .map((y) => ({ ...y, periods: y.year.includes(q) ? y.periods : y.periods.filter((p) => p.includes(q) || periodLabel(p).toLowerCase().includes(q)) }))
      .filter((y) => y.periods.length)
    : years;

  const toggleYear = (year, list) => {
    const all = list.every((p) => selected.has(p));
    const months = new Set(yearPeriods(year));
    onChange(all ? value.filter((v) => !months.has(String(v))) : [...new Set([...value, ...yearPeriods(year)])]);
  };
  const togglePeriod = (p) => onChange(selected.has(p) ? value.filter((v) => String(v) !== p) : [...value, p]);
  const toggleExpanded = (year) => setExpanded((prev) => {
    const next = new Set(prev);
    if (next.has(year)) next.delete(year); else next.add(year);
    return next;
  });

  const rowSx = {
    py: 0.25,
    px: 1,
    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.06) },
  };

  return (
    <>
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: alpha(theme.palette.divider, 0.6) }}>
        <TextField
          autoFocus
          fullWidth
          size="small"
          placeholder="Search periods or years..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                </InputAdornment>
              ),
            },
          }}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
        />
      </Box>
      <List dense disablePadding aria-label="Accounting periods" sx={{ maxHeight: 300, overflow: 'auto', py: 0.5 }}>
        {loading && !periods.length ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}><CircularProgress size={20} /></Box>
        ) : visible.length === 0 ? (
          <ListItemButton disabled sx={{ justifyContent: 'center', py: 2.5 }}>
            <Typography variant="caption" color="text.disabled">No periods found.</Typography>
          </ListItemButton>
        ) : [
          (() => {
            // "All periods", or every period matching the search.
            const scope = q ? visible.flatMap((y) => y.periods) : periods;
            const all = scope.every((p) => selected.has(p));
            const some = scope.some((p) => selected.has(p));
            const label = q ? 'Select matching' : 'All periods';
            return (
              <ListItemButton
                key="__all"
                onClick={() => onChange(all ? value.filter((v) => !scope.includes(String(v))) : [...new Set([...value, ...scope])])}
                sx={{ ...rowSx, pl: 4 }}
              >
                <Checkbox
                  size="small"
                  tabIndex={-1}
                  checked={all}
                  indeterminate={some && !all}
                  slotProps={{ input: { 'aria-label': label } }}
                  sx={CHECKBOX_SX}
                />
                <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, flex: 1 }}>{label}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {all ? `${scope.length} selected` : `${scope.filter((p) => selected.has(p)).length} of ${scope.length}`}
                </Typography>
              </ListItemButton>
            );
          })(),
          ...visible.map(({ year, periods: list }) => {
          const count = list.filter((p) => selected.has(p)).length;
          const open = Boolean(q) || expanded.has(year);
          return (
            <React.Fragment key={year}>
              <ListItemButton onClick={() => toggleYear(year, list)} sx={rowSx}>
                <IconButton
                  size="small"
                  aria-label={`${open ? 'Collapse' : 'Expand'} ${year}`}
                  onClick={(e) => { e.stopPropagation(); toggleExpanded(year); }}
                  sx={{ p: 0.25, mr: 0.25 }}
                >
                  {open ? <ExpandMoreRoundedIcon fontSize="small" /> : <ChevronRightRoundedIcon fontSize="small" />}
                </IconButton>
                <Checkbox
                  size="small"
                  tabIndex={-1}
                  checked={count === list.length}
                  indeterminate={count > 0 && count < list.length}
                  slotProps={{ input: { 'aria-label': `Year ${year}` } }}
                  sx={CHECKBOX_SX}
                />
                <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, flex: 1 }}>{year}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {count ? `${count} of ${list.length}` : `${list.length} period${list.length === 1 ? '' : 's'}`}
                </Typography>
              </ListItemButton>
              {open && list.map((p) => (
                <ListItemButton key={p} onClick={() => togglePeriod(p)} sx={{ ...rowSx, pl: 4.5 }}>
                  <Checkbox size="small" tabIndex={-1} checked={selected.has(p)} slotProps={{ input: { 'aria-label': `Period ${p}` } }} sx={CHECKBOX_SX} />
                  <Typography sx={{ fontSize: '0.85rem', fontWeight: 500, flex: 1 }}>{p}</Typography>
                  <Typography variant="caption" color="text.secondary">{periodLabel(p)}</Typography>
                </ListItemButton>
              ))}
            </React.Fragment>
          );
        }),
        ]}
      </List>
    </>
  );
}

// Loads the periods once each time the picker opens (cached by the caller's loader).
const usePeriods = (open, loadPeriods) => {
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!open || !loadPeriods) return undefined;
    let cancelled = false;
    setLoading(true);
    loadPeriods()
      .then((list) => { if (!cancelled) setPeriods(list); })
      .catch(() => { if (!cancelled) setPeriods([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [open, loadPeriods]);
  return { periods, loading };
};

const PAPER_SX = { width: 320, mt: 0.75, borderRadius: radius.lg, boxShadow: shadow.lg, border: `1px solid ${line}`, overflow: 'hidden' };

/**
 * Column filter for the accounting period: multi-select of periods and years.
 *   onApply(values) — empty clears the filter
 */
export function PeriodFilterPopover({ anchorEl, column, current, loadPeriods, onApply, onClose }) {
  const [values, setValues] = useState([]);
  const { periods, loading } = usePeriods(Boolean(anchorEl), loadPeriods);

  // No period filter = every period ticked.
  useEffect(() => {
    if (anchorEl) setValues(current?.filters?.length ? current.filters.map(String) : periods);
  }, [anchorEl, current, periods]);

  return (
    <Popover
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      slotProps={{ paper: { sx: PAPER_SX } }}
    >
      <Typography variant="subtitle2" noWrap sx={{ px: 2, pt: 2, pb: 0.5 }}>{column?.header}</Typography>
      <PeriodList periods={periods} loading={loading} value={values} onChange={setValues} />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1.5, borderTop: `1px solid ${line}` }}>
        <Button size="small" onClick={() => onApply([])} disabled={!current} sx={{ px: 1, minWidth: 0, fontWeight: 700 }}>
          Clear filter
        </Button>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button size="small" onClick={onClose}>Cancel</Button>
          <Button size="small" variant="contained" disabled={!values.length} onClick={() => onApply(normalize(values, periods))} sx={{ fontWeight: 700 }}>
            Apply
          </Button>
        </Box>
      </Box>
    </Popover>
  );
}

/**
 * Period selector for the Properties filter editor: reads like the other pickers, opens the
 * same period / year multi-select.
 */
export function PeriodField({ label = 'Periods', value, onChange, loadPeriods, disabled, sx }) {
  const [anchor, setAnchor] = useState(null);
  const [draft, setDraft] = useState([]);
  const { periods, loading } = usePeriods(Boolean(anchor), loadPeriods);
  const open = (e) => !disabled && setAnchor(e.currentTarget);
  // Edits stay in the picker until Done; no selection shows every period ticked.
  useEffect(() => {
    if (anchor) setDraft(value.length ? value.map(String) : periods);
  }, [anchor, value, periods]);
  const close = () => {
    onChange(normalize(draft, periods));
    setAnchor(null);
  };

  return (
    <>
      <TextField
        fullWidth
        size="small"
        label={label}
        value={value.length ? summarizePeriods(value).join(', ') : 'All periods'}
        disabled={disabled}
        onClick={open}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
            e.preventDefault();
            open(e);
          }
        }}
        sx={{ '& .MuiInputLabel-root:not(.MuiInputLabel-shrink)': { fontSize: '0.875rem' }, ...sx }}
        slotProps={{
          htmlInput: { readOnly: true, style: { cursor: disabled ? 'default' : 'pointer' }, 'aria-haspopup': 'listbox' },
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" sx={{ color: 'text.disabled' }} />
              </InputAdornment>
            ),
          },
        }}
      />
      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={close}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{ paper: { sx: { ...PAPER_SX, width: anchor ? Math.max(anchor.offsetWidth, 280) : 320 } } }}
      >
        <PeriodList periods={periods} loading={loading} value={draft} onChange={setDraft} />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1.5, borderTop: `1px solid ${line}` }}>
          <Button size="small" variant="contained" onClick={close} sx={{ fontWeight: 700 }}>
            Done
          </Button>
        </Box>
      </Popover>
    </>
  );
}
