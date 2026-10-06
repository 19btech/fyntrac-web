"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { alpha } from '@mui/material/styles';
import { Alert, Box, Button, Chip, Grid, TextField, Typography } from '@mui/material';
import { AppSwitch } from '../user-management/ui';
import { TimeField, TimeZoneField } from './fields';
import { CardStatus, FONT, FyntracCard, QUIET_BUTTON_SX, SaveBar, SectionLabel, SettingRow, StatusChip, choiceChipSx } from './ui';
import {
  CLOSE_DAYS, MONTHS, MONTHS_SHORT, closeDate, formatDate, formatInstant, localTimeZone, nextCloses, parseWhole, validateClose,
} from './schedule';

const toDraft = (config) => ({
  ...config,
  days: String(config.days ?? ''),
  perMonth: Array.from({ length: 12 }, (_, i) => String(config.perMonth?.[i] ?? config.days ?? '')),
});
const toConfig = (draft) => {
  const days = parseWhole(draft.days);
  // Months left blank while in "same" mode keep the shared delay, so nothing is stored as NaN.
  return { ...draft, days, perMonth: draft.perMonth.map((v) => (Number.isInteger(parseWhole(v)) ? parseWhole(v) : days)) };
};
const sameConfig = (a, b) => JSON.stringify(toConfig(a)) === JSON.stringify(toConfig(b));
const inRange = (n) => Number.isInteger(n) && n >= CLOSE_DAYS.min && n <= CLOSE_DAYS.max;
const digits = (value) => value.replace(/[^\d]/g, '').slice(0, 2);
const tfSx = { '& .MuiOutlinedInput-root': { borderRadius: 2, fontFamily: FONT, fontSize: '0.88rem' }, '& .MuiInputLabel-root': { fontFamily: FONT, fontSize: '0.88rem' } };

