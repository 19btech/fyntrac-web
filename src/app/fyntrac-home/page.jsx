"use client"
import React from 'react'
import {
  Box,
  Grid,
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
  alpha,
  Snackbar,
  Alert,
  Slide,
} from '@mui/material';
import { LineChart } from '@mui/x-charts/LineChart';
import { BarChart } from '@mui/x-charts/BarChart';
import { DataGrid } from '@mui/x-data-grid';
import { dataloaderApi, reportingApi } from '../services/api-client';
import { useTenant } from "../tenant-context";

// Icons
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import MoreVertIcon from '@mui/icons-material/MoreVert';

// Components
import MetricWidget from '../component/metric-widget';

// Stable transition component – must be defined outside render to avoid remounting Snackbar on every re-render
const SlideLeft = React.forwardRef((props, ref) => <Slide {...props} ref={ref} direction="left" />);
SlideLeft.displayName = 'SlideLeft';

// --- API CONFIGURATION ---
const serviceGetOpenAccountingPeriodsURL = '/accounting-period/get/open-periods'
const serviceGetCurrentOpenAccountingPeriodURL = '/accounting-period/get/current-open-period'
const serviceCloseAccountingPeriodURL = '/accounting-period/close'
const serviceGetWidgetDataURL = '/dashboard/get/widget-data'
const serviceGetTrendAnalysisURL = '/dashboard/get/trend-analysis-data'
const serviceGetRankedMetricURL = '/dashboard/get/ranked-metrics'
const serviceGetMomActivityDataURL = '/dashboard/get/mom-activity-data'

// --- REUSABLE COMPONENTS ---

