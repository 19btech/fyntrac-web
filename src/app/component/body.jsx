"use client"
import React from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import { useRouter } from 'next/navigation'
import { usePathname } from 'next/navigation';

const drawerWidth = 240;

function Body(props) {
  const { window } = props;
  const { children } = props;
  
  const [mobileOpen, setMobileOpen] = React.useState(false);
 
  const router = useRouter();
  const pathName = usePathname();

  const bodyCommonStyles = {
    bgcolor: 'background.paper',
    borderColor: 'text.primary',
    height: '85vh',
    p: 2,
    display: 'flex', alignItems: 'top'
    
  };


  const handleDrawerTransitionEnd = () => {
    setIsClosing(false);
  };

 
  const drawer = (
    <div>

    <Box sx={{ display: 'flex' }}  >
      <Box sx={{ ...bodyCommonStyles, borderRadius: '7px', width: { sm: `calc(100% - 10px)` } }}>
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
        sx={{ display: 'flex'  }}
      >
        <main>{drawer}</main>
        
      </Box>
    </Box>
  );
}

Body.propTypes = {
  /**
   * Injected by the documentation to work in an iframe.
   * Remove this when copying and pasting into your project.
   */
  window: PropTypes.func,
  children: PropTypes.any,
};

export default Body;
