"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ThemeProvider, alpha } from '@mui/material/styles';
import { Box, IconButton, Tab, Tabs, Tooltip, Typography } from '@mui/material';
import PersonAddAlt1OutlinedIcon from '@mui/icons-material/PersonAddAlt1Outlined';
import AddModeratorOutlinedIcon from '@mui/icons-material/AddModeratorOutlined';
import CachedRoundedIcon from '@mui/icons-material/CachedRounded';
import { useTenant } from '../tenant-context';
import { explorerTheme } from '../report-explorer/report-explorer';
import AppToast from '../report-explorer/app-toast';
import { EASE, line, shadow, surface } from '../report-explorer/tokens';
import UsersPanel from './users-panel';
import RolesPanel from './roles-panel';
import InviteDialog from './invite-dialog';
import { refreshAccess, useAccess } from './access';
import { ConfirmDialog } from './ui';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import { errorMessage, fetchRoles, fetchUsers } from './user-management-api';

const TABS = [
  { id: 'management', label: 'Management' },
  { id: 'roles', label: 'Roles' },
];

// The app's header icon button (as on the Model / Diagnostic pages).
export const HEADER_ICON_SX = {
  bgcolor: 'white',
  boxShadow: 1,
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': { bgcolor: 'grey.50', boxShadow: 3, transform: 'scale(1.08)' },
  '&:active': { transform: 'scale(0.94)' },
};

function TabLabel({ label, count }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
      {label}
      <Box
        component="span"
        sx={(t) => ({
          fontSize: '0.7rem', fontWeight: 700, px: 0.75, minWidth: 20, textAlign: 'center', borderRadius: '10px', lineHeight: '18px',
          bgcolor: alpha(t.palette.primary.main, 0.08), color: 'primary.main',
        })}
      >
        {count}
      </Box>
    </Box>
  );
}

/**
 * Configuration → User Management: invite and manage users (Management) and define what
 * each user type can do (Roles).
 */
