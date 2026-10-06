"use client";

import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import { COLUMN_LABELS, OPERATORS, OPERATOR_LABELS } from './report-registry';
import ValuesInput from './values-input';
import PickerField from './picker-field';
import { PeriodField } from './period-select';
import { line, radius, surface } from './tokens';

export const emptyCriterion = () => ({
  attributeName: '',
  operator: '',
  values: '',
  filters: [],
  logicalOperator: 'AND',
});

/**
 * Server-side report criteria (same payload as the legacy report pages).
 * Edits are local until "Apply & run".
 */
export default function CriteriaEditor({ attributes, criteria, periodFields, loadPeriods, onApply }) {
  const [draft, setDraft] = useState(criteria);

  useEffect(() => setDraft(criteria.length ? criteria : [emptyCriterion()]), [criteria]);

  const update = (index, patch) =>
    setDraft((prev) => prev.map((c, i) => (i === index ? { ...c, ...patch } : c)));

  const typeOf = (name) => attributes.find((a) => a.attributeName === name)?.dataType;
  // Accounting periods are picked from a period / year list; the condition is always "equals".
  const isPeriod = (name) => Boolean(periodFields?.has(name));

  return (
    <Box>
      {draft.map((c, index) => (
        <Box key={index}>
          <Box sx={{ border: `1px solid ${line}`, borderRadius: radius.md, bgcolor: surface.page, p: 1.5, pt: 1, position: 'relative' }}>
            {draft.length > 1 && (
              <IconButton
                size="small"
                onClick={() => setDraft((prev) => prev.filter((_, i) => i !== index))}
                sx={{ position: 'absolute', top: 2, right: 2, p: 0.5 }}
                aria-label="Remove filter"
              >
                <CloseRoundedIcon fontSize="small" />
              </IconButton>
            )}
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600, mb: 1.75 }}>
              Condition {index + 1}
            </Typography>
            <PickerField
              label="Attribute"
              value={c.attributeName || null}
              options={attributes.map((a) => ({ value: a.attributeName, label: COLUMN_LABELS[a.attributeName] || a.attributeAlias || a.attributeName }))}
              emptyText="No attributes available."
              onChange={(v) => update(index, { attributeName: v || '', operator: isPeriod(v) ? 'equals' : '', filters: [] })}
              sx={{ mb: 1.25, bgcolor: surface.raised }}
            />
            {isPeriod(c.attributeName) ? (
              <PeriodField
                value={c.filters}
                loadPeriods={loadPeriods}
                onChange={(filters) => update(index, { operator: 'equals', filters })}
                sx={{ bgcolor: surface.raised }}
              />
            ) : (
              <>
                <PickerField
                  label="Condition"
                  value={c.operator || null}
                  disabled={!c.attributeName}
                  options={(OPERATORS[typeOf(c.attributeName)] || OPERATORS.String).map((op) => ({ value: op, label: OPERATOR_LABELS[op] ?? op }))}
                  popoverWidth={240}
                  onChange={(v) => update(index, { operator: v || '' })}
                  sx={{ mb: 1.25, bgcolor: surface.raised }}
                />
                <ValuesInput
                  value={c.filters}
                  disabled={!c.operator}
                  onChange={(filters) => update(index, { filters })}
                  sx={{ bgcolor: surface.raised }}
                />
              </>
            )}
          </Box>

          {index < draft.length - 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 1 }}>
              <ToggleButtonGroup
                exclusive
                size="small"
                value={c.logicalOperator}
                onChange={(_, v) => v && update(index, { logicalOperator: v })}
              >
                <ToggleButton value="AND" sx={{ px: 2, py: 0.25 }}>AND</ToggleButton>
                <ToggleButton value="OR" sx={{ px: 2, py: 0.25 }}>OR</ToggleButton>
              </ToggleButtonGroup>
            </Box>
          )}
        </Box>
      ))}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1.5, gap: 1 }}>
        <Button size="small" startIcon={<AddRoundedIcon />} onClick={() => setDraft((prev) => [...prev, emptyCriterion()])} sx={{ fontWeight: 700 }}>
          Add filter
        </Button>
        <Button
            size="small"
            variant="contained"
            disableElevation
            startIcon={<CheckRoundedIcon />}
            onClick={() => onApply(draft)}
            sx={{ fontWeight: 700, px: 2 }}
          >
          Apply
        </Button>
      </Box>
    </Box>
  );
}
