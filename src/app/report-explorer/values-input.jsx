"use client";

import React, { useState } from 'react';
import { Autocomplete, Chip, TextField } from '@mui/material';
import { splitValues } from './report-registry';

/**
 * Multi-value input for filters. Values can be typed or pasted comma-separated
 * ("REVENUE, NEW_BILLING") — each becomes its own chip on comma, Enter or leaving the field.
 * options: optional suggestions.
 */
export default function ValuesInput({ label = 'Values', value, onChange, options = [], disabled, loading, autoFocus, sx }) {
  const [input, setInput] = useState('');

  const commit = (text) => {
    const added = splitValues([text]);
    if (added.length) onChange(splitValues([...value, ...added]));
    setInput('');
  };

  return (
    <Autocomplete
      multiple
      freeSolo
      size="small"
      options={options}
      loading={loading}
      value={value}
      inputValue={input}
      disabled={disabled}
      filterSelectedOptions
      onChange={(_, vals) => {
        onChange(splitValues(vals));
        setInput('');
      }}
      onInputChange={(_, text, reason) => {
        if (reason === 'reset') return;
        // A comma closes a value: everything before the last comma becomes chips.
        if (text.includes(',')) {
          const lastComma = text.lastIndexOf(',');
          const done = splitValues([text.slice(0, lastComma)]);
          if (done.length) onChange(splitValues([...value, ...done]));
          setInput(text.slice(lastComma + 1).trimStart());
          return;
        }
        setInput(text);
      }}
      onBlur={() => input.trim() && commit(input)}
      renderValue={(vals, getItemProps) => vals.map((option, i) => {
        const { key, ...itemProps } = getItemProps({ index: i });
        return <Chip key={key} size="small" label={option} {...itemProps} />;
      })}
      renderInput={(params) => (
        <TextField
          {...params}
          autoFocus={autoFocus}
          label={label}
          placeholder={value.length ? '' : 'Type values, separated by commas'}
          sx={sx}
        />
      )}
    />
  );
}
