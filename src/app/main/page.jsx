"use client";

import * as React from 'react';
import {
  createTheme,
  ThemeProvider
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
  Tooltip
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useTenant, TenantProvider } from "../tenant-context";
import PageContent from '../component/pageContent';

// Icons
import MenuIcon from '@mui/icons-material/Menu';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import LogoutIcon from '@mui/icons-material/Logout';
import StartOutlinedIcon from '@mui/icons-material/StartOutlined';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined';
import SyncAltOutlinedIcon from '@mui/icons-material/SyncAltOutlined';
import SettingsSuggestOutlinedIcon from '@mui/icons-material/SettingsSuggestOutlined';
import ConstructionOutlinedIcon from '@mui/icons-material/ConstructionOutlined';
import Diversity3OutlinedIcon from '@mui/icons-material/Diversity3Outlined';
import FeedOutlinedIcon from '@mui/icons-material/FeedOutlined';
import TroubleshootIcon from '@mui/icons-material/Troubleshoot';
import SettingsInputCompositeOutlinedIcon from '@mui/icons-material/SettingsInputCompositeOutlined';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';
import TableChartOutlinedIcon from '@mui/icons-material/TableChartOutlined';
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";

// ----------------------------------------------------------------------
// 🔧 CONFIGURATION
// ----------------------------------------------------------------------
const DRAWER_WIDTH = 260;
const COLLAPSED_WIDTH = 70;
const HEADER_HEIGHT = 64;

const fyntracTheme = createTheme({
  typography: { fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif' },
  palette: {
    primary: { main: "#1976d2" },
    secondary: { main: "#dc004e" },
    text: { primary: "#444", secondary: "#777" },
    background: { default: "#F6F7F8", paper: "#FFFFFF" },
  },
  components: {
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: "1px solid rgba(0,0,0,0.08)",
          backgroundColor: "#FFFFFF",
          overflowX: 'hidden',
          transition: 'width 0.3s ease',
        }
      }
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "#FFFFFF",
          color: "#444",
          boxShadow: "0px 1px 4px rgba(0,0,0,0.05)",
          borderBottom: "1px solid rgba(0,0,0,0.08)",
          zIndex: 1201,
        }
      }
    }
  }
});

