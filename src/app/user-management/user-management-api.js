import { dataloaderApi } from '../services/api-client';
import { BUILT_IN_ROLES } from './permissions';

/**
 * User management service contract (dataloader, per tenant):
 *
 *   GET    /user-management/users                         -> [User]
 *   POST   /user-management/users/invite                  { emails: [string], roleId, message } -> [User]
 *   PUT    /user-management/users/{id}                    { roleId?, status? } -> User
 *   POST   /user-management/users/{id}/resend-invite      -> User
 *   DELETE /user-management/users/{id}
 *
 *   GET    /user-management/roles                         -> [Role]
 *   POST   /user-management/roles                         { name, color, permissions } -> Role
 *   PUT    /user-management/roles/{id}                    { name?, color?, permissions? } -> Role
 *   DELETE /user-management/roles/{id}?reassignTo={id}    users of the deleted type move to reassignTo
 *
 *   User: { id, name, email, roleId, status: 'active' | 'invited' | 'deactivated',
 *           invitedAt, invitedBy, lastActiveAt }
 *   Role: { id, name, color, builtIn, permissions: [permission key] }
 */

const BASE = '/user-management';

// Built-in user types are always present; the service's copy (with any edited permissions) wins.
const withBuiltIns = (roles) => {
  const list = Array.isArray(roles) ? roles : [];
  const ids = new Set(list.map((r) => r.id));
  return [...BUILT_IN_ROLES.filter((r) => !ids.has(r.id)), ...list]
    .sort((a, b) => Number(Boolean(b.builtIn)) - Number(Boolean(a.builtIn)));
};

export const fetchUsers = async () => (await dataloaderApi.get(`${BASE}/users`)).data ?? [];
export const inviteUsers = async (payload) => (await dataloaderApi.post(`${BASE}/users/invite`, payload)).data;
export const updateUser = async (id, patch) => (await dataloaderApi.put(`${BASE}/users/${encodeURIComponent(id)}`, patch)).data;
export const resendInvite = async (id) => (await dataloaderApi.post(`${BASE}/users/${encodeURIComponent(id)}/resend-invite`)).data;
export const removeUser = async (id) => dataloaderApi.delete(`${BASE}/users/${encodeURIComponent(id)}`);

export const fetchRoles = async () => withBuiltIns((await dataloaderApi.get(`${BASE}/roles`)).data);
export const createRole = async (role) => (await dataloaderApi.post(`${BASE}/roles`, role)).data;
export const updateRole = async (id, patch) => (await dataloaderApi.put(`${BASE}/roles/${encodeURIComponent(id)}`, patch)).data;
export const deleteRole = async (id, reassignTo) =>
  dataloaderApi.delete(`${BASE}/roles/${encodeURIComponent(id)}`, { params: { reassignTo } });

export const errorMessage = (err, fallback) => err?.response?.data?.message || err?.message || fallback;
