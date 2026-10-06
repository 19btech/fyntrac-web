"use client";

import React, { useMemo, useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { alpha } from '@mui/material/styles';
import {
  Box,
  Chip,
  IconButton,
  InputAdornment,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import MarkEmailUnreadOutlinedIcon from '@mui/icons-material/MarkEmailUnreadOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import ForwardToInboxOutlinedIcon from '@mui/icons-material/ForwardToInboxOutlined';
import PersonOffOutlinedIcon from '@mui/icons-material/PersonOffOutlined';
import HowToRegOutlinedIcon from '@mui/icons-material/HowToRegOutlined';
import DeleteOutlineOutlined from '@mui/icons-material/DeleteOutlineOutlined';
import ManageAccountsOutlinedIcon from '@mui/icons-material/ManageAccountsOutlined';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import PickerField, { PickerPopover } from '../report-explorer/picker-field';
import { EmptyState } from '../report-explorer/report-catalog';
import { line, surface } from '../report-explorer/tokens';
import { ADMIN_ROLE_ID, permissionCount } from './permissions';
import { ConfirmDialog, RoleChip, Stat, StatusChip, UserAvatar, formatWhen } from './ui';
import { errorMessage, removeUser, resendInvite, updateUser } from './user-management-api';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'invited', label: 'Invited' },
  { value: 'deactivated', label: 'Deactivated' },
];

// What a user type change means for access: permissions gained and lost.
const accessDelta = (from, to) => {
  const a = new Set(from?.id === ADMIN_ROLE_ID ? null : from?.permissions);
  const b = new Set(to?.id === ADMIN_ROLE_ID ? null : to?.permissions);
  if (from?.id === ADMIN_ROLE_ID || to?.id === ADMIN_ROLE_ID) {
    const fromCount = from ? permissionCount(from) : 0;
    const toCount = to ? permissionCount(to) : 0;
    return { gained: Math.max(toCount - fromCount, 0), lost: Math.max(fromCount - toCount, 0) };
  }
  return { gained: [...b].filter((k) => !a.has(k)).length, lost: [...a].filter((k) => !b.has(k)).length };
};

