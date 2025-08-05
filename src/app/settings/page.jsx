"use client"
import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Paper, Autocomplete, TextField } from '@mui/material';
import Grid from '@mui/material/Grid2';
import IconButton from '@mui/material/IconButton';
import Switch from '@mui/material/Switch';
import Tooltip from '@mui/material/Tooltip';
import Link from '@mui/material/Link';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import CustomTabPanel from '../component/custom-tab-panel'
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import RefreshSharpIcon from '@mui/icons-material/RefreshSharp';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import AddDashboardConfiguration from '../component/add-update-dashboard-config';
import axios from 'axios';
import dayjs from 'dayjs';
import '../common.css';


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
  const [panelIndex, setPanelIndex] = React.useState(0);
  const [isDashboardConfigurationDialogOpen, setIsDashboardConfigurationDialogOpen] = React.useState(false);
  const [currency, setCurrency] = useState('USD');
  const currencyList = ['USD',
    'PKR',
    'EUR',
    'AED'];

  const [replayBoundry, setReplayBoundry] = useState('3');
  const replayBoundryList = ['3', '4',
    '5',
    '6',
    '7', '8', '9', '10', '11', '12'];

  const [reportingPeriod, setReportingPeriod] = useState('6');
  const reportingPeriodList = [
    '6',
    '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24'];

  const [reopenPeriod, setReopenPeriod] = useState('Nov-2022');
  const reopenPriodList = ['Nov-2022',
    'Oct-2022',
    'Sep-2022',
    'Aug-2022'];

  const rows = [
    { left: 'Item 1 Left', right: 'Item 1 Right' },
    { left: 'Item 2 Left', right: 'Item 2 Right' },
    { left: 'Item 3 Left', right: 'Item 3 Right' },
    { left: 'Item 4 Left', right: 'Item 4 Right' },
    { left: 'Item 5 Left', right: 'Item 5 Right' },
    { left: 'Item 6 Left', right: 'Item 6 Right' },
    { left: 'Item 7 Left', right: 'Item 7 Right' },
  ];
  const [editData, setEditData] = useState(null);
  const saveFiscalPeriodServiceURL = process.env.NEXT_PUBLIC_SUBLEDGER_SERVICE_URI + '/setting/fiscal-priod/save';
  const handleFiscalPeriodChange = (date) => {
    setFiscalPeriodStaringDate(date);
    if (fiscalPeriodStaringDate != null) {
      setIsFiscalPeriodButtonDisabled(false);
    }
  };



  const handleConfigurationTabChange = (event, newValue) => {
    setPanelIndex(newValue);
  };

  const handleAddDashboardConfigurationDialogOpen= () => {
    setIsDashboardConfigurationDialogOpen(true);
  }

  const handleAddDashboardConfigurationDialogClose= (val) => {
    setIsDashboardConfigurationDialogOpen(val);
  }

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
    <Box>
      <Box sx={{ width: '100%', display: 'flex', borderBottom: 1, borderColor: 'divider', alignItems: 'flex-start', margin: 0, padding: 0 }}>
        <Tabs sx={{ width: '90rem' }} value={panelIndex} onChange={handleConfigurationTabChange} aria-label="Accounting Configuration">
          <Tab label="General Settings" sx={{ textTransform: 'none' }} />
          <Tab label="User Managment" sx={{ textTransform: 'none' }} />
        </Tabs>
      </Box>

      <CustomTabPanel value={panelIndex} index={0}>
        <div style={{ width: '100%', margin: 'auto' }}>
          <Paper key={1} elevation={0} sx={{ padding: '10px', marginBottom: '5px' }}>
            <Grid container sx={{ height: '70px' }} alignItems="center" justifyContent="space-between">
              {/* Left Aligned */}
              <Grid>
                <Typography sx={{ fontSize: '0.9rem', textAlign: 'left' }}>Reset Environment</Typography>
                <Typography sx={{ fontSize: '0.7rem', textAlign: 'left', color: '#1a6ab9' }}>
                  Resetting your environment will remove all current settings and data.
                </Typography>
              </Grid>

              {/* Right Aligned */}
              <Grid>

                <IconButton aria-label="Reset Environment" onClick={handleSchemaRefresh} sx={{
                  '&:hover': {
                    backgroundColor: '#14213d',
                  },
                }}>
                  <Tooltip title="Reset Environment">
                    <RefreshSharpIcon
                      sx={{
                        fontSize: '40px',
                        transform: 'scale(1.1)',  // Slightly thicker appearance
                      }}
                    />
                  </Tooltip>
                </IconButton>
              </Grid>
            </Grid>

          </Paper>

          <Paper key={2} elevation={0} sx={{ padding: '10px', marginBottom: '5px' }}>
            <Grid container sx={{ height: '70px' }} alignItems="center" justifyContent="space-between">
              {/* Left Aligned */}
              <Grid size={8}>
                <Typography sx={{ fontSize: '0.9rem', textAlign: 'left' }}>Home Currencty</Typography>
                <Typography sx={{ fontSize: '0.7rem', textAlign: 'left', color: '#1a6ab9' }}>
                  Choose default currency of your environment.
                </Typography>
              </Grid>

              {/* Right Aligned */}
              <Grid size={2}>
                <Autocomplete
                  sx={{
                    "& .MuiInputBase-root": {
                      height: "40px"
                    }
                  }}
                  disablePortal
                  id="currency-combo"
                  options={currencyList}
                  value={currency}
                  getOptionLabel={(option) => option}
                  onChange={(event, newValue) => { setCurrency(newValue) }} // newValue will be the selected option object
                  renderInput={(params) => <TextField {...params} label="Currency" />}
                />


              </Grid>
              <Grid size={2} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Tooltip title="Currency">
                  <span>
                    <Link
                      component="button"
                      // onClick={handleCurrencySave} // Replace with your actual function
                      underline="none"
                      sx={{
                        marginLeft: 2,
                        color: '#1a6ab9',
                        fontWeight: 500,
                        px: 1,
                        cursor: 'pointer',
                        '&:hover': {
                          color: '#14213d',
                        },
                      }}
                    >
                      Save
                    </Link>
                  </span>
                </Tooltip>
              </Grid>
            </Grid>

          </Paper>

          <Paper key={4} elevation={0} sx={{ padding: '10px', marginBottom: '5px' }}>
            <Grid container sx={{ height: '70px' }} alignItems="center" justifyContent="space-between">
              {/* Left Aligned */}
              <Grid size={8}>
                <Typography sx={{ fontSize: '0.9rem', textAlign: 'left' }}>Fiscal Period Start Date</Typography>
                <Typography sx={{ fontSize: '0.7rem', textAlign: 'left', color: '#1a6ab9' }}>
                  Specify starting date of your fiscal period.
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
                    <Link
                      component="button"
                      onClick={handleSaveFiscalPeriod}
                      underline="none"
                      disabled={isFiscalPeriodButtonDisabled}
                      sx={{
                        marginLeft: 2,
                        color: '#1a6ab9',
                        fontWeight: 500,
                        px: 1,
                        cursor: isFiscalPeriodButtonDisabled ? 'not-allowed' : 'pointer',
                        pointerEvents: isFiscalPeriodButtonDisabled ? 'none' : 'auto',
                        '&:hover': {
                          color: '#14213d',
                        },
                      }}
                    >
                      Save
                    </Link>
                  </span>
                </Tooltip>

              </Grid>
            </Grid>

          </Paper>
          <Paper key={6} elevation={0} sx={{ padding: '10px', marginBottom: '5px' }}>
            <Grid container sx={{ height: '70px' }} alignItems="center" justifyContent="space-between">
              {/* Left Aligned */}
              <Grid>
                <Typography sx={{ fontSize: '0.9rem', textAlign: 'left' }}>Restatement Mode</Typography>
                <Typography sx={{ fontSize: '0.7rem', textAlign: 'left', color: '#1a6ab9' }}>
                  This action will reopen previously closed accounting periods.
                </Typography>
              </Grid>

              {/* Right Aligned */}
              <Grid>
                <Switch
                  sx={{
                    fontSize: '40px',
                    transform: 'scale(1.1)'
                  }}
                  checked={restatementMode} onChange={handleRestatementMode} />
              </Grid>
            </Grid>

          </Paper>

          <Paper key={7} elevation={0} sx={{ padding: '10px', marginBottom: '5px' }}>
            <Grid container sx={{ height: '70px' }} alignItems="center" justifyContent="space-between">
              {/* Left Aligned */}
              <Grid size={8}>
                <Typography sx={{ fontSize: '0.9rem', textAlign: 'left' }}>Re-Open Accounting Period</Typography>
                <Typography sx={{ fontSize: '0.7rem', textAlign: 'left', color: '#1a6ab9' }}>
                  Choose a closed period to reopen.
                </Typography>
              </Grid>

              {/* Right Aligned */}
              <Grid size={2}>
                <Autocomplete
                  sx={{
                    "& .MuiInputBase-root": {
                      height: "40px"
                    }
                  }}
                  disablePortal
                  id="reopen-period-combo"
                  options={reopenPriodList}
                  value={reopenPeriod}
                  getOptionLabel={(option) => option}
                  onChange={(event, newValue) => { setReopenPeriod(newValue) }} // newValue will be the selected option object
                  renderInput={(params) => <TextField {...params} label="Reopen Period" />}
                />


              </Grid>
              <Grid size={2} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Tooltip title="Reopen Period">
                  <span>
                    <Link
                      component="button"
                      // onClick={handleReopenPeriod} // Replace with your actual handler
                      underline="none"
                      sx={{
                        marginLeft: 2,
                        color: '#1a6ab9',
                        fontWeight: 500,
                        px: 1,
                        cursor: 'pointer',
                        '&:hover': {
                          color: '#14213d',
                        },
                      }}
                    >
                      Reopen
                    </Link>
                  </span>
                </Tooltip>
              </Grid>
            </Grid>

          </Paper>

          <Paper key={9} elevation={0} sx={{ padding: '10px', marginBottom: '5px' }}>
            <Grid container sx={{ height: '70px' }} alignItems="center" justifyContent="space-between">
              {/* Left Aligned */}
              <Grid size={8}>
                <Typography sx={{ fontSize: '0.9rem', textAlign: 'left' }}>Delete Entries</Typography>
                <Typography sx={{ fontSize: '0.7rem', textAlign: 'left', color: '#1a6ab9' }}>
                  This action will delete all transactions, balances, GL for selected date.
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
                    <Link
                      component="button" // behaves like a button
                      onClick={handleSaveFiscalPeriod}
                      underline="none"
                      sx={{
                        marginLeft: 2,
                        // bgcolor: '#c7c8d7',
                        px: 2,
                        color: '#1a6ab9',
                        cursor: isFiscalPeriodButtonDisabled ? 'not-allowed' : 'pointer',
                        pointerEvents: isFiscalPeriodButtonDisabled ? 'none' : 'auto',
                        '&:hover': {
                          color: '#14213d',
                        },
                      }}
                    >
                      Delete
                    </Link>
                  </span>
                </Tooltip>

              </Grid>
            </Grid>

          </Paper>

          <Paper key={11} elevation={0} sx={{ padding: '10px', marginBottom: '5px' }}>
            <Grid container sx={{ height: '70px' }} alignItems="center" justifyContent="space-between">
              {/* Left Aligned */}
              <Grid>
                <Typography sx={{ fontSize: '0.9rem', textAlign: 'left' }}>Configure Dashboard</Typography>
                <Typography sx={{ fontSize: '0.7rem', textAlign: 'left', color: '#1a6ab9' }}>
                  update dashboard settings.
                </Typography>
              </Grid>

              {/* Right Aligned */}
              <Grid>

                <IconButton aria-label="Reset Environment" onClick={handleAddDashboardConfigurationDialogOpen} sx={{
                  '&:hover': {
                    backgroundColor: '#14213d',
                  },
                }}>
                  <Tooltip title="Configure Dashboard">
                    <SettingsOutlinedIcon
                      sx={{
                        fontSize: '40px',
                        transform: 'scale(1.1)',  // Slightly thicker appearance
                      }}
                    />
                  </Tooltip>
                </IconButton>
              </Grid>
            </Grid>

          </Paper>

          <Paper key={12} elevation={0} sx={{ padding: '10px', marginBottom: '5px' }}>
            <Grid container sx={{ height: '70px' }} alignItems="center" justifyContent="space-between">
              {/* Left Aligned */}
              <Grid size={8}>
                <Typography sx={{ fontSize: '0.9rem', textAlign: 'left' }}>Rewind/Replay Look Back Period</Typography>
                <Typography sx={{ fontSize: '0.7rem', textAlign: 'left', color: '#1a6ab9' }}>
                  Specify the number of postings to include in the rewind replay operations.
                </Typography>
              </Grid>

              {/* Right Aligned */}
              <Grid size={2}>
                <Autocomplete
                  sx={{
                    "& .MuiInputBase-root": {
                      height: "40px"
                    }
                  }}
                  disablePortal
                  id="currency-combo"
                  options={replayBoundryList}
                  value={replayBoundry}
                  getOptionLabel={(option) => option}
                  onChange={(event, newValue) => { setReplayBoundry(newValue) }} // newValue will be the selected option object
                  renderInput={(params) => <TextField {...params} label="Lookback Period" />}
                />


              </Grid>
              <Grid size={2} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Tooltip title="Rewind/Replay lookback period">
                  <span>
                    <Link
                      component="button"
                      // onClick={handleCurrencySave} // Replace with your actual function
                      underline="none"
                      sx={{
                        marginLeft: 2,
                        color: '#1a6ab9',
                        fontWeight: 500,
                        px: 1,
                        cursor: 'pointer',
                        '&:hover': {
                          color: '#14213d',
                        },
                      }}
                    >
                      Save
                    </Link>
                  </span>
                </Tooltip>
              </Grid>
            </Grid>

          </Paper>

          <Paper key={13} elevation={0} sx={{ padding: '10px', marginBottom: '5px' }}>
            <Grid container sx={{ height: '70px' }} alignItems="center" justifyContent="space-between">
              {/* Left Aligned */}
              <Grid size={8}>
                <Typography sx={{ fontSize: '0.9rem', textAlign: 'left' }}>Reporting Period</Typography>
                <Typography sx={{ fontSize: '0.7rem', textAlign: 'left', color: '#1a6ab9' }}>
                  Set the number of recent posting periods to include in report.
                </Typography>
              </Grid>

              {/* Right Aligned */}
              <Grid size={2}>
                <Autocomplete
                  sx={{
                    "& .MuiInputBase-root": {
                      height: "40px"
                    }
                  }}
                  disablePortal
                  id="currency-combo"
                  options={reportingPeriodList}
                  value={reportingPeriod}
                  getOptionLabel={(option) => option}
                  onChange={(event, newValue) => { setReportingPeriod(newValue) }} // newValue will be the selected option object
                  renderInput={(params) => <TextField {...params} label="Reporting Period" />}
                />


              </Grid>
              <Grid size={2} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Tooltip title="Reporting Period">
                  <span>
                    <Link
                      component="button"
                      // onClick={handleCurrencySave} // Replace with your actual function
                      underline="none"
                      sx={{
                        marginLeft: 2,
                        color: '#1a6ab9',
                        fontWeight: 500,
                        px: 1,
                        cursor: 'pointer',
                        '&:hover': {
                          color: '#14213d',
                        },
                      }}
                    >
                      Save
                    </Link>
                  </span>
                </Tooltip>
              </Grid>
            </Grid>

          </Paper>


        </div>
      </CustomTabPanel>

      <CustomTabPanel value={panelIndex} index={1}>
        <div>work inprogress</div>
      </CustomTabPanel>

      <><AddDashboardConfiguration open={isDashboardConfigurationDialogOpen} onClose={handleAddDashboardConfigurationDialogClose} editData={settings.dashboardConfiguration}/></>
    </Box>
  );
}
