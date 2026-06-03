"use client"
import React from 'react';
import PropTypes from 'prop-types';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import MenuIcon from '@mui/icons-material/Menu';
import Grid from '@mui/material/Grid';
import StartOutlinedIcon from '@mui/icons-material/StartOutlined';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import SettingsSuggestRoundedIcon from '@mui/icons-material/SettingsSuggestRounded';
import TocOutlinedIcon from '@mui/icons-material/TocOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import TimelineOutlinedIcon from '@mui/icons-material/TimelineOutlined';
import ConstructionOutlinedIcon from '@mui/icons-material/ConstructionOutlined';
import SyncOutlinedIcon from '@mui/icons-material/SyncOutlined';
import BusinessCenterOutlinedIcon from '@mui/icons-material/BusinessCenterOutlined';
import Groups2RoundedIcon from '@mui/icons-material/Groups2Rounded';
import PostAddRoundedIcon from '@mui/icons-material/PostAddRounded';
import SettingsIcon from '@mui/icons-material/Settings';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import Collapse from '@mui/material/Collapse';
import StarBorder from '@mui/icons-material/StarBorder';
import { useRouter } from 'next/navigation'
import { usePathname } from 'next/navigation';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';

const drawerWidth = 300;

function Layout(props) {
  const { window } = props;
  const { children } = props;
  
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [isClosing, setIsClosing] = React.useState(false);
  const [open, setOpen] = React.useState(true);
  const [openSettings, setOpenSettings] = React.useState(false);
  const [openSettingsColapse, setOpenSettingsColapse] = React.useState(false);

  const handleOnSettingsClick = () => {
    setOpenSettings(prevOpen => !prevOpen);
  };

  const handleClick = () => {
    setOpen(!open);
  };  

  const router = useRouter();
  const pathName = usePathname();

  const handleDrawerClose = () => {
    setIsClosing(true);
    setMobileOpen(false);
  };

  const handleDrawerTransitionEnd = () => {
    setIsClosing(false);
  };

  const handleDrawerToggle = () => {
    if (!isClosing) {
      setMobileOpen(!mobileOpen);
    }
  };

  const drawer = (
    <div>
      <Toolbar>

      <Typography  variant="h6" noWrap component="div">
          <img src="fyntrac.png" alt="PNG Image"/>
      </Typography>
        </Toolbar>
      <Divider />
      <List>
        {['Get Started', 'Home', 'Pipeline', 'Model','Accounting','Sync','Reports'].map((text, index) => (
          <ListItem key={text} disablePadding onClick={() => {router.push('/' + text.toLocaleLowerCase().replace(/\s/g, ''))}} className={ pathName.startsWith('/' + text.toLowerCase().replace(/\s/g, '')) ? "text-sky-600 bg-slate-200" : "text-slate-700"}>
            <ListItemButton

            >
            <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: isClosing ? 3 : 'auto',
                    justifyContent: 'center',
                  }} className={ pathName.startsWith('/' + text.toLowerCase().replace(/\s/g, '')) ? "text-sky-600 bg-slate-200" : "#606060"}
                >
                  {index === 0 && <StartOutlinedIcon />}
                  {index === 1 && <HomeOutlinedIcon /> }
                  {index === 2 && <AccountTreeOutlinedIcon /> }
                  {index === 3 && <TocOutlinedIcon /> }
                  {index === 4 && <PersonOutlineOutlinedIcon /> }
                  {index === 5 && <SyncOutlinedIcon /> }
                  {index === 6 && <TimelineOutlinedIcon /> }
                  {index === 7 && <><ConstructionOutlinedIcon onClick={handleOnSettingsClick}/>  <ListItemText sx={{paddingLeft: 4}} primary={text} /> {openSettings ? <ExpandLess /> : <ExpandMore />}</>}

                </ListItemIcon>
                {index != 7 && <ListItemText sx={{paddingLeft: 4}} primary={text} />}
              
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      <List>
        <ListItem key='Settings' disablePadding onClick={handleOnSettingsClick} className={ openSettings ? "text-sky-600 bg-slate-200" : "#606060"}>
          <ListItemButton>
            <ListItemIcon sx={{
                    minWidth: 0,
                    mr: isClosing ? 3 : 'auto',
                    justifyContent: 'center',
                  }} className={ pathName.startsWith('/' + 'Settings'.toLowerCase().replace(/\s/g, '')) ? "text-sky-600 bg-slate-200" : "#606060"}
                >
              <><ConstructionOutlinedIcon/> </>
            </ListItemIcon>
            <ListItemText sx={{paddingLeft: 4}} primary='Settings' /> {openSettings ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>
        <Collapse in={openSettings || 
          pathName.startsWith('/' + 'rules'.toLowerCase().replace(/\s/g, '')) || 
          pathName.startsWith('/' + 'Settings'.toLowerCase().replace(/\s/g, '')) } timeout="auto" unmountOnExit>
        <List component="div" disablePadding>
          <ListItem key="Configure Accelerfi"  onClick={() => {{setOpenSettings(true); setOpenSettingsColapse(true);} router.push('/' + 'settings')}} className={ pathName.startsWith('/' + 'settings') ? "text-sky-600 bg-slate-200" : "text-slate-700"}>
          <ListItemButton sx={{ pl: 2 }}>
            <ListItemIcon className={ pathName.startsWith('/' + 'Settings'.toLowerCase().replace(/\s/g, '')) ? "text-sky-600 bg-slate-200" : "#606060"}>
              <SettingsSuggestRoundedIcon />
            </ListItemIcon>
            <ListItemText primary="Configure Accelerfi" />
          </ListItemButton>
          </ListItem>

          <ListItem key="Accounting Rules"  onClick={() => {{setOpenSettings(true); setOpenSettingsColapse(true);} router.push('/' + 'rules')}} className={ pathName.startsWith('/' + 'rules'.toLowerCase().replace(/\s/g, '')) ? "text-sky-600 bg-slate-200" : "text-slate-700"}>
          <ListItemButton sx={{ pl: 2 }}>
            <ListItemIcon className={ pathName.startsWith('/' + 'rules'.toLowerCase().replace(/\s/g, '')) ? "text-sky-600 bg-slate-200" : "#606060"}>
              <PostAddRoundedIcon />
            </ListItemIcon>
            <ListItemText primary="Accounting Rules" />
          </ListItemButton>
          </ListItem>

          <ListItem>
          <ListItemButton sx={{ pl: 2 }}>
            <ListItemIcon>
              <Groups2RoundedIcon />
            </ListItemIcon>
            <ListItemText primary="Team Members" />
          </ListItemButton>
          </ListItem>
        </List>
      </Collapse>
      </List>
      <Divider />
      <List>
        {['Merchant', ].map((text, index) => (
          <ListItem key={text} disablePadding onClick={() => {router.push('/' + text.toLocaleLowerCase().replace(/\s/g, ''))}} className={ pathName.startsWith('/' + text.toLowerCase().replace(/\s/g, '')) ? "text-sky-600 bg-slate-200" : "text-slate-700"}>
            <ListItemButton>
              <ListItemIcon className={ pathName.startsWith('/' + text.toLowerCase().replace(/\s/g, '')) ? "text-sky-600 bg-slate-200" : "#606060"}>
                {index === 0 && <BusinessCenterOutlinedIcon /> }
         
              </ListItemIcon>
              <ListItemText primary={text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );

  // Remove this const when copying and pasting into your project.
  const container = window !== undefined ? () => window().document.body : undefined;

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          
        }} className= { "bg-white text-sky-600" }
      >
        <Toolbar >
          <IconButton
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          <Typography variant="h6" noWrap component="div">
            Menu
          </Typography>
          </IconButton>
          
          <Grid container spacing={2}>
            <Grid item xs={10}>
            
            </Grid>
            <Grid item xs={2}>
            

              <AccountCircleIcon 
                  sx={{ fontSize: 40, 
                    marginLeft:12, 
                    borderColor: 'purple', 
                    color: 'purple',  
                    '&:hover': {backgroundColor: '#E6E6EF',},
                    }} />
              <SettingsIcon 
                  sx={{ fontSize: 40, 
                    marginLeft:2, 
                    borderColor: 'lightgreen', 
                    color: 'lightgreen',  
                    '&:hover': {backgroundColor: '#E6E6EF',},
                    }} />
              <ExitToAppIcon               
                    sx={{ fontSize: 40, 
                    marginLeft:2, 
                    borderColor: 'black', 
                    color: 'black',  
                    '&:hover': {backgroundColor: '#E6E6EF',},
                    }}  />
            </Grid>
          </Grid>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="administration"
      >
        {/* The implementation can be swapped with js to avoid SEO duplication of links. */}
        <Drawer
          container={container}
          variant="temporary"
          open={mobileOpen}
          onTransitionEnd={handleDrawerTransitionEnd}
          onClose={handleDrawerClose}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
          
        >

          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{ flexGrow: 0, p: 3, height: '100vh',width: { sm: `calc(100% - ${drawerWidth}px)` } }} className='bg-slate-200'
      >
        <Toolbar />
        <main>{ children }</main>
      </Box>
    </Box>
  );
}

Layout.propTypes = {
  /**
   * Injected by the documentation to work in an iframe.
   * Remove this when copying and pasting into your project.
   */
  window: PropTypes.func,
  children: PropTypes.any,
};

export default Layout;
