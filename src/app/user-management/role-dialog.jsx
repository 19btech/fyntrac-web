"use client";

import React, { useEffect, useState } from 'react';
import { Button, TextField, Typography } from '@mui/material';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import ExplorerDialog, { primaryActionSx, secondaryActionSx } from '../report-explorer/explorer-dialog';
import PickerField from '../report-explorer/picker-field';
import { ALL_PERMISSIONS, ADMIN_ROLE_ID, nextRoleColor } from './permissions';

/**
 * Create a custom user type (optionally starting from another type's permissions; `initial`
 * prefills it, e.g. to duplicate one), or edit a user type's details. Built-in types keep their name.
 *   onSubmit({ name, color, permissions? })
 */
export default function RoleDialog({ open, role, roles, initial, onClose, onSubmit, busy, error }) {
  const editing = Boolean(role);
  const [name, setName] = useState('');
  const [startFrom, setStartFrom] = useState('blank');

  useEffect(() => {
    if (!open) return;
    setName(role?.name ?? initial?.name ?? '');
    setStartFrom(initial?.startFrom ?? 'blank');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, role]);

  const duplicate = roles.some((r) => r.id !== role?.id && r.name.toLowerCase() === name.trim().toLowerCase());
  const submit = () => {
    const base = roles.find((r) => r.id === startFrom);
    onSubmit({
      name: name.trim(),
      // A light tint is assigned to new user types; edits keep theirs.
      color: role?.color ?? nextRoleColor(roles),
      ...(!editing && { permissions: base ? (base.id === ADMIN_ROLE_ID ? ALL_PERMISSIONS : [...base.permissions]) : [] }),
    });
  };

  return (
    <ExplorerDialog
      open={open}
      onClose={busy ? undefined : onClose}
      kind="Roles"
      kindIcon={<BadgeOutlinedIcon />}
      title={editing ? 'Edit User Type' : 'New User Type'}
      actions={(
        <>
          <Button onClick={onClose} disabled={busy} sx={secondaryActionSx}>Cancel</Button>
          <Button variant="contained" onClick={submit} disabled={!name.trim() || duplicate || busy} sx={primaryActionSx}>
            {editing ? 'Save changes' : 'Create user type'}
          </Button>
        </>
      )}
    >
      <TextField
        autoFocus={!role?.builtIn}
        fullWidth
        size="small"
        label="Name"
        value={name}
        disabled={role?.builtIn}
        onChange={(e) => setName(e.target.value)}
        error={duplicate}
        helperText={duplicate ? 'A user type with this name already exists.' : role?.builtIn ? 'Built-in user types keep their name.' : ' '}
        slotProps={{ htmlInput: { maxLength: 40 } }}
        sx={{ mb: editing ? 0 : 1.5 }}
      />
      {!editing && (
        <>
          <PickerField
            label="Start from"
            value={startFrom}
            options={[{ value: 'blank', label: 'No permissions' }, ...roles.map((r) => ({ value: r.id, label: `Copy of ${r.name}` }))]}
            onChange={(v) => v && setStartFrom(v)}
          />
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
            You can fine-tune every permission after creating it.
          </Typography>
        </>
      )}
      {error && <Typography variant="body2" color="error" sx={{ mt: 1.5 }}>{error}</Typography>}
    </ExplorerDialog>
  );
}
