"use client";

import * as React from 'react';
import {
  createTheme,
  ThemeProvider,
  alpha
} from '@mui/material/styles';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  CssBaseline,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tooltip,
  Chip,
  Slide,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useTenant } from "../tenant-context";
import PageContent from '../component/pageContent';
import { useAccess } from '../user-management/access';
import { dataloaderApi, reportingApi } from '../services/api-client';
import fyntracTheme from "../theme/fyntrac-theme";
// Icons
import MenuIcon from '@mui/icons-material/Menu';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import LogoutIcon from '@mui/icons-material/Logout';
import StartOutlinedIcon from '@mui/icons-material/StartOutlined';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined';
import SyncAltOutlinedIcon from '@mui/icons-material/SyncAltOutlined';
import TroubleshootIcon from '@mui/icons-material/Troubleshoot';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';
import TableChartOutlinedIcon from '@mui/icons-material/TableChartOutlined';
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import CloseIcon from '@mui/icons-material/Close';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

// ----------------------------------------------------------------------
// 🔧 CONFIGURATION
// ----------------------------------------------------------------------
const DRAWER_WIDTH = 252;
const COLLAPSED_WIDTH = 72;
const HEADER_HEIGHT = 64;

// 🎨 DESIGN TOKENS — matching theme.ts / Sidebar reference
const INDIGO = '#6366f1';
const INDIGO_DARK = '#4f46e5';
const INDIGO_BG = '#eef2ff';
const SLATE_50 = '#f8fafc';
const SLATE_100 = '#f1f5f9';
const SLATE_200 = '#e2e8f0';
const SLATE_500 = '#64748b';
const SLATE_700 = '#334155';
const SLATE_BLACK = '#14213d';

// 📍 Page title map
const PAGE_TITLES = {
  getstarted: 'Get Started',
  main: 'Dashboard',
  diagnostic: 'Diagnostic',
  model: 'Model',
  sync: 'Ingest',
  'report-dashboard': 'Reports',
  'settings-dashboard': 'Configurations',
};


// 🎨 ELEGANT THEME
// const fyntracTheme = createTheme({
//   typography: { 
//     fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
//     h6: { fontWeight: 700 },
//     body2: { fontSize: '0.875rem' },
//   },
//   palette: {
//     primary: { main: "#2563EB" }, // Modern Royal Blue
//     secondary: { main: "#dc004e" },
//     text: { primary: "#1E293B", secondary: "#64748B" }, // Slate colors
//     background: { default: "#F8FAFC", paper: "#FFFFFF" }, // Very light slate bg
//   },
//   components: {
//     MuiDrawer: {
//       styleOverrides: {
//         paper: {
//           borderRight: "1px dashed rgba(145, 158, 171, 0.24)", // Subtle dashed border
//           backgroundColor: "#FFFFFF",
//           overflowX: 'hidden',
//           transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)', // Snappy bezier
//         }
//       }
//     },
//     MuiAppBar: {
//       styleOverrides: {
//         root: {
//           backgroundColor: "rgba(255, 255, 255, 0.8)", // Semi-transparent
//           backdropFilter: "blur(6px)", // Glassmorphism effect
//           color: "#1E293B",
//           boxShadow: "none",
//           borderBottom: "1px solid rgba(145, 158, 171, 0.12)",
//           zIndex: 1201,
//         }
//       }
//     },
//     MuiListItemButton: {
//       styleOverrides: {
//         root: {
//           borderRadius: 8, // Rounded list items
//           margin: '4px 8px', // Breathing room
//           transition: 'all 0.2s ease-in-out',
//         }
//       }
//     }
//   }
// });

// ----------------------------------------------------------------------
// 🧩 HELPER: Recursive Navigation Item
// ----------------------------------------------------------------------
function NavItem({ item, pathname, onNavigate, depth = 0, isCollapsed, onExpandSidebar }) {
  const [open, setOpen] = React.useState(false);
  const hasChildren = item.children && item.children.length > 0;
  const isSelected = pathname === item.segment;

  React.useEffect(() => {
    if (hasChildren && item.children.some(child => child.segment === pathname)) {
      setOpen(true);
    }
  }, [pathname, hasChildren, item.children]);

  // After the hooks, so every item calls the same hooks in the same order.
  if (item.kind === 'divider') return <Divider sx={{ my: 2, mx: 2, borderStyle: 'dashed', borderColor: 'rgba(145, 158, 171, 0.24)', display: isCollapsed ? 'none' : 'block' }} />;

  const handleClick = () => {
    if (isCollapsed && hasChildren) {
      onExpandSidebar();
      setOpen(true);
      return;
    }
    if (hasChildren) {
      setOpen(!open);
      return;
    }
    onNavigate(item.segment, item.onClick);
    // Any click on a collapsed sidebar expands it — once the new page has rendered and the
    // browser is idle (at most 400 ms later), so the width animation isn't competing with the
    // page's first render. Reports keeps it collapsed (it needs the full width).
    if (isCollapsed && item.segment !== 'report-dashboard') {
      const whenIdle = window.requestIdleCallback ?? ((cb) => setTimeout(cb, 120));
      requestAnimationFrame(() => whenIdle(() => onExpandSidebar(), { timeout: 400 }));
    }
  };

  return (
    <>
      <Tooltip title={isCollapsed ? item.title : ""} placement="right" arrow>
        <ListItemButton
          onClick={handleClick}
          selected={isSelected}
          sx={{
            borderRadius: '12px',
            mb: '2px',
            pl: `${12 + (isCollapsed ? 0 : depth * 16)}px`,
            pr: '12px',
            justifyContent: 'flex-start',
            minHeight: 42,
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            bgcolor: isSelected ? '#eef2ff' : 'transparent',
            transition: 'background-color 160ms, color 160ms',
            // Text label — high specificity to prevent theme overrides
            '& .MuiListItemText-primary': {
              fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif !important',
              fontSize: '0.875rem !important',
              fontStyle: 'normal',
              fontWeight: `${isSelected ? 700 : 500} !important`,
              color: `${isSelected ? '#4f46e5' : '#334155'} !important`,
            },

            '&:hover': {
              bgcolor: isSelected ? '#eef2ff' : '#f1f5f9',
              '& .MuiListItemText-primary': { color: `${isSelected ? '#4f46e5' : '#14213d'} !important` },
            },

            '&.Mui-selected': {
              bgcolor: '#eef2ff',
              '& .MuiListItemText-primary': { color: '#4f46e5 !important', fontWeight: '700 !important' },
              '& .MuiListItemIcon-root, & .MuiSvgIcon-root': { color: '#6366f1' },
              '&:hover': { bgcolor: '#eef2ff' },
            },
          }}
        >
          <ListItemIcon sx={{
            minWidth: 24,
            mr: 1.5,
            flexShrink: 0,
            justifyContent: 'center',
            color: isSelected ? '#6366f1' : '#64748b',
          }}>
            {item.icon}
          </ListItemIcon>

          <ListItemText
            primary={item.title}
            aria-hidden={isCollapsed || undefined}
            sx={{
              m: 0,
              opacity: isCollapsed ? 0 : 1,
              // Fade in once the sidebar has widened a little; fade out immediately when collapsing.
              transition: isCollapsed ? 'opacity 90ms ease-out' : 'opacity 200ms ease-in 90ms',
            }}
            primaryTypographyProps={{
              noWrap: true,
              fontSize: '0.875rem',
              fontWeight: isSelected ? 700 : 500,
              sx: { color: isSelected ? '#4f46e5' : '#334155' },
            }}
          />

          {!isCollapsed && hasChildren ? (open ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />) : null}
        </ListItemButton>
      </Tooltip>

      {!isCollapsed && hasChildren && (
        <Collapse in={open} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {item.children.map((child, index) => (
              <NavItem
                key={index}
                item={child}
                pathname={pathname}
                onNavigate={onNavigate}
                depth={depth + 1}
                isCollapsed={isCollapsed}
                onExpandSidebar={onExpandSidebar}
              />
            ))}
          </List>
        </Collapse>
      )}
    </>
  );
}

