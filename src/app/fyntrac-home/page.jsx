"use client"
import React from 'react'
import Layout from '../component/layout'
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid2'
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
import MetricWidget from '../component/metric-widget';
import LineChartWidget from '../component/line-chat-widget';
import BarChartWidget from '../component/bar-chart-widget';
import DynamicTable from '../component/dynamic-data-table';
import { Typography } from '@mui/material';
import { LineChart } from '@mui/x-charts/LineChart';
import { useTenant } from "../tenant-context";

const serviceGetOpenAccountingPeriodsURL = process.env.NEXT_PUBLIC_SUBLEDGER_SERVICE_URI + '/accounting-period/get/open-periods'
const serviceGetCurrentOpenAccountingPeriodURL = process.env.NEXT_PUBLIC_SUBLEDGER_SERVICE_URI + '/accounting-period/get/current-open-period'
const serviceCloseAccountingPeriodURL = process.env.NEXT_PUBLIC_SUBLEDGER_SERVICE_URI + '/accounting-period/close'
const serviceGetWidgetDataURL = process.env.NEXT_PUBLIC_REPORTING_SERVICE_URI + '/dashboard/get/widget-data'
const serviceGetTrendAnalysisURL = process.env.NEXT_PUBLIC_REPORTING_SERVICE_URI + '/dashboard/get/trend-analysis-data'
const serviceGetRankedMetricURL = process.env.NEXT_PUBLIC_REPORTING_SERVICE_URI + '/dashboard/get/ranked-metrics'
const serviceGetMomActivityDataURL = process.env.NEXT_PUBLIC_REPORTING_SERVICE_URI + '/dashboard/get/mom-activity-data'


// const Item = styled(Paper)(({ theme }) => ({
//   backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
//   ...theme.typography.body2,
//   padding: theme.spacing(1),
//   textAlign: 'center',
//   color: theme.palette.text.secondary,
//   height: '100px',
//   width: '18%'
// }));

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: '#ffffff',
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: 'center',
  height: '38vh',
  color: (theme.vars ?? theme).palette.text.secondary,
  boxShadow: 'none', // Remove shadow (emboss effect)
  elevation: 0,       // Optional: for clarity, though not used directly in styling
  ...(theme.palette.mode === 'dark' && {
    backgroundColor: '#1A2027',
  }),
}));


const Container = styled(Paper)(({ theme }) => ({
  backgroundColor: '#hhffff',
  ...theme.typography.body2,
  padding: theme.spacing(0),
  textAlign: 'center',
  height: '15vh',
  color: (theme.vars ?? theme).palette.text.secondary,
  boxShadow: 'none',
  // Remove shadow (emboss effect)
  elevation: 0,       // Optional: for clarity, though not used directly in styling
  ...(theme.palette.mode === 'dark' && {
    backgroundColor: '#1A2027',
  }),
}));

// const Container = styled(Paper)(({ theme }) => ({
//   backgroundColor: '#hhffff',
//   ...theme.typography.body2,
//   height: '12vh',
//   color: (theme.vars ?? theme).palette.text.secondary,
//   boxShadow: 'none', // Remove shadow (emboss effect)
//   elevation: 0,       // Optional: for clarity, though not used directly in styling
//   ...(theme.palette.mode === 'dark' && {
//     backgroundColor: '#1A2027',
//   }),
// }));

const PlainItem = styled(Paper)(({ theme }) => ({
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: 'center',
  color: (theme.vars ?? theme).palette.text.secondary,
  boxShadow: 'none', // Remove shadow (emboss effect)
  elevation: 0,       // Optional: for clarity, though not used directly in styling
  ...(theme.palette.mode === 'dark' && {
    backgroundColor: '#1A2027',
  }),
}));

