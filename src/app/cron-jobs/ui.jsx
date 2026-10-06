"use client";

import React from 'react';
import { alpha, useTheme } from '@mui/material/styles';
import { Box, Button, Card, Chip, CircularProgress, Typography } from '@mui/material';

/*
 * Building blocks taken from the app's existing screens so Cron Jobs looks like the rest of it:
 *   FyntracCard, StatusChip, HEADER_ICON_SX  → Model Management (model/page.jsx)
 *   SettingRow, SectionLabel, choiceChipSx, NAVY_BUTTON_SX → Tenant Management (settings/page.jsx)
 */

export const FONT = '"Inter", "Helvetica Neue", Arial, sans-serif';

export const HEADER_ICON_SX = {
  bgcolor: 'white',
  boxShadow: 1,
  transition: 'background-color 0.2s, box-shadow 0.2s',
  '&:hover': { bgcolor: 'grey.50', boxShadow: 3 },
};

// Text buttons stay put: the theme otherwise lifts and glows every button on hover.
export const QUIET_BUTTON_SX = { '&:hover': { transform: 'none', boxShadow: 'none' } };

export const NAVY_BUTTON_SX = {
  borderRadius: 2, textTransform: 'none', fontWeight: 700, fontFamily: FONT, px: 2.5,
  background: '#14213d', color: '#fff',
  boxShadow: '0 4px 12px rgba(20,33,61,0.28)',
  transition: 'all 0.2s ease-in-out',
  '&:hover': { background: '#1e3057', boxShadow: '0 6px 18px rgba(20,33,61,0.4)', transform: 'translateY(-1px)' },
  '&.Mui-disabled': { background: 'rgba(20,33,61,0.4)', color: '#fff', boxShadow: 'none' },
};

export const TABLE_HEAD_CELL_SX = { fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', color: 'text.secondary', whiteSpace: 'nowrap' };

/** Selectable chip, as the period chips on Tenant Management. */
export const choiceChipSx = (active) => ({
  fontWeight: active ? 700 : 500,
  fontSize: '0.75rem',
  cursor: 'pointer',
  border: '1px solid',
  borderColor: active ? alpha('#2563EB', 0.5) : alpha('#94a3b8', 0.35),
  bgcolor: active ? alpha('#2563EB', 0.08) : 'transparent',
  color: active ? '#2563EB' : 'text.secondary',
  transition: 'all 0.15s',
  '&:hover': { borderColor: alpha('#2563EB', 0.4), bgcolor: alpha('#2563EB', 0.05) },
});

export function FyntracCard({ title, children, action, sx }) {
  const theme = useTheme();
  return (
    <Card
      elevation={0}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: `0px 2px 4px ${alpha(theme.palette.grey[300], 0.4)}, 0px 0px 2px ${alpha(theme.palette.grey[400], 0.2)}`,
        bgcolor: 'background.paper',
        transition: 'none',
        '&:hover': { transform: 'none', boxShadow: `0px 2px 4px ${alpha(theme.palette.grey[300], 0.4)}, 0px 0px 2px ${alpha(theme.palette.grey[400], 0.2)}`, borderColor: 'divider' },
        ...sx,
      }}
    >
      <Box
        sx={{
          px: 3, py: 2, gap: 2,
          borderBottom: '1px solid',
          borderColor: alpha(theme.palette.divider, 0.5),
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap',
          bgcolor: alpha(theme.palette.primary.main, 0.08),
          borderRadius: '12px 12px 0 0',
        }}
      >
        <Typography variant="h6" sx={{ fontSize: '1.05rem', fontWeight: 700, color: 'text.primary' }}>{title}</Typography>
        {action}
      </Box>
      <Box>{children}</Box>
    </Card>
  );
}

const STATUS = {
  ACTIVE: { bg: alpha('#22c55e', 0.1), color: '#166534', border: alpha('#22c55e', 0.2) },
  INACTIVE: { bg: alpha('#64748b', 0.1), color: '#334155', border: alpha('#64748b', 0.2) },
  INVALID: { bg: alpha('#ef4444', 0.1), color: '#991b1b', border: alpha('#ef4444', 0.2) },
  SCHEDULED: { bg: alpha('#3b82f6', 0.1), color: '#1e40af', border: alpha('#3b82f6', 0.2) },
};

export function StatusChip({ status, label }) {
  const tone = STATUS[status] ?? STATUS.INACTIVE;
  return (
    <Chip
      label={label ?? status}
      size="small"
      sx={{ fontWeight: 700, fontSize: '0.7rem', borderRadius: 1, height: 24, bgcolor: tone.bg, color: tone.color, border: `1px solid ${tone.border}` }}
    />
  );
}

export function SectionLabel({ label, first }) {
  return (
    <Typography
      variant="caption"
      sx={{
        fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: 'text.secondary', fontSize: '0.67rem', fontFamily: FONT,
        mt: first ? 0 : 2.5, mb: 1, display: 'block',
      }}
    >
      {label}
    </Typography>
  );
}

/** Title + description on the left, controls on the right (stacks below on narrow screens). */
export function SettingRow({ title, description, children, below }) {
  return (
    <Card
      elevation={0}
      sx={{
        mb: 1.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', borderLeft: '4px solid #bfdbfe',
        transition: 'all 0.2s ease-in-out',
        '&:hover': { boxShadow: '0 4px 16px rgba(15,23,42,0.09)', transform: 'translateY(-1px)', borderLeftColor: '#93c5fd' },
      }}
    >
      <Box sx={{ px: 3, py: 2, display: 'flex', alignItems: { xs: 'flex-start', md: 'center' }, flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', gap: 2 }}>
        <Box sx={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
          <Typography sx={{ fontSize: '0.88rem', fontWeight: 600, color: 'text.primary', fontFamily: FONT }}>{title}</Typography>
          <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', fontFamily: FONT, mt: 0.3 }}>{description}</Typography>
        </Box>
        {children && <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0, flexWrap: 'wrap' }}>{children}</Box>}
      </Box>
      {below && <Box sx={{ px: 3, pb: 2 }}>{below}</Box>}
    </Card>
  );
}

/** Loading / error placeholder inside a FyntracCard, as on Model Management. */
export function CardStatus({ loading, error, label }) {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 6 }}>
        <CircularProgress size={36} />
        <Typography sx={{ ml: 2 }} color="text.secondary">Loading {label}…</Typography>
      </Box>
    );
  }
  return (
    <Box sx={{ py: 4, textAlign: 'center' }}>
      <Typography color="error">{error}</Typography>
    </Box>
  );
}

/** Discard / Save footer for a job card. */
export function SaveBar({ dirty, saving, disabled, onDiscard, onSave }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1, px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
      {dirty && <Typography sx={{ mr: 'auto', fontSize: '0.75rem', fontWeight: 600, color: 'text.secondary', fontFamily: FONT }}>You have unsaved changes.</Typography>}
      <Button onClick={onDiscard} disabled={!dirty || saving} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, color: 'text.secondary', ...QUIET_BUTTON_SX }}>
        Discard
      </Button>
      <Button variant="contained" onClick={onSave} disabled={!dirty || saving || disabled} sx={NAVY_BUTTON_SX}>
        {saving ? 'Saving…' : 'Save'}
      </Button>
    </Box>
  );
}
