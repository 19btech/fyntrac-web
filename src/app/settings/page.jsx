"use client"
import React from 'react'
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Paper } from '@mui/material';
import Grid from '@mui/material/Grid2';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import Tooltip from '@mui/material/Tooltip';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import SuccessAlert from '../component/success-alert'
import ErrorAlert from '../component/error-alert'
import ConfirmationDialog from '../component/confirmation-dialog'
import ReopenAccountingPeriodDialog from '../component/reopen-accounting-period-dialog'
import axios from 'axios';
import dayjs from 'dayjs';
import '../common.css';

function CustomTabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3, alignContent: 'initial' }}>
          <>{children}</>
        </Box>
      )}
    </div>
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

export default function SettingsPage() {
  const [value, setValue] = React.useState(0);
  const [showSuccessMessage, setShowSuccessMessage] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState('');
  const [showErrorMessage, setShowErrorMessage] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');
  const [fiscalPeriodStaringDate, setFiscalPeriodStaringDate] = React.useState(null);
  const [open, setOpen] = React.useState(false);
  const [settings, setSettings] = React.useState({});
  const [isDataFetched, setIsDataFetched] = React.useState(false);
  const [restatementMode, setRestatementMode] = React.useState(false);
  const [showRestatementDaialog, setShowRestatementDaialog] = React.useState(false);
  const [showReopenAccountingPeriodDialog, setShowReopenAccountingPeriodDialog] = React.useState(false);
  const [showSchemaRefreshDialog, setShowSchemaRefreshDialog] = React.useState(false);
  const [isFiscalPeriodButtonDisabled, setIsFiscalPeriodButtonDisabled] = React.useState(true);

  const rows = [
    { left: 'Item 1 Left', right: 'Item 1 Right' },
    { left: 'Item 2 Left', right: 'Item 2 Right' },
    { left: 'Item 3 Left', right: 'Item 3 Right' },
    { left: 'Item 4 Left', right: 'Item 4 Right' },
    { left: 'Item 5 Left', right: 'Item 5 Right' },
    { left: 'Item 6 Left', right: 'Item 6 Right' },
    { left: 'Item 7 Left', right: 'Item 7 Right' },
  ];

  const saveFiscalPeriodServiceURL = process.env.NEXT_PUBLIC_SUBLEDGER_SERVICE_URI + '/setting/fiscal-priod/save';
  const handleFiscalPeriodChange = (date) => {
    setFiscalPeriodStaringDate(date);
    if (fiscalPeriodStaringDate != null) {
      setIsFiscalPeriodButtonDisabled(false);
    }
  };



  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const handleRestatementMode = (event) => {
    setRestatementMode(event.target.checked);
    setShowRestatementDaialog(event.target.checked);
  };


  const handleReopenAccountingPeriod = () => {
    setShowReopenAccountingPeriodDialog(true);
  }

  const fetchSettings = () => {
    const fetchSettings = process.env.NEXT_PUBLIC_SUBLEDGER_SERVICE_URI + '/setting/get/settings';
    axios.get(fetchSettings, {
      headers: {
        'X-Tenant': process.env.NEXT_PUBLIC_TENANT,
        Accept: '*/*',
        'Postman-Token': '091bd74b-e836-4185-896a-008fd64b4f46',
      }
    })
      .then(response => {
        setSettings(response.data);
        const fiscalPeriodDate = new Date(response.data.fiscalPeriodStartDate);
        setFiscalPeriodStaringDate(dayjs(fiscalPeriodDate));
        setRestatementMode(response.data.restatementMode === 1 ? true : false);
        // Handle success response if needed
      })
      .catch(error => {
        // Handle error if needed
      });
  };

  // Fetch data when the component mounts
  React.useEffect(() => {
    fetchSettings();
    setIsDataFetched(true);
  }, [isDataFetched]);


  const handleSaveFiscalPeriod = async () => {
    try {
      const response = await axios.post(saveFiscalPeriodServiceURL, {
        homeCurrency: '',
        glamFields: '',
        fiscalPeriodStartDate: new Date(fiscalPeriodStaringDate.toISOString()),
        reportingPeriod: null,
        restatementMode: 0,
        id: null
      },
        {
          headers: {
            'X-Tenant': process.env.NEXT_PUBLIC_TENANT,
            Accept: '*/*',
            'Content-Type': 'application/json',
            'Postman-Token': '091bd74b-e836-4185-896a-008fd64b4f46',
          }
        }
      );
      setSuccessMessage('');
      setShowSuccessMessage(true);

      setTimeout(() => {
        const fiscalPeriodDate = new Date(response.data.fiscalPeriodStartDate);
        setFiscalPeriodStaringDate(dayjs(fiscalPeriodDate));
        setIsFiscalPeriodButtonDisabled(true);
        setShowSuccessMessage(false);
        setShowErrorMessage(false);
        setOpen(false);
      }, 3000);
    } catch (error) {
      // Handle error if needed
      setErrorMessage(error);
      setShowErrorMessage(true);

    }
  };

  const reopenAllClosedAccountingPeriods = async () => {
    if (restatementMode === false) {
      return;
    }
    try {
      const response = await axios.post(process.env.NEXT_PUBLIC_SUBLEDGER_SERVICE_URI + '/setting/restatement-mode/save', {
        homeCurrency: '',
        glamFields: '',
        fiscalPeriodStartDate: new Date(fiscalPeriodStaringDate.toISOString()),
        reportingPeriod: null,
        restatementMode: restatementMode ? 1 : 0,
        id: null
      },
        {
          headers: {
            'X-Tenant': process.env.NEXT_PUBLIC_TENANT,
            Accept: '*/*',
            'Content-Type': 'application/json',
            'Postman-Token': '091bd74b-e836-4185-896a-008fd64b4f46',
          }
        }
      );
      setSuccessMessage('');
      setShowSuccessMessage(true);

      setTimeout(() => {
        const fiscalPeriodDate = new Date(response.data.fiscalPeriodStartDate);
        setFiscalPeriodStaringDate(dayjs(fiscalPeriodDate));
        setRestatementMode(response.data.restatementMode === 1 ? true : false);
        setShowSuccessMessage(false);
        setShowErrorMessage(false);
        setShowRestatementDaialog(false);
        setOpen(false);
      }, 3000);
    } catch (error) {
      // Handle error if needed
      setErrorMessage(error);
      setShowErrorMessage(true);

    }
  };

  const refreshEnvironment = async () => {
    try {
      const response = await axios.post(process.env.NEXT_PUBLIC_SUBLEDGER_SERVICE_URI + '/setting/refresh/schema', true,
        {
          headers: {
            'X-Tenant': process.env.NEXT_PUBLIC_TENANT,
            Accept: '*/*',
            'Content-Type': 'application/json',
            'Postman-Token': '091bd74b-e836-4185-896a-008fd64b4f46',
          }
        }
      );
      setSuccessMessage('');
      setShowSuccessMessage(true);

      setTimeout(() => {
        const fiscalPeriodDate = new Date(response.data.fiscalPeriodStartDate);
        setFiscalPeriodStaringDate(dayjs(fiscalPeriodDate));
        setRestatementMode(response.data.restatementMode === 1 ? true : false);
        setShowSuccessMessage(false);
        setShowErrorMessage(false);
        setShowSchemaRefreshDialog(false);
        setOpen(false);
      }, 3000);
    } catch (error) {
      // Handle error if needed
      setErrorMessage(error);
      setShowErrorMessage(true);

    }
  };

  const handleSchemaRefresh = () => {
    setShowSchemaRefreshDialog(true);
  }

  return (
    <div style={{ width: '100%', margin: 'auto' }}>
      <Paper key={1} elevation={0} sx={{ padding: '10px', marginBottom: '8px' }}>
        <Grid container sx={{ height: '109px' }} alignItems="center" justifyContent="space-between">
          {/* Left Aligned */}
          <Grid>
            <Typography sx={{ fontSize: '0.9rem', textAlign: 'left' }}>Reset Environment</Typography>
            <Typography sx={{ fontSize: '0.7rem', textAlign: 'left', color: '#691091' }}>
              Completely refresh your environment
            </Typography>
          </Grid>

          {/* Right Aligned */}
          <Grid>
            <Tooltip title="Reset Environment">
              <Button className='button-size' onClick={handleSchemaRefresh} variant="outlined" sx={{
                marginLeft: 2,
                color: 'white',
                backgroundColor: '#34b444  !important',
                '&:hover': {
                  backgroundColor: 'lightgrey',
                },
              }}>

                &nbsp; &nbsp; Reset &nbsp;  &nbsp;

              </Button>
            </Tooltip>
          </Grid>
        </Grid>

      </Paper>
      <Divider />

      <Paper key={2} elevation={0} sx={{ padding: '10px', marginBottom: '8px' }}>
        <Grid container sx={{ height: '110px' }} alignItems="center" justifyContent="space-between">
          {/* Left Aligned */}
          <Grid>
            <Typography sx={{ fontSize: '0.9rem', textAlign: 'left' }}>Home Currencty</Typography>
            <Typography sx={{ fontSize: '0.7rem', textAlign: 'left', color: '#691091' }}>
              What is home currencty?
            </Typography>
          </Grid>

          {/* Right Aligned */}
          <Grid>
            <Tooltip title="Currency">
              <Button className='button-size' variant="outlined" sx={{
                marginLeft: 2,
                color: 'white',
                backgroundColor: '#34b444  !important',
                '&:hover': {
                  backgroundColor: 'lightgrey',
                },
              }}>

                &nbsp; &nbsp; Save &nbsp;  &nbsp;

              </Button>
            </Tooltip>
          </Grid>
        </Grid>

      </Paper>
      <Divider />

      <Paper key={3} elevation={0} sx={{ padding: '10px', marginBottom: '8px' }}>
        <Grid container sx={{ height: '110px' }} alignItems="center" justifyContent="space-between">
          {/* Left Aligned */}
          <Grid>
            <Typography sx={{ fontSize: '0.9rem', textAlign: 'left' }}>General Ledger Accounts Mapping Fields</Typography>
            <Typography sx={{ fontSize: '0.7rem', textAlign: 'left', color: '#691091' }}>
              What are journal mapping fields?
            </Typography>
          </Grid>

          {/* Right Aligned */}
          <Grid>
            <Tooltip title="Mappings">
              <Button className='button-size' variant="outlined" sx={{
                marginLeft: 2,
                color: 'white',
                backgroundColor: '#34b444  !important',
                '&:hover': {
                  backgroundColor: 'lightgrey',
                },
              }}>

                &nbsp; &nbsp; Save &nbsp;  &nbsp;

              </Button>
            </Tooltip>
          </Grid>
        </Grid>

      </Paper>
      <Divider />

      <Paper key={4} elevation={0} sx={{ padding: '10px', marginBottom: '8px' }}>
        <Grid container sx={{ height: '110px' }} alignItems="center" justifyContent="space-between">
          {/* Left Aligned */}
          <Grid size={8}>
            <Typography sx={{ fontSize: '0.9rem', textAlign: 'left' }}>Fiscal Period Start Date</Typography>
            <Typography sx={{ fontSize: '0.7rem', textAlign: 'left', color: '#691091' }}>
              learn more!
            </Typography>
          </Grid>

          {/* Right Aligned */}
          <Grid size={2} >
            <LocalizationProvider dateAdapter={AdapterDayjs}>

              <DatePicker
                value={fiscalPeriodStaringDate}
                onChange={handleFiscalPeriodChange}
                sx={{
                  "& .MuiInputBase-root": {
                    height: "40px"
                  }
                }}
              />
            </LocalizationProvider>

          </Grid>

          <Grid size={2} sx={{ display: 'flex', justifyContent: 'flex-end' }}>

            <Tooltip title="Generate Accounting Periods" arrow>
              <span>
                <Button
                className='button-size'
                  disabled={isFiscalPeriodButtonDisabled}
                  onClick={handleSaveFiscalPeriod}
                  variant="outlined"
                  sx={{
                    marginLeft: 2,
                    color: 'white',
                    backgroundColor: '#34b444 !important',
                    '&:hover': {
                      backgroundColor: 'lightgrey',
                    },
                  }}
                >
                  &nbsp; &nbsp; Save &nbsp; &nbsp;
                </Button>
              </span>
            </Tooltip>

          </Grid>
        </Grid>

      </Paper>
      <Divider />

      <Paper key={5} elevation={0} sx={{ padding: '10px', marginBottom: '8px' }}>
        <Grid container sx={{ height: '110px' }} alignItems="center" justifyContent="space-between">
          {/* Left Aligned */}
          <Grid>
            <Typography sx={{ fontSize: '0.9rem', textAlign: 'left' }}>Reporting Period</Typography>
            <Typography sx={{ fontSize: '0.7rem', textAlign: 'left', color: '#691091' }}>
              What is reporting period?
            </Typography>
          </Grid>

          {/* Right Aligned */}
          <Grid>
            <Tooltip title="Reporting Period">
              <Button variant="outlined" 
              className='button-size'
              sx={{
                marginLeft: 2,
                color: 'white',
                backgroundColor: '#34b444  !important',
                '&:hover': {
                  backgroundColor: 'lightgrey',
                },
              }}>

                &nbsp; &nbsp; Save &nbsp;  &nbsp;

              </Button>
            </Tooltip>
          </Grid>
        </Grid>

      </Paper>
      <Divider />

      <Paper key={6} elevation={0} sx={{ padding: '10px', marginBottom: '8px' }}>
        <Grid container sx={{ height: '110px' }} alignItems="center" justifyContent="space-between">
          {/* Left Aligned */}
          <Grid>
            <Typography sx={{ fontSize: '0.9rem', textAlign: 'left' }}>Restatement Mode</Typography>
            <Typography sx={{ fontSize: '0.7rem', textAlign: 'left', color: '#691091' }}>
              What is restatement mode?
            </Typography>
          </Grid>

          {/* Right Aligned */}
          <Grid>
            <Switch checked={restatementMode} onChange={handleRestatementMode} />
          </Grid>
        </Grid>

      </Paper>
      <Divider />

      <Paper key={7} elevation={0} sx={{ padding: '10px', marginBottom: '8px' }}>
        <Grid container sx={{ height: '110px' }} alignItems="center" justifyContent="space-between">
          {/* Left Aligned */}
          <Grid>
            <Typography sx={{ fontSize: '0.9rem', textAlign: 'left' }}>Reopen Accounting Period</Typography>
            <Typography sx={{ fontSize: '0.7rem', textAlign: 'left', color: '#691091' }}>
              What is an accounting period?
            </Typography>
          </Grid>

          {/* Right Aligned */}
          <Grid>
            <Tooltip title='Reopen accounting period'>
              <Button variant="outlined" 
              className='button-size'
              sx={{
                marginLeft: 2,
                color: 'white',
                backgroundColor: '#34b444  !important',
                '&:hover': {
                  backgroundColor: 'lightgrey',
                },
              }} onClick={handleReopenAccountingPeriod} >

                &nbsp; &nbsp; Reopen &nbsp;  &nbsp;

              </Button>
            </Tooltip>
          </Grid>
        </Grid>

      </Paper>
      <Divider />

    </div>
  );
}