export default function UsersPanel({ users, roles, loading, loadError, currentEmail, canManage = true, onChanged, onToast, onOpenRole }) {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [rolePicker, setRolePicker] = useState(null); // { anchor, user }
  const [confirm, setConfirm] = useState(null); // { kind, user, roleId? }
  const [busy, setBusy] = useState(false);

  const roleById = useMemo(() => Object.fromEntries(roles.map((r) => [r.id, r])), [roles]);
  const counts = useMemo(() => ({
    active: users.filter((u) => u.status === 'active').length,
    invited: users.filter((u) => u.status === 'invited').length,
  }), [users]);

  const typeFilter = roleFilter !== 'all' && roleById[roleFilter] ? roleFilter : 'all';
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => (typeFilter === 'all' || u.roleId === typeFilter)
      && (statusFilter === 'all' || u.status === statusFilter)
      && (!q || `${u.name} ${u.email}`.toLowerCase().includes(q)));
  }, [users, search, typeFilter, statusFilter]);

  const isSelf = (u) => Boolean(currentEmail) && u.email.toLowerCase() === currentEmail;

  const run = async (action, success) => {
    setBusy(true);
    try {
      await action();
      onToast(success);
      setConfirm(null);
      await onChanged();
    } catch (err) {
      setConfirm(null);
      onToast(errorMessage(err, 'Something went wrong.'), 'error');
    } finally {
      setBusy(false);
    }
  };

  const confirmAction = () => {
    const { kind, user, roleId } = confirm;
    if (kind === 'role') return run(() => updateUser(user.id, { roleId }), `${user.name} is now ${roleById[roleId]?.name}.`);
    if (kind === 'deactivate') return run(() => updateUser(user.id, { status: 'deactivated' }), `${user.name} was deactivated.`);
    if (kind === 'remove') {
      return run(() => removeUser(user.id), user.status === 'invited' ? `Invitation for ${user.email} revoked.` : `${user.name} was removed.`);
    }
    return undefined;
  };

  const columns = [
    {
      field: 'name',
      headerName: 'User',
      flex: 1.6,
      minWidth: 260,
      renderCell: ({ row }) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, height: '100%', minWidth: 0 }}>
          <UserAvatar user={row} color={roleById[row.roleId]?.color} />
          <Box sx={{ minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Typography variant="body2" fontWeight={700} noWrap>{row.name}</Typography>
              {isSelf(row) && <Chip label="You" size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }} />}
            </Box>
            <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>{row.email}</Typography>
          </Box>
        </Box>
      ),
    },
    {
      field: 'roleId',
      headerName: 'User type',
      width: 190,
      renderCell: ({ row }) => {
        const locked = !canManage;
        return (
          <Tooltip title={locked ? '' : 'Change user type'}>
            <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
              <RoleChip
                role={roleById[row.roleId]}
                onClick={locked ? undefined : (e) => setRolePicker({ anchor: e.currentTarget, user: row })}
              />
            </Box>
          </Tooltip>
        );
      },
      sortComparator: (a, b) => String(roleById[a]?.name).localeCompare(String(roleById[b]?.name)),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      renderCell: ({ row }) => <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}><StatusChip status={row.status} /></Box>,
    },
    {
      field: 'lastActiveAt',
      headerName: 'Last active',
      width: 170,
      valueGetter: (value, row) => (row.status === 'invited' ? row.invitedAt : value) || '',
      renderCell: ({ row }) => (
        <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          {row.status === 'invited' ? `Invited ${formatWhen(row.invitedAt).toLowerCase()}` : formatWhen(row.lastActiveAt)}
        </Typography>
      ),
    },
    {
      field: 'actions',
      headerName: '',
      width: 140,
      sortable: false,
      disableColumnMenu: true,
      align: 'right',
      renderCell: ({ row }) => {
        if (!canManage) return null;
        return (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 0.5, height: '100%' }}>
            {row.status === 'invited' && (
              <Tooltip title="Resend invitation">
                <IconButton size="small" disabled={busy} aria-label={`Resend invitation to ${row.email}`} onClick={() => run(() => resendInvite(row.id), `Invitation resent to ${row.email}.`)}>
                  <ForwardToInboxOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {row.status === 'active' && (
              <Tooltip title="Deactivate">
                <IconButton size="small" disabled={busy} aria-label={`Deactivate ${row.name}`} onClick={() => setConfirm({ kind: 'deactivate', user: row })}>
                  <PersonOffOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {row.status === 'deactivated' && (
              <Tooltip title="Reactivate">
                <IconButton size="small" disabled={busy} aria-label={`Reactivate ${row.name}`} onClick={() => run(() => updateUser(row.id, { status: 'active' }), `${row.name} was reactivated.`)}>
                  <HowToRegOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {(
              <Tooltip title={row.status === 'invited' ? 'Revoke invitation' : 'Remove user'}>
                <IconButton size="small" disabled={busy} aria-label={`${row.status === 'invited' ? 'Revoke invitation for' : 'Remove'} ${row.email}`} onClick={() => setConfirm({ kind: 'remove', user: row })}>
                  <DeleteOutlineOutlined fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        );
      },
    },
  ];

  const confirmRole = confirm?.kind === 'role' ? roleById[confirm.roleId] : null;
  const delta = confirm?.kind === 'role' ? accessDelta(roleById[confirm.user.roleId], confirmRole) : null;

  return (
    <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', px: 3, py: 2.5, gap: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
        <Stat index={0} label="Users" value={users.length} icon={GroupOutlinedIcon} color="#6366F1" />
        <Stat index={1} label="Active" value={counts.active} icon={CheckCircleOutlineRoundedIcon} color="#16a34a" />
        <Stat index={2} label="Pending invites" value={counts.invited} icon={MarkEmailUnreadOutlinedIcon} color="#D97706" />
        <Stat index={3} label="User types" value={roles.length} icon={BadgeOutlinedIcon} color="#0891B2" />
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Search name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ width: 280 }}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: 'text.disabled' }} /></InputAdornment> } }}
        />
        <PickerField
          label="User type"
          value={typeFilter}
          fullWidth={false}
          options={[{ value: 'all', label: 'All user types' }, ...roles.map((r) => ({ value: r.id, label: r.name }))]}
          onChange={(v) => setRoleFilter(v || 'all')}
          sx={{ width: 200 }}
        />
        <PickerField
          label="Status"
          value={statusFilter}
          fullWidth={false}
          options={STATUS_OPTIONS}
          onChange={(v) => setStatusFilter(v || 'all')}
          sx={{ width: 180 }}
        />
        <Box sx={{ flex: 1 }} />
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
          {rows.length === users.length ? `${users.length} user${users.length === 1 ? '' : 's'}` : `${rows.length} of ${users.length} users`}
        </Typography>
      </Box>

      <Box sx={{ flex: 1, minHeight: 0, border: `1px solid ${line}`, borderRadius: '12px', overflow: 'hidden' }}>
        {loadError ? (
          <EmptyState icon={GroupOutlinedIcon} title="Users could not be loaded">{loadError}</EmptyState>
        ) : (
          <DataGrid
            rows={rows}
            columns={columns}
            getRowId={(r) => r.id}
            loading={loading}
            rowHeight={56}
            disableRowSelectionOnClick
            hideFooter={rows.length <= 25}
            initialState={{ pagination: { paginationModel: { pageSize: 25 } }, sorting: { sortModel: [{ field: 'name', sort: 'asc' }] } }}
            pageSizeOptions={[25, 50, 100]}
            localeText={{ noRowsLabel: users.length ? 'No users match these filters.' : 'No users yet — invite your team.' }}
            sx={(t) => ({
              border: 'none',
              '& .MuiDataGrid-columnHeaders, & .MuiDataGrid-columnHeader, & .MuiDataGrid-filler': { bgcolor: surface.page },
              '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 700, color: 'text.primary' },
              '& .MuiDataGrid-row': { transition: 'background-color 150ms' },
              '& .MuiDataGrid-row:hover': { bgcolor: alpha(t.palette.primary.main, 0.035) },
              '& .MuiDataGrid-cell': { borderColor: line },
              '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within, & .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within': { outline: 'none' },
              '& .MuiDataGrid-overlay': { color: 'text.secondary', fontSize: '0.875rem' },
            })}
          />
        )}
      </Box>

      <PickerPopover
        anchorEl={rolePicker?.anchor ?? null}
        onClose={() => setRolePicker(null)}
        options={roles.map((r) => ({ value: r.id, label: r.name }))}
        value={rolePicker?.user.roleId}
        width={240}
        searchPlaceholder="Search user types..."
        onSelect={(roleId) => {
          const { user } = rolePicker;
          setRolePicker(null);
          if (roleId !== user.roleId) setConfirm({ kind: 'role', user, roleId });
        }}
      />

      <ConfirmDialog
        open={Boolean(confirm)}
        busy={busy}
        kindIcon={<ManageAccountsOutlinedIcon />}
        tone={confirm?.kind === 'role' ? undefined : 'danger'}
        title={confirm?.kind === 'role' ? 'Change user type' : confirm?.kind === 'deactivate' ? 'Deactivate user' : confirm?.user.status === 'invited' ? 'Revoke invitation' : 'Remove user'}
        confirmLabel={confirm?.kind === 'role' ? 'Change user type' : confirm?.kind === 'deactivate' ? 'Deactivate' : confirm?.user.status === 'invited' ? 'Revoke' : 'Remove'}
        onConfirm={confirmAction}
        onClose={() => setConfirm(null)}
      >
        {confirm?.kind === 'role' && (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 1.5 }}>
              <Typography variant="body2"><b>{confirm.user.name}</b>:</Typography>
              <RoleChip role={roleById[confirm.user.roleId]} />
              <Typography variant="body2" color="text.secondary">→</Typography>
              <RoleChip role={confirmRole} />
            </Box>
            <Typography variant="body2" color="text.secondary">
              {delta.gained || delta.lost
                ? `They will gain ${delta.gained} and lose ${delta.lost} permission${delta.gained + delta.lost === 1 ? '' : 's'}. `
                : 'Their permissions stay the same. '}
              <Box component="span" role="link" tabIndex={0} onClick={() => { setConfirm(null); onOpenRole(confirm.roleId); }} sx={{ color: 'primary.main', fontWeight: 700, cursor: 'pointer' }}>
                Review {confirmRole?.name} access
              </Box>
            </Typography>
          </>
        )}
        {confirm?.kind === 'deactivate' && (
          <Typography variant="body2" color="text.secondary">
            {isSelf(confirm.user)
              ? <>You will lose access to this tenant until another Admin reactivates you.</>
              : <><b>{confirm.user.name}</b> will lose access to this tenant until reactivated. Their history is kept.</>}
          </Typography>
        )}
        {confirm?.kind === 'remove' && (
          <Typography variant="body2" color="text.secondary">
            {confirm.user.status === 'invited'
              ? <>The invitation sent to <b>{confirm.user.email}</b> will stop working.</>
              : isSelf(confirm.user)
                ? <>You will be removed from this tenant and lose access immediately.</>
                : <><b>{confirm.user.name}</b> will be removed from this tenant. You can invite them again later.</>}
          </Typography>
        )}
      </ConfirmDialog>
    </Box>
  );
}
