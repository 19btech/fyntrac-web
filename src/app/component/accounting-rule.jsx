"use client"
import React from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import Transaction from './transaction';

function CustomTabPanel(props) {
    const { children, value, index, ...other } = props;
  
    return (
      <Box
        width="100%"
        role="tabpanel"
        hidden={value !== index}
        id={`simple-tabpanel-${index}`}
        aria-labelledby={`simple-tab-${index}`}
        {...other}
      >
        {value === index && (
          <Box sx={{ p: 2, }}>
            {children}
          </Box>
        )}
      </Box>
    );
  }
  
  CustomTabPanel.propTypes = {
    children: PropTypes.node,
    index: PropTypes.number.isRequired,
    value: PropTypes.number.isRequired,
  };
  
  function a11yProps(index) {
    return {
      id: `simple-tab-${index}`,
      'aria-controls': `simple-tabpanel-${index}`,
    };
  }

function AccountingRule(props){
    const { window } = props;

    const [value, setValue] = React.useState(0);

    const handleChange = (event, newValue) => {
      setValue(newValue);
    };

    return (
        
    <Box>
      <Box sx={{ width: '95rem', borderBottom: 1, borderColor: 'divider', alignItems: 'flex-start', margin: 0, padding: 0}}>
        <Tabs sx={{ width: '90rem' }} value={value} onChange={handleChange} aria-label="Accounting Configuration">
          <Tab label="Transactions" {...a11yProps(0)} />
          <Tab label="Attributes" {...a11yProps(1)} />
          <Tab label="Balance" {...a11yProps(2)} />
          <Tab label="Account Type" {...a11yProps(3)} />
        </Tabs>
      </Box>
      <CustomTabPanel value={value} index={0}>
       <Transaction></Transaction>
      </CustomTabPanel>
      <CustomTabPanel value={value} index={1}>
        Attributes
      </CustomTabPanel>
      <CustomTabPanel value={value} index={2}>
        Balance
      </CustomTabPanel>
      <CustomTabPanel value={value} index={3}>
        Account Type
      </CustomTabPanel>

     
    </Box>
      );
}

AccountingRule.propTypes = {
    /**
     * Injected by the documentation to work in an iframe.
     * Remove this when copying and pasting into your project.
     */
    window: PropTypes.func,
    children: PropTypes.any,
  };
  
  export default AccountingRule;