export default function UserManagement() {
  const { user } = useTenant();
  const { can } = useAccess();
  // Actions follow the signed-in user's own permissions (unknown while loading → allowed; the
  // service enforces them too).
  const canInvite = can('users.invite') !== false;
  const canManage = can('users.manage') !== false;
  const canRoles = can('roles.manage') !== false;
  const [tab, setTab] = useState('management');
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
  const [focusRoleId, setFocusRoleId] = useState(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [createRequest, setCreateRequest] = useState(0);
  // Unsaved user type permissions: leaving the tab or refreshing asks first.
  const [rolesDirty, setRolesDirty] = useState(false);
  const [leaving, setLeaving] = useState(null); // action waiting for "discard changes"
  const guard = (action) => (rolesDirty ? setLeaving(() => action) : action());

  const showToast = useCallback((message, severity = 'success') => setToast({ open: true, message, severity }), []);

  const reload = useCallback(async () => {
    try {
      const [u, r] = await Promise.all([fetchUsers(), fetchRoles()]);
      setUsers(Array.isArray(u) ? u : []);
      setRoles(r);
      setLoadError('');
    } catch (err) {
      setLoadError(errorMessage(err, 'Could not load users.'));
    } finally {
      setLoading(false);
    }
  }, []);

  // Any change to users or user types can change what the signed-in user may open.
  const changed = useCallback(async () => {
    await reload();
    refreshAccess();
  }, [reload]);

  useEffect(() => { reload(); }, [reload]);

  const openRole = (roleId) => { setFocusRoleId(roleId); setTab('roles'); };
  const currentEmail = String(user?.email || '').toLowerCase();

  return (
    <ThemeProvider theme={explorerTheme}>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 112px)', minHeight: 560, textAlign: 'left' }}>
        {/* Header — same treatment as the Model / Diagnostic pages: title and icon actions */}
        <Box
          sx={{
            p: 1.5,
            borderBottom: '1.5px solid',
            borderColor: (t) => alpha(t.palette.divider, 0.2),
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2,
            mb: 2,
            flexShrink: 0,
          }}
        >
          <Typography variant="h5" fontWeight={600} color="text.primary" sx={{ letterSpacing: '-0.5px' }}>
            User Management
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {tab === 'management' ? (canInvite && (
              <Tooltip title="Invite user">
                <IconButton aria-label="Invite user" onClick={() => setInviteOpen(true)} sx={HEADER_ICON_SX}>
                  <PersonAddAlt1OutlinedIcon color="action" />
                </IconButton>
              </Tooltip>
            )) : (canRoles && (
              <Tooltip title="New user type">
                <IconButton aria-label="New user type" onClick={() => setCreateRequest((n) => n + 1)} sx={HEADER_ICON_SX}>
                  <AddModeratorOutlinedIcon color="action" />
                </IconButton>
              </Tooltip>
            ))}
            <Tooltip title="Refresh">
              <IconButton aria-label="Refresh" onClick={() => guard(() => { setLoading(true); changed(); })} sx={HEADER_ICON_SX}>
                <CachedRoundedIcon color="action" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            minHeight: 0,
            bgcolor: surface.raised,
            border: `1px solid ${line}`,
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: shadow.md,
          }}
        >
          <Tabs
            value={tab}
            onChange={(_, value) => guard(() => setTab(value))}
            sx={{
              px: 1.5,
              minHeight: 44,
              borderBottom: `1px solid ${line}`,
              '& .MuiTab-root': { textTransform: 'none', fontWeight: 700, fontSize: '0.875rem', minHeight: 44, px: 1.5, color: 'text.secondary', transition: 'color 150ms' },
              '& .MuiTab-root:hover': { color: 'text.primary' },
              '& .Mui-selected': { fontWeight: 700 },
              '& .MuiTabs-indicator': { height: 2.5, borderRadius: '2px 2px 0 0' },
            }}
          >
            {TABS.map((t) => (
              <Tab key={t.id} value={t.id} label={<TabLabel label={t.label} count={t.id === 'management' ? users.length : roles.length} />} />
            ))}
          </Tabs>

          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, ease: EASE }}
            style={{ flex: 1, minHeight: 0, display: 'flex' }}
          >
            {tab === 'management' ? (
              <UsersPanel
                users={users}
                roles={roles}
                loading={loading}
                loadError={loadError}
                currentEmail={currentEmail}
                canManage={canManage}
                onChanged={changed}
                onToast={showToast}
                onOpenRole={openRole}
              />
            ) : (
              <RolesPanel
                roles={roles}
                users={users}
                loading={loading}
                focusRoleId={focusRoleId}
                createRequest={createRequest}
                readOnly={!canRoles}
                onDirtyChange={setRolesDirty}
                onChanged={changed}
                onToast={showToast}
              />
            )}
          </motion.div>
        </Box>
      </Box>

      <InviteDialog
        open={inviteOpen}
        roles={roles}
        existingEmails={users.map((u) => u.email.toLowerCase())}
        onClose={() => setInviteOpen(false)}
        onOpenRole={(id) => { setInviteOpen(false); openRole(id); }}
        onInvited={async (invited) => {
          setInviteOpen(false);
          showToast(`Invitation sent to ${invited[0]?.email ?? 'the user'}.`);
          setTab('management');
          await changed();
        }}
      />
      <ConfirmDialog
        open={Boolean(leaving)}
        kind="Roles"
        kindIcon={<BadgeOutlinedIcon />}
        title="Discard changes?"
        confirmLabel="Discard"
        tone="danger"
        onConfirm={() => { const action = leaving; setLeaving(null); setRolesDirty(false); action(); }}
        onClose={() => setLeaving(null)}
      >
        <Typography variant="body2" color="text.secondary">Your permission changes have not been saved.</Typography>
      </ConfirmDialog>
      <AppToast toast={toast} onClose={() => setToast((t) => ({ ...t, open: false }))} />
    </ThemeProvider>
  );
}
