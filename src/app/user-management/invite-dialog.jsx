"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { alpha } from '@mui/material/styles';
import { Box, Button, ButtonBase, InputAdornment, TextField, Typography } from '@mui/material';
import PersonAddAlt1OutlinedIcon from '@mui/icons-material/PersonAddAlt1Outlined';
import MailOutlineRoundedIcon from '@mui/icons-material/MailOutlineRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import ExplorerDialog, { primaryActionSx, secondaryActionSx } from '../report-explorer/explorer-dialog';
import PickerField from '../report-explorer/picker-field';
import { radius } from '../report-explorer/tokens';
import { ALL_PERMISSIONS, MODULES, permissionCount } from './permissions';
import { errorMessage, inviteUsers } from './user-management-api';
import { ink } from './ui';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DEFAULT_ROLE = 'analyst';

// Areas a user type can reach (any permission in the area).
const areasFor = (role) => MODULES.filter((m) => m.permissions.some((p) => role.id === 'admin' || role.permissions.includes(p.key))).map((m) => m.label);

/** Invite one user to the tenant with a user type. */
export default function InviteDialog({ open, roles, existingEmails, onClose, onInvited, onOpenRole }) {
  const [email, setEmail] = useState('');
  const [touched, setTouched] = useState(false);
  const [roleId, setRoleId] = useState(DEFAULT_ROLE);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setEmail('');
    setTouched(false);
    setRoleId(roles.some((r) => r.id === DEFAULT_ROLE) ? DEFAULT_ROLE : roles[0]?.id);
    setMessage('');
    setError('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const value = email.trim().toLowerCase();
  const problem = !value
    ? ''
    : !EMAIL.test(value)
      ? 'Enter a valid email address.'
      : existingEmails.includes(value)
        ? 'This person is already a user.'
        : '';
  const role = roles.find((r) => r.id === roleId);
  const areas = useMemo(() => (role ? areasFor(role) : []), [role]);
  const canSend = Boolean(value) && !problem && Boolean(role) && !busy;

  const send = async () => {
    if (!canSend) { setTouched(true); return; }
    setBusy(true);
    setError('');
    try {
      const invited = await inviteUsers({ emails: [value], roleId, message: message.trim() });
      onInvited(invited || []);
    } catch (err) {
      setError(errorMessage(err, 'The invitation could not be sent.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ExplorerDialog
      open={open}
      onClose={busy ? undefined : onClose}
      kind="User Management"
      kindIcon={<PersonAddAlt1OutlinedIcon />}
      title="Invite User"
      maxWidth="sm"
      actions={(
        <>
          <Button onClick={onClose} disabled={busy} sx={secondaryActionSx}>Cancel</Button>
          <Button variant="contained" onClick={send} disabled={!canSend} sx={primaryActionSx}>Send invitation</Button>
        </>
      )}
    >
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
        They receive an email to join this tenant and sign in with their company account.
      </Typography>

      <TextField
        autoFocus
        fullWidth
        size="small"
        type="email"
        label="Email address"
        placeholder="name@company.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onBlur={() => setTouched(true)}
        onKeyDown={(e) => e.key === 'Enter' && send()}
        error={touched && Boolean(problem)}
        helperText={(touched && problem) || ' '}
        slotProps={{
          input: { startAdornment: <InputAdornment position="start"><MailOutlineRoundedIcon fontSize="small" sx={{ color: 'text.disabled' }} /></InputAdornment> },
        }}
        sx={{ mb: 1.75 }}
      />

      <PickerField
        label="User type"
        value={roleId}
        options={roles.map((r) => ({ value: r.id, label: r.name }))}
        onChange={(v) => v && setRoleId(v)}
        sx={{ mb: 1.5 }}
      />
      {role && (
        <Box
          sx={{
            borderRadius: radius.lg,
            border: `1px solid ${alpha(role.color || '#64748B', 0.3)}`,
            bgcolor: alpha(role.color || '#64748B', 0.1),
            px: 2,
            py: 1.5,
            mb: 2.5,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Typography variant="body2" fontWeight={700} sx={{ flex: 1 }}>{role.name}</Typography>
            <Typography variant="caption" sx={{ fontWeight: 700, color: ink(role.color) }}>
              {permissionCount(role)} of {ALL_PERMISSIONS.length} permissions
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.6 }}>
            Access to {areas.length ? areas.join(', ') : 'nothing yet'}.
          </Typography>
          <ButtonBase
            onClick={() => onOpenRole(role.id)}
            sx={{ mt: 0.75, fontSize: '0.75rem', fontWeight: 700, color: 'primary.main', borderRadius: 1, gap: 0.5, '&:hover': { textDecoration: 'underline' } }}
          >
            Review access <ArrowForwardRoundedIcon sx={{ fontSize: 14 }} />
          </ButtonBase>
        </Box>
      )}

      <TextField
        fullWidth
        multiline
        minRows={2}
        size="small"
        label="Personal note (optional)"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        slotProps={{ htmlInput: { maxLength: 500 } }}
      />
      {error && <Typography variant="body2" color="error" sx={{ mt: 1.5 }}>{error}</Typography>}
    </ExplorerDialog>
  );
}
