"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { alpha } from '@mui/material/styles';
import {
  Box,
  Button,
  ButtonBase,
  Card,
  Chip,
  CircularProgress,
  IconButton,
  InputAdornment,
  LinearProgress,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import SpaceDashboardOutlinedIcon from '@mui/icons-material/SpaceDashboardOutlined';
import SyncAltOutlinedIcon from '@mui/icons-material/SyncAltOutlined';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import TroubleshootIcon from '@mui/icons-material/Troubleshoot';
import TableChartOutlinedIcon from '@mui/icons-material/TableChartOutlined';
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined';
import RuleOutlinedIcon from '@mui/icons-material/RuleOutlined';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import EventNoteOutlinedIcon from '@mui/icons-material/EventNoteOutlined';
import GridOnOutlinedIcon from '@mui/icons-material/GridOnOutlined';
import CodeOutlinedIcon from '@mui/icons-material/CodeOutlined';
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined';
import ManageAccountsOutlinedIcon from '@mui/icons-material/ManageAccountsOutlined';
import SearchIcon from '@mui/icons-material/Search';
import EditOutlined from '@mui/icons-material/EditOutlined';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';
import DeleteOutlineOutlined from '@mui/icons-material/DeleteOutlineOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import RemoveRoundedIcon from '@mui/icons-material/RemoveRounded';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import PickerField from '../report-explorer/picker-field';
import { EmptyState } from '../report-explorer/report-catalog';
import { EASE, EASE_CSS, line, radius, surface } from '../report-explorer/tokens';
import { ADMIN_ROLE_ID, ALL_PERMISSIONS, BUILT_IN_ROLES, LEVELS, MODULES, permissionCount } from './permissions';
import { AppSwitch, ConfirmDialog, LevelChip, ink } from './ui';
import RoleDialog from './role-dialog';
import { createRole, deleteRole, errorMessage, updateRole } from './user-management-api';

const LEVEL_FILTERS = [
  { value: 'all', label: 'All' },
  ...Object.entries(LEVELS).map(([value, l]) => ({ value, label: l.label })),
];

// Icon per access area (the same icons as the app's navigation where there is one).
const MODULE_ICONS = {
  dashboard: SpaceDashboardOutlinedIcon,
  ingest: SyncAltOutlinedIcon,
  models: ArticleOutlinedIcon,
  diagnostic: TroubleshootIcon,
  reports: TableChartOutlinedIcon,
  insight: InsightsOutlinedIcon,
  rules: RuleOutlinedIcon,
  mapping: AccountTreeOutlinedIcon,
  events: EventNoteOutlinedIcon,
  customTables: GridOnOutlinedIcon,
  logicStudio: CodeOutlinedIcon,
  tenant: ApartmentOutlinedIcon,
  users: ManageAccountsOutlinedIcon,
};

const sameSet = (a, b) => a.size === b.size && [...a].every((k) => b.has(k));
const grantsOf = (role) => new Set(role?.id === ADMIN_ROLE_ID ? ALL_PERMISSIONS : role?.permissions ?? []);

function RoleListItem({ role, members, selected, onSelect }) {
  const count = permissionCount(role);
  return (
    <ButtonBase
      onClick={onSelect}
      aria-current={selected ? 'true' : undefined}
      sx={{
        width: '100%',
        textAlign: 'left',
        display: 'block',
        px: 1.5,
        py: 1.25,
        borderRadius: radius.md,
        border: '1px solid',
        borderColor: selected ? alpha(role.color, 0.55) : 'transparent',
        bgcolor: selected ? alpha(role.color, 0.12) : 'transparent',
        transition: 'background-color 150ms, border-color 150ms',
        '&:hover': { bgcolor: selected ? alpha(role.color, 0.16) : surface.sunken },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="body2" fontWeight={700} noWrap sx={{ flex: 1 }}>{role.name}</Typography>
        {!role.builtIn && <Chip label="Custom" size="small" sx={{ height: 18, fontSize: '0.62rem', fontWeight: 700 }} />}
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.75 }}>
        <Typography variant="caption" color="text.secondary">{members} user{members === 1 ? '' : 's'}</Typography>
        <Typography variant="caption" color="text.secondary">{count}/{ALL_PERMISSIONS.length}</Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={(count / ALL_PERMISSIONS.length) * 100}
        sx={{ mt: 0.5, height: 4, borderRadius: 2, bgcolor: surface.sunken, '& .MuiLinearProgress-bar': { bgcolor: role.color, borderRadius: 2 } }}
      />
    </ButtonBase>
  );
}

// Quick setting for an area: no access, read-only, or everything.
const presetOf = (module, grants) => {
  const keys = module.permissions.map((p) => p.key);
  const reads = module.permissions.filter((p) => p.level === 'read').map((p) => p.key);
  const on = keys.filter((k) => grants.has(k));
  if (!on.length) return 'none';
  if (on.length === keys.length) return 'full';
  if (on.length === reads.length && reads.every((k) => grants.has(k))) return 'read';
  return null;
};

function ModuleCard({ module, grants, locked, visible, accent, onToggle, onPreset }) {
  const Icon = MODULE_ICONS[module.id] ?? ManageAccountsOutlinedIcon;
  const total = module.permissions.length;
  const on = module.permissions.filter((p) => grants.has(p.key)).length;
  const preset = presetOf(module, grants);
  const hasRead = module.permissions.some((p) => p.level === 'read') && module.permissions.some((p) => p.level !== 'read');
  return (
    <Card variant="outlined" sx={{ flexShrink: 0, borderRadius: radius.lg, overflow: 'hidden', '&:hover': { transform: 'none' } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.25, bgcolor: alpha(accent, 0.06), borderBottom: `1px solid ${line}` }}>
        <Box sx={{ width: 34, height: 34, borderRadius: 2.5, display: 'grid', placeItems: 'center', flexShrink: 0, bgcolor: on ? alpha(accent, 0.2) : surface.sunken, color: on ? ink(accent) : 'text.disabled', transition: 'background-color 200ms, color 200ms' }}>
          <Icon sx={{ fontSize: 19 }} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="subtitle2" fontWeight={700}>{module.label}</Typography>
            <Chip size="small" label={`${on}/${total}`} sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700, bgcolor: on ? alpha('#16a34a', 0.12) : surface.sunken, color: on ? '#15803d' : 'text.secondary' }} />
          </Box>
          <Typography variant="caption" color="text.secondary">{module.description}</Typography>
        </Box>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={preset}
          disabled={locked}
          onChange={(_, v) => v && onPreset(v)}
          aria-label={`${module.label} access`}
          sx={{ '& .MuiToggleButton-root': { textTransform: 'none', fontWeight: 700, px: 1.25, py: 0.25, fontSize: '0.75rem' } }}
        >
          <ToggleButton value="none">None</ToggleButton>
          {hasRead && <ToggleButton value="read">Read</ToggleButton>}
          <ToggleButton value="full">Full</ToggleButton>
        </ToggleButtonGroup>
      </Box>
      {module.permissions.filter((p) => visible.has(p.key)).map((p, i) => (
        <Box
          key={p.key}
          sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pl: 8, pr: 2, py: 1, borderTop: i ? `1px solid ${line}` : 'none', transition: 'background-color 150ms', '&:hover': { bgcolor: alpha(accent, 0.05) } }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" fontWeight={600}>{p.label}</Typography>
            <Typography variant="caption" color="text.secondary">{p.description}</Typography>
          </Box>
          <LevelChip level={p.level} />
          <AppSwitch
            checked={grants.has(p.key)}
            disabled={locked}
            onChange={() => onToggle(p.key)}
            slotProps={{ input: { 'aria-label': p.label } }}
          />
        </Box>
      ))}
    </Card>
  );
}

