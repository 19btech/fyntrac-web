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
const DRAWER_WIDTH = 240; // Slightly wider for elegance
const COLLAPSED_WIDTH = 60;
const HEADER_HEIGHT = 56; // Slightly taller header

// 🎨 ELEGANT THEME
const fyntracTheme = createTheme({
  typography: { 
    fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h6: { fontWeight: 700 },
    body2: { fontSize: '0.875rem' },
  },
  palette: {
    primary: { main: "#2563EB" }, // Modern Royal Blue
    secondary: { main: "#dc004e" },
    text: { primary: "#1E293B", secondary: "#64748B" }, // Slate colors
    background: { default: "#F8FAFC", paper: "#FFFFFF" }, // Very light slate bg
  },
  components: {
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: "1px dashed rgba(145, 158, 171, 0.24)", // Subtle dashed border
          backgroundColor: "#FFFFFF",
          overflowX: 'hidden',
          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)', // Snappy bezier
        }
      }
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(255, 255, 255, 0.8)", // Semi-transparent
          backdropFilter: "blur(6px)", // Glassmorphism effect
          color: "#1E293B",
          boxShadow: "none",
          borderBottom: "1px solid rgba(145, 158, 171, 0.12)",
          zIndex: 1201,
        }
      }
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8, // Rounded list items
          margin: '4px 8px', // Breathing room
          transition: 'all 0.2s ease-in-out',
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
            pl: isCollapsed ? 2.5 : (2 + (depth * 2)),
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            minHeight: 48,
            color: 'text.secondary',
            
            // Hover State
            '&:hover': {
              bgcolor: 'rgba(145, 158, 171, 0.08)',
              color: 'text.primary',
            },

            // Selected State (Modern "Glow")
            '&.Mui-selected': {
              bgcolor: alpha('#2563EB', 0.08), // Soft blue bg
              color: 'primary.main',
              fontWeight: 600,
              '&:hover': {
                bgcolor: alpha('#2563EB', 0.16),
              },
              // The left accent bar
              '&::before': {
                content: '""',
                position: 'absolute',
                left: 0,
                top: 8,
                bottom: 8,
                width: 3,
                borderRadius: '0 4px 4px 0',
                backgroundColor: isCollapsed ? 'transparent' : 'primary.main',
                display: isCollapsed ? 'none' : 'block'
              }
            }
          }}
        >
          <ListItemIcon sx={{
            minWidth: isCollapsed ? 0 : 36,
            mr: isCollapsed ? 'auto' : 1.5,
            justifyContent: 'center',
            color: 'inherit', // Inherit color from parent (handles selected state automatically)
            transition: 'all 0.2s',
          }}>
            {item.icon}
          </ListItemIcon>

          {!isCollapsed && (
            <ListItemText
              primary={item.title}
              slotProps={{
                fontSize: '0.875rem',
                fontWeight: isSelected ? 600 : 500, // Medium weight for better readability
                whiteSpace: 'nowrap',
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
    { segment: "getstarted", title: "Get Started", icon: <StartOutlinedIcon /> },
    { segment: "main", title: "Dashboard", icon: <DashboardOutlinedIcon /> },
    { segment: "diagnostic", title: "Diagnostic", icon: <TroubleshootIcon /> },
    { segment: "model", title: "Model", icon: <ArticleOutlinedIcon /> },
    { segment: "mapping", title: "Mapping", icon: <AccountBalanceOutlinedIcon /> },
    { segment: "sync", title: "Ingest", icon: <SyncAltOutlinedIcon /> },
    { segment: "report-dashboard", title: "Reports", icon: <TableChartOutlinedIcon /> },
    { segment: "settings-dashboard", title: "Settings", icon: <TuneOutlinedIcon /> },
    { kind: "divider" },
  ];

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      pt: `${HEADER_HEIGHT}px`
    }}>

      {/* 1. Main Navigation */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', overflowX: 'hidden', py: 2 }}>
        <List component="nav" sx={{ px: 1 }}>
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
      <Box sx={{ p: 1 }}>
        <Divider sx={{ mb: 1, borderStyle: 'dashed', borderColor: 'rgba(145, 158, 171, 0.24)' }} />
        <NavItem
          item={{
            segment: "logout",
            title: "Sign Out",
            icon: <LogoutIcon sx={{ color: "#FF5630" }} />, // Alert color for logout
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
        <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: 'background.default' }}>
          <CssBaseline />

          {/* 1. APPBAR */}
          <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
            <Toolbar sx={{ height: HEADER_HEIGHT }}>
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
                onClick={handleCollapseToggle}
                sx={{ 
                  mr: 2, 
                  display: { xs: 'none', sm: 'inline-flex' },
                  color: 'text.secondary' 
                }}
              >
                {isCollapsed ? <MenuIcon /> : <MenuOpenIcon />}
              </IconButton>

              {/* LOGO */}
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <img src="fyntrac-small.png" alt="Fyntrac" style={{ maxHeight: 30 }} />
              </Box>

              <Box sx={{ flexGrow: 1 }} />

              {/* USER PROFILE */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {tenant && user && (
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1.5,
                    bgcolor: alpha('#919EAB', 0.12), // Subtle pill background
                    py: 0.5,
                    px: 1.5,
                    borderRadius: 3
                  }}>
                    <Avatar sx={{ 
                      bgcolor: 'primary.main', 
                      width: 28, 
                      height: 28, 
                      fontSize: 14,
                      fontWeight: 700 
                    }}>
                      {user.firstName?.[0]?.toUpperCase()}
                    </Avatar>
                    <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                      <Typography variant="subtitle2" sx={{ color: 'text.primary', lineHeight: 1 }}>
                        {user.firstName} /  {tenant}
                      </Typography>

                    </Box>
                  </Box>
                )}
              </Box>
            </Toolbar>
          </AppBar>

          {/* 2. SIDEBAR */}
          <Box
            component="nav"
            sx={{ width: { sm: currentDrawerWidth }, flexShrink: { sm: 0 }, transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
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
              transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <Toolbar sx={{ height: HEADER_HEIGHT }} /> 
            
            {/* Added container for content padding */}
            <Box sx={{ p: 0, height: '100%' }}>
               <PageContent pathname={pathname} />
            </Box>
          </Box>

          {/* 4. LOGOUT DIALOG */}
          <Dialog
            open={openDialog}
            onClose={() => setOpenDialog(false)}
            maxWidth="sm"
            fullWidth
            slotProps={{ 
              paper: { sx: { borderRadius: 3, boxShadow: '0 24px 48px -12px rgba(0,0,0,0.1)' } },
              backdrop: { sx: { backdropFilter: 'blur(3px)' } }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, px: 3, pt: 3, pb: 1 }}>
              <Avatar sx={{ bgcolor: alpha('#FF5630', 0.16), color: '#FF5630' }}>
                <WarningAmberIcon />
              </Avatar>
              <DialogTitle sx={{ p: 0, fontWeight: 700 }}>Sign Out</DialogTitle>
            </Box>
            <DialogContent sx={{ px: 3, py: 2 }}>
              <Typography color="text.secondary">
                Are you sure you want to log out? Unsaved changes may be lost.
              </Typography>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3, pt: 2 }}>
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
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, ml: 2 }}
              >
                Log Out
              </Button>
            </DialogActions>
          </Dialog>

        </Box>
      </ThemeProvider>
    </TenantProvider>
  );
}