// ----------------------------------------------------------------------
// 🧩 COMPONENT: Drawer Content
// ----------------------------------------------------------------------
function DrawerContent({ isCollapsed, onExpandSidebar, pathname, onNavigate, onLogout, onReadiness }) {
  const { can } = useAccess();
  // Role-gated pages are hidden once the user's access is known to exclude them.
  const GATED = { diagnostic: 'diagnostic.run' };
  const NAVIGATION = [
    { segment: "getstarted", title: "Get Started", icon: <StartOutlinedIcon />, fontSize: 'fontSize: "14px !important"' },
    { segment: "main", title: "Dashboard", icon: <DashboardOutlinedIcon />, fontSize: 'fontSize: "14px !important"' },
    { segment: "diagnostic", title: "Diagnostic", icon: <TroubleshootIcon />, fontSize: 'fontSize: "14px !important"' },
    { segment: "model", title: "Model", icon: <ArticleOutlinedIcon />, fontSize: 'fontSize: "14px !important"' },
    { segment: "sync", title: "Ingest", icon: <SyncAltOutlinedIcon />, fontSize: 'fontSize: "14px !important"' },
    { segment: "report-dashboard", title: "Reports", icon: <TableChartOutlinedIcon />, fontSize: 'fontSize: "14px !important"' },
    { segment: "settings-dashboard", title: "Configurations", icon: <TuneOutlinedIcon />, fontSize: 'fontSize: "14px !important"' },
    { kind: "divider" },
  ];

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
    }}>

      {/* Logo / Brand */}
      <Box sx={{
        p: isCollapsed ? 2 : 2.5,
        pb: 2.5,
        pt: isCollapsed ? 2 : 4.5,
        pl: isCollapsed ? 2 : 3.5,
        display: 'flex',
        alignItems: 'center',
        justifyContent: isCollapsed ? 'center' : 'flex-start',
        minHeight: HEADER_HEIGHT,
        borderBottom: `1px solid ${SLATE_200}`,
      }}>
        <Box
          component="img"
          src={isCollapsed ? '/fyntrac-small.png' : '/fyntrac.png'}
          alt="Fyntrac"
          sx={{
            width: isCollapsed ? 36 : '80%',
            height: isCollapsed ? 36 : 'auto',
            maxHeight: isCollapsed ? 36 : 48,
            objectFit: 'contain',
            flexShrink: 0,
            transition: 'width 220ms cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      </Box>

      {/* WORKSPACE label (kept in place and faded, so the list below doesn't jump) */}
      {(
        <Typography variant="overline" aria-hidden={isCollapsed || undefined} sx={{
          opacity: isCollapsed ? 0 : 1,
          transition: isCollapsed ? 'opacity 90ms ease-out' : 'opacity 200ms ease-in 90ms',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          px: 2.5,
          mt: 2,
          mb: 0.5,
          fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
          fontSize: '0.625rem',
          fontWeight: 700,
          fontStyle: 'normal',
          color: '#64748b',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          lineHeight: 1.1,
          display: 'block',
        }}>
          Workspace
        </Typography>
      )}

      {/* 1. Main Navigation */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', overflowX: 'hidden', py: 1 }}>
        <List component="nav" sx={{ px: 1.5 }}>
          {NAVIGATION.filter((item) => !GATED[item.segment] || can(GATED[item.segment]) !== false).map((item, index) => (
            <NavItem
              key={item.segment ?? `${item.kind}-${index}`}
              item={item}
              pathname={pathname.replace('/', '')}
              onNavigate={onNavigate}
              isCollapsed={isCollapsed}
              onExpandSidebar={onExpandSidebar}
            />
          ))}
        </List>
      </Box>

      {/* 2. Bottom Section */}
      <Box sx={{ p: 1, borderTop: `1px solid ${SLATE_200}`, bgcolor: SLATE_50 }}>
        <NavItem
          item={{
            segment: "readiness",
            title: "Readiness",
            icon: <FactCheckOutlinedIcon />,
            onClick: onReadiness,
          }}
          pathname={pathname}
          onNavigate={onNavigate}
          isCollapsed={isCollapsed}
          onExpandSidebar={onExpandSidebar}
        />
        <NavItem
          item={{
            segment: "logout",
            title: "Sign Out",
            icon: <LogoutIcon />,
            onClick: onLogout,
          }}
          pathname={pathname}
          onNavigate={onNavigate}
          isCollapsed={isCollapsed}
          onExpandSidebar={onExpandSidebar}
        />
      </Box>
    </Box>
  );
}

// ----------------------------------------------------------------------
// 🚀 MAIN LAYOUT
// ----------------------------------------------------------------------
export default function DashboardLayoutModern() {
  const { tenant, user, setTenant, clearSession } = useTenant();

  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [pathname, setPathname] = React.useState('/main');
  const [openDialog, setOpenDialog] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const [openReadiness, setOpenReadiness] = React.useState(false);
  const [readinessLoading, setReadinessLoading] = React.useState(false);
  // A background refresh is running (the checklist shows the previous results meanwhile).
  const [readinessRefreshing, setReadinessRefreshing] = React.useState(false);
  const [readinessStatus, setReadinessStatus] = React.useState({});
  // Data the checklist could not read (its items show as "couldn't check").
  const [readinessErrors, setReadinessErrors] = React.useState([]);
  const [selectedPhase, setSelectedPhase] = React.useState('tenant');
  const readinessLoadedRef = React.useRef(false);
  const readinessSeq = React.useRef(0);

  const fetchReadinessStatus = React.useCallback(async (showLoading = true) => {
    if (!tenant) return;
    // Only the latest load is applied (a slower, older one never overwrites it).
    const seq = ++readinessSeq.current;
    if (showLoading) setReadinessLoading(true); else setReadinessRefreshing(true);
    try {
      const SOURCES = [
        ['settings', '/setting/get/settings', 'tenant settings'],
        ['periods', '/accounting-period/get/open-periods', 'accounting periods'],
        ['txns', '/transaction/get/all', 'transactions'],
        ['attrs', '/attribute/get/all', 'attributes'],
        ['aggs', '/aggregation/get/all', 'balances'],
        ['coa', '/chartofaccount/get/all', 'chart of accounts'],
        ['subledger', '/subledgermapping/get/all', 'subledger mappings'],
        ['events', '/fyntrac/event-configurations/all', 'events'],
        ['rulesLog', '/validation-logs/ref/by-type/ACCOUNTING_RULES', 'accounting rules validation log'],
        ['mappingLog', '/validation-logs/ref/by-type/JOURNAL_MAPPING', 'journal mapping validation log'],
        ['customTables', '/fyntrac/custom-table/reference-tables', 'reference tables'],
        ['operationalTables', '/fyntrac/custom-table/operational-tables', 'operational tables'],
        ['models', '/model/get/all', 'models'],
        ['subtypes', '/accounttype/get/subtypes', 'account subtypes'],
      ];
      const results = await Promise.allSettled(SOURCES.map(([, url]) => dataloaderApi.get(url)));
      if (seq !== readinessSeq.current) return;
      const data = {};
      const failed = new Set();
      results.forEach((r, i) => {
        const [key, , label] = SOURCES[i];
        if (r.status === 'fulfilled') data[key] = r.value?.data ?? null;
        else { data[key] = null; failed.add(key); console.warn('Readiness: could not load', label, r.reason); }
      });
      const errorLabels = SOURCES.filter(([key]) => failed.has(key)).map(([, , label]) => label);

      const listOf = (d) => (Array.isArray(d) ? d : Array.isArray(d?.content) ? d.content : Array.isArray(d?.data) ? d.data : []);
      // Soft-deleted records never count; "live" = not deleted.
      const live = (list) => list.filter(x => x && !x.isDeleted);
      const cnt = (d) => live(listOf(d)).length;
      const { settings, periods, txns, attrs, aggs, coa, subledger, events, rulesLog, mappingLog, customTables, operationalTables, models, subtypes } = data;

      // Issues marked resolved on the Accounting Rules / Journal Mapping screens (per tenant; the
      // older per-tab keys are read too).
      const readIds = (storage, key) => { try { return JSON.parse(storage.getItem(key) ?? '[]'); } catch { return []; } };
      const resolvedFor = (type) => new Set([
        ...readIds(localStorage, `resolved_${type}.${tenant || 'default'}`),
        ...readIds(sessionStorage, `resolved_${type}`),
      ].map(String));
      const resolvedRules = resolvedFor('ACCOUNTING_RULES');
      const resolvedMapping = resolvedFor('JOURNAL_MAPPING');
      const unresolvedRules = Array.isArray(rulesLog) ? rulesLog.filter(r => !resolvedRules.has(String(r.id))) : [];
      const unresolvedMapping = Array.isArray(mappingLog) ? mappingLog.filter(r => !resolvedMapping.has(String(r.id))) : [];
      const tableOf = (r) => String(r.sourceTable ?? '').toLowerCase();
      const hasIssueFor = (logs, ...keywords) => logs.some(r => keywords.some(k => tableOf(r).includes(k)));
      const hasTxnErrors = hasIssueFor(unresolvedRules, 'transaction');
      const hasAttrErrors = hasIssueFor(unresolvedRules, 'attribute');
      const hasAggErrors = hasIssueFor(unresolvedRules, 'aggregation', 'balance');
      // One issue whose table is the account type / subtype table (not "account" and "type" from two issues).
      const hasSubtypeErrors = unresolvedMapping.some(r => tableOf(r).includes('account') && (tableOf(r).includes('type') || tableOf(r).includes('subtype')));
      const hasSubledgerErrors = hasIssueFor(unresolvedMapping, 'subledger');
      const hasCoaErrors = hasIssueFor(unresolvedMapping, 'chart', 'coa');

      const notes = {};
      const statusOf = (key, count, hasErrors, logKey) => {
        if (failed.has(key)) { notes[key] = 'Could not be checked — the data did not load.'; return 'unknown'; }
        if (hasErrors) return 'warning';
        if (count > 0 && failed.has(logKey)) {
          notes[key] = 'Configured, but its validation issues could not be checked.';
          return 'warning';
        }
        return count > 0 ? 'done' : 'pending';
      };

      // Custom tables: live and active ones count.
      const activeTable = (t) => t.isActive !== false;
      const refTables = live(listOf(customTables)).filter(activeTable);
      const opTables = live(listOf(operationalTables)).filter(activeTable);
      const tableNames = refTables.map(t => t.tableName || t.name).filter(Boolean);
      const operationalTableNames = opTables.map(t => t.tableName || t.name).filter(Boolean);

      // Events: live ones; inactive events don't run.
      const liveEvents = live(listOf(events));
      const activeEvents = liveEvents.filter(e => e.isActive !== false);
      const eventNames = activeEvents.map(e => e.eventName || e.name).filter(Boolean);

      // Models: live and ACTIVE ones can run.
      const liveModels = live(listOf(models));
      const activeModels = liveModels.filter(m => String(m.modelStatus ?? 'ACTIVE').toUpperCase() === 'ACTIVE');
      const modelTypes = [...new Set(activeModels.map(m => String(m.modelType || '').toUpperCase()).filter(Boolean))];

      // Reference Table Data: each active reference table must have data. One row is enough to
      // know (limit=1 — the full table is never downloaded). Keyed by the table's id.
      let referenceTableData;
      const refTablesMissingData = [];
      const refTablesUnchecked = [];
      const refTablesToCheck = refTables
        .map(t => ({ id: t.id || t._id, name: t.tableName || t.name }))
        .filter(t => t.id && t.name);
      if (failed.has('customTables')) {
        referenceTableData = 'unknown';
        notes.referenceTableData = 'Could not be checked — the reference tables did not load.';
      } else if (refTablesToCheck.length > 0) {
        const dataResults = await Promise.allSettled(
          refTablesToCheck.map(t => reportingApi.post(`/custom-ref-data/execute/${t.id}`, [], { params: { limit: 1 } }))
        );
        if (seq !== readinessSeq.current) return;
        dataResults.forEach((r, i) => {
          const { name } = refTablesToCheck[i];
          if (r.status !== 'fulfilled') {
            console.warn('Reference data check failed for', name, r.reason);
            refTablesUnchecked.push(name);
            return;
          }
          const rows = Array.isArray(r.value?.data) ? r.value.data : [];
          if (rows.length === 0) refTablesMissingData.push(name);
        });
        referenceTableData = refTablesMissingData.length > 0 ? 'warning'
          : refTablesUnchecked.length > 0 ? 'unknown' : 'done';
        if (refTablesUnchecked.length) notes.referenceTableData = `Could not check: ${refTablesUnchecked.join(', ')}.`;
      } else {
        // No reference tables to load: 'done' when the Custom Tables phase is otherwise
        // populated (e.g. operational-only), else 'pending' so a fully empty phase stays optional.
        referenceTableData = operationalTableNames.length > 0 ? 'done' : 'pending';
      }

      // Model step: an active model is needed; models that exist but are all inactive is a warning.
      let modelStatus;
      if (failed.has('models')) { modelStatus = 'unknown'; notes.model = 'Could not be checked — the models did not load.'; }
      else if (activeModels.length > 0) modelStatus = 'done';
      else if (liveModels.length > 0) { modelStatus = 'warning'; notes.model = 'Models are loaded, but none is active — activate one to run it.'; }
      else modelStatus = 'pending';

      let eventsStatus;
      if (failed.has('events')) { eventsStatus = 'unknown'; notes.events = 'Could not be checked — the events did not load.'; }
      else if (activeEvents.length > 0) eventsStatus = 'done';
      else if (liveEvents.length > 0) { eventsStatus = 'warning'; notes.events = 'Events exist, but all are inactive.'; }
      else eventsStatus = 'pending';

      setReadinessStatus({
        // Home currency: a currency is actually set.
        currency: failed.has('settings') ? 'unknown' : (settings?.currency || settings?.homeCurrency) ? 'done' : 'pending',
        fiscal: failed.has('periods') ? 'unknown' : cnt(periods) > 0 ? 'done' : 'pending',
        dashboard: failed.has('settings') ? 'unknown' : (settings?.dashboardConfiguration || settings?.dashboardConfig || settings?.widgetConfig) ? 'done' : 'pending',
        transactions: statusOf('txns', cnt(txns), hasTxnErrors, 'rulesLog'),
        attributes: statusOf('attrs', cnt(attrs), hasAttrErrors, 'rulesLog'),
        balances: statusOf('aggs', cnt(aggs), hasAggErrors, 'rulesLog'),
        coa: statusOf('coa', cnt(coa), hasCoaErrors, 'mappingLog'),
        subledger: statusOf('subledger', cnt(subledger), hasSubledgerErrors, 'mappingLog'),
        accountsubtypes: statusOf('subtypes', cnt(subtypes), hasSubtypeErrors, 'mappingLog'),
        events: eventsStatus,
        eventNames,
        // Done once any table is known to exist; with none found, a failed load means "couldn't check".
        customtables: (tableNames.length + operationalTableNames.length) > 0 ? 'done'
          : (failed.has('customTables') || failed.has('operationalTables')) ? 'unknown' : 'pending',
        customTableNames: tableNames,
        operationalTableNames,
        referenceTableData,
        referenceTableDataMissing: refTablesMissingData,
        model: modelStatus,
        modelTypes,
        modelNames: activeModels.map(m => m.modelName).filter(Boolean),
        // Per-item explanations, keyed like the items (statusOf keys map to item ids below).
        notes: {
          ...notes,
          transactions: notes.txns, attributes: notes.attrs, balances: notes.aggs,
          accountsubtypes: notes.subtypes,
          ...((tableNames.length + operationalTableNames.length) === 0 && (failed.has('customTables') || failed.has('operationalTables'))
            ? { customtables: 'Could not be checked — the custom tables did not load.' } : {}),
        },
      });
      setReadinessErrors(errorLabels);
      readinessLoadedRef.current = true;
    } catch (err) {
      if (seq !== readinessSeq.current) return;
      console.error('Readiness check failed:', err);
      setReadinessErrors(['the readiness check']);
    } finally {
      if (seq === readinessSeq.current) {
        setReadinessLoading(false);
        setReadinessRefreshing(false);
      }
    }
  }, [tenant]);

  // A different tenant starts from an empty checklist (never shows the previous tenant's), then
  // pre-fetches silently so the modal opens instantly.
  React.useEffect(() => {
    readinessSeq.current += 1;
    readinessLoadedRef.current = false;
    setReadinessStatus({});
    setReadinessErrors([]);
    setReadinessRefreshing(false);
    if (tenant) fetchReadinessStatus(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant]);
  const [settingsKey, setSettingsKey] = React.useState(0);
  const [reportsKey, setReportsKey] = React.useState(0);
  const [rulesInitialTab, setRulesInitialTab] = React.useState(0);
  const [journalInitialTab, setJournalInitialTab] = React.useState(0);

  React.useEffect(() => setMounted(true), []);

  // Allow deeply-nested components (e.g. the event-configuration modal) to
  // request in-app navigation without prop drilling, via a global custom event.
  React.useEffect(() => {
    const onNavigateRequest = (e) => {
      const segment = e?.detail?.segment;
      if (segment) handleNavigation(segment);
    };
    window.addEventListener('fyntrac:navigate', onNavigateRequest);
    return () => window.removeEventListener('fyntrac:navigate', onNavigateRequest);
  }, []);

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
  const handleCollapseToggle = () => setIsCollapsed(!isCollapsed);

  const handleNavigation = (segment, customOnClick) => {
    if (customOnClick) {
      customOnClick();
    } else if (segment === "getstarted") {
      window.open("https://docs.fyntrac.com", "_blank");
    } else if (segment) {
      if (segment === 'settings-dashboard') setSettingsKey(k => k + 1);
      // Reports needs the full width for its grid and side panel
      if (segment === 'report-dashboard') {
        setIsCollapsed(true);
        setReportsKey(k => k + 1); // always land on the Standard reports tab
      }
      setPathname(`/${segment}`);
      setMobileOpen(false);
    }
  };

  const handleLogoutConfirm = () => {
    setOpenDialog(false);
    clearSession(); // Clears localStorage + redirects via window.location.href to gateway OIDC logout
  };

  const currentDrawerWidth = isCollapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH;
  const currentPageTitle = PAGE_TITLES[pathname.replace('/', '')] || 'Dashboard';

  if (!mounted) return null;

  return (
    <ThemeProvider theme={fyntracTheme}>
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        <CssBaseline />

        {/* 1. SIDEBAR */}
        <Box
          component="nav"
          sx={{
            width: { sm: currentDrawerWidth },
            flexShrink: { sm: 0 },
            transition: 'width 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {/* Mobile Drawer */}
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{ keepMounted: true }}
            sx={{
              display: { xs: 'block', sm: 'none' },
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH },
            }}
          >
            <DrawerContent
              isCollapsed={false}
              onExpandSidebar={() => { }}
              pathname={pathname}
              onNavigate={handleNavigation}
              onLogout={() => setOpenDialog(true)}
              onReadiness={() => { setOpenReadiness(true); fetchReadinessStatus(!readinessLoadedRef.current); }}
            />
          </Drawer>

          {/* Desktop Drawer */}
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: 'none', sm: 'block' },
              '& .MuiDrawer-paper': {
                boxSizing: 'border-box',
                width: currentDrawerWidth,
                transition: 'width 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
                willChange: 'width',
                overflow: 'visible',
                borderRight: `1px solid ${SLATE_200}`,
                bgcolor: '#ffffff',
              },
            }}
            open
          >
            {/* Floating expand/collapse pill */}
            <Tooltip title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} placement="right">
              <IconButton
                onClick={handleCollapseToggle}
                size="small"
                sx={{
                  position: 'absolute',
                  top: HEADER_HEIGHT - 12,
                  right: -12,
                  zIndex: (t) => t.zIndex.drawer + 2,
                  width: 24,
                  height: 24,
                  bgcolor: '#fff',
                  border: `1px solid ${SLATE_200}`,
                  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
                  color: SLATE_700,
                  '&:hover': { bgcolor: INDIGO, color: '#fff', borderColor: INDIGO },
                }}
              >
                {isCollapsed ? <ChevronRightIcon fontSize="small" /> : <ChevronLeftIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
            <DrawerContent
              isCollapsed={isCollapsed}
              onExpandSidebar={() => setIsCollapsed(false)}
              pathname={pathname}
              onNavigate={handleNavigation}
              onLogout={() => setOpenDialog(true)}
              onReadiness={() => { setOpenReadiness(true); fetchReadinessStatus(!readinessLoadedRef.current); }}
            />
          </Drawer>
        </Box>

        {/* Right column: AppBar + Content stacked in flex-column */}
        <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>

          {/* 2. APPBAR — static, no gap */}
          <AppBar
            position="static"
            elevation={0}
            sx={{
              bgcolor: 'background.paper',
              borderBottom: `1px solid ${SLATE_200}`,
              color: 'text.primary',
              flexShrink: 0,
            }}
          >
            <Toolbar sx={{ height: HEADER_HEIGHT, pl: 0, pr: { sm: 2.5 }, gap: 2, minHeight: `${HEADER_HEIGHT}px !important` }}>
              {/* Mobile hamburger */}
              <IconButton
                color="inherit"
                edge="start"
                size="small"
                onClick={handleDrawerToggle}
                sx={{ display: { sm: 'none' }, width: 32, height: 32 }}
              >
                <MenuIcon sx={{ fontSize: 26 }} />
              </IconButton>

              {/* Desktop expand/collapse toggle */}
              <IconButton
                edge="start"
                onClick={handleCollapseToggle}
                size="small"
                sx={{
                  display: { xs: 'none', sm: 'inline-flex' },
                  color: SLATE_500,
                  '&:hover': { bgcolor: SLATE_100, color: SLATE_BLACK },
                }}
              >
                <MenuIcon sx={{ fontSize: 26 }} />
              </IconButton>

              {/* Page title block */}
              <Box sx={{ flexGrow: 1 }}>
                <Typography component="span" sx={{
                  fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif !important',
                  fontSize: '0.6875rem !important',
                  fontWeight: '700 !important',
                  fontStyle: 'normal !important',
                  color: '#64748b !important',
                  textTransform: 'uppercase !important',
                  letterSpacing: '0.08em !important',
                  lineHeight: '1.1 !important',
                  display: 'block',
                }}>
                  Workspace
                </Typography>
                <Typography sx={{
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: SLATE_BLACK,
                  lineHeight: 1.3,
                  mt: 0,
                  fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
                }}>
                  {currentPageTitle}
                </Typography>
              </Box>

              {/* USER PROFILE */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {tenant && (
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    bgcolor: alpha('#919EAB', 0.12),
                    py: 0.5,
                    px: 1.5,
                    borderRadius: 3
                  }}>
                    {(() => {
                      const displayName = user?.firstName || user?.name || user?.email || tenant || '';
                      const initial = displayName?.[0]?.toUpperCase();
                      return (
                        <>
                          <Avatar sx={{ bgcolor: 'primary.main', width: 28, height: 28, fontSize: 14, fontWeight: 700 }}>
                            {initial}
                          </Avatar>
                          <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                            <Typography variant="subtitle2" sx={{ color: 'text.primary', lineHeight: 1 }}>
                              {displayName} / {tenant}
                            </Typography>
                          </Box>
                        </>
                      );
                    })()}
                  </Box>
                )}
              </Box>
            </Toolbar>
          </AppBar>

          {/* 3. MAIN CONTENT — scrolls independently, no top gap */}
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              overflow: 'auto',
              bgcolor: 'background.default',
            }}
          >
            <PageContent pathname={pathname} settingsKey={settingsKey} reportsKey={reportsKey} rulesInitialTab={rulesInitialTab} journalInitialTab={journalInitialTab} />
          </Box>
        </Box>

        {/* 4. LOGOUT DIALOG */}
        <Dialog
          open={openDialog}
          onClose={() => setOpenDialog(false)}
          maxWidth="xs"
          fullWidth
          slots={{ transition: Slide }}
          slotProps={{
            transition: { direction: 'up' },
            paper: { sx: { borderRadius: 4, overflow: 'hidden', border: '1px solid', borderColor: 'divider' } },
          }}
        >
          <DialogTitle sx={{ p: 0, flexShrink: 0 }}>
            <Box sx={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              px: 3, pt: 3, pb: 2.5,
              background: `linear-gradient(135deg, ${alpha('#2563EB', 0.08)} 0%, ${alpha('#2563EB', 0.05)} 100%)`,
              borderBottom: '1px solid', borderColor: 'divider',
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <img src="fyntrac.png" alt="Fyntrac" style={{ width: 72, height: 'auto' }} />
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    <Chip
                      label="Account"
                      size="small"
                      sx={{
                        height: 20, fontSize: '0.6rem', fontWeight: 700,
                        letterSpacing: 0.8, textTransform: 'uppercase',
                        bgcolor: alpha('#2563EB', 0.1), color: '#2563EB', borderRadius: 1,
                      }}
                    />
                  </Box>
                  <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.2, color: 'text.primary', fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif' }}>
                    Sign Out
                  </Typography>
                </Box>
              </Box>
              <Tooltip title="Close" placement="left">
                <IconButton onClick={() => setOpenDialog(false)} size="small" sx={{
                  color: 'text.secondary', bgcolor: 'action.hover', borderRadius: 2,
                  '&:hover': { bgcolor: alpha('#dc2626', 0.12), color: '#dc2626' },
                }}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </DialogTitle>
          <DialogContent sx={{ pt: 5, px: 3 }}>
            <Typography sx={{ fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif', fontSize: '0.88rem', color: 'text.secondary', lineHeight: 1.7, mt: 3 }}>
              Are you sure you want to log out? <strong>Unsaved changes may be lost.</strong>
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button
              onClick={handleLogoutConfirm}
              variant="contained"
              sx={{
                borderRadius: 2, textTransform: 'none', fontWeight: 700,
                fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif', px: 2.5,
                background: '#14213d', color: '#fff',
                boxShadow: '0 4px 12px rgba(20,33,61,0.28)',
                transition: 'all 0.2s ease-in-out',
                '&:hover': { background: '#1e3057', boxShadow: '0 6px 18px rgba(20,33,61,0.4)', transform: 'translateY(-1px)' },
              }}
            >
              Log Out
            </Button>
          </DialogActions>
        </Dialog>

        {/* ── Readiness Checklist Modal ── */}
        {(() => {
          const PHASES = [
            {
              id: 'tenant', label: 'Tenant Setup', route: 'settings/configure', mandatory: true,
              items: [
                { id: 'currency', label: 'Home Currency', route: 'settings/configure' },
                { id: 'fiscal', label: 'Fiscal Period', route: 'settings/configure' },
                { id: 'dashboard', label: 'Dashboard', route: 'settings/configure' },
              ],
            },
            {
              id: 'rules', label: 'Accounting Rules', route: 'settings/accounting-rules/reference-data', mandatory: true,
              items: [
                { id: 'transactions', label: 'Transactions', route: 'settings/accounting-rules/reference-data', tabIndex: 0 },
                { id: 'attributes', label: 'Attributes', route: 'settings/accounting-rules/reference-data', tabIndex: 1 },
                { id: 'balances', label: 'Balances', route: 'settings/accounting-rules/reference-data', tabIndex: 2 },
              ],
            },
            {
              id: 'journal', label: 'Journal Mapping', route: 'journal-mapping', mandatory: true,
              items: [
                { id: 'accountsubtypes', label: 'Account Subtypes', route: 'journal-mapping', tabIndex: 0 },
                { id: 'subledger', label: 'Subledger Mapping', route: 'journal-mapping', tabIndex: 1 },
                { id: 'coa', label: 'Chart of Accounts', route: 'journal-mapping', tabIndex: 2 },
              ],
            },
            {
              id: 'customtables', label: 'Custom Tables', route: 'settings/accounting-rules/custom-table', mandatory: false,
              items: [
                { id: 'customtables', label: 'Custom Tables', namesKey: 'customTableNames', opNamesKey: 'operationalTableNames', route: 'settings/accounting-rules/custom-table' },
                { id: 'referenceTableData', label: 'Reference Table Data', missingKey: 'referenceTableDataMissing', route: 'sync' },
              ],
            },
            {
              id: 'events', label: 'Event Setup', route: 'settings/accounting-rules/event-configuration', mandatory: true,
              items: [
                { id: 'events', label: 'Events Configured', namesKey: 'eventNames', route: 'settings/accounting-rules/event-configuration' },
              ],
            },
            {
              id: 'model', label: 'Model', route: 'model', mandatory: true,
              items: [
                { id: 'model', label: 'Model', namesKey: 'modelNames', showModelType: true, route: 'model' },
              ],
            },
          ];

          const phaseStatus = (phase) => {
            if (!phase.mandatory && phase.items.every(i => (readinessStatus[i.id] ?? 'pending') === 'pending')) return 'optional';
            const statuses = phase.items.map(i => readinessStatus[i.id] ?? 'pending');
            if (statuses.every(s => s === 'done')) return 'done';
            // Couldn't check = not known to be fine.
            if (statuses.some(s => s === 'warning' || s === 'unknown')) return 'warning';
            if (statuses.some(s => s === 'done')) return 'progress';
            return 'pending';
          };

          const circleColor = (ps) => ({
            done: alpha('#16a34a', 0.12),
            warning: alpha('#d97706', 0.12),
            progress: alpha('#2563EB', 0.12),
            pending: alpha('#94a3b8', 0.1),
            optional: alpha('#94a3b8', 0.06),
          }[ps] || alpha('#94a3b8', 0.1));

          const circleBorderColor = (ps) => ({
            done: alpha('#16a34a', 0.4),
            warning: alpha('#d97706', 0.4),
            progress: alpha('#2563EB', 0.4),
            pending: alpha('#94a3b8', 0.25),
            optional: alpha('#94a3b8', 0.15),
          }[ps] || alpha('#94a3b8', 0.25));

          const circleTextColor = (ps) => ({
            done: '#16a34a',
            warning: '#d97706',
            progress: '#2563EB',
            pending: '#94a3b8',
            optional: '#cbd5e1',
          }[ps] || '#94a3b8');
          const itemColor = (s) => ({ done: '#16a34a', warning: '#d97706', unknown: '#64748b', pending: '#94a3b8' }[s] || '#94a3b8');

          const StatusIcon = ({ status, size = 18 }) => {
            if (status === 'done') return <CheckCircleOutlinedIcon sx={{ fontSize: size, color: '#16a34a', flexShrink: 0 }} />;
            if (status === 'warning') return <WarningAmberOutlinedIcon sx={{ fontSize: size, color: '#d97706', flexShrink: 0 }} />;
            if (status === 'unknown') return <HelpOutlineOutlinedIcon sx={{ fontSize: size, color: '#64748b', flexShrink: 0 }} />;
            return <RadioButtonUncheckedIcon sx={{ fontSize: size, color: '#cbd5e1', flexShrink: 0 }} />;
          };

          const activePhase = PHASES.find(p => p.id === selectedPhase) ?? PHASES[0];

          return (
            <Dialog
              open={openReadiness}
              onClose={() => setOpenReadiness(false)}
              maxWidth="md"
              fullWidth
              slots={{ transition: Slide }}
              slotProps={{
                transition: { direction: 'up' },
                paper: { sx: { borderRadius: 4, overflow: 'hidden', border: '1px solid', borderColor: 'divider', height: '80vh', display: 'flex', flexDirection: 'column' } },
              }}
            >
              {/* Header */}
              <DialogTitle sx={{ p: 0, flexShrink: 0 }}>
                <Box sx={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  px: 3, pt: 2.5, pb: 2,
                  background: `linear-gradient(135deg, ${alpha('#2563EB', 0.08)} 0%, ${alpha('#2563EB', 0.03)} 100%)`,
                  borderBottom: '1px solid', borderColor: 'divider',
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <img src="fyntrac.png" alt="Fyntrac" style={{ width: 64, height: 'auto' }} />
                    <Box>
                      <Box sx={{ mb: 0.5 }}>
                        <Chip
                          icon={<FactCheckOutlinedIcon sx={{ fontSize: '12px !important', color: '#2563EB !important' }} />}
                          label="Implementation"
                          size="small"
                          sx={{ height: 20, fontSize: '0.6rem', fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', bgcolor: alpha('#2563EB', 0.1), color: '#2563EB', borderRadius: 1 }}
                        />
                      </Box>
                      <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.2, color: 'text.primary', fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif' }}>
                        Readiness Checklist
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem' }}>
                        Track your tenant setup progress
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {readinessRefreshing && !readinessLoading && (
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <CircularProgress size={12} sx={{ color: '#2563EB' }} /> Updating…
                      </Typography>
                    )}
                    <Tooltip title="Refresh">
                      <span>
                        <IconButton onClick={() => fetchReadinessStatus(false)} disabled={readinessLoading || readinessRefreshing} size="small" aria-label="Refresh readiness" sx={{ color: 'text.secondary', bgcolor: 'action.hover', borderRadius: 2, '&:hover': { bgcolor: alpha('#2563EB', 0.08), color: '#2563EB' } }}>
                          <RefreshRoundedIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="Close" placement="left">
                      <IconButton onClick={() => setOpenReadiness(false)} size="small" sx={{ color: 'text.secondary', bgcolor: 'action.hover', borderRadius: 2, '&:hover': { bgcolor: alpha('#2563EB', 0.08), color: '#2563EB' } }}>
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </DialogTitle>

              <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                {readinessLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
                    <CircularProgress size={36} sx={{ color: '#2563EB' }} />
                  </Box>
                ) : (
                  <>
                    {readinessErrors.length > 0 && (
                      <Alert
                        severity="warning"
                        sx={{ borderRadius: 0, fontSize: '0.8rem' }}
                        action={<Button color="inherit" size="small" onClick={() => fetchReadinessStatus(false)} sx={{ fontWeight: 700 }}>Retry</Button>}
                      >
                        <span title={readinessErrors.join(', ')}>
                          {readinessErrors.length > 1 ? `Couldn’t load ${readinessErrors.length} setup checks.` : `Couldn’t load ${readinessErrors[0]}.`} Check the server connection and retry.
                        </span>
                      </Alert>
                    )}
                    {/* Pipeline */}
                    <Box sx={{ px: 3, pt: 3, pb: 2.5, borderBottom: '1px solid', borderColor: 'divider', bgcolor: alpha('#f8fafc', 0.8) }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        {PHASES.map((phase, idx) => {
                          const ps = phaseStatus(phase);
                          const isSelected = selectedPhase === phase.id;
                          return (
                            <React.Fragment key={phase.id}>
                              <Box
                                onClick={() => setSelectedPhase(phase.id)}
                                sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, cursor: 'pointer', px: 0.5 }}
                              >
                                {/* Circle */}
                                <Box sx={{
                                  width: 64, height: 64, borderRadius: '50%',
                                  bgcolor: circleColor(ps),
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  border: `2px solid ${isSelected ? circleBorderColor(ps) : 'transparent'}`,
                                  boxShadow: isSelected ? `0 0 0 3px ${alpha(circleTextColor(ps), 0.15)}` : 'none',
                                  transition: 'all 0.2s',
                                  '&:hover': { boxShadow: `0 0 0 3px ${alpha(circleTextColor(ps), 0.12)}`, border: `2px solid ${circleBorderColor(ps)}` },
                                }}>
                                  {ps === 'done' && <CheckCircleOutlinedIcon sx={{ color: '#16a34a', fontSize: 26 }} />}
                                  {ps === 'warning' && <WarningAmberOutlinedIcon sx={{ color: '#d97706', fontSize: 26 }} />}
                                  {(ps === 'pending' || ps === 'optional' || ps === 'progress') && (
                                    <Typography sx={{ color: circleTextColor(ps), fontWeight: 700, fontSize: '1.1rem' }}>{idx + 1}</Typography>
                                  )}
                                </Box>
                                {/* Label */}
                                <Typography variant="caption" sx={{
                                  mt: 1, fontWeight: isSelected ? 700 : 600, textAlign: 'center',
                                  color: isSelected ? '#14213d' : ps === 'done' ? '#16a34a' : ps === 'warning' ? '#d97706' : '#64748b',
                                  fontSize: '0.72rem', lineHeight: 1.3, maxWidth: 80,
                                }}>
                                  {phase.label}
                                </Typography>
                                {!phase.mandatory && (
                                  <Chip label="Optional" size="small" sx={{ mt: 0.5, height: 14, fontSize: '0.55rem', fontWeight: 700, bgcolor: alpha('#94a3b8', 0.1), color: '#94a3b8', borderRadius: 1 }} />
                                )}
                              </Box>
                              {/* Arrow */}
                              {idx < PHASES.length - 1 && (
                                <Box sx={{ display: 'flex', alignItems: 'center', pt: 2.5, px: 0 }}>
                                  <ArrowForwardIosIcon sx={{ fontSize: 13, color: '#cbd5e1' }} />
                                </Box>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </Box>
                    </Box>

                    {/* Selected Phase Content */}
                    <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
                      {/* Phase header */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: alpha(circleTextColor(phaseStatus(activePhase)), 0.35), flexShrink: 0 }} />
                        <Typography variant="subtitle1" fontWeight={700} color="text.primary">{activePhase.label}</Typography>
                        {!activePhase.mandatory && (
                          <Chip label="Optional" size="small" sx={{ height: 18, fontSize: '0.62rem', fontWeight: 700, bgcolor: alpha('#94a3b8', 0.1), color: '#94a3b8', borderRadius: 1 }} />
                        )}
                      </Box>

                      {/* Items */}
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {activePhase.items.map(item => {
                          const status = readinessStatus[item.id] ?? 'pending';
                          return (
                            <Box
                              key={item.id}
                              onClick={() => { setOpenReadiness(false); if (item.tabIndex !== undefined) { const r = item.route ?? activePhase.route; if (r === 'settings/accounting-rules/reference-data') setRulesInitialTab(item.tabIndex); else if (r === 'journal-mapping') setJournalInitialTab(item.tabIndex); } handleNavigation(item.route ?? activePhase.route); }}
                              sx={{
                                display: 'flex', alignItems: 'flex-start', gap: 2,
                                p: 2, borderRadius: 3, cursor: 'pointer',
                                border: '1px solid', borderColor: alpha('#e2e8f0', 0.8),
                                bgcolor: status === 'done' ? alpha('#16a34a', 0.02) : status === 'warning' ? alpha('#d97706', 0.02) : '#fafafa',
                                transition: 'all 0.15s',
                                '&:hover': { borderColor: '#2563EB', bgcolor: alpha('#2563EB', 0.02), transform: 'translateX(2px)' },
                              }}
                            >
                              <StatusIcon status={status} size={20} />
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="body2" fontWeight={600} sx={{ color: status === 'pending' || status === 'unknown' ? 'text.secondary' : 'text.primary', fontSize: '0.85rem' }}>
                                  {item.label}
                                </Typography>
                                {/* Generic names list (events, custom tables, model names) */}
                                {item.namesKey && (() => {
                                  const names = readinessStatus[item.namesKey] ?? [];
                                  const opNames = item.opNamesKey ? (readinessStatus[item.opNamesKey] ?? []) : [];
                                  const hasAny = names.length > 0 || opNames.length > 0;
                                  return hasAny ? (
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 0.75 }}>
                                      {names.length > 0 && (
                                        <Box>
                                          {item.opNamesKey && (
                                            <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4, display: 'block', mb: 0.25 }}>Reference</Typography>
                                          )}
                                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                            {names.map(name => (
                                              <Chip key={name} label={name} size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600, bgcolor: alpha('#16a34a', 0.08), color: '#16a34a', borderRadius: 1 }} />
                                            ))}
                                          </Box>
                                        </Box>
                                      )}
                                      {opNames.length > 0 && (
                                        <Box>
                                          <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4, display: 'block', mb: 0.25 }}>Operational</Typography>
                                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                            {opNames.map(name => (
                                              <Chip key={name} label={name} size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600, bgcolor: alpha('#2563EB', 0.08), color: '#2563EB', borderRadius: 1 }} />
                                            ))}
                                          </Box>
                                        </Box>
                                      )}
                                      {item.showModelType && (readinessStatus.modelTypes ?? []).length > 0 && (
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                          {[...new Set(readinessStatus.modelTypes.map(t => (t === 'DSL' || t === 'PYTHON' ? 'Python Model' : t === 'EXCEL' ? 'Excel Model' : `${t} Model`)))].map(label => (
                                            <Chip key={label} label={label} size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600, bgcolor: alpha('#64748b', 0.08), color: '#64748b', borderRadius: 1, width: 'fit-content' }} />
                                          ))}
                                        </Box>
                                      )}
                                    </Box>
                                  ) : (
                                    <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.72rem' }}>
                                      {!activePhase.mandatory ? 'Not configured (optional)' : 'None configured'}
                                    </Typography>
                                  );
                                })()}
                                {/* Reference Table Data: list of tables still missing ingested data */}
                                {item.missingKey && (() => {
                                  const missing = readinessStatus[item.missingKey] ?? [];
                                  if (status === 'done') {
                                    return (
                                      <Typography variant="caption" sx={{ color: '#16a34a', fontSize: '0.72rem', fontWeight: 600, display: 'block', mt: 0.5 }}>
                                        All reference tables have data loaded
                                      </Typography>
                                    );
                                  }
                                  if (status === 'warning' && missing.length > 0) {
                                    return (
                                      <Box sx={{ mt: 0.75 }}>
                                        <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4, display: 'block', mb: 0.25 }}>No data loaded</Typography>
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                          {missing.map(name => (
                                            <Chip key={name} label={name} size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600, bgcolor: alpha('#d97706', 0.1), color: '#b45309', borderRadius: 1 }} />
                                          ))}
                                        </Box>
                                      </Box>
                                    );
                                  }
                                  return null;
                                })()}
                                {/* Warning / couldn't-check label */}
                                {(status === 'warning' || status === 'unknown') && (
                                  <Typography variant="caption" sx={{ color: status === 'unknown' ? '#64748b' : '#d97706', fontSize: '0.72rem', fontWeight: 600, display: 'block', mt: 0.5 }}>
                                    {readinessStatus.notes?.[item.id]
                                      ?? (item.missingKey ? 'Load data for the highlighted reference tables to continue' : 'Has validation issues — review before proceeding')}
                                  </Typography>
                                )}
                              </Box>
                              <ArrowForwardIosIcon sx={{ fontSize: 12, color: '#cbd5e1', mt: 0.5 }} />
                            </Box>
                          );
                        })}
                      </Box>
                    </Box>
                  </>
                )}
              </DialogContent>
            </Dialog>
          );
        })()}

      </Box>
    </ThemeProvider>
  );
}