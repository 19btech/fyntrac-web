"use client";

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import * as React from 'react';
import { createTheme } from '@mui/material/styles';
import { AppProvider, DashboardLayout } from '@toolpad/core';
import {
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Avatar,
} from '@mui/material';
import { useTenant, TenantProvider } from "../tenant-context";
import { useRouter } from 'next/navigation';
import PageContent from '../component/pageContent';

// MUI Icons
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import LogoutIcon from '@mui/icons-material/Logout';
import BarChartIcon from '@mui/icons-material/BarChart';
import TimelineIcon from '@mui/icons-material/Timeline';
import StartOutlinedIcon from '@mui/icons-material/StartOutlined';
import CottageOutlinedIcon from '@mui/icons-material/CottageOutlined';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined';
import SyncAltOutlinedIcon from '@mui/icons-material/SyncAltOutlined';
import AutoGraphOutlinedIcon from '@mui/icons-material/AutoGraphOutlined';
import SettingsSuggestOutlinedIcon from '@mui/icons-material/SettingsSuggestOutlined';
import ConstructionOutlinedIcon from '@mui/icons-material/ConstructionOutlined';
import Diversity3OutlinedIcon from '@mui/icons-material/Diversity3Outlined';
import BusinessCenterOutlinedIcon from '@mui/icons-material/BusinessCenterOutlined';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import FeedOutlinedIcon from '@mui/icons-material/FeedOutlined';
import TroubleshootIcon from '@mui/icons-material/Troubleshoot';
import SettingsInputCompositeOutlinedIcon from '@mui/icons-material/SettingsInputCompositeOutlined';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';
import TableChartOutlinedIcon from '@mui/icons-material/TableChartOutlined';
import DatasetLinkedOutlinedIcon from '@mui/icons-material/DatasetLinkedOutlined';
import DatasetOutlinedIcon from '@mui/icons-material/DatasetOutlined';
import SummarizeOutlinedIcon from '@mui/icons-material/SummarizeOutlined';
// System font stack - no external dependencies
const systemFontStack = '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif';

const demoTheme = createTheme({
  typography: {
    fontFamily: systemFontStack,
  },
  palette: {
    primary: { main: "#1976d2" },
    secondary: { main: "#dc004e" },
    text: { primary: "#444", secondary: "#777" },
    background: { default: "#e4e8ee" },
  },
  components: {
    MuiDivider: { styleOverrides: { root: { display: "block" } } },
  },
});

// ✅ Custom TopBar with hydration-safe rendering
function CustomTopBar() {
  const { tenant, user } = useTenant();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, pr: 3 }}>
      {tenant && user && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32, fontSize: 14 }}>
            {user.firstName?.[0]?.toUpperCase()}
          </Avatar>
          <Typography variant="body2" color="text.secondary">
            {user.firstName} / {tenant}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