// ----------------------------------------------------------------------
// 🧩 HELPER: Recursive Navigation Item
// ----------------------------------------------------------------------
function NavItem({ item, pathname, onNavigate, depth = 0, isCollapsed, onExpandSidebar }) {
  const [open, setOpen] = React.useState(false);

  if (item.kind === 'divider') return <Divider sx={{ my: 1, display: isCollapsed ? 'none' : 'block' }} />;

  const hasChildren = item.children && item.children.length > 0;
  const isSelected = pathname === item.segment;

  React.useEffect(() => {
    if (hasChildren && item.children.some(child => child.segment === pathname)) {
      setOpen(true);
    }
  }, [pathname, hasChildren, item.children]);

  const handleClick = () => {
    if (isCollapsed && hasChildren) {
      onExpandSidebar();
      setOpen(true);
      return;
    }
    if (hasChildren) {
      setOpen(!open);
    } else {
      onNavigate(item.segment, item.onClick);
    }
  };

  return (
    <>
      <Tooltip title={isCollapsed ? item.title : ""} placement="right" arrow>
        <ListItemButton
          onClick={handleClick}
          selected={isSelected}
          sx={{
            pl: isCollapsed ? 2 : (2 + (depth * 2)),
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            minHeight: 48,
            '&.Mui-selected': {
              bgcolor: 'action.selected',
              borderRight: isCollapsed ? 'none' : '3px solid #1976d2',
              color: 'primary.main',
              '& .MuiListItemIcon-root': { color: 'primary.main' }
            }
          }}
        >
          <ListItemIcon sx={{
            minWidth: isCollapsed ? 0 : 40,
            mr: isCollapsed ? 'auto' : 0,
            justifyContent: 'center',
            color: 'text.secondary'
          }}>
            {item.icon}
          </ListItemIcon>

          {!isCollapsed && (
            <ListItemText
              primary={item.title}
              slotProps={{
                fontSize: '0.95rem',
                fontWeight: isSelected ? 600 : 400,
                whiteSpace: 'nowrap',
                opacity: 1
              }}
            />
          )}

          {!isCollapsed && hasChildren ? (open ? <ExpandLess /> : <ExpandMore />) : null}
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
// 🧩 COMPONENT: Separated Drawer Content (Fixes Error)
// ----------------------------------------------------------------------
function DrawerContent({ isCollapsed, onExpandSidebar, pathname, onNavigate, onLogout }) {
  // Navigation Items (Sign Out removed from here)
  const NAVIGATION = [
    { segment: "getstarted", title: "Get Started", icon: <StartOutlinedIcon /> },
    { segment: "main", title: "Dashboard", icon: <DashboardOutlinedIcon /> },
    { segment: "diagnostic", title: "Diagnostic", icon: <TroubleshootIcon /> },
    { segment: "model", title: "Model", icon: <ArticleOutlinedIcon /> },
    { segment: "mapping", title: "Mapping", icon: <AccountBalanceOutlinedIcon /> },
    { segment: "sync", title: "Ingest", icon: <SyncAltOutlinedIcon /> },
    { segment: "report-dashboard", title: "Reports", icon: <TableChartOutlinedIcon /> },
    { segment: "settings-dashboard", title: "Settings", icon: <TuneOutlinedIcon /> },
    { kind: "divider" },
    // {
    //   segment: "settings",
    //   title: "Settings",
    //   icon: <ConstructionOutlinedIcon />,
    //   children: [
    //     { segment: "configure", title: "Configure", icon: <SettingsSuggestOutlinedIcon /> },
    //     {
    //       segment: "accounting-rules",
    //       title: "Accounting Rules",
    //       icon: <TuneOutlinedIcon />,
    //       children: [
    //         { segment: "reference-data", title: "Reference Data", icon: <FeedOutlinedIcon /> },
    //         { segment: "event-configuration", title: "Event Configuration", icon: <SettingsInputCompositeOutlinedIcon /> },
    //         { segment: "custom-table", title: "Custom Table", icon: <TableChartOutlinedIcon /> },
    //       ],
    //     },
    //     { segment: "team-members", title: "Team Members", icon: <Diversity3OutlinedIcon /> },
    //   ],
    // },
  ];

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      pt: `${HEADER_HEIGHT}px` // Push content down below fixed AppBar
    }}>

      {/* 1. Main Navigation (Scrollable) */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        <List component="nav" sx={{ px: 1, py: 2 }}>
          {NAVIGATION.map((item, index) => (
            <NavItem
              key={index}
              item={item}
              pathname={pathname.replace('/', '')}
              onNavigate={onNavigate}
              isCollapsed={isCollapsed}
              onExpandSidebar={onExpandSidebar}
            />
          ))}
        </List>
      </Box>

      {/* 2. Divider */}
      <Divider />

      {/* 3. Bottom Section (Sign Out) */}
      <List sx={{ px: 1, pb: 2 }}>
        <NavItem
          item={{
            segment: "logout",
            title: "Sign Out",
            icon: <LogoutIcon sx={{ color: "error.main" }} />,
            onClick: onLogout,
          }}
          pathname={pathname}
          onNavigate={onNavigate}
          isCollapsed={isCollapsed}
          onExpandSidebar={onExpandSidebar}
        />
      </List>
    </Box>
  );
}

