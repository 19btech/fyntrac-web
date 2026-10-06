"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { MotionConfig, motion } from 'framer-motion';
import { ThemeProvider, alpha, createTheme } from '@mui/material/styles';
import { Box, ButtonBase, CircularProgress, Tab, Tabs, Tooltip, Typography } from '@mui/material';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import StarBorderRoundedIcon from '@mui/icons-material/StarBorderRounded';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import apiClient from '../services/api-client';
import { insightUrl } from '../services/runtime-config';
import { useAccess } from '../user-management/access';
import { useTenant } from '../tenant-context';
import ReportCatalog from './report-catalog';
import ReportViewer from './report-viewer';
import SidePanel from './side-panel';
import ReportErrorBoundary from './error-boundary';
import ExportsPanel from './exports-panel';
import { useExports } from './export-store';
import { CATEGORIES, REPORTS, categoryLabel, getReport } from './report-registry';
import { useReportStore } from './use-report-store';
import { prefetchReport, setReportTenant, warmPeriods, warmUpReports } from './report-api';
import { EASE, line, radius, shadow, surface } from './tokens';

const FAVORITES_TAB = 'favorites';
const EXPORTED_TAB = 'exported';

const TABS = [
  ...CATEGORIES.map((c) => ({ id: c.id, label: c.label })),
  {
    id: FAVORITES_TAB,
    label: 'Favorites',
    emptyIcon: StarBorderRoundedIcon,
    emptyTitle: 'No favorites yet',
    emptyText: 'Star a report and it will appear here for quick access.',
  },
  { id: EXPORTED_TAB, label: 'Exported' },
];

// Applied only inside the Report Explorer, including its dialogs and menus.
export const explorerTheme = (outer) => createTheme(outer, {
  // Other screens set their headings to 700; match them so this page doesn't read lighter.
  typography: {
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
    subtitle1: { fontWeight: 700 },
    subtitle2: { fontWeight: 700 },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { boxShadow: 'none', '&:hover': { transform: 'none', boxShadow: 'none' } },
        contained: { boxShadow: 'none', '&:hover': { boxShadow: 'none' } },
        sizeSmall: { padding: '5px 12px', fontSize: '0.8125rem' },
      },
    },
    MuiListItemButton: {
      styleOverrides: { root: { '&.Mui-selected': { backgroundColor: 'transparent' } } },
    },
  },
});

function ExportStatus({ running, justFinished }) {
  if (running) {
    return (
      <Tooltip title={`${running.count} export${running.count > 1 ? 's' : ''} in progress`}>
        <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, color: 'primary.main', fontSize: '0.72rem', fontWeight: 700 }}>
          <CircularProgress size={12} thickness={6} variant={running.progress > 0 ? 'determinate' : 'indeterminate'} value={running.progress * 100} />
          {Math.round(running.progress * 100)}%
        </Box>
      </Tooltip>
    );
  }
  if (justFinished) {
    return (
      <Tooltip title="Export completed">
        <CheckCircleRoundedIcon sx={{ fontSize: 16, color: '#16a34a', animation: 'exportDone 400ms ease-out', '@keyframes exportDone': { from: { transform: 'scale(0.4)', opacity: 0 }, to: { transform: 'none', opacity: 1 } } }} />
      </Tooltip>
    );
  }
  return null;
}

function TabLabel({ label, count, status }) {
  return (
    <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
      {label}
      {status}
      {!status && count > 0 && (
        <Box
          component="span"
          sx={{ minWidth: 20, height: 18, px: 0.6, borderRadius: '9px', fontSize: '0.7rem', fontWeight: 700, lineHeight: '18px', textAlign: 'center', bgcolor: surface.sunken, color: 'text.secondary' }}
        >
          {count}
        </Box>
      )}
    </Box>
  );
}

