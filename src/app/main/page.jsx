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
} from '@mui/material';
import { useTenant } from "../tenant-context";
import PageContent from '../component/pageContent';
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

// ----------------------------------------------------------------------
// 🔧 CONFIGURATION
// ----------------------------------------------------------------------
const DRAWER_WIDTH = 252;
const COLLAPSED_WIDTH = 72;
const HEADER_HEIGHT = 64;

// 🎨 DESIGN TOKENS — matching theme.ts / Sidebar reference
const INDIGO       = '#6366f1';
const INDIGO_DARK  = '#4f46e5';
const INDIGO_BG    = '#eef2ff';
const SLATE_50     = '#f8fafc';
const SLATE_100    = '#f1f5f9';
const SLATE_200    = '#e2e8f0';
const SLATE_500    = '#64748b';
const SLATE_700    = '#334155';
const SLATE_BLACK  = '#14213d';

// 📍 Page title map
const PAGE_TITLES = {
  getstarted:         'Get Started',
  main:               'Dashboard',
  diagnostic:         'Diagnostic',
  model:              'Model',
  sync:               'Ingest',
  'report-dashboard': 'Reports',
  'settings-dashboard': 'Settings',
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

  if (item.kind === 'divider') return <Divider sx={{ my: 2, mx: 2, borderStyle: 'dashed', borderColor: 'rgba(145, 158, 171, 0.24)', display: isCollapsed ? 'none' : 'block' }} />;

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
            borderRadius: '12px',
            mb: '2px',
            pl: isCollapsed ? '10px' : `${14 + depth * 16}px`,
            pr: isCollapsed ? '10px' : '14px',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            minHeight: 42,
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
            minWidth: isCollapsed ? 0 : 32,
            mr: isCollapsed ? 'auto' : 1,
            justifyContent: 'center',
            color: isSelected ? '#6366f1' : '#64748b',
          }}>
            {item.icon}
          </ListItemIcon>

          {!isCollapsed && (
            <ListItemText
              primary={item.title}
              primaryTypographyProps={{
                fontSize: '0.875rem',
                fontWeight: isSelected ? 700 : 500,
                sx: { color: isSelected ? '#4f46e5' : '#334155' },
              }}
            />
          )}

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
function DrawerContent({ isCollapsed, onExpandSidebar, pathname, onNavigate, onLogout }) {
  const NAVIGATION = [
    { segment: "getstarted", title: "Get Started", icon: <StartOutlinedIcon />, fontSize: 'fontSize: "14px !important"' },
    { segment: "main", title: "Dashboard", icon: <DashboardOutlinedIcon />, fontSize: 'fontSize: "14px !important"' },
    { segment: "diagnostic", title: "Diagnostic", icon: <TroubleshootIcon />, fontSize: 'fontSize: "14px !important"' },
    { segment: "model", title: "Model", icon: <ArticleOutlinedIcon />, fontSize: 'fontSize: "14px !important"' },
    { segment: "sync", title: "Ingest", icon: <SyncAltOutlinedIcon />, fontSize: 'fontSize: "14px !important"' },
    { segment: "report-dashboard", title: "Reports", icon: <TableChartOutlinedIcon />, fontSize: 'fontSize: "14px !important"' },
    { segment: "settings-dashboard", title: "Settings", icon: <TuneOutlinedIcon />, fontSize: 'fontSize: "14px !important"' },
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

      {/* WORKSPACE label */}
      {!isCollapsed && (
        <Typography variant="overline" sx={{
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

      {/* 2. Bottom Section */}
      <Box sx={{ p: 1, borderTop: `1px solid ${SLATE_200}`, bgcolor: SLATE_50 }}>
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
  const [settingsKey, setSettingsKey] = React.useState(0);

  React.useEffect(() => setMounted(true), []);

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
  const handleCollapseToggle = () => setIsCollapsed(!isCollapsed);

  const handleNavigation = (segment, customOnClick) => {
    if (customOnClick) {
      customOnClick();
    } else if (segment === "getstarted") {
      window.open("https://fyntrac.gitbook.io/fyntrac-docs", "_blank");
    } else if (segment) {
      if (segment === 'settings-dashboard') setSettingsKey(k => k + 1);
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
              transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
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
                  transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
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
              <PageContent pathname={pathname} settingsKey={settingsKey} />
            </Box>
          </Box>

          {/* 4. LOGOUT DIALOG */}
          <Dialog
            open={openDialog}
            onClose={() => setOpenDialog(false)}
            maxWidth="sm"
            fullWidth
            slots={{ transition: Slide }}
            slotProps={{ transition: { direction: 'up' } }}
            PaperProps={{
              sx: {
                borderRadius: 4,
                boxShadow: '0 32px 64px rgba(0,0,0,0.14)',
                overflow: 'hidden',
                border: '1px solid',
                borderColor: 'divider',
              }
            }}
          >
            <DialogTitle sx={{ p: 0 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  px: 3,
                  pt: 3,
                  pb: 2.5,
                  background: 'linear-gradient(135deg, rgba(220,38,38,0.05) 0%, rgba(239,68,68,0.03) 100%)',
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <img src="fyntrac.png" alt="Fyntrac" style={{ width: 72, height: 'auto' }} />
                  <Box>
                    <Chip
                      label="Account"
                      size="small"
                      sx={{
                        height: 18,
                        fontSize: '0.6rem',
                        fontWeight: 700,
                        letterSpacing: 0.8,
                        textTransform: 'uppercase',
                        bgcolor: alpha('#dc2626', 0.1),
                        color: '#dc2626',
                        mb: 0.5,
                        borderRadius: 1,
                      }}
                    />
                    <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.2, color: 'text.primary' }}>
                      Sign Out
                    </Typography>
                  </Box>
                </Box>
                <Tooltip title="Close" placement="left">
                  <IconButton
                    onClick={() => setOpenDialog(false)}
                    size="small"
                    sx={{
                      color: 'text.secondary',
                      bgcolor: 'action.hover',
                      borderRadius: 2,
                      '&:hover': { bgcolor: alpha('#dc2626', 0.08), color: '#dc2626' },
                    }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </DialogTitle>
            <DialogContent sx={{ px: 3, py: 3 }}>
              <Typography color="text.secondary">
                Are you sure you want to log out? Unsaved changes may be lost.
              </Typography>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3, pt: 0, gap: 1 }}>
              <Button
                onClick={() => setOpenDialog(false)}
                variant="outlined"
                color="inherit"
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleLogoutConfirm}
                variant="contained"
                color="error"
                disableElevation
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, bgcolor: '#14213d', '&:hover': { bgcolor: '#1e2f52' } }}
              >
                Log Out
              </Button>
            </DialogActions>
          </Dialog>

      </Box>
    </ThemeProvider>
  );
}