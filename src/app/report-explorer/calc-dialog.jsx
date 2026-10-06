"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import {
  Autocomplete,
  Box,
  Button,
  ButtonBase,
  Chip,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import FunctionsRoundedIcon from '@mui/icons-material/FunctionsRounded';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import { FORMULA_TEMPLATES, compileFormula, fieldRef } from './formula';
import { formatNumber } from './pivot';
import ExplorerDialog, { primaryActionSx, secondaryActionSx } from './explorer-dialog';
import PickerField from './picker-field';
import { line, radius, surface, tint } from './tokens';

const templateById = Object.fromEntries(FORMULA_TEMPLATES.map((t) => [t.id, t]));

/**
 * Create or edit a calculated column.
 * calc (expression): { id, name, expression, format, template, inputs: [headerA, headerB] }
 * calc (sum where):  { id, name, type: 'sumWhere', metric, matchField, values, format, template: 'sumWhere' }
 * loadValues(field) → Promise<string[]> of the values a field takes (for "Sum where").
 */
export default function CalcDialog({ open, calc, meta, sampleRow, loadValues, onSave, onDelete, onClose }) {
  const theme = useTheme();
  const selfField = calc ? `calc:${calc.id}` : null;
  // Formula inputs: raw numeric fields plus "Sum where" columns (never the column being edited).
  const numericFields = useMemo(
    () => meta.filter((m) => m.numeric && (!m.calc || m.sumWhere) && m.field !== selfField),
    [meta, selfField]
  );
  const amountFields = useMemo(() => meta.filter((m) => m.numeric && !m.calc), [meta]);
  const matchFields = useMemo(() => meta.filter((m) => !m.calc && m.dataType !== 'Double'), [meta]);
  const headerOf = (field) => meta.find((m) => m.field === field)?.header ?? field;
  const [name, setName] = useState('');
  const [templateId, setTemplateId] = useState('difference');
  const [inputs, setInputs] = useState([null, null]);
  const [customExpression, setCustomExpression] = useState('');
  const [format, setFormat] = useState('number');
  const [swMetric, setSwMetric] = useState(null);
  const [swMatch, setSwMatch] = useState(null);
  const [swValues, setSwValues] = useState([]);
  const [valueOptions, setValueOptions] = useState([]);
  const [valuesLoading, setValuesLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const template = calc?.template && templateById[calc.template] ? calc.template : (calc ? 'custom' : 'difference');
    setName(calc?.name ?? '');
    setTemplateId(template);
    setInputs(calc?.inputs ?? [numericFields[0]?.header ?? null, numericFields[1]?.header ?? null]);
    setCustomExpression(calc?.expression ?? '');
    setFormat(calc?.format ?? 'number');
    setSwMetric(calc?.metric ?? amountFields[0]?.field ?? null);
    setSwMatch(calc?.matchField ?? matchFields.find((m) => /transaction|metric/i.test(m.field))?.field ?? null);
    setSwValues(calc?.values ?? []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, calc]);

  // Offer the values the chosen match field actually takes.
  useEffect(() => {
    if (!open || templateId !== 'sumWhere' || !swMatch || !loadValues) return undefined;
    let cancelled = false;
    setValuesLoading(true);
    loadValues(swMatch)
      .then((vals) => { if (!cancelled) setValueOptions(vals); })
      .catch(() => { if (!cancelled) setValueOptions([]); })
      .finally(() => { if (!cancelled) setValuesLoading(false); });
    return () => { cancelled = true; };
  }, [open, templateId, swMatch, loadValues]);

  const template = templateById[templateId];
  const isSumWhere = template.id === 'sumWhere';
  const expression = isSumWhere
    ? ''
    : template.id === 'custom'
      ? customExpression
      : template.inputs && inputs.slice(0, template.inputs).every(Boolean)
        ? template.build(...inputs)
        : '';
  const compiled = useMemo(() => {
    if (isSumWhere) {
      if (!swMetric || !swMatch) return { error: 'Choose the amount and the field to match' };
      if (!swValues.length) return { error: 'Pick at least one value to include' };
      return {};
    }
    return expression ? compileFormula(expression, meta) : { error: 'Choose the fields to use' };
  }, [isSumWhere, swMetric, swMatch, swValues, expression, meta]);
  const preview = !isSumWhere && !compiled.error && sampleRow ? compiled.evaluate(sampleRow) : null;
  const sumWhereText = swMetric && swMatch && swValues.length
    ? `${headerOf(swMetric)} where ${headerOf(swMatch)} is ${swValues.join(' or ')}`
    : '';
  const fallbackName = isSumWhere
    ? (swMetric && swValues.length ? `${headerOf(swMetric)} – ${swValues.join(' + ')}` : 'Sum where')
    : template.id === 'custom' ? 'Calculated column' : `${template.label}: ${inputs.slice(0, template.inputs).join(template.id === 'ratio' || template.id === 'percentOf' ? ' / ' : ', ')}`;

  const pickTemplate = (id) => {
    setTemplateId(id);
    if (templateById[id].format) setFormat(templateById[id].format);
    if (id === 'custom' && !customExpression && expression) setCustomExpression(expression);
  };

  const save = () => {
    const id = calc?.id ?? `c${Date.now().toString(36)}`;
    if (isSumWhere) {
      onSave({ id, name: name.trim() || fallbackName, type: 'sumWhere', template: 'sumWhere', metric: swMetric, matchField: swMatch, values: swValues, format });
      return;
    }
    onSave({ id, name: name.trim() || fallbackName, expression, format, template: templateId, inputs });
  };

  const fieldOptions = numericFields.map((m) => ({ value: m.header, label: m.header }));
  const fieldSelect = (index, label) => (
    <Box sx={{ flex: 1 }}>
      <PickerField
        label={label}
        value={inputs[index]}
        options={fieldOptions}
        emptyText="No numeric fields."
        onChange={(v) => setInputs((prev) => prev.map((x, i) => (i === index ? v : x)))}
        sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'background.paper' } }}
      />
    </Box>
  );

  return (
    <ExplorerDialog
      open={open}
      onClose={onClose}
      kind="Calculated column"
      kindIcon={<FunctionsRoundedIcon />}
      title={calc ? 'Edit Calculated Column' : 'New Calculated Column'}
      actions={(
        <>
          {calc && onDelete && (
            <Button color="error" onClick={() => onDelete(calc.id)} sx={{ ...secondaryActionSx, color: 'error.main', mr: 'auto' }}>
              Delete column
            </Button>
          )}
          <Button onClick={onClose} sx={secondaryActionSx}>Cancel</Button>
          <Button variant="contained" onClick={save} disabled={Boolean(compiled.error)} sx={primaryActionSx}>
            {calc ? 'Save Changes' : 'Add Column'}
          </Button>
        </>
      )}
    >
        <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'text.secondary' }}>
          Formula
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 1, mt: 1, mb: 2.5 }}>
          {FORMULA_TEMPLATES.map((t) => {
            const selected = t.id === templateId;
            return (
              <ButtonBase
                key={t.id}
                onClick={() => pickTemplate(t.id)}
                aria-pressed={selected}
                sx={{
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  textAlign: 'left',
                  p: 1.25,
                  borderRadius: radius.md,
                  border: `1px solid ${selected ? theme.palette.primary.main : line}`,
                  bgcolor: selected ? tint(theme, 0.06) : 'background.paper',
                  transition: 'border-color 140ms, background-color 140ms',
                  '&:hover': { borderColor: selected ? theme.palette.primary.main : '#CBD5E1' },
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 600, color: selected ? 'primary.main' : 'text.primary' }}>{t.label}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>{t.hint}</Typography>
              </ButtonBase>
            );
          })}
        </Box>

        {isSumWhere ? (
          <>
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Box sx={{ flex: 1 }}>
                <PickerField
                  label="Amount"
                  value={swMetric}
                  options={amountFields.map((m) => ({ value: m.field, label: m.header }))}
                  emptyText="No numeric fields."
                  onChange={setSwMetric}
                  sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'background.paper' } }}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <PickerField
                  label="Where"
                  value={swMatch}
                  options={matchFields.map((m) => ({ value: m.field, label: m.header }))}
                  emptyText="No fields to match on."
                  onChange={(v) => { setSwMatch(v); setSwValues([]); }}
                  sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'background.paper' } }}
                />
              </Box>
            </Box>
            <Autocomplete
              multiple
              freeSolo
              size="small"
              sx={{ mt: 2 }}
              options={valueOptions}
              loading={valuesLoading}
              value={swValues}
              disabled={!swMatch}
              onChange={(_, vals) => setSwValues([...new Set(vals.map((v) => String(v).trim()).filter(Boolean))])}
              renderValue={(vals, getItemProps) => vals.map((option, i) => {
                const { key, ...itemProps } = getItemProps({ index: i });
                return <Chip key={key} size="small" label={option} {...itemProps} />;
              })}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Is any of"
                  placeholder={swValues.length ? '' : valuesLoading ? 'Loading values…' : 'Pick one or more values'}
                  sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'background.paper' } }}
                />
              )}
            />
          </>
        ) : template.id === 'custom' ? (
          <>
            <TextField
              fullWidth
              multiline
              minRows={2}
              label="Expression"
              value={customExpression}
              onChange={(e) => setCustomExpression(e.target.value)}
              placeholder="([Revenue] - [New Billing]) / ABS([Beginning Deferred Revenue]) * 100"
              slotProps={{ htmlInput: { style: { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: '0.85rem' } } }}
            />
            <Box sx={{ display: 'flex', gap: 1, mt: 1, alignItems: 'center', flexWrap: 'wrap' }}>
              <PickerField
                label="Insert field"
                value={null}
                options={fieldOptions}
                fullWidth={false}
                sx={{ width: 240, '& .MuiOutlinedInput-root': { bgcolor: 'background.paper' } }}
                onChange={(v) => v && setCustomExpression((prev) => `${prev}${prev && !prev.endsWith(' ') ? ' ' : ''}${fieldRef(v)}`)}
              />
              <Typography variant="caption" color="text.secondary">
                Use + − * / ( ) and ABS, ROUND(x, n), MIN, MAX
              </Typography>
            </Box>
          </>
        ) : (
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            {fieldSelect(0, template.inputs === 1 ? 'Field' : 'Field A')}
            {template.inputs === 2 && fieldSelect(1, 'Field B')}
          </Box>
        )}

        <Box
          sx={{
            mt: 2,
            p: 1.5,
            borderRadius: radius.md,
            bgcolor: compiled.error ? 'rgba(239, 68, 68, 0.05)' : surface.page,
            border: `1px solid ${compiled.error ? 'rgba(239, 68, 68, 0.25)' : line}`,
            display: 'flex',
            gap: 1,
            alignItems: 'flex-start',
          }}
        >
          {compiled.error
            ? <ErrorOutlineRoundedIcon fontSize="small" color="error" sx={{ mt: 0.25 }} />
            : <CheckCircleOutlineRoundedIcon fontSize="small" color="success" sx={{ mt: 0.25 }} />}
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontFamily: isSumWhere ? 'inherit' : 'ui-monospace, SFMono-Regular, Menlo, monospace', wordBreak: 'break-word', fontWeight: isSumWhere ? 600 : 400 }}>
              {isSumWhere ? (sumWhereText ? `Σ ${sumWhereText}` : '—') : (expression || '—')}
            </Typography>
            <Typography variant="caption" color={compiled.error ? 'error' : 'text.secondary'}>
              {compiled.error
                ? compiled.error
                : isSumWhere
                  ? 'Added up on every row, subtotal and total — only records matching these values count.'
                  : sampleRow
                    ? `First row: ${preview === null ? 'blank (e.g. divide by zero)' : formatNumber(preview, 'Double', format)}`
                    : 'Formula is valid'}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mt: 2.5, alignItems: 'flex-end' }}>
          <TextField
            label="Column name"
            size="small"
            value={name}
            placeholder={fallbackName}
            onChange={(e) => setName(e.target.value)}
            sx={{ flex: 1 }}
            slotProps={{ inputLabel: { shrink: true }, htmlInput: { maxLength: 60 } }}
          />
          <ToggleButtonGroup
            exclusive
            size="small"
            value={format}
            onChange={(_, v) => v && setFormat(v)}
            sx={{ '& .MuiToggleButton-root': { textTransform: 'none', fontWeight: 600, px: 1.5 } }}
          >
            <ToggleButton value="number">1,234.56</ToggleButton>
            <ToggleButton value="percent">12.34%</ToggleButton>
          </ToggleButtonGroup>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
          Calculated on each row as displayed — on summary, subtotal and total rows it uses the aggregated values,
          so ratios stay correct.
        </Typography>
    </ExplorerDialog>
  );
}