const TopItem = styled(Paper)(({ theme }) => ({
  backgroundColor: '#EEF6FF',
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: 'left',
  height: '15vh',
  color: (theme.vars ?? theme).palette.text.secondary,
  boxShadow: 'none', // Remove shadow (emboss effect)
  display: 'flex',             // Flex layout
  alignItems: 'left',        // Vertical centering
  justifyContent: 'left',    // Horizontal centering
  borderRadius: theme.spacing(2), // ✅ Add rounded corners (adjust as needed)

  ...(theme.palette.mode === 'dark' && {
    backgroundColor: '#1A2027',
  }),
}));


const AccountingPeriodRecord = {
  periodId: 0,
  period: "",
  fiscalPeriod: 0,
  year: 0,
  status: 0,
};

const columns = [
  { id: 'rank', label: 'Rank' },
  { id: 'metricName', label: 'Metric', align: 'left' },
  { id: 'balance', label: 'Balance', align: 'right' },
];


const momDataset = [
  { accountingPeriodId: '2022-1', payment: 1000, upb: 2000, unam: -1000, interest: 2000 },
  { accountingPeriodId: '2022-2', payment: 1200, upb: 1800, unam: -950, interest: 1800 },
  { accountingPeriodId: '2022-3', payment: 1400, upb: 1600, unam: -800, interest: 1600 },
  { accountingPeriodId: '2022-4', payment: 1750, upb: 1200, unam: -550, interest: 1300 },
];

const valueFormatter = (value) => `$ ${value}`;

const momSeries = [
  { dataKey: 'payment', label: 'Payment', valueFormatter },
  { dataKey: 'upb', label: 'Unpaid Principal', valueFormatter },
  { dataKey: 'unam', label: 'Unpaid Fee', valueFormatter },
  { dataKey: 'interest', label: 'Interest Balance', valueFormatter },
];
Map
const defaultChartSetting = {
  yAxis: [{ label: 'Activity', width: 60 }],
  height: 300,
  margin: { top: 30, bottom: 50, left: 70, right: 20 },
};

