/**
 * Access catalogue for role-based access control: every area of the app and the actions
 * it offers (taken from what each screen can do), plus the built-in user types.
 *
 * Levels describe the impact of an action:
 *   read     — sees data, changes nothing
 *   write    — creates or changes configuration / data
 *   critical — irreversible or period-affecting (close / reopen periods, overwrite or delete data,
 *              grant access)
 *
 * Shared by the UI and the local dev API (plain JS, no React).
 */

export const LEVELS = {
  read: { label: 'Read', color: '#0369A1', bg: 'rgba(14,165,233,0.10)' },
  write: { label: 'Write', color: '#B45309', bg: 'rgba(245,158,11,0.12)' },
  critical: { label: 'High risk', color: '#B91C1C', bg: 'rgba(220,38,38,0.10)' },
};

export const MODULES = [
  {
    id: 'dashboard',
    label: 'Dashboard & Period Close',
    description: 'Home dashboard, metrics and the accounting period close.',
    permissions: [
      { key: 'dashboard.view', label: 'View dashboard', description: 'Activity, top metrics and the current open period.', level: 'read' },
      { key: 'dashboard.configure', label: 'Configure dashboard widgets', description: 'Choose the metrics and widgets shown on the dashboard.', level: 'write' },
      { key: 'period.close', label: 'Close accounting period', description: 'Close the current open period and move the books forward.', level: 'critical' },
    ],
  },
  {
    id: 'ingest',
    label: 'Ingest',
    description: 'Activity data loads and their validation.',
    permissions: [
      { key: 'ingest.view', label: 'View loads & validation logs', description: 'Recent and historical uploads with their validation results.', level: 'read' },
      { key: 'ingest.samples', label: 'Download sample files', description: 'Sample activity data templates.', level: 'read' },
      { key: 'ingest.upload', label: 'Upload activity data', description: 'Append new activity files.', level: 'write' },
      { key: 'ingest.overwrite', label: 'Overwrite activity data', description: 'Replace previously loaded activity.', level: 'critical' },
    ],
  },
  {
    id: 'models',
    label: 'Models',
    description: 'Accounting models and their executions.',
    permissions: [
      { key: 'model.view', label: 'View models & executions', description: 'Loaded models, their status and execution progress.', level: 'read' },
      { key: 'model.download', label: 'Download model files', description: 'Download model definitions.', level: 'read' },
      { key: 'model.upload', label: 'Upload & update models', description: 'Upload new models or new versions.', level: 'write' },
      { key: 'model.activate', label: 'Activate / deactivate models', description: 'Choose which models run.', level: 'write' },
      { key: 'model.execute', label: 'Execute models', description: 'Run models against loaded activity.', level: 'write' },
      { key: 'model.delete', label: 'Delete models', description: 'Move models to the trash.', level: 'critical' },
    ],
  },
  {
    id: 'diagnostic',
    label: 'Diagnostic',
    description: 'Instrument-level diagnostics. Without access the page is hidden.',
    permissions: [
      { key: 'diagnostic.run', label: 'Open Diagnostic', description: 'Open the Diagnostic page and trace an instrument through a model.', level: 'read' },
      { key: 'diagnostic.download', label: 'Download diagnostic output', description: 'Export the diagnostic workbook.', level: 'read' },
    ],
  },
  {
    id: 'reports',
    label: 'Reports',
    description: 'Report Explorer: standard, accounting, custom and control reports.',
    permissions: [
      { key: 'reports.view', label: 'View reports', description: 'Open standard, accounting, custom and control reports.', level: 'read' },
      { key: 'reports.export', label: 'Export reports', description: 'Download reports as CSV.', level: 'read' },
    ],
  },
  {
    id: 'insight',
    label: 'Fyntrac Insight',
    description: 'Analytics and dashboards in Fyntrac Insight.',
    permissions: [
      { key: 'insight.access', label: 'Open Fyntrac Insight', description: 'Open Fyntrac Insight from the Report Explorer.', level: 'read' },
    ],
  },
  {
    id: 'rules',
    label: 'Accounting Rules',
    description: 'Attributes, transactions and aggregation metrics.',
    permissions: [
      { key: 'rules.view', label: 'View accounting rules', description: 'Attributes, transactions and metrics.', level: 'read' },
      { key: 'rules.manage', label: 'Create & edit rules', description: 'Add or change attributes, transactions and metrics.', level: 'write' },
      { key: 'rules.upload', label: 'Bulk upload rules', description: 'Upload rule files (append or overwrite).', level: 'write' },
      { key: 'rules.delete', label: 'Delete rules', description: 'Remove attributes, transactions or metrics.', level: 'critical' },
    ],
  },
  {
    id: 'mapping',
    label: 'Journal Mapping',
    description: 'Account types, chart of accounts and subledger mapping.',
    permissions: [
      { key: 'mapping.view', label: 'View journal mapping', description: 'Account types, chart of accounts and subledger mappings.', level: 'read' },
      { key: 'mapping.manage', label: 'Create & edit mappings', description: 'Change account types, accounts and subledger mappings.', level: 'write' },
      { key: 'mapping.delete', label: 'Delete mappings', description: 'Remove accounts, account types or mappings.', level: 'critical' },
    ],
  },
  {
    id: 'events',
    label: 'Events',
    description: 'Business events built from input sources.',
    permissions: [
      { key: 'events.view', label: 'View events', description: 'Configured events and their sources.', level: 'read' },
      { key: 'events.manage', label: 'Create & edit events', description: 'Define events, sources and triggers.', level: 'write' },
      { key: 'events.delete', label: 'Delete events', description: 'Remove event configurations.', level: 'critical' },
    ],
  },
  {
    id: 'customTables',
    label: 'Custom Tables',
    description: 'Operational and reference custom tables.',
    permissions: [
      { key: 'customTables.view', label: 'View custom tables', description: 'Table definitions and their data.', level: 'read' },
      { key: 'customTables.manage', label: 'Create & edit tables', description: 'Define tables and their columns.', level: 'write' },
      { key: 'customTables.activate', label: 'Activate / deactivate tables', description: 'Turn tables on or off.', level: 'write' },
      { key: 'customTables.upload', label: 'Upload table data', description: 'Load data into custom tables (append or overwrite).', level: 'write' },
      { key: 'customTables.delete', label: 'Delete tables', description: 'Remove custom tables.', level: 'critical' },
    ],
  },
  {
    id: 'logicStudio',
    label: 'Logic Studio',
    description: 'Custom business logic. Without access the Logic Studio card is locked.',
    permissions: [
      { key: 'logicStudio.access', label: 'Open Logic Studio', description: 'Build, test and execute custom business logic.', level: 'write' },
    ],
  },
  {
    id: 'tenant',
    label: 'Tenant Management',
    description: 'Tenant settings, periods and environment.',
    permissions: [
      { key: 'tenant.view', label: 'View tenant settings', description: 'Fiscal calendar, currency, periods and environment status.', level: 'read' },
      { key: 'tenant.financials', label: 'Edit fiscal calendar & currency', description: 'Fiscal period start, number of periods and reporting currency.', level: 'write' },
      { key: 'tenant.refreshSchema', label: 'Refresh schema', description: 'Rebuild the tenant schema.', level: 'write' },
      { key: 'tenant.restatement', label: 'Toggle restatement mode', description: 'Turn restatement on or off for the tenant.', level: 'critical' },
      { key: 'tenant.reopenPeriods', label: 'Reopen closed periods', description: 'Reopen accounting periods that were closed.', level: 'critical' },
      { key: 'tenant.reset', label: 'Reset environment', description: 'Delete activity data and reset the environment.', level: 'critical' },
    ],
  },
  {
    id: 'users',
    label: 'User Management',
    description: 'Users, user types and their access.',
    permissions: [
      { key: 'users.view', label: 'View users', description: 'Users, their user types and status.', level: 'read' },
      { key: 'users.invite', label: 'Invite users', description: 'Send invitations to join the tenant.', level: 'write' },
      { key: 'users.manage', label: 'Change user types & access', description: 'Change user types, deactivate or remove users.', level: 'critical' },
      { key: 'roles.manage', label: 'Manage user types & permissions', description: 'Create user types and change what each can do.', level: 'critical' },
    ],
  },
];