export default function ReportExplorer() {
  const { user, tenant } = useTenant();
  const { favorites, toggleFavorite } = useReportStore();
  const exportScope = `${tenant || 'default'}:${user?.id || user?.email || 'anon'}`;
  const { exports, startExport, removeExport, downloadExport } = useExports(exportScope);
  const [seenExports, setSeenExports] = useState(() => new Set());
  // Only exports finishing after the page opened count as "just finished" (not stored ones).
  const [openedAt] = useState(() => Date.now());
  // Cached report data belongs to the current tenant (cleared before anything is fetched for another).
  setReportTenant(tenant);

  const [tab, setTab] = useState(CATEGORIES[0].id);
  const [active, setActive] = useState(null); // { key, reportId, item }
  const [panel, setPanel] = useState(null);

  // Whether any period is closed decides every report's default period; check it straight away.
  // Then warm every report's default layout in the background so opening any report is instant.
  useEffect(() => {
    warmPeriods();
    const idle = window.requestIdleCallback ?? ((cb) => setTimeout(cb, 300));
    const cancel = window.cancelIdleCallback ?? clearTimeout;
    const handle = idle(() => warmUpReports());
    return () => cancel(handle);
  }, [tenant]);

  const toItem = (report) => ({
    key: report.id,
    reportId: report.id,
    category: report.category,
    tag: categoryLabel(report.category),
    name: report.name,
    description: report.description,
    comingSoon: report.comingSoon,
    favorite: favorites.includes(report.id),
    onToggleFavorite: () => toggleFavorite(report.id),
  });

  const allItems = useMemo(
    () => REPORTS.map(toItem),
    // toItem only closes over favorites
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [favorites]
  );

  const items = useMemo(() => {
    if (tab === EXPORTED_TAB) return [];
    if (tab === FAVORITES_TAB) return allItems.filter((i) => i.favorite);
    return allItems.filter((i) => i.category === tab);
  }, [tab, allItems]);

  const currentTab = TABS.find((t) => t.id === tab);
  const activeReport = active && getReport(active.reportId);

  const openItem = (item) => {
    if (!item || item.comingSoon) return;
    setActive({ key: item.key, reportId: item.reportId, item });
  };

  const changeTab = (value) => {
    setTab(value);
    setActive(null);
    if (value === EXPORTED_TAB) setSeenExports(new Set(exports.map((e) => e.id)));
  };

  // Export status for the Exported tab label: progress while running, a check when one finishes.
  const runningExports = exports.filter((e) => e.status === 'running');
  const running = runningExports.length
    ? { count: runningExports.length, progress: runningExports.reduce((sum, e) => sum + e.progress, 0) / runningExports.length }
    : null;
  const justFinished = tab !== EXPORTED_TAB
    && exports.some((e) => e.status === 'done' && (e.finishedAt ?? 0) >= openedAt && !seenExports.has(e.id));

  const { can } = useAccess();
  const insightAllowed = can('insight.access') !== false;

  const openInsight = async () => {
    if (!insightAllowed) return;
    const base = insightUrl();
    const params = new URLSearchParams();
    try {
      // Fetch the OIDC ID token from the gateway and pass it to Fyntrac Insight
      const { data } = await apiClient.get('/auth/token');
      if (data?.token) params.set('token', data.token);
    } catch (err) {
      console.error('Failed to fetch token for Fyntrac Insight, opening without token:', err);
    }
    const displayName = user?.firstName || user?.name || user?.email || tenant || '';
    if (displayName) params.set('firstName', displayName);
    const tenantId = typeof tenant === 'string' ? tenant : (tenant?.id || tenant?.tenantId || tenant?.name || '');
    if (tenantId) params.set('tenant', tenantId);
    const qs = params.toString();
    window.open(qs ? `${base}?${qs}` : base, '_blank', 'noopener');
  };

  const reportsPanel = { items, activeKey: active?.key, onOpen: openItem };
  const counts = {
    [FAVORITES_TAB]: allItems.filter((i) => i.favorite).length,
    [EXPORTED_TAB]: exports.length,
  };
  const viewKey = active && activeReport ? `report:${active.key}` : `catalog:${tab}`;

  return (
    <ThemeProvider theme={explorerTheme}>
      <MotionConfig reducedMotion="user">
        <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 112px)', minHeight: 560, textAlign: 'left' }}>
          {/* Header — same treatment as the Diagnostic / Model pages */}
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
              Report Explorer
            </Typography>
            {insightAllowed && (
            <Tooltip title="Open Fyntrac Insight">
              <ButtonBase
                onClick={openInsight}
                aria-label="Open Fyntrac Insight"
                sx={{
                  borderRadius: radius.md,
                  p: 0.5,
                  transition: 'background-color 150ms, opacity 150ms',
                  '&:hover': { bgcolor: surface.sunken },
                  '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main' },
                }}
              >
                <Box component="img" src="/fyntrac-insight.png" alt="Fyntrac Insight" sx={{ height: 30, objectFit: 'contain', display: 'block', borderRadius: '8px' }} />
              </ButtonBase>
            </Tooltip>
            )}
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
              onChange={(_, value) => changeTab(value)}
              variant="scrollable"
              scrollButtons="auto"
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
                <Tab
                  key={t.id}
                  value={t.id}
                  label={<TabLabel label={t.label} count={counts[t.id]} status={t.id === EXPORTED_TAB ? <ExportStatus running={running} justFinished={justFinished} /> : null} />}
                  // Re-clicking the current tab while a report is open goes back to that tab's catalogue.
                  onClick={() => t.id === tab && setActive(null)}
                />
              ))}
            </Tabs>

            <Box sx={{ display: 'flex', flex: 1, minHeight: 0, bgcolor: surface.raised }}>
              <motion.div
                key={viewKey}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15, ease: EASE }}
                style={{ display: 'flex', flex: 1, minWidth: 0, minHeight: 0 }}
              >
                {active && activeReport ? (
                  <ReportErrorBoundary resetKey={active.key} onExit={() => setActive(null)}>
                    <ReportViewer
                      report={activeReport}
                      activeKey={active.key}
                      favorite={favorites.includes(active.key)}
                      onToggleFavorite={() => toggleFavorite(active.key)}
                      onExport={startExport}
                      panel={panel}
                      onPanelChange={setPanel}
                      reportsPanel={reportsPanel}
                    />
                  </ReportErrorBoundary>
                ) : tab === EXPORTED_TAB ? (
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <ExportsPanel exports={exports} onDownload={downloadExport} onRemove={removeExport} />
                  </Box>
                ) : (
                  <>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <ReportCatalog
                        title={currentTab.label}
                        items={items}
                        onOpen={openItem}
                        onPrefetch={(item) => prefetchReport(getReport(item.reportId))}
                        emptyIcon={currentTab.emptyIcon ?? AssessmentOutlinedIcon}
                        emptyTitle={currentTab.emptyTitle ?? 'No reports yet'}
                        emptyText={currentTab.emptyText ?? 'Reports for this category will appear here.'}
                      />
                    </Box>
                    <SidePanel
                      panel={panel === 'reports' ? panel : null}
                      onPanelChange={setPanel}
                      hasReport={false}
                      reportsPanel={reportsPanel}
                    />
                  </>
                )}
              </motion.div>
            </Box>
          </Box>
        </Box>

      </MotionConfig>
    </ThemeProvider>
  );
}
