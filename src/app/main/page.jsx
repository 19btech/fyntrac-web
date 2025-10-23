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
import { Inter } from 'next/font/google';
import PageContent from '../component/pageContent';

// Import MUI icons
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
import RuleFolderOutlinedIcon from '@mui/icons-material/RuleFolderOutlined';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import TroubleshootIcon from '@mui/icons-material/Troubleshoot';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

const inter = Inter({ subsets: ['latin'] });

const demoTheme = createTheme({
  typography: { fontFamily: `${inter.style.fontFamily}, sans-serif` },
  palette: {
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' },
    text: { primary: '#444', secondary: '#777' },
    background: { default: '#e4e8ee' },
  },
  components: {
    MuiDivider: { styleOverrides: { root: { display: 'none' } } },
  },
});

// Custom TopBar
function CustomTopBar() {
  const { tenant, user } = useTenant();
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, pr: 3 }}>
      {tenant && user && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32, fontSize: 14 }}>
            {user.firstName[0]?.toUpperCase()}
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

  const handleLogoutConfirm = () => {
    localStorage.removeItem('selectedTenant');
    setTenant(null);
    setOpenDialog(false);
    router.replace('/');
  };

  // Navigation with icons created only on client
const NAVIGATION = React.useMemo(() => [
  { segment: 'getstarted', title: 'Get Started', icon: <StartOutlinedIcon /> },
  { segment: 'main', title: 'Dashboard', icon: <CottageOutlinedIcon /> },
  { segment: 'diagnostic', title: 'Diagnostic', icon: <TroubleshootIcon /> },
  { segment: 'model', title: 'Model', icon: <ArticleOutlinedIcon /> },
  { segment: 'mapping', title: 'Mapping', icon: <AccountBalanceOutlinedIcon /> },
  { segment: 'sync', title: 'Sync', icon: <SyncAltOutlinedIcon /> },
  { kind: 'divider' },
  {
    segment: 'reports',
    title: 'Reports',
    icon: <BarChartIcon />,
    children: [
      { segment: 'gle-report', title: 'Journal Entry Report', icon: <AutoGraphOutlinedIcon /> },
      { segment: 'transaction-activity-report', title: 'Activity Report', icon: <TrendingUpOutlinedIcon /> },
      { segment: 'rollforward-report', title: 'Rollforward Report', icon: <TimelineIcon /> },
    ],
  },
  { kind: 'divider' },
  {
    segment: 'settings',
    title: 'Settings',
    icon: <ConstructionOutlinedIcon />,
    children: [
      { segment: 'configure', title: 'Configure', icon: <SettingsSuggestOutlinedIcon /> },
      { segment: 'accounting-rules', title: 'Accounting Rules', icon: <RuleFolderOutlinedIcon /> },
      { segment: 'team-members', title: 'Team Members', icon: <Diversity3OutlinedIcon /> },
    ],
  },
  { kind: 'divider' },
  { segment: 'merchant', title: 'Merchant', icon: <BusinessCenterOutlinedIcon /> },
  { kind: 'divider' },
{ kind: 'divider', height: '10px', visibility: 'hidden'},
{ kind: 'divider', height: '10px', visibility: 'hidden'},
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

  return (
    <TenantProvider>
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 3,
            bgcolor: '#f9f9f9',
            boxShadow: 6,
            position: 'relative',
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
          <Button
            onClick={() => setOpenDialog(false)}
            color="inherit"
            variant="outlined"
            sx={{ borderRadius: 2, px: 3 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleLogoutConfirm}
            color="error"
            variant="contained"
            sx={{ borderRadius: 2, px: 4 }}
          >
            Logout
          </Button>
        </DialogActions>
      </Dialog>

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
        </DashboardLayout>
      </AppProvider>
    </TenantProvider>
  );
}

export default DashboardLayoutBasic;