function DashboardLayoutBasic() {
  const { setTenant } = useTenant();
  const router = useRouter();
  const [pathname, setPathname] = React.useState('/home');
  const [openDialog, setOpenDialog] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogoutConfirm = () => {
    localStorage.removeItem('selectedTenant');
    setTenant(null);
    setOpenDialog(false);
    router.replace('/');
  };

  const NAVIGATION = React.useMemo(() => [
    { segment: 'getstarted', title: 'Get Started', icon: <StartOutlinedIcon /> },
    { segment: 'main', title: 'Dashboard', icon: <CottageOutlinedIcon /> },
    { segment: 'diagnostic', title: 'Diagnostic', icon: <TroubleshootIcon /> },
    { segment: 'model', title: 'Model', icon: <ArticleOutlinedIcon /> },
    { segment: 'mapping', title: 'Mapping', icon: <AccountBalanceOutlinedIcon /> },
    { segment: 'sync', title: 'Sync', icon: <SyncAltOutlinedIcon /> },
     { kind: 'divider' },
     { segment: 'new-reports', title: 'Reports', icon: <SummarizeOutlinedIcon /> },
    { kind: 'divider' },
    {
      segment: 'reports',
      title: 'Reports',
      icon: <BarChartIcon />,
      children: [
        { segment: 'gle-report', title: 'Journal Entry Report', icon: <AutoGraphOutlinedIcon /> },
        { segment: 'transaction-activity-report', title: 'Activity Report', icon: <TrendingUpOutlinedIcon /> },
        { segment: 'rollforward-report', title: 'Rollforward Report', icon: <TimelineIcon /> },
        { segment: 'custom-ref-data-report', title: 'Custom Ref Data Report', icon: <DatasetLinkedOutlinedIcon /> },
        { segment: 'custom-operational-data-report', title: 'Custom Operational Data Report', icon: <DatasetOutlinedIcon /> },

      ],
    },
    { kind: 'divider' },
    {
      segment: 'settings',
      title: 'Settings',
      icon: <ConstructionOutlinedIcon />,
      children: [
        { segment: 'configure', title: 'Configure', icon: <SettingsSuggestOutlinedIcon /> },
        {
          segment: 'accounting-rules',
          title: 'Accounting Rules',
          icon: <TuneOutlinedIcon />,
          children: [
            { segment: 'reference-data', title: 'Reference Data', icon: <FeedOutlinedIcon /> },
            { segment: 'event-configuration', title: 'Event Configuration', icon: <SettingsInputCompositeOutlinedIcon /> },
            { segment: 'custom-table', title: 'Custom Table', icon: <TableChartOutlinedIcon /> },
          ],
        },
        { segment: 'team-members', title: 'Team Members', icon: <Diversity3OutlinedIcon /> },
      ],
    },
    { kind: 'divider' },
    { segment: 'merchant', title: 'Merchant', icon: <BusinessCenterOutlinedIcon /> },
    { kind: 'divider' },
    {
      segment: 'logout',
      title: 'Sign Out',
      icon: <LogoutIcon sx={{ color: 'error.main' }} />,
      onClick: () => setOpenDialog(true),
      sx: { mt: 3 }
    },
    { kind: 'divider' },
  ], []);

  const customRouter = React.useMemo(() => ({
    pathname,
    searchParams: new URLSearchParams(),
    navigate: (path) => {
      if (path === '/logout') {
        setOpenDialog(true);
      } else {
        setPathname(String(path));
      }
    },
  }), [pathname]);

  if (!mounted) return null; // ✅ prevents hydration mismatch

  return (
    <TenantProvider>
      <AppProvider
        branding={{ logo: <img src="fyntrac-small.png" alt="Fyntrac" />, title: '' }}
        navigation={NAVIGATION}
        router={customRouter}
        theme={demoTheme}
      >
        <DashboardLayout
          sx={{ background: '#e4e8ee' }}
          theme={demoTheme}
          slots={{ toolbarActions: CustomTopBar }}
        >
          <PageContent pathname={customRouter.pathname} />

          <Dialog
            open={openDialog}
            onClose={() => setOpenDialog(false)}
            maxWidth="sm"
            fullWidth
            slotProps={{
              paper: {
                sx: {
                  width: '100%',
                  maxWidth: 600,
                  borderRadius: 3,
                  p: 3,
                  bgcolor: '#f9f9f9',
                  boxShadow: 6,
                  position: 'relative',
                },
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <WarningAmberIcon color="warning" fontSize="large" />
              <DialogTitle sx={{ fontWeight: 'bold', fontSize: '1.5rem' }}>
                Confirm Logout
              </DialogTitle>
            </Box>

            <DialogContent>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Are you sure you want to log out? Any unsaved changes will be lost.
              </Typography>
            </DialogContent>

            <DialogActions sx={{ justifyContent: 'space-between', pt: 2 }}>
              <Button onClick={() => setOpenDialog(false)} color="inherit" variant="outlined" sx={{ borderRadius: 2, px: 3 }}>
                Cancel
              </Button>
              <Button onClick={handleLogoutConfirm} color="error" variant="contained" sx={{ borderRadius: 2, px: 4 }}>
                Logout
              </Button>
            </DialogActions>
          </Dialog>
        </DashboardLayout>
      </AppProvider>
    </TenantProvider>
  );
}

export default DashboardLayoutBasic;