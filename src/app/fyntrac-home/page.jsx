"use client"
import React from 'react'
import {
  Box,
  Grid2 as Grid,
  Card,
  Typography,
  Divider,
  Button,
  Menu,
  TextField,
  Autocomplete,
  Avatar,
  IconButton,
  Container,
  useTheme,
  alpha
} from '@mui/material';
import { LineChart } from '@mui/x-charts/LineChart';
import axios from 'axios';
import { useTenant } from "../tenant-context";

// Icons
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import MoreVertIcon from '@mui/icons-material/MoreVert';

// Components
import MetricWidget from '../component/metric-widget';
import BarChartWidget from '../component/bar-chart-widget';
import DynamicTable from '../component/dynamic-data-table';

// --- API CONFIGURATION ---
const serviceGetOpenAccountingPeriodsURL = process.env.NEXT_PUBLIC_SUBLEDGER_SERVICE_URI + '/accounting-period/get/open-periods'
const serviceGetCurrentOpenAccountingPeriodURL = process.env.NEXT_PUBLIC_SUBLEDGER_SERVICE_URI + '/accounting-period/get/current-open-period'
const serviceCloseAccountingPeriodURL = process.env.NEXT_PUBLIC_SUBLEDGER_SERVICE_URI + '/accounting-period/close'
const serviceGetWidgetDataURL = process.env.NEXT_PUBLIC_REPORTING_SERVICE_URI + '/dashboard/get/widget-data'
const serviceGetTrendAnalysisURL = process.env.NEXT_PUBLIC_REPORTING_SERVICE_URI + '/dashboard/get/trend-analysis-data'
const serviceGetRankedMetricURL = process.env.NEXT_PUBLIC_REPORTING_SERVICE_URI + '/dashboard/get/ranked-metrics'
const serviceGetMomActivityDataURL = process.env.NEXT_PUBLIC_REPORTING_SERVICE_URI + '/dashboard/get/mom-activity-data'

// --- REUSABLE COMPONENTS ---

// UPDATED: A unified card component with better contrast via soft shadows
const DashboardCard = ({ children, title, action, sx, minHeight }) => {
  const theme = useTheme();


  return (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        minHeight: minHeight || 'auto',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 3,
        // CHANGED: Replaced flat border with a subtle double-shadow for depth and definition
        // Layer 1: Soft diffuse shadow. Layer 2: sharp subtle outline shadow.
        boxShadow: `0px 2px 4px ${alpha(theme.palette.grey[300], 0.4)}, 0px 0px 2px ${alpha(theme.palette.grey[400], 0.2)}`,
        bgcolor: 'background.paper',
        // Enhanced hover effect for better interactivity contrast
        transition: 'box-shadow 0.3s, transform 0.2s ease-in-out',
        '&:hover': {
          boxShadow: `0px 12px 24px ${alpha(theme.palette.grey[400], 0.3)}`,
          transform: 'translateY(-2px)' // Subtle lift
        },
        ...sx
      }}
    >
      {(title || action) && (
        <>
          <Box sx={{ p: 2.5, pb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {title && (
              <Typography variant="h6" sx={{ fontSize: '1.05rem', fontWeight: 700, color: 'text.primary' }}>
                {title}
              </Typography>
            )}
            {action}
          </Box>
          <Divider sx={{ opacity: 0.6 }} />
        </>
      )}
      <Box sx={{ p: 2.5, flexGrow: 1, position: 'relative' }}>
        {children}
      </Box>
    </Card>
  );
};

// --- DATA STRUCTURES ---
const AccountingPeriodRecord = { periodId: 0, period: "", fiscalPeriod: 0, year: 0, status: 0 };

const numberFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const compactFormatter = (value) =>
  new Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 2,
  }).format(value);

const columns = [
  { id: 'rank', label: 'Rank', align: 'center', width: 60 },
  { id: 'metricName', label: 'Metric', align: 'left' },
  {
    id: 'balance',
    label: 'Balance',
    align: 'right',

    // ✅ THIS is what makes formatting work
    format: (value) =>
      new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(Number(value) || 0),
  },
];

