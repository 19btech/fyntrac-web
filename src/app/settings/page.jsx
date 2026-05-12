"use client"
import React, { useState } from 'react';
import {
  Box, Typography, Autocomplete, TextField,
  Dialog, DialogContent, DialogActions,
  Button, IconButton, Switch, Tooltip,
  Card, Snackbar, Alert, Slide, Link,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import CustomTabPanel from '../component/custom-tab-panel';
import AddDashboardConfiguration from '../component/add-update-dashboard-config';
import { dataloaderApi } from '../services/api-client';
import dayjs from 'dayjs';
import '../common.css';
import { useTenant } from "../tenant-context";

// ── Typography action link ────────────────────────────────────────────────────
const ACTION_BLUE = '#1a6ab9';

const ActionLink = ({ onClick, disabled = false, children }) => (
  <Typography
    component="span"
    onClick={disabled ? undefined : onClick}
    sx={{
      fontSize: '0.82rem', fontWeight: 700,
      fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
      color: disabled ? 'text.disabled' : ACTION_BLUE,
      cursor: disabled ? 'default' : 'pointer',
      userSelect: 'none',
      display: 'inline-block',
      transition: 'all 0.18s ease-in-out',
      '&:hover': disabled ? {} : {
        color: '#14213d',
        transform: 'translateY(-2px)',
        letterSpacing: 0.3,
      },
      '&:active': { transform: 'translateY(0px)' },
    }}
  >
    {children}
  </Typography>
);

// ── Shared textfield style ────────────────────────────────────────────────────
const tfSx = {
  '& .MuiOutlinedInput-root': { borderRadius: 2, fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif', fontSize: '0.88rem' },
  '& .MuiInputLabel-root': { fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif', fontSize: '0.88rem' },
};

// ── Setting row card ──────────────────────────────────────────────────────────
const SettingRow = ({ title, description, children }) => (
  <Card elevation={0} sx={{
    mb: 1.5, borderRadius: 3,
    border: '1px solid', borderColor: 'divider',
    borderLeft: '4px solid #bfdbfe',
    transition: 'all 0.2s ease-in-out',
    '&:hover': { boxShadow: '0 4px 16px rgba(15,23,42,0.09)', transform: 'translateY(-1px)', borderLeftColor: '#93c5fd' },
  }}>
    <Box sx={{
      px: 3, py: 2,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2,
    }}>
      <Box sx={{ flex: 1, textAlign: 'left' }}>
        <Typography sx={{ fontSize: '0.88rem', fontWeight: 600, color: 'text.primary', fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif', textAlign: 'left' }}>
          {title}
        </Typography>
        <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif', mt: 0.3, textAlign: 'left' }}>
          {description}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
        {children}
      </Box>
    </Box>
  </Card>
);

// ── Section label ────────────────────────────────────────────────────────────
const SectionLabel = ({ label, first }) => (
  <Typography variant="caption" sx={{
    fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8,
    color: 'text.secondary', fontSize: '0.67rem', fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
    mt: first ? 0 : 2.5, mb: 1, display: 'block',
  }}>
    {label}
  </Typography>
);

export default function SettingsPage() {
  const { tenant } = useTenant();
  const theme = useTheme();

  // ── State ─────────────────────────────────────────────────────────────────
  const [settings, setSettings] = React.useState({});
  const [isDataFetched, setIsDataFetched] = React.useState(false);
  const [panelIndex, setPanelIndex] = React.useState(0);

  // Fiscal period
  const [fiscalPeriodStaringDate, setFiscalPeriodStaringDate] = React.useState(null);
  const [isFiscalPeriodButtonDisabled, setIsFiscalPeriodButtonDisabled] = React.useState(true);

  // Currency
  const [currency, setCurrency] = useState('USD');
  const [currencyList, setCurrencyList] = useState([]);

  // Reporting period
  const [reportingPeriod, setReportingPeriod] = useState('6');
  const reportingPeriodList = ['6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24'];

  // Reopen period
  const [reopenPeriod, setReopenPeriod] = useState('Nov-2022');
  const reopenPriodList = ['Nov-2022', 'Oct-2022', 'Sep-2022', 'Aug-2022'];

  // Delete entries
  const [deleteEntriesDate, setDeleteEntriesDate] = useState(null);

  // Restatement
  const [restatementMode, setRestatementMode] = React.useState(false);
  const [showRestatementDaialog, setShowRestatementDaialog] = React.useState(false);

  // Dialogs
  const [showSchemaRefreshDialog, setShowSchemaRefreshDialog] = React.useState(false);
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = React.useState(false);
  const [isDashboardConfigurationDialogOpen, setIsDashboardConfigurationDialogOpen] = React.useState(false);

  // Toast
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
  const showToast = (message, severity = 'success') => setToast({ open: true, message, severity });
  const handleToastClose = (_, reason) => {
    if (reason === 'clickaway') return;
    setToast(prev => ({ ...prev, open: false }));
  };

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleFiscalPeriodChange = (date) => {
    setFiscalPeriodStaringDate(date);
    setIsFiscalPeriodButtonDisabled(date == null);
  };
  const handleConfigurationTabChange = (_, newValue) => setPanelIndex(newValue);
  const handleAddDashboardConfigurationDialogOpen = () => setIsDashboardConfigurationDialogOpen(true);
  const handleAddDashboardConfigurationDialogClose = (val) => setIsDashboardConfigurationDialogOpen(val);
  const handleRestatementMode = (event) => {
    setRestatementMode(event.target.checked);
    if (event.target.checked) setShowRestatementDaialog(true);
  };

  // ── API calls ─────────────────────────────────────────────────────────────
  const fetchCurrencies = () => {
    dataloaderApi.get('/setting/get/currencies')
      .then(response => {
        console.log("Currency List: ", response.data);
        setCurrencyList(response.data)
      })
      .catch(() => { });
  };

  const fetchSettings = () => {
    dataloaderApi.get('/setting/get/settings')
      .then(response => {
        setSettings(response.data);
        setFiscalPeriodStaringDate(dayjs(new Date(response.data.fiscalPeriodStartDate)));
        setRestatementMode(response.data.restatementMode === 1);
        setCurrency(response.data.currency);
      })
      .catch(() => { });
  };

  React.useEffect(() => {
    fetchSettings();
    setIsDataFetched(true);
    fetchCurrencies();
  }, [isDataFetched]);

  const saveCurrency = async () => {
    try {
      await dataloaderApi.post('/setting/save/currency', currency, {
        headers: { 'X-Tenant': tenant, Accept: '*/*', 'Content-Type': 'application/json' },
      });
      showToast('Home currency saved successfully.');
    } catch {
      showToast('Failed to save currency.', 'error');
    }
  };

  const handleSaveFiscalPeriod = async () => {
    try {
      const response = await dataloaderApi.post('/setting/fiscal-priod/save', {
        homeCurrency: '', glamFields: '',
        fiscalPeriodStartDate: new Date(fiscalPeriodStaringDate.toISOString()),
        reportingPeriod: null, restatementMode: 0, id: null,
      }, { headers: { 'X-Tenant': tenant, Accept: '*/*', 'Content-Type': 'application/json' } });
      showToast('Fiscal period saved and accounting periods generated.');
      setTimeout(() => {
        setFiscalPeriodStaringDate(dayjs(new Date(response.data.fiscalPeriodStartDate)));
        setIsFiscalPeriodButtonDisabled(true);
      }, 1500);
    } catch {
      showToast('Failed to save fiscal period.', 'error');
    }
  };

  const handleSaveReportingPeriod = async () => {
    try {
      showToast('Reporting period saved successfully.');
    } catch {
      showToast('Failed to save reporting period.', 'error');
    }
  };

  const handleReopenPeriod = async () => {
    try {
      showToast(`Period ${reopenPeriod} reopened successfully.`);
    } catch {
      showToast('Failed to reopen period.', 'error');
    }
  };

  const handleDeleteEntries = async () => {
    setShowDeleteConfirmDialog(false);
    try {
      showToast('Entries deleted successfully.', 'success');
    } catch {
      showToast('Failed to delete entries.', 'error');
    }
  };

  const reopenAllClosedAccountingPeriods = async () => {
    if (!restatementMode) return;
    try {
      const response = await dataloaderApi.post('/setting/restatement-mode/save', {
        homeCurrency: '', glamFields: '',
        fiscalPeriodStartDate: new Date(fiscalPeriodStaringDate.toISOString()),
        reportingPeriod: null, restatementMode: 1, id: null,
      }, { headers: { 'X-Tenant': tenant, Accept: '*/*', 'Content-Type': 'application/json' } });
      showToast('Restatement mode enabled — all accounting periods reopened.');
      setTimeout(() => {
        setFiscalPeriodStaringDate(dayjs(new Date(response.data.fiscalPeriodStartDate)));
        setRestatementMode(response.data.restatementMode === 1);
        setShowRestatementDaialog(false);
      }, 1500);
    } catch {
      showToast('Failed to enable restatement mode.', 'error');
    }
  };

  const refreshEnvironment = async () => {
    try {
      const response = await dataloaderApi.post('/setting/refresh/schema', true, {
        headers: { 'X-Tenant': tenant, Accept: '*/*', 'Content-Type': 'application/json' },
      });
      showToast(`Environment [${tenant}] has been reset.`);
      setTimeout(() => {
        setFiscalPeriodStaringDate(dayjs(new Date(response.data.fiscalPeriodStartDate)));
        setRestatementMode(response.data.restatementMode === 1);
        setShowSchemaRefreshDialog(false);
      }, 1500);
    } catch {
      showToast('Failed to reset environment.', 'error');
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Box sx={{ fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif' }}>

      {/* ── Toast notification ── */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={handleToastClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        slots={{ transition: Slide }} slotProps={{ transition: { direction: 'left' } }}
      >
        <Alert
          onClose={handleToastClose}
          severity={toast.severity}
          variant="standard"
          sx={{
            borderRadius: 3, fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
            fontWeight: 600, fontSize: '0.85rem',
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

      {/* ── Delete Entries confirm dialog ── */}
      <Dialog
        open={showDeleteConfirmDialog}
        onClose={() => setShowDeleteConfirmDialog(false)}
        maxWidth="xs" fullWidth
        slots={{ transition: Slide }} slotProps={{ transition: { direction: 'up' } }}
        PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden', border: '1px solid', borderColor: 'divider' } }}
      >
        <Box sx={{
          px: 3, pt: 3, pb: 2,
          background: `linear-gradient(135deg, ${alpha('#dc2626', 0.07)} 0%, ${alpha('#dc2626', 0.02)} 100%)`,
          borderBottom: '1px solid', borderColor: 'divider',
          display: 'flex', alignItems: 'center', gap: 2,
        }}>
          <Box sx={{ bgcolor: alpha('#dc2626', 0.1), borderRadius: 2, p: 1, display: 'flex' }}>
            <DeleteOutlinedIcon sx={{ color: '#dc2626', fontSize: 22 }} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={700} sx={{ fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif', lineHeight: 1.2 }}>
              Delete Entries
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif' }}>
              This action cannot be undone
            </Typography>
          </Box>
        </Box>
        <DialogContent sx={{ pt: 2.5, px: 3 }}>
          <Typography sx={{ fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif', fontSize: '0.88rem', color: 'text.secondary', lineHeight: 1.7 }}>
            This will <strong>permanently delete all activity data</strong> for the selected posting date{' '}
            {deleteEntriesDate && (
              <strong style={{ color: '#14213d' }}>({deleteEntriesDate.format('MM/DD/YYYY')})</strong>
            )}.
            Are you sure you want to continue?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setShowDeleteConfirmDialog(false)} variant="text" sx={{
            borderRadius: 2, textTransform: 'none', fontWeight: 600,
            color: 'text.secondary', fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
          }}>Cancel</Button>
          <Button onClick={handleDeleteEntries} variant="contained" sx={{
            borderRadius: 2, textTransform: 'none', fontWeight: 700,
            fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif', px: 2.5,
            background: '#dc2626', color: '#fff',
            boxShadow: '0 4px 12px rgba(220,38,38,0.28)',
            transition: 'all 0.2s ease-in-out',
            '&:hover': { background: '#b91c1c', boxShadow: '0 6px 18px rgba(220,38,38,0.4)', transform: 'translateY(-1px)' },
          }}>Delete Entries</Button>
        </DialogActions>
      </Dialog>

      {/* ── Reset Environment confirm dialog ── */}
      <Dialog
        open={showSchemaRefreshDialog}
        onClose={() => setShowSchemaRefreshDialog(false)}
        maxWidth="xs" fullWidth
        slots={{ transition: Slide }} slotProps={{ transition: { direction: 'up' } }}
        PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden', border: '1px solid', borderColor: 'divider' } }}
      >
        <Box sx={{
          px: 3, pt: 3, pb: 2,
          background: `linear-gradient(135deg, ${alpha('#dc2626', 0.07)} 0%, ${alpha('#dc2626', 0.02)} 100%)`,
          borderBottom: '1px solid', borderColor: 'divider',
          display: 'flex', alignItems: 'center', gap: 2,
        }}>
          <Box sx={{ bgcolor: alpha('#dc2626', 0.1), borderRadius: 2, p: 1, display: 'flex' }}>
            <WarningAmberIcon sx={{ color: '#dc2626', fontSize: 22 }} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={700} sx={{ fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif', lineHeight: 1.2 }}>
              Reset Environment
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif' }}>
              This action cannot be undone
            </Typography>
          </Box>
        </Box>
        <DialogContent sx={{ pt: 2.5, px: 3 }}>
          <Typography sx={{ fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif', fontSize: '0.88rem', color: 'text.secondary', lineHeight: 1.7 }}>
            Are you sure you want to reset <strong style={{ color: '#14213d' }}>[{tenant}]</strong>?
            This will <strong>permanently remove all current settings and data</strong>.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setShowSchemaRefreshDialog(false)} variant="text" sx={{
            borderRadius: 2, textTransform: 'none', fontWeight: 600,
            color: 'text.secondary', fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
          }}>Cancel</Button>
          <Button onClick={refreshEnvironment} variant="contained" sx={{
            borderRadius: 2, textTransform: 'none', fontWeight: 700,
            fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif', px: 2.5,
            background: '#dc2626', color: '#fff',
            boxShadow: '0 4px 12px rgba(220,38,38,0.28)',
            transition: 'all 0.2s ease-in-out',
            '&:hover': { background: '#b91c1c', boxShadow: '0 6px 18px rgba(220,38,38,0.4)', transform: 'translateY(-1px)' },
          }}>Reset Environment</Button>
        </DialogActions>
      </Dialog>

      {/* ── Restatement Mode confirm dialog ── */}
      <Dialog
        open={showRestatementDaialog}
        onClose={() => { setShowRestatementDaialog(false); setRestatementMode(false); }}
        maxWidth="xs" fullWidth
        slots={{ transition: Slide }} slotProps={{ transition: { direction: 'up' } }}
        PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden', border: '1px solid', borderColor: 'divider' } }}
      >
        <Box sx={{
          px: 3, pt: 3, pb: 2,
          background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.08)} 0%, ${alpha(theme.palette.warning.main, 0.02)} 100%)`,
          borderBottom: '1px solid', borderColor: 'divider',
          display: 'flex', alignItems: 'center', gap: 2,
        }}>
          <Box sx={{ bgcolor: alpha(theme.palette.warning.main, 0.12), borderRadius: 2, p: 1, display: 'flex' }}>
            <WarningAmberIcon sx={{ color: theme.palette.warning.dark, fontSize: 22 }} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={700} sx={{ fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif', lineHeight: 1.2 }}>
              Enable Restatement Mode
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif' }}>
              Reopens all previously closed accounting periods
            </Typography>
          </Box>
        </Box>
        <DialogContent sx={{ pt: 2.5, px: 3 }}>
          <Typography sx={{ fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif', fontSize: '0.88rem', color: 'text.secondary', lineHeight: 1.7 }}>
            Enabling restatement mode will reopen <strong>all previously closed accounting periods</strong> for{' '}
            <strong style={{ color: '#14213d' }}>[{tenant}]</strong>. Are you sure?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => { setShowRestatementDaialog(false); setRestatementMode(false); }} variant="text" sx={{
            borderRadius: 2, textTransform: 'none', fontWeight: 600,
            color: 'text.secondary', fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
          }}>Cancel</Button>
          <Button onClick={reopenAllClosedAccountingPeriods} variant="contained" sx={{
            borderRadius: 2, textTransform: 'none', fontWeight: 700,
            fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif', px: 2.5,
            background: '#d97706', color: '#fff',
            boxShadow: '0 4px 12px rgba(217,119,6,0.35)',
            transition: 'all 0.2s ease-in-out',
            '&:hover': { background: '#b45309', boxShadow: '0 6px 18px rgba(217,119,6,0.45)', transform: 'translateY(-1px)' },
          }}>Confirm Restatement</Button>
        </DialogActions>
      </Dialog>

      {/* ── Tabs ── */}
      <Box sx={{ width: '100%', borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={panelIndex}
          onChange={handleConfigurationTabChange}
          aria-label="Settings tabs"
          sx={{ '& .MuiTab-root': { textTransform: 'none', fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif', fontWeight: 600, fontSize: '0.88rem' } }}
        >
          <Tab label="Tenant Management" />
        </Tabs>
      </Box>

      <CustomTabPanel value={panelIndex} index={0}>
        <Box sx={{ py: 1 }}>

          {/* ── Section: Environment ── */}
          <SectionLabel label="Environment" first />

          <SettingRow
            title="Reset Environment"
            description="Resetting your environment will permanently remove all current settings and data."
          >
            <Tooltip title="Reset Environment">
              <IconButton onClick={() => setShowSchemaRefreshDialog(true)} size="small" sx={{
                bgcolor: alpha('#dc2626', 0.08), color: '#dc2626', borderRadius: 2,
                transition: 'all 0.2s ease-in-out',
                '&:hover': { bgcolor: alpha('#dc2626', 0.16), transform: 'translateY(-1px) rotate(90deg)', boxShadow: 2 },
              }}>
                <RefreshOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </SettingRow>

          <SettingRow
            title="Configure Dashboard"
            description="Customize which metrics and graphs appear on your dashboard."
          >
            <Tooltip title="Configure Dashboard">
              <IconButton onClick={handleAddDashboardConfigurationDialogOpen} size="small" sx={{
                bgcolor: alpha('#14213d', 0.07), color: '#14213d', borderRadius: 2,
                transition: 'all 0.2s ease-in-out',
                '&:hover': { bgcolor: alpha('#14213d', 0.14), transform: 'translateY(-1px) rotate(30deg)', boxShadow: 2 },
              }}>
                <SettingsOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </SettingRow>

          {/* ── Section: Financials ── */}
          <SectionLabel label="Financials" />

          <SettingRow
            title="Home Currency"
            description="Choose the default currency for your environment."
          >
            <Autocomplete
              size="small"
              options={currencyList || []}
              value={currency || null}
              getOptionLabel={(option) => option || ''}
              onChange={(_, newValue) => setCurrency(newValue || null)}
              sx={{ width: 160 }}
              renderInput={(params) => <TextField {...params} label="Currency" sx={tfSx} />}
            />
            <ActionLink onClick={saveCurrency} disabled={false}>Save</ActionLink>
          </SettingRow>

          <SettingRow
            title="Fiscal Period Start Date"
            description="Specify the starting date of your fiscal period to generate accounting periods."
          >
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                value={fiscalPeriodStaringDate}
                onChange={handleFiscalPeriodChange}
                slotProps={{ textField: { size: 'small', sx: { width: 178, ...tfSx } } }}
              />
            </LocalizationProvider>
            <ActionLink onClick={handleSaveFiscalPeriod} disabled={isFiscalPeriodButtonDisabled}>Save</ActionLink>
          </SettingRow>

          <SettingRow
            title="Reporting Period"
            description="Set the number of recent posting periods to include in reports."
          >
            <Autocomplete
              size="small"
              options={reportingPeriodList}
              value={reportingPeriod}
              getOptionLabel={(option) => option}
              onChange={(_, newValue) => setReportingPeriod(newValue)}
              sx={{ width: 160 }}
              renderInput={(params) => <TextField {...params} label="# Periods" sx={tfSx} />}
            />
            <ActionLink onClick={handleSaveReportingPeriod} disabled={false}>Save</ActionLink>
          </SettingRow>

          {/* ── Section: Accounting Periods ── */}
          <SectionLabel label="Accounting Periods" />

          <SettingRow
            title="Restatement Mode"
            description="Enabling this will reopen all previously closed accounting periods."
          >
            <Switch
              checked={restatementMode}
              onChange={handleRestatementMode}
              sx={{
                '& .MuiSwitch-switchBase.Mui-checked': { color: '#16a34a' },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#16a34a' },
              }}
            />
          </SettingRow>

          <SettingRow
            title="Re-Open Accounting Period"
            description="Select a closed period to reopen for adjustments."
          >
            <Autocomplete
              size="small"
              options={reopenPriodList}
              value={reopenPeriod}
              getOptionLabel={(option) => option}
              onChange={(_, newValue) => setReopenPeriod(newValue)}
              sx={{ width: 160 }}
              renderInput={(params) => <TextField {...params} label="Period" sx={tfSx} />}
            />
            <ActionLink onClick={handleReopenPeriod}>Reopen</ActionLink>
          </SettingRow>

          <SettingRow
            title="Delete Entries"
            description="Permanently delete all activity data for the selected date."
          >
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                value={deleteEntriesDate}
                onChange={(date) => setDeleteEntriesDate(date)}
                slotProps={{ textField: { size: 'small', sx: { width: 178, ...tfSx } } }}
              />
            </LocalizationProvider>
            <ActionLink onClick={() => setShowDeleteConfirmDialog(true)} disabled={!deleteEntriesDate}>Delete</ActionLink>
          </SettingRow>

        </Box>
      </CustomTabPanel>

      <AddDashboardConfiguration
        open={isDashboardConfigurationDialogOpen}
        onClose={handleAddDashboardConfigurationDialogClose}
        editData={settings.dashboardConfiguration}
      />
    </Box>
  );
}
