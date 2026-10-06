"use client";

import React, { useEffect, useState } from 'react';
import { Box, Button, Popover, TextField, Typography } from '@mui/material';
import PickerField from './picker-field';
import { line, radius, shadow } from './tokens';

const CONDITIONS = [
  { value: '==', label: 'Equals' },
  { value: '!=', label: 'Does not equal' },
  { value: '>', label: 'Greater than' },
  { value: '>=', label: 'Greater than or equal' },
  { value: '<', label: 'Less than' },
  { value: '<=', label: 'Less than or equal' },
  { value: 'between', label: 'Between' },
];

// Existing report criteria on the field → the popover's condition and values.
const fromCriteria = (current) => {
  const ge = current.find((c) => c.operator === '>=');
  const le = current.find((c) => c.operator === '<=');
  if (current.length === 2 && ge && le) return { op: 'between', a: ge.filters[0], b: le.filters[0] };
  if (current[0]) return { op: current[0].operator, a: current[0].filters[0] ?? '', b: '' };
  return { op: '>', a: '', b: '' };
};

/**
 * Condition filter for amount columns. It becomes a report filter applied to individual records
 * by the service — before they are grouped and summed — so it works on grouped views and on
 * every matching record, not just the rows loaded in the browser.
 *   onApply([{ operator, value }])  — empty list clears the filter
 */
export default function NumberFilterPopover({ anchorEl, column, current, onApply, onClose }) {
  const [op, setOp] = useState('>');
  const [a, setA] = useState('');
  const [b, setB] = useState('');

  useEffect(() => {
    if (!anchorEl) return;
    const init = fromCriteria(current || []);
    setOp(init.op);
    setA(init.a);
    setB(init.b);
  }, [anchorEl, current]);

  const isNum = (v) => v !== '' && !Number.isNaN(Number(v));
  const valid = op === 'between' ? isNum(a) && isNum(b) : isNum(a);
  const apply = () => {
    if (!valid) return;
    onApply(op === 'between'
      ? [{ operator: '>=', value: Math.min(Number(a), Number(b)) }, { operator: '<=', value: Math.max(Number(a), Number(b)) }]
      : [{ operator: op, value: Number(a) }]);
  };
  const onKeyDown = (e) => e.key === 'Enter' && apply();

  return (
    <Popover
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      slotProps={{ paper: { sx: { width: 320, mt: 0.75, borderRadius: radius.lg, p: 2, boxShadow: shadow.lg, border: `1px solid ${line}` } } }}
    >
      <Typography variant="subtitle2" noWrap sx={{ mb: 2 }}>{column?.header}</Typography>
      <PickerField label="Condition" value={op} options={CONDITIONS} popoverWidth={260} onChange={(v) => v && setOp(v)} />
      <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
        <TextField
          autoFocus
          fullWidth
          size="small"
          type="number"
          label={op === 'between' ? 'From' : 'Value'}
          value={a}
          onChange={(e) => setA(e.target.value)}
          onKeyDown={onKeyDown}
        />
        {op === 'between' && (
          <TextField fullWidth size="small" type="number" label="To" value={b} onChange={(e) => setB(e.target.value)} onKeyDown={onKeyDown} />
        )}
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
        <Button size="small" onClick={() => onApply([])} disabled={!current?.length} sx={{ px: 1, minWidth: 0, fontWeight: 700 }}>Clear filter</Button>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button size="small" onClick={onClose}>Cancel</Button>
          <Button size="small" variant="contained" onClick={apply} disabled={!valid} sx={{ fontWeight: 700 }}>Apply</Button>
        </Box>
      </Box>
    </Popover>
  );
}
