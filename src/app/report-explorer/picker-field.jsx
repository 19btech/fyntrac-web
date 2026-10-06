"use client";

import React, { useMemo, useState } from 'react';
import { alpha, useTheme } from '@mui/material/styles';
import {
  Box,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  Popover,
  TextField,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import HighlightOffOutlinedIcon from '@mui/icons-material/HighlightOffOutlined';

/**
 * The application's standard selector (as on the Diagnostic page: "Select Model",
 * "Select Posting Date"): a read-only field that opens a searchable list popover.
 * Shared here so every Report Explorer dropdown looks and behaves the same.
 *
 * options: [{ value, label }]
 */
export function PickerPopover({ anchorEl, onClose, options, value, onSelect, searchPlaceholder = 'Search...', emptyText = 'No options found.', width = 350 }) {
  const theme = useTheme();
  const [search, setSearch] = useState('');
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? options.filter((o) => String(o.label).toLowerCase().includes(q)) : options;
  }, [options, search]);

  return (
    <Popover
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      slotProps={{
        transition: { onExited: () => setSearch('') },
        paper: {
          sx: {
            mt: 0.75,
            width,
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(15,23,42,0.16)',
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden',
          },
        },
      }}
    >
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: alpha(theme.palette.divider, 0.6) }}>
        <TextField
          autoFocus
          fullWidth
          size="small"
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && filtered.length === 1) onSelect(filtered[0].value);
          }}
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
      <List dense disablePadding sx={{ maxHeight: 280, overflow: 'auto' }}>
        {filtered.length === 0 ? (
          <ListItemButton disabled sx={{ justifyContent: 'center', py: 2.5 }}>
            <Typography variant="caption" color="text.disabled">{emptyText}</Typography>
          </ListItemButton>
        ) : filtered.map((o) => (
          <ListItemButton
            key={o.value}
            selected={o.value === value}
            onClick={() => onSelect(o.value)}
            sx={{
              py: 1,
              px: 2,
              '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.06) },
              '&.Mui-selected': { bgcolor: alpha(theme.palette.primary.main, 0.1) },
              '&.Mui-selected:hover': { bgcolor: alpha(theme.palette.primary.main, 0.12) },
            }}
          >
            <ListItemText primary={o.label} slotProps={{ primary: { fontSize: '0.85rem', fontWeight: 500, color: 'text.primary' } }} />
          </ListItemButton>
        ))}
      </List>
    </Popover>
  );
}

export default function PickerField({
  label,
  value,
  options,
  onChange,
  clearable = false,
  disabled = false,
  placeholder,
  searchPlaceholder,
  emptyText,
  fullWidth = true,
  sx,
  popoverWidth,
}) {
  const [anchor, setAnchor] = useState(null);
  const selected = options.find((o) => o.value === value);

  return (
    <>
      <TextField
        fullWidth={fullWidth}
        size="small"
        label={label}
        placeholder={placeholder}
        value={selected ? selected.label : ''}
        disabled={disabled}
        onClick={(e) => !disabled && setAnchor(e.currentTarget)}
        onKeyDown={(e) => {
          if (!disabled && (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown')) {
            e.preventDefault();
            setAnchor(e.currentTarget);
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
            endAdornment: clearable && selected ? (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  aria-label={`Clear ${label || 'selection'}`}
                  onClick={(e) => { e.stopPropagation(); onChange(null); }}
                  sx={{ color: 'text.disabled', '&:hover': { color: 'error.main' } }}
                >
                  <HighlightOffOutlinedIcon sx={{ fontSize: '0.95rem' }} />
                </IconButton>
              </InputAdornment>
            ) : null,
          },
        }}
      />
      <PickerPopover
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        options={options}
        value={value}
        width={popoverWidth ?? (anchor ? Math.max(anchor.offsetWidth, 260) : 350)}
        searchPlaceholder={searchPlaceholder ?? `Search ${String(label || '').toLowerCase()}...`}
        emptyText={emptyText}
        onSelect={(v) => {
          setAnchor(null);
          onChange(v);
        }}
      />
    </>
  );
}
