"use client";

import React, { useEffect, useState } from 'react';
import { Box, Button, Popover, Typography } from '@mui/material';
import PickerField from './picker-field';
import ValuesInput from './values-input';
import { OPERATORS, OPERATOR_LABELS } from './report-registry';
import { line, radius, shadow } from './tokens';

/**
 * Column filter for text, id and date columns: contains / does not contain / equals /
 * does not equal (plus comparisons for numbers and dates), one or more comma-separated values.
 * Becomes a report filter, so it runs on every matching record in the service.
 *   onApply({ operator, values })  — empty values clears the filter
 */
export default function TextFilterPopover({ anchorEl, column, current, loadValues, onApply, onClose }) {
  const [op, setOp] = useState('equals');
  const [values, setValues] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!anchorEl) return;
    setOp(current?.operator ?? 'equals');
    setValues(current?.filters ?? []);
  }, [anchorEl, current]);

  // Suggest the values the column actually has.
  useEffect(() => {
    if (!anchorEl || !column || !loadValues) return undefined;
    let cancelled = false;
    setLoading(true);
    loadValues(column.field)
      .then((vals) => { if (!cancelled) setSuggestions(vals.slice(0, 500)); })
      .catch(() => { if (!cancelled) setSuggestions([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [anchorEl, column, loadValues]);

  const conditions = (OPERATORS[column?.dataType] || OPERATORS.String).map((o) => ({ value: o, label: OPERATOR_LABELS[o] ?? o }));
  const comparison = ['>', '>=', '<', '<='].includes(op);

  return (
    <Popover
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      slotProps={{ paper: { sx: { width: 340, mt: 0.75, borderRadius: radius.lg, p: 2, boxShadow: shadow.lg, border: `1px solid ${line}` } } }}
    >
      <Typography variant="subtitle2" noWrap sx={{ mb: 2 }}>{column?.header}</Typography>
      <PickerField label="Condition" value={op} options={conditions} popoverWidth={260} onChange={(v) => v && setOp(v)} />
      <Box sx={{ mt: 2 }}>
        <ValuesInput
          autoFocus
          label={comparison ? 'Value' : 'Values'}
          value={comparison ? values.slice(0, 1) : values}
          options={suggestions}
          loading={loading}
          onChange={(vals) => setValues(comparison ? vals.slice(-1) : vals)}
        />
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
        <Button size="small" onClick={() => onApply({ operator: op, values: [] })} disabled={!current} sx={{ px: 1, minWidth: 0, fontWeight: 700 }}>
          Clear filter
        </Button>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button size="small" onClick={onClose}>Cancel</Button>
          <Button size="small" variant="contained" disabled={!values.length} onClick={() => onApply({ operator: op, values })} sx={{ fontWeight: 700 }}>
            Apply
          </Button>
        </Box>
      </Box>
    </Popover>
  );
}