export const ALL_PERMISSIONS = MODULES.flatMap((m) => m.permissions.map((p) => p.key));
const byLevel = (level) => MODULES.flatMap((m) => m.permissions.filter((p) => p.level === level).map((p) => p.key));
const READ = byLevel('read');

export const ADMIN_ROLE_ID = 'admin';

// Built-in user types and what each can do by default.
export const BUILT_IN_ROLES = [
  {
    id: ADMIN_ROLE_ID,
    name: 'Admin',
    color: '#A5B4FC',
    builtIn: true,
    permissions: ALL_PERMISSIONS,
  },
  {
    id: 'controller',
    name: 'Controller',
    color: '#7DD3FC',
    builtIn: true,
    permissions: ALL_PERMISSIONS.filter((k) => !['tenant.reset', 'tenant.refreshSchema', 'users.invite', 'users.manage', 'roles.manage'].includes(k)),
  },
  {
    id: 'manager',
    name: 'Manager',
    color: '#6EE7B7',
    builtIn: true,
    permissions: [
      'dashboard.view', 'dashboard.configure',
      'ingest.view', 'ingest.samples', 'ingest.upload',
      'model.view', 'model.download', 'model.upload', 'model.activate', 'model.execute',
      'diagnostic.run', 'diagnostic.download',
      'reports.view', 'reports.export', 'insight.access',
      'rules.view', 'rules.manage', 'rules.upload',
      'mapping.view',
      'events.view', 'events.manage',
      'customTables.view', 'customTables.manage', 'customTables.activate', 'customTables.upload',
      'logicStudio.access',
      'tenant.view',
      'users.view',
    ],
  },
  {
    id: 'analyst',
    name: 'Analyst',
    color: '#FCD34D',
    builtIn: true,
    permissions: [
      'dashboard.view',
      'ingest.view', 'ingest.samples',
      'model.view', 'model.download',
      'diagnostic.run', 'diagnostic.download',
      'reports.view', 'reports.export', 'insight.access',
      'rules.view', 'mapping.view', 'events.view', 'customTables.view',
    ],
  },
  {
    id: 'auditor',
    name: 'Auditor',
    color: '#CBD5E1',
    builtIn: true,
    permissions: READ,
  },
];

export const BUILT_IN_IDS = BUILT_IN_ROLES.map((r) => r.id);

// Light tints assigned to custom user types (in order, skipping ones already in use). Built-in
// user types use their own light tints above.
export const ROLE_COLORS = ['#C4B5FD', '#F9A8D4', '#5EEAD4', '#FDBA74', '#BEF264', '#93C5FD', '#FCA5A5', '#D8B4FE'];
export const nextRoleColor = (roles) => {
  const used = new Set(roles.map((r) => r.color));
  return ROLE_COLORS.find((c) => !used.has(c)) ?? ROLE_COLORS[roles.length % ROLE_COLORS.length];
};

export const permissionCount = (role) => (role.id === ADMIN_ROLE_ID ? ALL_PERMISSIONS.length : role.permissions.filter((k) => ALL_PERMISSIONS.includes(k)).length);