// Locate this section in your code (around line 118)
const defaultChartSetting = {
  yAxis: [
    {
      label: 'Activity',
      labelPadding: 30,
      width: 60,
      // FIX: Move font settings into tickLabelStyle
      tickLabelStyle: {
        fontSize: 12,
        fontWeight: 500, // This will now work
      },
      // Optional: If you wanted to style the word "Activity" instead
      labelStyle: {
        fontSize: 14,
        fontWeight: 600,
      },
      valueFormatter: compactFormatter,
    },
  ],
  height: 300,
  margin: { top: 30, bottom: 30, left: 90, right: 70 },
};

export default function HomePage() {
  const { tenant } = useTenant();
  const theme = useTheme();

  // --- STATE ---
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [openPeriodCloseDialog, setOpenPeriodCloseDialog] = React.useState(false);
  const [isDataFetched, setIsDataFetched] = React.useState(false);
  const [year, setYear] = React.useState('');
  var [years, setYears] = React.useState([]);
  const [month, setMonth] = React.useState('');
  var [months, setMonths] = React.useState([]);
  const [rankedMetrics, setRankedMetrics] = React.useState([]);
  const [momData, setMomData] = React.useState([]);
  const [momMetricSeries, setMomMetricSeries] = React.useState([]);
  const [accountingPeriods, setAccountingPeriods] = React.useState([{ ...AccountingPeriodRecord, "period": "_ _ / _ _" }]);
  const [widgetDataList, setWidgetDataList] = React.useState([]);
  const [trendAnalysisData, setTrendAnalysisData] = React.useState([]);
  const [currentOpenAccountingPeriod, setCurrentOpenAccountingPeriod] = React.useState({ ...AccountingPeriodRecord, "period": "__ / __" });


  // --- HANDLERS ---
  const handleClickOpen = (event) => {
    setAnchorEl(event.currentTarget);
    setOpenPeriodCloseDialog(true);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setOpenPeriodCloseDialog(false);
  };

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
      if (ap > 0 && ap < 10) { monthList.push("0" + ap.toString()); } else { monthList.push(ap.toString()); }
    });
    setMonths(monthList);
    setMonth(monthList[0]);
  }

  // --- API CALLS ---
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        fetchOpenAccountingPeriods();
        fetchCurrentOpenAccountingPeriod();
        fetchWidgetData();
        fetchTrendAnalysisData();
        fetchRankedMetricData();
        fetchMoMActivityData();
        setIsDataFetched(true);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, [tenant]);

  const handlecloseAccountingPeriod = async () => {
    try {
      await axios.post(serviceCloseAccountingPeriodURL, {
        ...AccountingPeriodRecord,
        "periodId": parseInt(year + month),
        "period": year + '-' + month,
        "fiscalPeriod": parseInt(month),
        "year": parseInt(year),
        "status": 1
      }, { headers: { 'X-Tenant': tenant, Accept: '*/*' } });

      fetchOpenAccountingPeriods();
      handleClose();
    } catch (error) { console.error(error); }
  };

  const fetchOpenAccountingPeriods = () => {
    axios.get(serviceGetOpenAccountingPeriodsURL, { headers: { 'X-Tenant': tenant, Accept: '*/*' } })
      .then(response => { setAccountingPeriods(response.data); fillYearList(response.data); fillMonthList(response.data); })
      .catch(error => { });
  };

  const fetchWidgetData = () => {
    axios.get(serviceGetWidgetDataURL, { headers: { 'X-Tenant': tenant, Accept: '*/*' } })
      .then(response => { setWidgetDataList(response.data); })
      .catch(error => { });
  };

  const fetchTrendAnalysisData = () => {
    axios.get(serviceGetTrendAnalysisURL, { headers: { 'X-Tenant': tenant, Accept: '*/*' } })
      .then(response => { setTrendAnalysisData(response.data); })
      .catch(error => { });
  };

  const fetchRankedMetricData = () => {
    axios.get(serviceGetRankedMetricURL, { headers: { 'X-Tenant': tenant, Accept: '*/*' } })
      .then(response => { setRankedMetrics(response.data); })
      .catch(error => { });
  };

  const fetchMoMActivityData = () => {
    axios.get(serviceGetMomActivityDataURL, { headers: { 'X-Tenant': tenant, Accept: '*/*' } })
      .then(response => { setMomData(response.data.momData); setMomMetricSeries(response.data.monthOverMonthSeries); })
      .catch(error => { });
  };

  const fetchCurrentOpenAccountingPeriod = () => {
    axios.get(serviceGetCurrentOpenAccountingPeriodURL, { headers: { 'X-Tenant': tenant, Accept: '*/*' } })
      .then(response => { setCurrentOpenAccountingPeriod(response.data); })
      .catch(error => { });
  };



  const currencyFormatter = (value) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
    }).format(value);

  // --- RENDER ---
  // Added a slight background color to the container so white cards pop out
  return (
    <Box sx={{ bgcolor: alpha(theme.palette.grey[50], 0.5), minHeight: '100vh' }}>
      <Container maxWidth="xl" sx={{ py: 4 }}>

        {/* 2. Key Metrics Row */}
        <Grid container spacing={2.5} sx={{ mb: 4 }}>

          {/* A. Accounting Period Widget */}
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            {/* CHANGED: Increased tint opacity slightly for better contrast (0.04 -> 0.08) */}
            <DashboardCard sx={{ bgcolor: alpha(theme.palette.primary.main, 0.08) }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                  <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main', color: 'white', boxShadow: 2 }}>
                    <CalendarTodayIcon fontSize="small" />
                  </Avatar>
                  <Typography variant="subtitle1" fontWeight={700} color="primary.dark">
                    Accounting Period
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                  <Typography variant="h4" fontWeight={800} color="primary.main" sx={{ letterSpacing: '-1px' }}>
                    {currentOpenAccountingPeriod.period}
                  </Typography>
                  <IconButton size="small" onClick={handleClickOpen} sx={{ bgcolor: 'white', boxShadow: 1, '&:hover': { bgcolor: 'grey.100' } }}>
                    <ArrowDropDownIcon color="primary" />
                  </IconButton>
                </Box>
              </Box>

              <Menu
                open={openPeriodCloseDialog}
                anchorEl={anchorEl}
                onClose={handleClose}
                sx={{ mt: 1 }}
                slotProps={{ paper: { sx: { borderRadius: 3, boxShadow: 3 } } }}
              >
                <Box sx={{ p: 2, display: 'flex', gap: 1 }}>
                  <Autocomplete
                    options={years}
                    value={year}
                    onChange={(e, v) => setYear(v)}
                    disableClearable
                    sx={{ width: 100 }}
                    renderInput={(params) => <TextField {...params} label="Year" size="small" />}
                  />
                  <Autocomplete
                    options={months}
                    value={month}
                    onChange={(e, v) => setMonth(v)}
                    disableClearable
                    sx={{ width: 100 }}
                    renderInput={(params) => <TextField {...params} label="Month" size="small" />}
                  />
                  <Button variant="contained" onClick={handlecloseAccountingPeriod} size="medium" sx={{ borderRadius: 2, fontWeight: 700, boxShadow: 2 }}>
                    Close
                  </Button>
                </Box>
              </Menu>
            </DashboardCard>
          </Grid>

          {/* B. Four Metric Widgets */}
          {widgetDataList.slice(0, 4).map((metric, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 2.4 }} key={index}>
              <DashboardCard sx={{ p: 0 }}>
                <Box sx={{ height: '100%', p: 0 }}>
                  <MetricWidget metric={metric} />
                </Box>
              </DashboardCard>
            </Grid>
          ))}
        </Grid>

        {/* 3. Charts & Tables Row */}
        <Grid container spacing={2.5} sx={{ mb: 4 }}>

          {/* Trend Analysis */}
          <Grid size={{ xs: 12, md: 8 }}>
            <DashboardCard title={`${trendAnalysisData.metricName || 'Metric'} Trend Analysis`} minHeight={440}>
              {trendAnalysisData?.accountingPeriods?.length > 0 && trendAnalysisData?.endingBalances?.length > 0 ? (
                <Box sx={{ width: '100%', height: 340, mt: 5 }}>
                  <LineChart
                    xAxis={[
                      {
                        data: trendAnalysisData.accountingPeriods,
                        scaleType: 'point',
                        label: 'Accounting Period',
                        labelPadding: 30,
                        tickLabelStyle: {
                          fontSize: 12,
                          fontWeight: 500,
                         // angle: -30,
                         //  textAnchor: 'end',
                        },
                        labelStyle: {
                          fontSize: 13,
                          fontWeight: 600,
                        },
                      },
                    ]}
                    yAxis={[
                      {
                        label: 'Ending Balance ($)',
                        labelPadding: 30,
                        tickLabelStyle: {
                          fontSize: 12,
                          fontWeight: 500,
                          scaleType: 'linear',
                        },
                        valueFormatter: compactFormatter, // ✅ KEY FIX
                        labelStyle: {
                          fontSize: 13,
                          fontWeight: 600,

                        },


                      },
                    ]}
                    series={[
                      {
                        data: trendAnalysisData.endingBalances,
                        label: 'Balance Trend',
                        showMark: false,
                        color: theme.palette.primary.main,
                        area: true,
                        valueFormatter: currencyFormatter, // ✅ Tooltip full value
                        areaStyle: {
                          fill: `url(#trendGradient)`,
                          opacity: 0.3,
                        },
                      },
                    ]}
                    margin={{
                      left: 20,
                      right: 30,
                      top: 30,
                      bottom: 30,
                    }}
                    sx={{
                      '& .MuiAreaElement-root': {
                        fill: 'url(#trendGradient)',
                      },
                    }}
                  >
                    <defs>
                      <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                  </LineChart>
                </Box>
              ) : (
                <Box sx={{ height: 340, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: alpha(theme.palette.grey[200], 0.3), borderRadius: 2 }}>
                  <Typography color="text.secondary" fontWeight={500}>
                    {isDataFetched ? 'No trend data available' : 'Loading data...'}
                  </Typography>
                </Box>
              )}
            </DashboardCard>
          </Grid>

          {/* Top 5 Metrics */}
          <Grid size={{ xs: 12, md: 4 }}>
            <DashboardCard title="Top 5 Metrics" minHeight={440} action={<IconButton size="small" sx={{ color: 'text.secondary' }}></IconButton>}>
              <Box sx={{ height: 340, overflow: 'auto', mt: 1 }}>
                <DynamicTable
                  columns={columns}
                  rows={rankedMetrics}
                  rowKey="rank"
                />
              </Box>
            </DashboardCard>
          </Grid>
        </Grid>

        {/* 4. Bottom Row: Month over Month */}
        <Grid container spacing={2.5}>
          <Grid size={12}>
            <DashboardCard title="Month Over Month Activity" minHeight={450}>
              {momData.length > 0 ? (
                <Box sx={{ width: '100%', height: 380, mt: 2 }}>
                  <BarChartWidget
                    dataset={momData}
                    xAxis={[{
                      label: 'Accounting Period',
                      dataKey: 'accountingPeriodId',
                      scaleType: 'band',
                      tickLabelStyle: {
                        fontSize: 12,
                        fontWeight: 500, // This will now work
                      },
                      // Optional: If you wanted to style the word "Activity" instead
                      labelStyle: {
                        fontSize: 14,
                        fontWeight: 600,
                      },
                     

                    }]}
                    series={momMetricSeries}
                    chartSetting={{
                      ...defaultChartSetting,
                      height: 380,
                      // ✅ FIX: Override the margin here. Increase bottom to ~70px.
                      margin: { top: 30, right: 70, left: 80, bottom: 30 }
                    }}
                  />
                </Box>
              ) : (
                <Box sx={{ height: 380, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: alpha(theme.palette.grey[200], 0.3), borderRadius: 2 }}>
                  <Typography color="text.secondary" fontWeight={500}>
                    {isDataFetched ? 'No activity data available' : 'Loading...'}
                  </Typography>
                </Box>
              )}
            </DashboardCard>
          </Grid>
        </Grid>

      </Container>
    </Box>
  )
}