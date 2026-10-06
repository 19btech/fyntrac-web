"use client";

import React from 'react';
import { alpha, darken, styled } from '@mui/material/styles';
import { Avatar, Box, Button, Card, Chip, Fade, Switch, Typography } from '@mui/material';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import ExplorerDialog, { primaryActionSx, secondaryActionSx } from '../report-explorer/explorer-dialog';
import { LEVELS } from './permissions';

export const STATUS = {
  active: { label: 'Active', color: '#15803d', bg: 'rgba(22,163,74,0.12)' },
  invited: { label: 'Invited', color: '#4338CA', bg: 'rgba(99,102,241,0.12)' },
  deactivated: { label: 'Deactivated', color: '#64748B', bg: 'rgba(100,116,139,0.12)' },
};

// Text / icon colour for a (possibly light) user type tint, readable on white.
export const ink = (color) => darken(color || '#64748B', 0.45);

export function RoleChip({ role, onClick, size = 'small' }) {
  const color = role?.color || '#64748B';
  return (
    <Chip
      size={size}
      label={role?.name ?? 'Unknown'}
      onClick={onClick}
      sx={{
        fontWeight: 700,
        color: ink(color),
        bgcolor: alpha(color, 0.14),
        border: `1px solid ${alpha(color, 0.3)}`,
        transition: 'background-color 150ms, border-color 150ms',
        '&:hover': onClick ? { bgcolor: alpha(color, 0.22), borderColor: alpha(color, 0.45) } : undefined,
      }}
    />
  );
}

export function StatusChip({ status }) {
  const tone = STATUS[status] ?? STATUS.deactivated;
  return (
    <Chip
      size="small"
      label={tone.label}
      sx={{ fontWeight: 700, color: tone.color, bgcolor: tone.bg }}
    />
  );
}

export function LevelChip({ level }) {
  const tone = LEVELS[level];
  return (
    <Chip
      size="small"
      label={tone.label}
      sx={{ height: 20, fontSize: '0.66rem', fontWeight: 700, letterSpacing: '0.02em', color: tone.color, bgcolor: tone.bg }}
    />
  );
}

// The app's toggle (as on the Model and Event screens): check / minus icons in the track,
// blue when on and grey when off.
const ToggleBase = styled(Switch)(({ theme }) => ({
  padding: 8,
  '& .MuiSwitch-track': {
    borderRadius: 22 / 2,
    '&::before, &::after': {
      content: '""',
      position: 'absolute',
      top: '50%',
      transform: 'translateY(-50%)',
      width: 16,
      height: 16,
    },
    '&::before': {
      backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 24 24"><path fill="${encodeURIComponent(
        theme.palette.getContrastText(theme.palette.primary.main),
      )}" d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z"/></svg>')`,
      left: 12,
    },
    '&::after': {
      backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 24 24"><path fill="${encodeURIComponent(
        theme.palette.getContrastText(theme.palette.primary.main),
      )}" d="M19,13H5V11H19V13Z" /></svg>')`,
      right: 12,
    },
  },
  '& .MuiSwitch-thumb': {
    boxShadow: 'none',
    width: 16,
    height: 16,
    margin: 2,
  },
  '& .MuiSwitch-switchBase.Mui-checked': {
    color: '#1e88e5',
    '&:hover': { backgroundColor: 'rgba(30, 136, 229, 0.08)' },
  },
  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#1e88e5', opacity: 0.5 },
  '& .MuiSwitch-switchBase:not(.Mui-checked)': {
    color: '#6d6d6d',
    '&:hover': { backgroundColor: 'rgba(109, 109, 109, 0.08)' },
  },
  '& .MuiSwitch-switchBase:not(.Mui-checked) + .MuiSwitch-track': { backgroundColor: '#6d6d6d' },
}));
export const AppSwitch = (props) => <ToggleBase {...props} />;

const initials = (name, email) => {
  const parts = String(name || email || '?').split(/[\s@._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? '?') + (parts[1]?.[0] ?? '')).toUpperCase();
};

export function UserAvatar({ user, color }) {
  return (
    <Avatar sx={{ width: 32, height: 32, fontSize: '0.75rem', fontWeight: 700, bgcolor: alpha(color || '#64748B', 0.18), color: ink(color) }}>
      {initials(user.name, user.email)}
    </Avatar>
  );
}

// Stat card (theme Card: hover lift like the Diagnostic page) with a tinted icon tile.
export function Stat({ label, value, index, icon: Icon, color = '#6366F1' }) {
  return (
    <Fade in timeout={Math.min((index + 1) * 200, 600)}>
      <Card variant="outlined" sx={{ px: 2, py: 1.25, minWidth: 172, display: 'flex', alignItems: 'center', gap: 1.5, borderRadius: 3 }}>
        {Icon && (
          <Box sx={{ width: 36, height: 36, borderRadius: 2.5, display: 'grid', placeItems: 'center', bgcolor: alpha(color, 0.12), color, flexShrink: 0 }}>
            <Icon sx={{ fontSize: 20 }} />
          </Box>
        )}
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: '0.66rem' }}>
            {label}
          </Typography>
          <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.3, fontVariantNumeric: 'tabular-nums' }}>{value}</Typography>
        </Box>
      </Card>
    </Fade>
  );
}

/** Confirmation in the app's dialog style. tone: 'danger' for destructive actions. */
export function ConfirmDialog({ open, title, kind = 'User Management', kindIcon, confirmLabel, tone, busy, confirmDisabled, onConfirm, onClose, children }) {
  return (
    <ExplorerDialog
      open={open}
      onClose={busy ? undefined : onClose}
      kind={kind}
      kindIcon={kindIcon}
      title={title}
      actions={(
        <>
          <Button onClick={onClose} disabled={busy} sx={secondaryActionSx}>Cancel</Button>
          <Button variant="contained" onClick={onConfirm} disabled={busy || confirmDisabled} sx={primaryActionSx}>
            {confirmLabel}
          </Button>
        </>
      )}
    >
      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
        {tone === 'danger' && <WarningAmberRoundedIcon sx={{ color: '#D97706', mt: 0.25 }} />}
        <Box sx={{ flex: 1 }}>{children}</Box>
      </Box>
    </ExplorerDialog>
  );
}

export const formatWhen = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} d ago`;
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
};
