"use client"
import React from 'react'
import Layout from '../component/layout'
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import { styled } from '@mui/material/styles';
import axios from 'axios';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import SuccessAlert from '../component/success-alert'
import ErrorAlert from '../component/error-alert'

const serviceGetOpenAccountingPeriodsURL = process.env.NEXT_PUBLIC_SUBLEDGER_SERVICE_URI + '/accounting-period/get/open-periods'
const serviceGetCurrentOpenAccountingPeriodURL = process.env.NEXT_PUBLIC_SUBLEDGER_SERVICE_URI + '/accounting-period/get/current-open-period'
const serviceCloseAccountingPeriodURL = process.env.NEXT_PUBLIC_SUBLEDGER_SERVICE_URI + '/accounting-period/close'

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: 'center',
  color: theme.palette.text.secondary,
  height: '100px',
  width: '18%'
}));


const AccountingPeriodRecord = {
  periodId: 0,
  period: "",
  fiscalPeriod: 0,
  year: 0,
  status: 0,
};

export default function HomePage() {
const [anchorEl, setAnchorEl] = React.useState(null);
const [openPeriodCloseDialog, setOpenPeriodCloseDialog] = React.useState(false);
const [isDataFetched, setIsDataFetched] = React.useState(false);
const [year, setYear] = React.useState('');
var [years, setYears] = React.useState([]);
const [month, setMonth] = React.useState('');
var [months, setMonths] = React.useState([]);
const [showSuccessMessage, setShowSuccessMessage] = React.useState(false);
const [successMessage, setSuccessMessage] = React.useState('');
const [showErrorMessage, setShowErrorMessage] = React.useState(false);
const [errorMessage, setErrorMessage] = React.useState('');

  const [accountingPeriods, setAccountingPeriods] = React.useState([
    {...AccountingPeriodRecord,
      "periodId": 0,
  "period": "_ _ / _ _",
  "fiscalPeriod": 0,
  "year": 0,
  "status": 0
    }]);

    const handleClickOpen = (event) => {
      setAnchorEl(event.currentTarget);
      setOpenPeriodCloseDialog(true);
    };
    
    const handleClose = () => {
      setAnchorEl(null);
      setOpenPeriodCloseDialog(false);
    };

    
const [currentOpenAccountingPeriod, setCurrentOpenAccountingPeriod] = React.useState({
  ...AccountingPeriodRecord,
  "periodId": 0,
  "period": "__ / __",
  "fiscalPeriod": 0,
  "year": 0,
  "status": 0
});

// Fetch data when the component mounts
React.useEffect(() => {
  const fetchData = async () => {
    try {
      // Fetch open accounting periods first
      await fetchOpenAccountingPeriods();

      // Then fetch the last closed accounting period
      await fetchCurrentOpenAccountingPeriod();

      // Mark data fetching as complete
      setIsDataFetched(true);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  fetchData();

  // Log the `years` after both fetches are complete
 }, [isDataFetched]);

const fillYearList = (apList) => {
  var yearList = [];
  var uniquePeriodIds = [...new Set(apList.map((record) => record.year))];
  uniquePeriodIds.forEach((ap) => {if(ap > 0) yearList.push(ap.toString())});

  setYears(yearList);
  setYear(yearList[0]);
}

const fillMonthList = (apList) => {
  var monthList = [];
  var uniquePeriodIds = [...new Set(apList.map((record) => record.fiscalPeriod))];
  uniquePeriodIds.forEach((ap) => {
    if(ap > 0 && ap < 10) {
      monthList.push("0" + ap.toString());
    }else{
      monthList.push(ap.toString());
    }
    
    });

  setMonths(monthList);
  setMonth(monthList[0]);
}

const handlecloseAccountingPeriod = async () => {
  try {
    const response = await axios.post(serviceCloseAccountingPeriodURL, {...AccountingPeriodRecord,
      "periodId": parseInt(year + month),
  "period": year + '-' + month,
  "fiscalPeriod": parseInt(month),
  "year": parseInt(year),
  "status": 1
    },
    {
    headers: {
      'X-Tenant': process.env.NEXT_PUBLIC_TENANT,
      Accept: '*/*',
      'Postman-Token': '091bd74b-e836-4185-896a-008fd64b4f46',
    }
  }
  );
    setLastClosedAccountingPeriod(response.data);
    setSuccessMessage(response.data);
    setShowSuccessMessage(true);

    setTimeout(() => {
      setShowSuccessMessage(false);
      setShowErrorMessage(false);
      fetchOpenAccountingPeriods();
      handleClose();
     // onClose(false);
    }, 3000);
    } catch (error) {
    // Handle error if needed
    setErrorMessage(error);
    setShowErrorMessage(true);

  }
};

const fetchOpenAccountingPeriods = () => {
    
axios.get(serviceGetOpenAccountingPeriodsURL, {
    headers: {
      'X-Tenant': process.env.NEXT_PUBLIC_TENANT,
      Accept: '*/*',
      'Postman-Token': '091bd74b-e836-4185-896a-008fd64b4f46',
    }
  })
    .then(response => {
      setAccountingPeriods(response.data);
      fillYearList(response.data);
      fillMonthList(response.data);
    })
    .catch(error => {
      // Handle error if needed
    });
};

const fetchCurrentOpenAccountingPeriod = () => {
    
  axios.get(serviceGetCurrentOpenAccountingPeriodURL, {
      headers: {
        'X-Tenant': process.env.NEXT_PUBLIC_TENANT,
        Accept: '*/*',
        'Postman-Token': '091bd74b-e836-4185-896a-008fd64b4f46',
      }
    })
      .then(response => {
        
          setCurrentOpenAccountingPeriod(response.data);
        
      })
      .catch(error => {
        // Handle error if needed
      });
  };
  
  return (
    <>
      
    <Box component="section" sx={{ 
      p: 5,     
      bgcolor: 'background.paper',
      borderColor: 'text.primary', 
      borderRadius: '7px', 
      border: '1px grey'
      }}>
         <div>
      <Stack
        direction="row"
        divider={<Divider orientation="vertical" flexItem />}
        spacing={2}
      >
        <Item sx={{bgcolor: '#0097B2' }}>Accounting Period
          <div>
            

{/*      
          <Autocomplete
      id="combo-box-demo"
      options={accountingPeriods}
      getOptionLabel={(option) => option.period}
      value={lastClosedAccountingPeriod}
      onChange={(event, newValue) => {
        setLastClosedAccountingPeriod(newValue); // Update state when the user selects a new value
      }}
      isOptionEqualToValue={(option, value) => option.periodId === value.periodId}
      sx={{
        width: 250,
        '& .MuiOutlinedInput-root': {
          '& fieldset': {
            border: 'none',
            fontSize: '20px',  // Increase font size here
              fontWeight: '700', // Adjust font weight here
          },
        },
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          sx={{
            '& .MuiInputBase-input': {
              textAlign: 'center',
              fontSize: '20px',  // Increase font size here
              fontWeight: '900', // Adjust font weight here
            },
          }}
        />
      )}
    />
      */}
          </div>
          <div style={{
    marginTop: '30px',
    fontSize: '25px',
    fontWeight: 'bold',
    display: 'grid',
    gridTemplateColumns: '3fr 1fr'
  }}>
    <div > {currentOpenAccountingPeriod.period}</div>
    <div > 
      <Button id="period-close-button" onClick={handleClickOpen} color="primary" >
        <ArrowDropDownIcon sx={{ color: 'white' }}/>
      </Button>
    </div>
    {
  openPeriodCloseDialog && (
    <Menu
      open={openPeriodCloseDialog}
      anchorEl={anchorEl}
      onClose={handleClose}
      MenuListProps={{
        'aria-labelledby': 'period-close-button',
      }}
    >
      <MenuItem>
      <Autocomplete
        options={years}
        value={year}
        onChange={(event, newValue) => {
          setYear(newValue); // Update state when the user selects a new value
        }}
        inputValue={year}
        onInputChange={(event, newInputValue) => {
         // setYear(newInputValue);
         //do nothing
        }}
        // getOptionLabel={(option) => typeof option === 'number' ? option.toString() : option}
        disableClearable={true}
        id="year-list"
        
        sx={{ width: 120, height: 1}}
        renderInput={(params) => <TextField {...params} label="Year" InputProps={{
          ...params.InputProps,
          readOnly: true, // Prevent manual editing
        }}/>}
      />
      <div style={{width: '10px'}}/>
      <Autocomplete
        options={months}
        value={month}
        onChange={(event, newValue) => {
          setMonth(newValue); // Update state when the user selects a new value
        }}
        inputValue={month}
        onInputChange={(event, newInputValue) => {
         // setYear(newInputValue);
         //do nothing
        }}
        // getOptionLabel={(option) => typeof option === 'number' ? option.toString() : option}
        disableClearable={true}
        id="month-list"
        sx={{ width: 80, height: 1}}
        renderInput={(params) => <TextField {...params} label="Month" InputProps={{
          ...params.InputProps,
          readOnly: true, // Prevent manual editing
        }}/>}
      />
      
<div style={{width: '10px'}}/>
    <Button variant="contained" onClick={handlecloseAccountingPeriod} sx={{bgcolor: '#0097B2'}}>
      Close
    </Button>
      </MenuItem>
    </Menu>
  )
}
  </div>
        </Item>
        <Item>Item 2</Item>
        <Item>Item 3</Item>
        <Item>Item 4</Item>
      </Stack>
    </div>


    </Box>
    </>
  )
}
