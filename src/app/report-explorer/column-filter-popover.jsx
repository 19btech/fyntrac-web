"use client";

import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  InputAdornment,
  Popover,
  TextField,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { line, radius, shadow, surface } from './tokens';

const MAX_VISIBLE = 500;

/**
 * Checkbox value filter for one column. No filter = every value ticked; ticking every value
 * again removes the filter.
 */
export default function ColumnFilterPopover({ anchorEl, column, values, selected, onApply, onClose }) {
  const [search, setSearch] = useState('');
  const [checked, setChecked] = useState(new Set());

  useEffect(() => {
    if (anchorEl) {
      setSearch('');
      setChecked(new Set(selected?.length ? selected : values));
    }
  }, [anchorEl, selected, values]);

  const everything = values.length > 0 && values.every((v) => checked.has(v));
  const apply = () => {
    if (!checked.size) return;
    onApply(everything ? [] : values.filter((v) => checked.has(v)));
  };

  const matching = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? values.filter((v) => v.toLowerCase().includes(q)) : values;
  }, [values, search]);

  const shown = matching.slice(0, MAX_VISIBLE);
  const allShownChecked = shown.length > 0 && shown.every((v) => checked.has(v));

  const toggle = (value) =>
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(value) ? next.delete(value) : next.add(value);
      return next;
    });

  const toggleAll = () =>
    setChecked((prev) => {
      const next = new Set(prev);
      shown.forEach((v) => (allShownChecked ? next.delete(v) : next.add(v)));
      return next;
    });

  return (
    <Popover
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      slotProps={{ paper: { sx: { width: 300, mt: 0.75, borderRadius: radius.lg, p: 2, boxShadow: shadow.lg, border: `1px solid ${line}` } } }}
    >
      <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 1, mb: 1.5 }}>
        <Typography variant="subtitle2" noWrap>{column?.header}</Typography>
        <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
          {everything ? `All ${values.length} values` : `${checked.size} of ${values.length} selected`}
        </Typography>
      </Box>
      <TextField
        size="small"
        fullWidth
        autoFocus
        placeholder="Search..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && apply()}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>
            ),
          },
        }}
      />

      <FormControlLabel
        sx={{ mt: 1, mb: 0.5, ml: 0 }}
        control={
          <Checkbox
            size="small"
            checked={allShownChecked}
            indeterminate={!allShownChecked && shown.some((v) => checked.has(v))}
            onChange={toggleAll}
          />
        }
        label={<Typography variant="body2" fontWeight={600}>{search ? 'Select matching' : 'Select all'}</Typography>}
      />

      <Box sx={{ maxHeight: 240, overflow: 'auto', border: `1px solid ${line}`, borderRadius: radius.md, bgcolor: surface.page, py: 0.5, px: 0.5 }}>
        {shown.map((value) => (
          <FormControlLabel
            key={value}
            sx={{ display: 'flex', ml: 0, mr: 0, borderRadius: '4px', '&:hover': { bgcolor: surface.sunken } }}
            control={<Checkbox size="small" checked={checked.has(value)} onChange={() => toggle(value)} />}
            label={<Typography variant="body2" noWrap>{value}</Typography>}
          />
        ))}
        {matching.length > MAX_VISIBLE && (
          <Typography variant="caption" color="text.secondary" sx={{ px: 1 }}>
            Showing first {MAX_VISIBLE} of {matching.length} — refine your search.
          </Typography>
        )}
        {shown.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ p: 1 }}>No values</Typography>
        )}
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1.5 }}>
        <Button size="small" onClick={() => onApply([])} disabled={!selected?.length} sx={{ px: 1, minWidth: 0 }}>Clear filter</Button>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button size="small" onClick={onClose}>Cancel</Button>
          <Button size="small" variant="contained" disabled={!checked.size} onClick={apply}>
            Apply
          </Button>
        </Box>
      </Box>
    </Popover>
  );
}