function CompareView({ roles, onSelect }) {
  return (
    <Box sx={{ overflow: 'auto', flex: 1, minHeight: 0, border: `1px solid ${line}`, borderRadius: radius.lg }}>
      <Box component="table" sx={{ borderCollapse: 'separate', borderSpacing: 0, width: '100%', fontSize: '0.8125rem' }}>
        <Box component="thead">
          <Box component="tr">
            <Box component="th" sx={{ position: 'sticky', top: 0, left: 0, zIndex: 3, bgcolor: surface.page, textAlign: 'left', px: 2, py: 1.25, borderBottom: `1px solid ${line}`, minWidth: 280 }}>
              Permission
            </Box>
            {roles.map((r) => (
              <Box component="th" key={r.id} sx={{ position: 'sticky', top: 0, zIndex: 2, bgcolor: surface.page, px: 1, py: 1, borderBottom: `1px solid ${line}`, minWidth: 104 }}>
                <ButtonBase onClick={() => onSelect(r.id)} sx={{ borderRadius: radius.sm, px: 1, py: 0.5, flexDirection: 'column', '&:hover': { bgcolor: surface.sunken } }}>
                  <Typography variant="caption" fontWeight={700}>{r.name}</Typography>
                </ButtonBase>
              </Box>
            ))}
          </Box>
        </Box>
        <Box component="tbody">
          {MODULES.map((m) => (
            <React.Fragment key={m.id}>
              <Box component="tr">
                <Box component="td" colSpan={roles.length + 1} sx={{ position: 'sticky', left: 0, px: 2, pt: 1.5, pb: 0.5, fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.05em', textTransform: 'uppercase', color: 'text.secondary', bgcolor: surface.raised }}>
                  {m.label}
                </Box>
              </Box>
              {m.permissions.map((p) => (
                <Box component="tr" key={p.key} sx={{ '&:hover td': { bgcolor: surface.page } }}>
                  <Box component="td" sx={{ position: 'sticky', left: 0, bgcolor: surface.raised, px: 2, py: 0.75, borderBottom: `1px solid ${line}` }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'space-between' }}>
                      <span>{p.label}</span>
                      <LevelChip level={p.level} />
                    </Box>
                  </Box>
                  {roles.map((r) => {
                    const on = grantsOf(r).has(p.key);
                    return (
                      <Box component="td" key={r.id} aria-label={`${r.name}: ${on ? 'allowed' : 'not allowed'}`} sx={{ textAlign: 'center', py: 0.75, borderBottom: `1px solid ${line}` }}>
                        {on
                          ? <CheckRoundedIcon sx={{ fontSize: 18, color: '#16a34a' }} />
                          : <RemoveRoundedIcon sx={{ fontSize: 16, color: 'text.disabled' }} />}
                      </Box>
                    );
                  })}
                </Box>
              ))}
            </React.Fragment>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

export default function RolesPanel({ roles, users, loading = false, focusRoleId, createRequest, readOnly = false, onDirtyChange, onChanged, onToast }) {
  const [selectedId, setSelectedId] = useState(focusRoleId ?? roles[0]?.id ?? ADMIN_ROLE_ID);
  const [view, setView] = useState('edit');
  const [draft, setDraft] = useState(() => new Set());
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState('all');
  const [dialog, setDialog] = useState(null); // { mode: 'create' | 'edit' | 'duplicate' }
  const [dialogError, setDialogError] = useState('');
  const [pending, setPending] = useState(null); // action waiting for "discard unsaved permission changes"
  const [removing, setRemoving] = useState(null); // role being deleted
  const [reassignTo, setReassignTo] = useState(null);
  const [busy, setBusy] = useState(false);

  const role = roles.find((r) => r.id === selectedId) ?? roles[0];
  const savedKey = role ? `${role.id}:${role.id === ADMIN_ROLE_ID ? '*' : [...role.permissions].sort().join(',')}` : '';
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const saved = useMemo(() => grantsOf(role), [savedKey]);
  const locked = role?.id === ADMIN_ROLE_ID || readOnly;
  const dirty = Boolean(role) && !sameSet(draft, saved);
  const members = (id) => users.filter((u) => u.roleId === id).length;
  const builtInDefault = BUILT_IN_ROLES.find((r) => r.id === role?.id);
  const differsFromDefault = builtInDefault && !locked && !sameSet(draft, new Set(builtInDefault.permissions));

  useEffect(() => { if (focusRoleId) setSelectedId(focusRoleId); }, [focusRoleId]);
  // "New user type" from the page header (only clicks made while this tab is shown).
  const handledRequest = useRef(createRequest);
  useEffect(() => {
    if (createRequest === handledRequest.current) return;
    handledRequest.current = createRequest;
    openDialog('create');
  }, [createRequest]); // eslint-disable-line react-hooks/exhaustive-deps
  // A fresh copy of the saved permissions whenever another role is shown or it was saved.
  useEffect(() => { setDraft(new Set(saved)); }, [saved]);
  // Lets the page ask before leaving the tab with unsaved changes.
  const unsaved = dirty && !locked;
  useEffect(() => { onDirtyChange?.(unsaved); }, [unsaved, onDirtyChange]);
  useEffect(() => () => onDirtyChange?.(false), [onDirtyChange]);

  // Anything that moves away from the shown permissions asks first when they are unsaved.
  const guarded = (action) => (dirty ? setPending(() => action) : action());
  const select = (id) => {
    if (id === role?.id) return;
    guarded(() => setSelectedId(id));
  };
  // Creating or duplicating selects the new user type, which would drop unsaved changes.
  function openDialog(mode) {
    guarded(() => { setDialogError(''); setDialog({ mode }); });
  }

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return new Set(MODULES.flatMap((m) => m.permissions
      .filter((p) => (level === 'all' || p.level === level)
        && (!q || `${m.label} ${p.label} ${p.description}`.toLowerCase().includes(q)))
      .map((p) => p.key)));
  }, [search, level]);

  const toggle = (key) => setDraft((prev) => {
    const next = new Set(prev);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });
  const applyPreset = (module, preset) => setDraft((prev) => {
    const next = new Set(prev);
    module.permissions.forEach((p) => {
      if (preset === 'full' || (preset === 'read' && p.level === 'read')) next.add(p.key);
      else next.delete(p.key);
    });
    return next;
  });

  const gained = [...draft].filter((k) => !saved.has(k));
  const lost = [...saved].filter((k) => !draft.has(k));

  const saveDraft = async () => {
    setBusy(true);
    try {
      await updateRole(role.id, { permissions: ALL_PERMISSIONS.filter((k) => draft.has(k)) });
      onToast(`${role.name} permissions saved.`);
      await onChanged();
    } catch (err) {
      onToast(errorMessage(err, 'Permissions could not be saved.'), 'error');
    } finally {
      setBusy(false);
    }
  };

  const submitDialog = async (values) => {
    setBusy(true);
    setDialogError('');
    try {
      if (dialog.mode === 'edit') {
        await updateRole(role.id, { name: values.name, color: values.color });
        onToast(`${values.name} updated.`);
      } else {
        const created = await createRole(values);
        onToast(`${created.name} created.`);
        setSelectedId(created.id);
      }
      setDialog(null);
      await onChanged();
    } catch (err) {
      setDialogError(errorMessage(err, 'The user type could not be saved.'));
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    setBusy(true);
    try {
      await deleteRole(removing.id, members(removing.id) ? reassignTo : undefined);
      onToast(`${removing.name} deleted.`);
      setRemoving(null);
      setSelectedId(roles[0]?.id);
      await onChanged();
    } catch (err) {
      setRemoving(null);
      onToast(errorMessage(err, 'The user type could not be deleted.'), 'error');
    } finally {
      setBusy(false);
    }
  };

  if (!role) {
    if (loading) {
      return (
        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress size={28} />
        </Box>
      );
    }
    return (
      <Box sx={{ flex: 1, p: 3 }}>
        <EmptyState icon={BadgeOutlinedIcon} title="User types could not be loaded">Use Refresh to try again.</EmptyState>
      </Box>
    );
  }
  const count = locked ? saved.size : draft.size;
  const shownModules = MODULES.filter((m) => m.permissions.some((p) => visible.has(p.key)));

  return (
    <Box sx={{ flex: 1, minWidth: 0, display: 'flex' }}>
      {/* User types */}
      <Box sx={{ width: 280, flexShrink: 0, borderRight: `1px solid ${line}`, display: 'flex', flexDirection: 'column', bgcolor: surface.page }}>
        <Box sx={{ px: 2, pt: 2.25, pb: 1.25 }}>
          <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'text.secondary' }}>User types</Typography>
        </Box>
        <Box component="nav" aria-label="User types" sx={{ flex: 1, overflow: 'auto', px: 1.25, pb: 1.5, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {roles.map((r) => (
            <RoleListItem key={r.id} role={r} members={members(r.id)} selected={view === 'edit' && r.id === role.id} onSelect={() => { setView('edit'); select(r.id); }} />
          ))}
        </Box>
      </Box>

      {/* Permissions */}
      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ px: 3, pt: 2.5, pb: 1.5, display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          {view === 'edit' ? (
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="h6" fontWeight={700}>{role.name}</Typography>
                <Chip size="small" label={role.builtIn ? 'Built-in' : 'Custom'} sx={{ fontWeight: 700, height: 22 }} />
                <Chip size="small" label={`${members(role.id)} user${members(role.id) === 1 ? '' : 's'}`} sx={{ fontWeight: 700, height: 22, bgcolor: surface.sunken }} />
              </Box>
            </Box>
          ) : (
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" fontWeight={700}>Compare user types</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>What each user type can do. Select a user type to edit it.</Typography>
            </Box>
          )}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {view === 'edit' && !readOnly && (
              <>
                {!role.builtIn && (
                  <Tooltip title="Edit details">
                    <IconButton aria-label="Edit details" onClick={() => { setDialogError(''); setDialog({ mode: 'edit' }); }}><EditOutlined fontSize="small" /></IconButton>
                  </Tooltip>
                )}
                <Tooltip title="Duplicate">
                  <IconButton aria-label="Duplicate user type" onClick={() => openDialog('duplicate')}><ContentCopyOutlinedIcon fontSize="small" /></IconButton>
                </Tooltip>
                {builtInDefault && !locked && (
                  <Tooltip title="Reset to default permissions">
                    <span>
                      <IconButton aria-label="Reset to default permissions" disabled={!differsFromDefault} onClick={() => setDraft(new Set(builtInDefault.permissions))}>
                        <RestartAltRoundedIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                )}
                {!role.builtIn && (
                  <Tooltip title="Delete user type">
                    <IconButton aria-label="Delete user type" onClick={() => { setReassignTo(null); setRemoving(role); }}><DeleteOutlineOutlined fontSize="small" /></IconButton>
                  </Tooltip>
                )}
              </>
            )}
            <ToggleButtonGroup
              exclusive
              size="small"
              value={view}
              onChange={(_, v) => v && setView(v)}
              sx={{ ml: 1, '& .MuiToggleButton-root': { textTransform: 'none', fontWeight: 700, px: 1.5, py: 0.5 } }}
            >
              <ToggleButton value="edit">Permissions</ToggleButton>
              <ToggleButton value="compare">Compare</ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>

        {view === 'compare' ? (
          <Box sx={{ px: 3, pb: 2.5, flex: 1, minHeight: 0, display: 'flex' }}>
            <CompareView roles={roles} onSelect={(id) => { setView('edit'); select(id); }} />
          </Box>
        ) : (
          <>
            <Box sx={{ px: 3, pb: 1.5, display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
              <TextField
                size="small"
                placeholder="Search permissions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                sx={{ width: 260 }}
                slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: 'text.disabled' }} /></InputAdornment> } }}
              />
              <ToggleButtonGroup
                exclusive
                size="small"
                value={level}
                onChange={(_, v) => v && setLevel(v)}
                sx={{ '& .MuiToggleButton-root': { textTransform: 'none', fontWeight: 700, px: 1.5, py: 0.5 } }}
              >
                {LEVEL_FILTERS.map((l) => <ToggleButton key={l.value} value={l.value}>{l.label}</ToggleButton>)}
              </ToggleButtonGroup>
              <Box sx={{ flex: 1 }} />
              <Box sx={{ minWidth: 200 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                  {count} of {ALL_PERMISSIONS.length} permissions
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={(count / ALL_PERMISSIONS.length) * 100}
                  sx={{ height: 6, borderRadius: 3, bgcolor: surface.sunken, '& .MuiLinearProgress-bar': { bgcolor: role.color, borderRadius: 3 } }}
                />
              </Box>
            </Box>

            {locked && role.id === ADMIN_ROLE_ID && (
              <Box sx={{ mx: 3, mb: 1.5, px: 2, py: 1.25, borderRadius: radius.md, bgcolor: alpha(role.color, 0.1), border: `1px solid ${alpha(role.color, 0.3)}`, display: 'flex', alignItems: 'center', gap: 1 }}>
                <LockOutlinedIcon sx={{ fontSize: 18, color: ink(role.color) }} />
                <Typography variant="body2">Admins always have full access, so the tenant can never be locked out.</Typography>
              </Box>
            )}

            <motion.div
              key={role.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: EASE }}
              style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: '0 24px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}
            >
              {shownModules.length ? shownModules.map((m) => (
                <ModuleCard
                  key={m.id}
                  module={m}
                  grants={locked ? saved : draft}
                  locked={locked}
                  visible={visible}
                  accent={role.color}
                  onToggle={toggle}
                  onPreset={(preset) => applyPreset(m, preset)}
                />
              )) : (
                <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>No permissions match.</Typography>
              )}
            </motion.div>

            {dirty && !locked && (
              <Box
                sx={(t) => ({
                  px: 3,
                  py: 1.5,
                  borderTop: `1px solid ${alpha(t.palette.primary.main, 0.18)}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  bgcolor: alpha(t.palette.primary.main, 0.05),
                  animation: `saveBarIn 200ms ${EASE_CSS}`,
                  '@keyframes saveBarIn': { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'none' } },
                })}
              >
                <Typography variant="body2" fontWeight={700}>Unsaved changes to {role.name}</Typography>
                {gained.length > 0 && <Chip size="small" label={`+${gained.length} granted`} sx={{ fontWeight: 700, color: '#15803d', bgcolor: 'rgba(22,163,74,0.12)' }} />}
                {lost.length > 0 && <Chip size="small" label={`−${lost.length} removed`} sx={{ fontWeight: 700, color: '#b91c1c', bgcolor: 'rgba(220,38,38,0.10)' }} />}
                <Box sx={{ flex: 1 }} />
                <Button onClick={() => setDraft(new Set(saved))} disabled={busy} sx={{ fontWeight: 700 }}>Discard</Button>
                <Button variant="contained" onClick={saveDraft} disabled={busy} sx={{ fontWeight: 700 }}>Save changes</Button>
              </Box>
            )}
          </>
        )}
      </Box>

      <RoleDialog
        open={Boolean(dialog)}
        role={dialog?.mode === 'edit' ? role : null}
        roles={roles}
        busy={busy}
        error={dialogError}
        onClose={() => setDialog(null)}
        initial={dialog?.mode === 'duplicate' ? { name: `${role.name} copy`, startFrom: role.id } : null}
        onSubmit={submitDialog}
      />

      <ConfirmDialog
        open={Boolean(pending)}
        kindIcon={<BadgeOutlinedIcon />}
        kind="Roles"
        title="Discard changes?"
        confirmLabel="Discard"
        tone="danger"
        onConfirm={() => { const action = pending; setPending(null); setDraft(new Set(saved)); action(); }}
        onClose={() => setPending(null)}
      >
        <Typography variant="body2" color="text.secondary">
          Your changes to <b>{role.name}</b> have not been saved.
        </Typography>
      </ConfirmDialog>

      <ConfirmDialog
        open={Boolean(removing)}
        busy={busy}
        kindIcon={<BadgeOutlinedIcon />}
        kind="Roles"
        title="Delete user type"
        confirmLabel="Delete"
        tone="danger"
        confirmDisabled={Boolean(removing && members(removing.id) && !reassignTo)}
        onConfirm={confirmDelete}
        onClose={() => setRemoving(null)}
      >
        {removing && (members(removing.id) ? (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              <b>{members(removing.id)}</b> {members(removing.id) === 1 ? 'user has' : 'users have'} the <b>{removing.name}</b> user type. Choose the user type they move to.
            </Typography>
            <PickerField
              label="Move users to"
              value={reassignTo}
              options={roles.filter((r) => r.id !== removing.id).map((r) => ({ value: r.id, label: r.name }))}
              onChange={setReassignTo}
            />
          </>
        ) : (
          <Typography variant="body2" color="text.secondary"><b>{removing.name}</b> will be deleted. No users have this user type.</Typography>
        ))}
      </ConfirmDialog>
    </Box>
  );
}