export default function HomePage() {
    const { tenant } = useTenant();
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
  const [rankedMetrics, setRankedMetrics] = React.useState([]);
  const [momData, setMomData] = React.useState([]);
  const [momMetricSeries, setMomMetricSeries] = React.useState([]);
  const [accountingPeriods, setAccountingPeriods] = React.useState([
    {
      ...AccountingPeriodRecord,
      "periodId": 0,
      "period": "_ _ / _ _",
      "fiscalPeriod": 0,
      "year": 0,
      "status": 0
    }]);

  const [widgetDataList, setWidgetDataList] = React.useState([]);
  const [trendAnalysisData, setTrendAnalysisData] = React.useState([]);
  const [moMActivityData, setMoMActivityData] = React.useState([]);

  const transformToMomDataset = (data) => {
    const result = {};

    data.forEach(({ accountingPeriodId, activity, value }) => {
      if (!result[accountingPeriodId]) {
        result[accountingPeriodId] = { accountingPeriodId };
      }
      result[accountingPeriodId][activity] = value;
    });

    return Object.values(result);
  };

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
        fetchOpenAccountingPeriods();

        // Then fetch the last closed accounting period
        fetchCurrentOpenAccountingPeriod();

        fetchWidgetData();
        fetchTrendAnalysisData();
        fetchRankedMetricData();
        fetchMoMActivityData();
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
    uniquePeriodIds.forEach((ap) => { if (ap > 0) yearList.push(ap.toString()) });

    setYears(yearList);
    setYear(yearList[0]);
  }

  const fillMonthList = (apList) => {
    var monthList = [];
    var uniquePeriodIds = [...new Set(apList.map((record) => record.fiscalPeriod))];
    uniquePeriodIds.forEach((ap) => {
      if (ap > 0 && ap < 10) {
        monthList.push("0" + ap.toString());
      } else {
        monthList.push(ap.toString());
      }

    });

    setMonths(monthList);
    setMonth(monthList[0]);
  }

  const handlecloseAccountingPeriod = async () => {
    try {
      console.log('Tenant...', tenant);
      const response = await axios.post(serviceCloseAccountingPeriodURL, {
        ...AccountingPeriodRecord,
        "periodId": parseInt(year + month),
        "period": year + '-' + month,
        "fiscalPeriod": parseInt(month),
        "year": parseInt(year),
        "status": 1
      },
        {
          headers: {
            'X-Tenant': tenant,
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
        'X-Tenant': tenant,
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


  const fetchWidgetData = () => {
console.log('Tenant...', tenant);
    axios.get(serviceGetWidgetDataURL, {
      headers: {
        'X-Tenant': tenant,
        Accept: '*/*',
        'Postman-Token': '091bd74b-e836-4185-896a-008fd64b4f46',
      }
    })
      .then(response => {
        setWidgetDataList(response.data);
      })
      .catch(error => {
        // Handle error if needed
      });
  };



  const fetchTrendAnalysisData = () => {

    axios.get(serviceGetTrendAnalysisURL, {
      headers: {
        'X-Tenant': tenant,
        Accept: '*/*',
        'Postman-Token': '091bd74b-e836-4185-896a-008fd64b4f46',
      }
    })
      .then(response => {
        setTrendAnalysisData(response.data);
      })
      .catch(error => {
        // Handle error if needed
      });
  };


  const fetchRankedMetricData = () => {

    axios.get(serviceGetRankedMetricURL, {
      headers: {
        'X-Tenant': tenant,
        Accept: '*/*',
        'Postman-Token': '091bd74b-e836-4185-896a-008fd64b4f46',
      }
    })
      .then(response => {
        console.log('Ranked Metric:', response.data);
        setRankedMetrics(response.data);
      })
      .catch(error => {
        // Handle error if needed
      });
  };



  const fetchMoMActivityData = () => {

    axios.get(serviceGetMomActivityDataURL, {
      headers: {
        'X-Tenant': tenant,
        Accept: '*/*',
        'Postman-Token': '091bd74b-e836-4185-896a-008fd64b4f46',
      }
    })
      .then(response => {
        console.log('MOM Activity Response:', response.data);

        setMomData(response.data.momData);
        setMomMetricSeries(response.data.monthOverMonthSeries);
        console.log('MOM Activity Data:', momData);
        console.log('MOM Activity Metrics:', momMetricSeries);
        // setMoMActivityData(response.data);
      })
      .catch(error => {
        // Handle error if needed
      });
  };

  const fetchCurrentOpenAccountingPeriod = () => {

    axios.get(serviceGetCurrentOpenAccountingPeriodURL, {
      headers: {
        'X-Tenant': tenant,
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

    <Container>
      <Grid container spacing={3}>
        <Grid size={.25}></Grid>
        <Grid size={2.3}>
          <TopItem>


            <Typography variant="h8" fontWeight="medium" sx={{ color: '#2f3a53', width: '100px', paddingTop: 1, paddingLeft: 1 }}>
              Accounting&nbsp;Period
            </Typography>

            <Box
              sx={{
                fontSize: '20px',
                fontWeight: 'bold',
                display: 'flex',
                gridTemplateColumns: '6fr 2fr',
                alignItems: 'center',
              }}
            >
              <div>{currentOpenAccountingPeriod.period}</div>
              <div>
                <Button id="period-close-button" onClick={handleClickOpen}>
                  <ArrowDropDownIcon />
                </Button>
              </div>
            </Box>

            {openPeriodCloseDialog && (
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
                    onChange={(event, newValue) => setYear(newValue)}
                    inputValue={year}
                    disableClearable
                    id="year-list"
                    sx={{ width: 120 }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Year"
                        InputProps={{ ...params.InputProps, readOnly: true }}
                      />
                    )}
                  />
                  <Box sx={{ width: '10px' }} />
                  <Autocomplete
                    options={months}
                    value={month}
                    onChange={(event, newValue) => setMonth(newValue)}
                    inputValue={month}
                    disableClearable
                    id="month-list"
                    sx={{ width: 100 }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Month"
                        InputProps={{ ...params.InputProps, readOnly: true }}
                      />
                    )}
                  />
                  <Box sx={{ width: '10px' }} />
                  <Button variant="contained" onClick={handlecloseAccountingPeriod} sx={{ bgcolor: '#0097B2' }}>
                    Close
                  </Button>
                </MenuItem>
              </Menu>
            )}
          </TopItem>
        </Grid>


        <Grid size={2.3}>
          <TopItem>
            <MetricWidget metric={widgetDataList[0]} />
          </TopItem>
        </Grid>
        <Grid size={2.3}>
          <TopItem>
            <MetricWidget metric={widgetDataList[1]} />
          </TopItem>
        </Grid>
        <Grid size={2.3}>
          <TopItem>
            <MetricWidget metric={widgetDataList[2]} />
          </TopItem>
        </Grid>
        <Grid size={2.3}>
          <TopItem>
            <MetricWidget metric={widgetDataList[3]} />
          </TopItem>
        </Grid>
        <Grid size={.25}></Grid>

        <Grid
          size={12}
          sx={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#ffffff',
            height: '6vh',
          }}
        >
          <TextField
            label="Currency"
            defaultValue="US Dollar"
            variant="outlined"
            fullWidth
            InputProps={{
              readOnly: true,
            }}
            sx={{
              ml: 2,
              '& .MuiInputBase-root': {
                borderRadius: '16px',
                height: '4vh',
                width: '15vh',
                fontSize: '0.875rem',
              },
              '& label': {
                transform: 'translate(14px, -9px) scale(0.75)',
              },

            }}
          />
        </Grid>

        <Grid size={8}>
          <Item>

            <Typography variant="h6" fontWeight={600} sx={{ color: '#2f3a53', letterSpacing: '-1px', }}>
              {trendAnalysisData.metricName}  Trend Analysis
            </Typography>
            <Divider />
            {trendAnalysisData?.accountingPeriods?.length > 0 && trendAnalysisData?.endingBalances?.length > 0 ? (
              <LineChart sx={{paddingBottom: 2}}
                xAxis={[
                  {
                    id: 'accountingPeriod',
                    data: trendAnalysisData.accountingPeriods, // Must be sorted if desired
                    scaleType: 'point'
                  }
                ]}
                yAxis={[
                  {
                    label: 'Ending Balance ($)',
                  }
                ]}
                series={[
                  {
                    data: trendAnalysisData.endingBalances,
                    label: 'Balance Trend',
                    showMark: true,
                    color: '#1976d2',
                    xAxisKey: 'accountingPeriod' // optional but useful when multiple axes
                  }
                ]}
              />

            ) : (
              <Box
                sx={{
                  height: 300,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px dashed #ccc',
                  borderRadius: 1
                }}
              >
                <Typography color="text.secondary">
                  {!trendAnalysisData ? 'Loading data...' : 'No data available'}
                </Typography>
              </Box>
            )}
          </Item>
        </Grid>
        <Grid size={4}>
          <Item>
            <Typography variant="h6" fontWeight={600} sx={{ color: '#2f3a53', letterSpacing: '-1px', }}>
              Top Five Metrics
            </Typography>
            <Divider />
            <DynamicTable
              columns={columns}
              rows={rankedMetrics}
              rowKey="rank" // Unique identifier property
            />
          </Item>
        </Grid>
        <Grid size={12}>
          <Item>
            <Typography variant="h6" fontWeight={600} sx={{ color: '#2f3a53', letterSpacing: '-1px', }}>
              Month Over Month Activity
            </Typography>
            <Divider />
            <BarChartWidget
              dataset={momData}
              xAxis={[{ dataKey: 'accountingPeriodId' }]}
              series={momMetricSeries}
              chartSetting={defaultChartSetting}
            />
          </Item>
        </Grid>
      </Grid>
    </Container>

  )
}
