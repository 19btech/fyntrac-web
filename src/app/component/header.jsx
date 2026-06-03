"use client"
import React from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import { useRouter } from 'next/navigation'
import { usePathname } from 'next/navigation';

const drawerWidth = 400;

function Header(props) {
  const { window } = props;
  const { children } = props;
  
  const [mobileOpen, setMobileOpen] = React.useState(false);
 
  const router = useRouter();
  const pathName = usePathname();

  const commonStyles = {
    bgcolor: 'background.paper',
    borderColor: 'text.primary',
    height: '3rem',
    display: 'flex', alignItems: 'center', justifyContent: 'center'
    
  };


  const handleDrawerTransitionEnd = () => {
    setIsClosing(false);
  };

 
  const drawer = (
    <div>

    <Box sx={{ display: 'flex', justifyContent: 'center' }}  >
      <Box sx={{ ...commonStyles, borderRadius: '7px', width: { sm: `calc(100% - 10px)` } }}>
      { children }
        </Box>
    </Box>

    </div>
  );

  // Remove this const when copying and pasting into your project.
  const container = window !== undefined ? () => window().document.body : undefined;

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />

      <Box
        sx={{ flexGrow: 1,  width: { sm: `calc(100% - ${drawerWidth}px)` } }}
      >
        <main>{drawer}</main>
        
      </Box>
    </Box>
  );
}

Header.propTypes = {
  /**
   * Injected by the documentation to work in an iframe.
   * Remove this when copying and pasting into your project.
   */
  window: PropTypes.func,
  children: PropTypes.any,
};

export default Header;