// ----------------------------------------------------------------------
// 🚀 MAIN LAYOUT
// ----------------------------------------------------------------------
export default function DashboardLayoutClipped() {
  const { tenant, user, setTenant } = useTenant();
  const router = useRouter();

  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [pathname, setPathname] = React.useState('/main');
  const [openDialog, setOpenDialog] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
  const handleCollapseToggle = () => setIsCollapsed(!isCollapsed);

  const handleNavigation = (segment, customOnClick) => {
    if (customOnClick) {
      customOnClick();
    } else if (segment === "getstarted") {
      window.open("https://fyntrac.gitbook.io/fyntrac-docs", "_blank");
    } else if (segment) {
      setPathname(`/${segment}`);
      setMobileOpen(false);
    }
  };

  const handleLogoutConfirm = () => {
    localStorage.removeItem('selectedTenant');
    setTenant(null);
    setOpenDialog(false);
    router.replace('/');
  };

  const currentDrawerWidth = isCollapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH;

  if (!mounted) return null;

  return (
    <TenantProvider>
      <ThemeProvider theme={fyntracTheme}>
        <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F6F7F8' }}>
          <CssBaseline />

          {/* 1. APPBAR */}
          <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
            <Toolbar>
              {/* Mobile Toggle */}
              <IconButton
                color="inherit"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ mr: 2, display: { sm: 'none' } }}
              >
                <MenuIcon />
              </IconButton>
              {/* Desktop Toggle */}
              <IconButton
                color="inherit"
                edge="start"
                onClick={handleCollapseToggle}
                sx={{ mr: 2, display: { xs: 'none', sm: 'block' } }}
              >
                {isCollapsed ? <MenuIcon /> : <MenuOpenIcon />}
              </IconButton>

              {/* LOGO */}
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <img src="fyntrac-small.png" alt="Fyntrac" style={{ maxHeight: 32 }} />
              </Box>

              <Box sx={{ flexGrow: 1 }} />

              {/* USER PROFILE */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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
            </Toolbar>
          </AppBar>

          {/* 2. SIDEBAR */}
          <Box
            component="nav"
            sx={{ width: { sm: currentDrawerWidth }, flexShrink: { sm: 0 }, transition: 'width 0.3s ease' }}
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
                isCollapsed={false} // Always expanded on mobile
                onExpandSidebar={() => { }}
                pathname={pathname}
                onNavigate={handleNavigation}
                onLogout={() => setOpenDialog(true)}
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
                  transition: 'width 0.3s ease',
                  overflowX: 'hidden'
                },
              }}
              open
            >
              <DrawerContent
                isCollapsed={isCollapsed}
                onExpandSidebar={() => setIsCollapsed(false)}
                pathname={pathname}
                onNavigate={handleNavigation}
                onLogout={() => setOpenDialog(true)}
              />
            </Drawer>
          </Box>

          {/* 3. MAIN CONTENT */}
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              p: 0,
              width: { sm: `calc(100% - ${currentDrawerWidth}px)` },
              transition: 'width 0.3s ease',
            }}
          >
            <Toolbar /> {/* Spacer */}
            <PageContent pathname={pathname} />
          </Box>

          {/* 4. LOGOUT DIALOG */}
          <Dialog
            open={openDialog}
            onClose={() => setOpenDialog(false)}
            maxWidth="sm"
            fullWidth
            slotProps={{ paper: { sx: { borderRadius: 3, p: 2 } } }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 3, pt: 2 }}>
              <WarningAmberIcon color="warning" fontSize="large" />
              <DialogTitle sx={{ p: 0, fontWeight: 'bold' }}>Confirm Logout</DialogTitle>
            </Box>
            <DialogContent sx={{ px: 3, py: 2 }}>
              <Typography>Are you sure you want to log out?</Typography>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2, justifyContent: 'space-between' }}>
              <Button onClick={() => setOpenDialog(false)} variant="outlined" color="inherit">Cancel</Button>
              <Button onClick={handleLogoutConfirm} variant="contained" color="error">Logout</Button>
            </DialogActions>
          </Dialog>

        </Box>
      </ThemeProvider>
    </TenantProvider>
  );
}