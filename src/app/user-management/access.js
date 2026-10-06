"use client";

import { useEffect, useSyncExternalStore } from 'react';
import { useTenant } from '../tenant-context';
import { ADMIN_ROLE_ID, ALL_PERMISSIONS } from './permissions';
import { fetchRoles, fetchUsers } from './user-management-api';
import { userManagementEnabled } from '../services/runtime-config';

/**
 * The signed-in user's permissions, from their user type.
 *   - flag off          → everything (NEXT_PUBLIC_USER_MANAGEMENT isn't "true": no service to ask)
 *   - user found        → their user type's permissions (Admin: everything; deactivated: nothing)
 *   - user not listed   → nothing role-gated
 *   - service missing   → everything (404: the feature isn't deployed, so nobody is locked out)
 *   - check failed      → nothing role-gated (network / server / auth errors fail closed;
 *                         gated screens offer Retry)
 * Shared by every gated screen; refreshAccess() reloads it after users or user types change.
 */
let state = { status: 'idle', email: null, grants: null };
const listeners = new Set();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l) => { listeners.add(l); return () => listeners.delete(l); };
const snapshot = () => state;

const load = async (email) => {
  let next;
  if (!userManagementEnabled()) {
    next = { status: 'ready', email, grants: null };
  } else try {
    const [users, roles] = await Promise.all([fetchUsers(), fetchRoles()]);
    const me = (users || []).find((u) => String(u.email).toLowerCase() === email);
    const role = me && roles.find((r) => r.id === me.roleId);
    const grants = !me || me.status !== 'active' || !role
      ? new Set()
      : new Set(role.id === ADMIN_ROLE_ID ? ALL_PERMISSIONS : role.permissions);
    next = { status: 'ready', email, grants };
  } catch (err) {
    // Only a missing service means "not deployed"; any other failure must not unlock everything.
    next = err?.response?.status === 404
      ? { status: 'ready', email, grants: null }
      : { status: 'ready', email, grants: new Set(), failed: true };
  }
  // Another account signed in meanwhile: its own load owns the state.
  if (state.email !== email) return;
  state = next;
  emit();
};

export const refreshAccess = () => {
  if (state.email === null) return Promise.resolve();
  if (state.failed) { state = { status: 'loading', email: state.email, grants: null }; emit(); } // show the retry is running
  return load(state.email);
};

/** can(key): true / false once known; undefined while loading (treat as "not yet"). */
export function useAccess() {
  const { user } = useTenant();
  const email = String(user?.email || '').toLowerCase();
  const current = useSyncExternalStore(subscribe, snapshot, snapshot);

  useEffect(() => {
    if (!email) return;
    if (state.email !== email || state.status === 'idle') {
      state = { status: 'loading', email, grants: null };
      emit();
      load(email);
    }
  }, [email]);

  const ready = current.status === 'ready' && current.email === email;
  return {
    ready,
    // The access check itself failed (everything role-gated is locked until it succeeds).
    failed: ready && Boolean(current.failed),
    can: (key) => (!ready ? undefined : current.grants === null || current.grants.has(key)),
  };
}