// UPDATED: A unified card component with better contrast via soft shadows
const DashboardCard = ({ children, title, action, sx, minHeight, noPadding, accentHeader }) => {
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
          <Box sx={{ p: 2.5, pb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: accentHeader ? alpha(theme.palette.primary.main, 0.08) : 'transparent', borderRadius: '12px 12px 0 0' }}>
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
      <Box sx={{ p: noPadding ? 0 : 2.5, flexGrow: 1, position: 'relative' }}>
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

const formatMetricName = (name) =>
  (name || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

// Locate this section in your code (around line 118)

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
  const [toast, setToast] = React.useState({ open: false, message: '', severity: 'success' });
  const [currencyCode, setCurrencyCode] = React.useState('USD');
  const showToast = (message, severity = 'success') => setToast({ open: true, message, severity });
  const handleToastClose = (_, reason) => { if (reason === 'clickaway') return; setToast(p => ({ ...p, open: false })); };


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
    return yearList[0];
  }

  const fillMonthList = (apList, selectedYear) => {
    var filtered = selectedYear
      ? apList.filter(r => r.year.toString() === selectedYear.toString())
      : apList;
    var monthList = [];
    var uniquePeriodIds = [...new Set(filtered.map((record) => record.fiscalPeriod))];
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
        // Fetch current period first so we can pass its periodId to widget data
        const periodRes = await dataloaderApi.get(serviceGetCurrentOpenAccountingPeriodURL);
        const currentPeriod = periodRes.data;
        setCurrentOpenAccountingPeriod(currentPeriod);

        fetchOpenAccountingPeriods();
        fetchWidgetData(currentPeriod.periodId);
        fetchTrendAnalysisData();
        fetchRankedMetricData();
        fetchMoMActivityData();
        fetchCurrencySettings();
        setIsDataFetched(true);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, [tenant]);

  const handlecloseAccountingPeriod = async () => {
    try {
      // If restatement mode is currently ON, disable it FIRST before closing the period.
      try {
        const settingsRes = await dataloaderApi.get('/setting/get/settings');
        if (settingsRes?.data?.restatementMode === 1) {
          await dataloaderApi.post('/setting/restatement-mode/save', {
            homeCurrency: '',
            glamFields: '',
            fiscalPeriodStartDate: settingsRes.data.fiscalPeriodStartDate,
            reportingPeriod: null,
            restatementMode: 0,
            id: settingsRes.data.id ?? null,
          }, { headers: { 'X-Tenant': tenant, Accept: '*/*', 'Content-Type': 'application/json' } });
        }
      } catch (e) {
        console.warn('Failed to disable restatement mode before period close:', e);
      }

      await dataloaderApi.post(serviceCloseAccountingPeriodURL, {
        ...AccountingPeriodRecord,
        "periodId": parseInt(year + month),
        "period": year + '-' + month,
        "fiscalPeriod": parseInt(month),
        "year": parseInt(year),
        "status": 1
      });

      fetchOpenAccountingPeriods();
      fetchCurrentOpenAccountingPeriod();
      handleClose();
      showToast('Accounting period closed successfully.');
    } catch (error) {
      console.error(error);
      showToast('Failed to close accounting period.', 'error');
    }
  };

  const fetchOpenAccountingPeriods = () => {
    dataloaderApi.get(serviceGetOpenAccountingPeriodsURL)
      .then(response => {
        setAccountingPeriods(response.data);
        const firstYear = fillYearList(response.data);
        fillMonthList(response.data, firstYear);
      })
      .catch(error => { });
  };

  const fetchWidgetData = (periodId) => {
    const config = periodId ? { params: { accountingPeriodId: periodId } } : {};
    reportingApi.get(serviceGetWidgetDataURL, config)
      .then(response => { setWidgetDataList(response.data); })
      .catch(error => { });
  };

  const fetchTrendAnalysisData = () => {
    reportingApi.get(serviceGetTrendAnalysisURL)
      .then(response => {
        const periods = response.data.accountingPeriods ?? [];
        const balances = response.data.endingBalances ?? [];
        const last6 = Math.max(0, periods.length - 6);
        setTrendAnalysisData({
          ...response.data,
          accountingPeriods: periods.slice(last6),
          endingBalances: balances.slice(last6),
        });
      })
      .catch(error => { });
  };

  const fetchRankedMetricData = () => {
    reportingApi.get(serviceGetRankedMetricURL)
      .then(response => { setRankedMetrics(response.data); })
      .catch(error => { });
  };

  const fetchMoMActivityData = () => {
    reportingApi.get(serviceGetMomActivityDataURL)
      .then(response => {
        const sorted = [...(response.data.momData || [])]
          .sort((a, b) => String(a.accountingPeriodId).localeCompare(String(b.accountingPeriodId)))
          .slice(-6);
        setMomData(sorted);
        setMomMetricSeries((response.data.monthOverMonthSeries || []).map((s, i) => {
          const label = formatMetricName(s.label);
          return { ...s, label, ...(i === 1 ? { color: '#fca311' } : {}) };
        }));
      })
      .catch(error => { });
  };

  const fetchCurrentOpenAccountingPeriod = () => {
    dataloaderApi.get(serviceGetCurrentOpenAccountingPeriodURL)
      .then(response => { setCurrentOpenAccountingPeriod(response.data); })
      .catch(error => { });
  };

  const fetchCurrencySettings = () => {
    dataloaderApi.get('/setting/get/settings')
      .then(response => { if (response.data?.currency) setCurrencyCode(response.data.currency); })
      .catch(() => {});
  };



  const currencySymbol = (() => {
    try {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode })
        .formatToParts(1).find(p => p.type === 'currency')?.value || currencyCode;
    } catch { return currencyCode; }
  })();

  const currencyFormatter = (value) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
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

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography fontWeight={700} color="primary.main" sx={{ fontSize: '30px', letterSpacing: '-0.5px', flex: 1, textAlign: 'center' }}>
                    {currentOpenAccountingPeriod.period}
                  </Typography>
                  <IconButton size="small" onClick={handleClickOpen} sx={{ bgcolor: 'white', boxShadow: 1, transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', '&:hover': { bgcolor: 'grey.100', boxShadow: 3, transform: 'scale(1.08)' }, '&:active': { transform: 'scale(0.94)' } }}>
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
                    onChange={(e, v) => { setYear(v); fillMonthList(accountingPeriods, v); }}
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
              <DashboardCard noPadding>
                <MetricWidget metric={metric} currencyCode={currencyCode} />
              </DashboardCard>
            </Grid>
          ))}
        </Grid>

        {/* 3. Charts & Tables Row */}
        <Grid container spacing={2.5} sx={{ mb: 4 }}>

          {/* Trend Analysis */}
          <Grid size={{ xs: 12, md: 8 }}>
            <DashboardCard accentHeader title={`${formatMetricName(trendAnalysisData.metricName || 'Metric')} Trend Analysis`} minHeight={440}>
              {trendAnalysisData?.accountingPeriods?.length > 0 && trendAnalysisData?.endingBalances?.length > 0 ? (
                <Box sx={{ width: '100%', height: 340, mt: 1 }}>
                  <LineChart
                    xAxis={[{
                      data: trendAnalysisData.accountingPeriods,
                      scaleType: 'point',
                      label: 'Accounting Period',
                      tickLabelStyle: { fontSize: 11, fill: '#475569', fontWeight: 700 },
                      labelStyle: { fontSize: 12, fill: '#334155', fontWeight: 700 },
                    }]}
                    yAxis={[{
                      label: 'Ending Balance',
                      tickLabelStyle: { fontSize: 11, fill: '#475569', fontWeight: 700 },
                      labelStyle: { fontSize: 12, fill: '#334155', fontWeight: 700 },
                      valueFormatter: compactFormatter,
                    }]}
                    series={[{
                      data: trendAnalysisData.endingBalances,
                      label: formatMetricName(trendAnalysisData.metricName || 'Ending Balance'),
                      area: true,
                      showMark: true,
                      curve: 'catmullRom',
                      color: '#fca311',
                      valueFormatter: currencyFormatter,
                    }]}
                    height={320}
                    margin={{ top: 20, right: 30, bottom: 70, left: 90 }}
                    grid={{ horizontal: true }}
                    sx={{
                      '& .MuiAreaElement-root': {
                        fill: `url(#trendAreaGradient)`,
                      },
                      '& .MuiLineElement-root': {
                        strokeWidth: 2.5,
                        filter: `drop-shadow(0 2px 6px ${alpha(theme.palette.primary.main, 0.35)})`,
                      },
                      '& .MuiMarkElement-root': {
                        strokeWidth: 2,
                        fill: '#fff',
                        r: 3,
                      },
                      '& .MuiChartsGrid-line': {
                        stroke: alpha(theme.palette.grey[300], 0.7),
                        strokeDasharray: '4 4',
                      },
                    }}
                  >
                    <defs>
                      <linearGradient id="trendAreaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={theme.palette.primary.main} stopOpacity={0.22} />
                        <stop offset="100%" stopColor={theme.palette.primary.main} stopOpacity={0.02} />
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
            <DashboardCard accentHeader title="Top Metrics" minHeight={440}>
              <DataGrid
                rows={rankedMetrics.slice(0, 5).map(r => ({ ...r, id: r.rank }))}
                columns={[
                  {
                    field: 'rank',
                    headerName: '#',
                    width: 52,
                    align: 'center',
                    headerAlign: 'center',
                    sortable: true,
                    renderCell: ({ value }) => {
                      const tints = {
                        1: { bg: alpha('#f59e0b', 0.15), color: '#b45309' },
                        2: { bg: alpha('#94a3b8', 0.15), color: '#475569' },
                        3: { bg: alpha('#b45309', 0.12), color: '#92400e' },
                      };
                      const t = tints[value] || { bg: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.dark };
                      return (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                          <Box sx={{ width: 26, height: 26, borderRadius: '50%', bgcolor: t.bg, color: t.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700 }}>
                            {value}
                          </Box>
                        </Box>
                      );
                    },
                  },
                  {
                    field: 'metricName',
                    headerName: 'Metric',
                    flex: 1,
                    sortable: true,
                    renderCell: ({ value }) => (
                      <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', width: '100%' }}>
                        <Typography variant="body2" sx={{ fontWeight: 500, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{formatMetricName(value)}</Typography>
                      </Box>
                    ),
                  },
                  {
                    field: 'balance',
                    headerName: 'Balance',
                    width: 130,
                    align: 'right',
                    headerAlign: 'right',
                    sortable: true,
                    renderCell: ({ value }) => (
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', height: '100%', width: '100%' }}>
                        <Typography variant="body2" sx={{ fontWeight: 500, color: '#374151', fontFamily: 'Inter, sans-serif' }}>
                          {new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Number(value) || 0)}
                        </Typography>
                      </Box>
                    ),
                  },
                ]}
                hideFooter
                disableColumnMenu
                disableRowSelectionOnClick
                density="comfortable"
                sx={{
                  border: 'none',
                  '& .MuiDataGrid-columnHeaders': {
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                    borderRadius: 2,
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'text.secondary',
                    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                  },
                  '& .MuiDataGrid-row': {
                    borderRadius: 1,
                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) },
                    transition: 'background 0.15s',
                  },
                  '& .MuiDataGrid-cell': {
                    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.35)}`,
                  },
                  '& .MuiDataGrid-row:last-child .MuiDataGrid-cell': { borderBottom: 'none' },
                }}
              />
            </DashboardCard>
          </Grid>
        </Grid>

        {/* 4. Bottom Row: Month over Month */}
        <Grid container spacing={2.5}>
          <Grid size={12}>
            <DashboardCard accentHeader title="Month Over Month Activity" minHeight={450}>
              {momData.length > 0 ? (
                <Box sx={{ width: '100%', height: 380, mt: 2 }}>
                  <BarChart
                    dataset={momData}
                    xAxis={[{
                      dataKey: 'accountingPeriodId',
                      scaleType: 'band',
                      label: 'Accounting Period',
                      tickLabelStyle: { fontSize: 11, fill: '#475569', fontWeight: 700 },
                      labelStyle: { fontSize: 12, fill: '#334155', fontWeight: 700 },
                    }]}
                    yAxis={[{
                      label: 'Activity',
                      tickLabelStyle: { fontSize: 11, fill: '#475569', fontWeight: 700 },
                      labelStyle: { fontSize: 12, fill: '#334155', fontWeight: 700 },
                      valueFormatter: compactFormatter,
                    }]}
                    series={momMetricSeries.map(s => ({ ...s, valueFormatter: currencyFormatter }))}
                    colors={[
                      '#A5B4FC', // indigo-300
                      '#67E8F9', // cyan-300
                      '#86EFAC', // green-300
                      '#FCA5A5', // red-300
                      '#FCD34D', // amber-300
                      '#C4B5FD', // violet-300
                      '#6EE7B7', // emerald-300
                      '#FDA4AF', // rose-300
                      '#93C5FD', // blue-300
                      '#7DD3FC', // sky-300
                    ]}
                    borderRadius={7}
                    height={350}
                    margin={{ top: 20, right: 30, bottom: 70, left: 90 }}
                    grid={{ horizontal: true }}
                    sx={{
                      '& .MuiChartsGrid-line': {
                        stroke: alpha(theme.palette.grey[300], 0.7),
                        strokeDasharray: '4 4',
                      },
                      '& .MuiBarElement-root': {
                        transition: 'filter 0.15s ease',
                        '&:hover': { filter: 'brightness(1.12)' },
                      },
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
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={handleToastClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        sx={{ top: '55px', '@media (min-width:600px)': { top: '55px' } }}
        slots={{ transition: SlideLeft }}
      >
        <Alert
          onClose={handleToastClose}
          severity={toast.severity}
          variant="standard"
          sx={{
            borderRadius: 3, fontWeight: 600, fontSize: '0.85rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)', minWidth: 280,
            bgcolor: toast.severity === 'success' ? 'rgba(22,163,74,0.12)' : 'rgba(220,38,38,0.10)',
            border: toast.severity === 'success' ? '1px solid rgba(22,163,74,0.3)' : '1px solid rgba(220,38,38,0.3)',
            color: toast.severity === 'success' ? '#15803d' : '#dc2626',
            '& .MuiAlert-icon': { color: toast.severity === 'success' ? '#16a34a' : '#dc2626' },
          }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}