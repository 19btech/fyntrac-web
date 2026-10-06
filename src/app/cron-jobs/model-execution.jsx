"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { alpha } from '@mui/material/styles';
import { Box, Chip, TextField, Typography } from '@mui/material';
import PickerField from '../report-explorer/picker-field';
import { AppSwitch } from '../user-management/ui';
import { TimeField, TimeZoneField } from './fields';
import { CardStatus, FONT, FyntracCard, SaveBar, SectionLabel, SettingRow, StatusChip, choiceChipSx } from './ui';
import {
  MONTHLY_OFFSET, MONTHLY_RULES, formatInstant, localTimeZone, nextModelRuns, toModelSchedule, validateModelSchedule,
} from './schedule';

// Daily / month-end jobs store offsetDays 0; offer 3 days if the user switches to before / after.
const toDraft = (config) => ({ ...config, offsetDays: String(config.offsetDays || 3) });
// Compare what would be saved, so edits to a hidden field (e.g. days while Daily) aren't "changes".
const sameConfig = (a, b) => JSON.stringify(toModelSchedule(a)) === JSON.stringify(toModelSchedule(b));
const formatDay = (ts, timeZone) => new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric', timeZone }).format(new Date(ts));
const tfSx = { '& .MuiOutlinedInput-root': { borderRadius: 2, fontFamily: FONT, fontSize: '0.88rem' }, '& .MuiInputLabel-root': { fontFamily: FONT, fontSize: '0.88rem' } };

const RUN_DAY_HINT = {
  monthEnd: 'Runs on the last calendar day of every month.',
  beforeMonthEnd: 'Counts back from the last calendar day — 3 days before Jan 31 runs on Jan 28.',
  afterMonthEnd: 'Counts on from the last calendar day — 3 days after Jan 31 runs on Feb 3.',
};

export default function ModelExecution({ config, loading, error, now, onSave, onDirtyChange }) {
  const [draft, setDraft] = useState(() => toDraft(config));
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setDraft(toDraft(config)); setTouched(false); }, [config]);

  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));
  const dirty = !sameConfig(draft, toDraft(config));
  useEffect(() => { onDirtyChange?.(dirty); }, [dirty, onDirtyChange]);
  const errors = useMemo(() => validateModelSchedule(draft), [draft]);
  const valid = Object.keys(errors).length === 0;
  const next = useMemo(() => (valid ? nextModelRuns(toModelSchedule(draft), now, 1)[0] : null), [draft, valid, now]);
  const local = localTimeZone();
  const offsetError = touched || draft.offsetDays !== '' ? errors.offsetDays : undefined;

  const save = async () => {
    if (!valid) { setTouched(true); return; }
    setSaving(true);
    try { await onSave(toModelSchedule(draft)); } finally { setSaving(false); }
  };

  return (
    <FyntracCard
      title="Model Execution Job"
      action={!loading && !error && <StatusChip status={config.enabled ? 'ACTIVE' : 'INACTIVE'} />}
    >
      {(loading || error) && <CardStatus loading={loading} error={error} label="model execution job" />}

      {!loading && !error && (
        <>
          <Box sx={{ p: 2.5 }}>
            <SectionLabel label="Schedule" first />

            <SettingRow title="Automatic Execution" description="Trigger model execution automatically on the schedule below.">
              <AppSwitch
                checked={Boolean(draft.enabled)}
                onChange={(e) => set({ enabled: e.target.checked })}
                slotProps={{ input: { 'aria-label': 'Automatic model execution' } }}
              />
            </SettingRow>

            <SettingRow title="Run Time" description="Time of day model execution is triggered, in the selected time zone.">
              <Box sx={{ width: 160 }}>
                <TimeField value={draft.time} onChange={(time) => set({ time })} error={errors.time} />
              </Box>
              <Box sx={{ width: { xs: '100%', sm: 300 } }}>
                <TimeZoneField value={draft.timeZone} onChange={(timeZone) => set({ timeZone })} error={touched ? errors.timeZone : undefined} />
              </Box>
            </SettingRow>

            <SectionLabel label="Frequency" />

            <SettingRow title="Run Frequency" description="Run every day, or once a month around the calendar month-end.">
              <Chip label="Daily" size="small" onClick={() => set({ frequency: 'daily' })} sx={choiceChipSx(draft.frequency === 'daily')} />
              <Chip label="Monthly" size="small" onClick={() => set({ frequency: 'monthly' })} sx={choiceChipSx(draft.frequency === 'monthly')} />
            </SettingRow>

            {draft.frequency === 'monthly' && (
              <SettingRow title="Run Day" description={RUN_DAY_HINT[draft.monthlyRule] ?? RUN_DAY_HINT.monthEnd}>
                <Box sx={{ width: 240 }}>
                  <PickerField
                    label="Day of Month"
                    value={draft.monthlyRule}
                    options={MONTHLY_RULES}
                    onChange={(v) => v && set({ monthlyRule: v })}
                    searchPlaceholder="Search..."
                  />
                </Box>
                {draft.monthlyRule !== 'monthEnd' && (
                  <TextField
                    size="small"
                    label="# Days"
                    value={draft.offsetDays}
                    onChange={(e) => set({ offsetDays: e.target.value.replace(/[^\d]/g, '').slice(0, 2) })}
                    error={Boolean(offsetError)}
                    helperText={offsetError || `${MONTHLY_OFFSET.min}–${MONTHLY_OFFSET.max}`}
                    slotProps={{ htmlInput: { inputMode: 'numeric' } }}
                    sx={{ width: 120, ...tfSx }}
                  />
                )}
              </SettingRow>
            )}

            <SettingRow
              title="Next Run"
              description={draft.enabled ? 'When model execution will next be triggered with these settings.' : 'Automatic execution is off — this is when the next run would be.'}
            >
              {next ? (
                <Box sx={{ textAlign: 'right' }}>
                  <Chip
                    label={formatDay(next, draft.timeZone)}
                    size="small"
                    sx={{ fontSize: '0.75rem', fontWeight: 600, bgcolor: alpha('#14213d', 0.07), color: '#14213d', border: '1px solid', borderColor: alpha('#14213d', 0.2), borderRadius: 1.5 }}
                  />
                  <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', fontFamily: FONT, mt: 0.5 }}>{formatInstant(next, draft.timeZone)}</Typography>
                  {local !== draft.timeZone && (
                    <Typography sx={{ fontSize: '0.7rem', color: 'text.disabled', fontFamily: FONT }}>{formatInstant(next, local, { weekday: false, year: false })} your time</Typography>
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
