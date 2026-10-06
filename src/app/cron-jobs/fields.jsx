"use client";

import React, { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { Box, Typography } from '@mui/material';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import PickerField from '../report-explorer/picker-field';
import { isValidTime, modernZoneName, timeZoneOptions } from './schedule';

const toDayjs = (time) => (isValidTime(time) ? dayjs(`2000-01-01T${time}`) : null);

/**
 * Time of day as "HH:mm". Keeps the picker's own value while the user types so a half-typed
 * time isn't wiped; an incomplete or invalid entry reports '' (which validation rejects).
 */
export function TimeField({ label = 'Time', value, onChange, error, helperText, disabled }) {
  const [local, setLocal] = useState(() => toDayjs(value));

  useEffect(() => {
    const current = local && local.isValid() ? local.format('HH:mm') : '';
    if (current !== (value || '')) setLocal(toDayjs(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <TimePicker
      label={label}
      value={local}
      disabled={disabled}
      onChange={(next) => {
        setLocal(next);
        onChange(next && next.isValid() ? next.format('HH:mm') : '');
      }}
      slotProps={{
        textField: { size: 'small', fullWidth: true, error: Boolean(error), helperText: error || helperText },
      }}
    />
  );
}

/** Searchable list of every time zone, labelled with its current UTC offset. */
export function TimeZoneField({ value, onChange, error, disabled }) {
  const options = useMemo(() => timeZoneOptions(), []);
  return (
    <Box>
      <PickerField
        label="Time zone"
        value={modernZoneName(value)}
        options={options}
        disabled={disabled}
        onChange={(v) => v && onChange(v)}
        searchPlaceholder="Search city, region or offset..."
        emptyText="No time zone matches."
        popoverWidth={380}
        sx={error ? { '& .MuiOutlinedInput-notchedOutline': { borderColor: 'error.main' } } : undefined}
      />
      {error && <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5, ml: 1.75 }}>{error}</Typography>}
    </Box>
  );
}