export default function AccountingClose({ config, loading, error, now, onSave, onDirtyChange }) {
  const [draft, setDraft] = useState(() => toDraft(config));
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setDraft(toDraft(config)); setTouched(false); }, [config]);

  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));
  const setMonth = (i, v) => setDraft((d) => ({ ...d, perMonth: d.perMonth.map((x, j) => (j === i ? v : x)) }));
  const dirty = !sameConfig(draft, toDraft(config));
  useEffect(() => { onDirtyChange?.(dirty); }, [dirty, onDirtyChange]);
  const errors = useMemo(() => validateClose(draft), [draft]);
  const valid = Object.keys(errors).length === 0;
  const next = useMemo(() => (valid ? nextCloses(toConfig(draft), now, 1)[0] : null), [draft, valid, now]);
  const year = new Date(now).getFullYear();
  const local = localTimeZone();
  // Range errors show once a field has a value; empty fields only after a save attempt.
  const show = (key, raw) => (touched || String(raw ?? '') !== '' ? errors[key] : undefined);

  const changeMode = (mode) => {
    if (mode === draft.mode) return;
    if (mode === 'perMonth') {
      // Start every month from the shared delay (when it is valid) unless months were already customised.
      const untouched = draft.perMonth.every((v) => v === draft.perMonth[0]);
      set({ mode, perMonth: untouched && inRange(parseWhole(draft.days)) ? Array(12).fill(draft.days) : draft.perMonth });
    } else {
      set({ mode, days: draft.days || draft.perMonth[0] || '' });
    }
  };

  const save = async () => {
    if (!valid) { setTouched(true); return; }
    setSaving(true);
    try { await onSave(toConfig(draft)); } finally { setSaving(false); }
  };

  const savedOn = Boolean(config.enabled);

  return (
    <FyntracCard
      title="Accounting Close Job"
      action={!loading && !error && <StatusChip status={savedOn ? 'ACTIVE' : 'INACTIVE'} />}
    >
      {(loading || error) && <CardStatus loading={loading} error={error} label="accounting close job" />}

      {!loading && !error && (
        <>
          <Box sx={{ p: 2.5 }}>
            <SectionLabel label="Schedule" first />

            <SettingRow
              title="Automatic Close"
              description="Automatically close the prior month once its delay after calendar month-end has passed."
            >
              <AppSwitch
                checked={Boolean(draft.enabled)}
                onChange={(e) => set({ enabled: e.target.checked })}
                slotProps={{ input: { 'aria-label': 'Automatic accounting close' } }}
              />
            </SettingRow>

            <SettingRow title="Close Time" description="Time of day the close job runs on the closing day, in the selected time zone.">
              <Box sx={{ width: 160 }}>
                <TimeField value={draft.time} onChange={(time) => set({ time })} error={errors.time} />
              </Box>
              <Box sx={{ width: { xs: '100%', sm: 300 } }}>
                <TimeZoneField value={draft.timeZone} onChange={(timeZone) => set({ timeZone })} error={touched ? errors.timeZone : undefined} />
              </Box>
            </SettingRow>

            <SectionLabel label="Close Delay" />

            <SettingRow
              title="Days After Month-End"
              description="Number of days after the calendar month-end before that month is closed — the same for every month, or set per month."
              below={draft.mode === 'perMonth' && (
                <Box sx={{ pt: 1, borderTop: '1px dashed', borderColor: 'divider' }}>
                  <Grid container spacing={1.5} sx={{ mt: 0.5 }}>
                    {MONTHS.map((m, i) => {
                      const err = show(`perMonth.${i}`, draft.perMonth[i]);
                      const n = parseWhole(draft.perMonth[i]);
                      const closesOn = inRange(n) ? closeDate(year, i, n) : null;
                      return (
                        <Grid key={m} size={{ xs: 6, sm: 4, md: 3, lg: 2 }}>
                          <TextField
                            size="small"
                            fullWidth
                            label={m}
                            value={draft.perMonth[i]}
                            onChange={(e) => setMonth(i, digits(e.target.value))}
                            error={Boolean(err)}
                            helperText={err || (closesOn != null ? `Closes ${formatDate(closesOn, { year: new Date(closesOn).getUTCFullYear() !== year })}` : ' ')}
                            slotProps={{ htmlInput: { inputMode: 'numeric', 'aria-label': `${m} — days after month-end` } }}
                            sx={tfSx}
                          />
                        </Grid>
                      );
                    })}
                  </Grid>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
                    <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', fontFamily: FONT }}>
                      Close dates shown for {year}. Each month must close on or after the month before it.
                    </Typography>
                    <Button
                      size="small"
                      disabled={!inRange(parseWhole(draft.perMonth[0])) || draft.perMonth.every((v) => v === draft.perMonth[0])}
                      onClick={() => set({ perMonth: Array(12).fill(draft.perMonth[0]) })}
                      sx={{ textTransform: 'none', fontWeight: 700, color: '#1a6ab9', ...QUIET_BUTTON_SX }}
                    >
                      Apply January to all months
                    </Button>
                  </Box>
                  {errors.order && <Alert severity="error" sx={{ mt: 1, borderRadius: 2 }}>{errors.order}</Alert>}
                </Box>
              )}
            >
              <Chip label="Same every month" size="small" onClick={() => changeMode('same')} sx={choiceChipSx(draft.mode === 'same')} />
              <Chip label="Different by month" size="small" onClick={() => changeMode('perMonth')} sx={choiceChipSx(draft.mode === 'perMonth')} />
              {draft.mode === 'same' && (
                <TextField
                  size="small"
                  label="# Days"
                  value={draft.days}
                  onChange={(e) => set({ days: digits(e.target.value) })}
                  error={Boolean(show('days', draft.days))}
                  helperText={show('days', draft.days)}
                  slotProps={{ htmlInput: { inputMode: 'numeric' } }}
                  sx={{ width: 120, ...tfSx }}
                />
              )}
            </SettingRow>

            <SettingRow
              title="Next Close"
              description={draft.enabled ? 'The next accounting period that will be closed with these settings.' : 'Automatic close is off — this is when the next period would close.'}
            >
              {next ? (
                <Box sx={{ textAlign: 'right' }}>
                  <Chip
                    label={`${MONTHS_SHORT[next.month]} ${next.year}`}
                    size="small"
                    sx={{ fontSize: '0.75rem', fontWeight: 600, bgcolor: alpha('#14213d', 0.07), color: '#14213d', border: '1px solid', borderColor: alpha('#14213d', 0.2), borderRadius: 1.5 }}
                  />
                  <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', fontFamily: FONT, mt: 0.5 }}>{formatInstant(next.at, draft.timeZone)}</Typography>
                  {local !== draft.timeZone && (
                    <Typography sx={{ fontSize: '0.7rem', color: 'text.disabled', fontFamily: FONT }}>{formatInstant(next.at, local, { weekday: false, year: false })} your time</Typography>
                  )}
                </Box>
              ) : (
                <Typography sx={{ fontSize: '0.78rem', color: 'text.disabled', fontFamily: FONT }}>Complete the settings above</Typography>
              )}
            </SettingRow>
          </Box>

          <SaveBar
            dirty={dirty}
            saving={saving}
            disabled={touched && !valid}
            onDiscard={() => { setDraft(toDraft(config)); setTouched(false); }}
            onSave={save}
          />
        </>
      )}
    </FyntracCard>
  );
}
