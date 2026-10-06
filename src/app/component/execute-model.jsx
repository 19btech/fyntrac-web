import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField,
  IconButton, Typography, Tooltip, Box,
  Chip, Alert, Slide,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import HighlightOffOutlinedIcon from '@mui/icons-material/HighlightOffOutlined';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { dataloaderApi } from '../services/api-client';
import { useTenant } from '../tenant-context';

// mm/dd/yyyy that is a real calendar date (rejects 02/31, 04/31, 02/29 in non-leap years).
const isValidExecutionDate = (value) => {
  const m = /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/(\d{4})$/.exec(value);
  if (!m) return false;
  const [month, day, year] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const d = new Date(Date.UTC(year, month - 1, day));
  return d.getUTCFullYear() === year && d.getUTCMonth() === month - 1 && d.getUTCDate() === day;
};

const ExecuteModel = ({ open, onClose, modelType }) => {
  const { tenant } = useTenant();
  const theme = useTheme();
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showErrorMessage, setShowErrorMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [date, setDate] = useState('');
  const [error, setError] = useState(false);
  const [latestExecutionState, setLatestExecutionState] = useState(null);
  const [showWarningMessage, setShowWarningMessage] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  // 'loading' | 'ready' | 'failed' — the destructive-date check needs the latest execution date.
  const [stateStatus, setStateStatus] = useState('loading');
  const [submitting, setSubmitting] = useState(false);
  const closeTimer = useRef(null);
  // Whether this opening of the dialog started a run (the page then watches for it).
  const startedRef = useRef(false);

  const fetchLatestExecutionState = async () => {
    setStateStatus('loading');
    try {
      const response = await dataloaderApi.get('/execution/state/get/latest', {
        headers: { 'X-Tenant': tenant },
      });
      setLatestExecutionState(response.data);
      setStateStatus('ready');
    } catch (err) {
      console.error('Failed to fetch latest execution state:', err);
      setLatestExecutionState(null);
      setStateStatus('failed');
    }
  };

  useEffect(() => {
    if (open) {
      startedRef.current = false;
      fetchLatestExecutionState();
    }
  }, [open, tenant]);

  // A pending auto-close must never fire after the dialog was closed (or reopened) or unmounted.
  const clearCloseTimer = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };
  useEffect(() => clearCloseTimer, []);

  const handleChange = (event) => {
    const value = event.target.value;
    setDate(value);
    setError(!isValidExecutionDate(value));
    setShowWarningMessage(false);
  };

  const handleClose = () => {
    clearCloseTimer();
    setSubmitting(false);
    setShowErrorMessage(false);
    setShowSuccessMessage(false);
    setShowWarningMessage(false);
    setDate('');
    setError(false);
    onClose(startedRef.current);
  };

  const WARNING_DESTRUCTIVE = `DESTRUCTIVE ACTION: Continuing permanently deletes all future data after this date. This cannot be undone. Press "Execute Model" to proceed.`;
  const WARNING_UNVERIFIED = `The latest execution date could not be checked. If this date is earlier than the last execution, continuing permanently deletes all data after it. Press "Execute Model" to proceed.`;
  const handleModelExecution = async () => {
    if (submitting || showSuccessMessage) return; // one run per click
    if (date.length === 0) {
      setError(true);
      return;
    }
    if (error || !isValidExecutionDate(date)) {
      setError(true);
      return;
    }
    if (stateStatus === 'loading') return;

    // Check warning condition (execution date < latest execution date)
    const parts = date.split('/');
    let isWarningCondition = false;
    if (parts.length === 3 && latestExecutionState && latestExecutionState.executionDate) {
      const month = parts[0];
      const day = parts[1];
      const year = parts[2];
      const dateInt = parseInt(`${year}${month}${day}`, 10);
      if (dateInt < Number(latestExecutionState.executionDate)) {
        isWarningCondition = true;
      }
    }
    // If the latest execution date couldn't be checked, the run might be destructive: confirm first.
    const unverified = stateStatus === 'failed';

    if ((isWarningCondition || unverified) && !showWarningMessage) {
      setShowWarningMessage(true);
      setWarningMessage(isWarningCondition ? WARNING_DESTRUCTIVE : WARNING_UNVERIFIED);
      return;
    }

    setSubmitting(true);

    const isDsl = modelType === 'DSL' || modelType === 'PYTHON';
    const serviceURL = isDsl ? '/model/execute/dsl' : '/model/execute';

    try {
      const payload = { date };
      // async=true: the service answers 202 with the run id as soon as the run has started, instead of
      // holding this request open for the whole run (minutes, or hours for large tenants — longer
      // than any proxy keeps a request open). The Model page's progress panel follows the run.
      const response = await dataloaderApi.post(serviceURL, payload, {
        headers: { 'X-Tenant': tenant, Accept: '*/*' },
        params: { async: true },
      });

      const started = response.data;
      startedRef.current = true;
      setSuccessMessage(typeof started === 'string'
        ? started
        : `Execution started for ${date}. Follow its progress on the Model page.`);
      setShowSuccessMessage(true);
      setShowWarningMessage(false);
      fetchLatestExecutionState();

      clearCloseTimer();
      closeTimer.current = setTimeout(() => {
        closeTimer.current = null;
        handleClose();
      }, 3000);
    } catch (err) {
      console.log("err", err);
      const data = err?.response?.data;
      const msg =
        (typeof data === 'string' && data) ||
        data?.message ||
        data?.error ||
        err?.message ||
        'An unexpected error occurred.';
      setErrorMessage(msg);
      setShowErrorMessage(true);
      setShowWarningMessage(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      slots={{ transition: Slide }}
      slotProps={{
        transition: { direction: 'up' },
        paper: {
          sx: {
            borderRadius: 4,
            boxShadow: '0 32px 64px rgba(15,23,42,0.18)',
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'divider',
            fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
            '& .MuiTypography-root, & .MuiInputBase-root, & .MuiButton-root, & .MuiChip-root, & .MuiFormHelperText-root': {
              fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
            },
          },
        },
      }}
    >
      {/* ── HEADER ── */}
      <DialogTitle sx={{ p: 0, flexShrink: 0 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            px: 3,
            pt: 3,
            pb: 2.5,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <img src="fyntrac.png" alt="Fyntrac" style={{ width: 72, height: 'auto' }} />
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Chip
                  icon={<PlayArrowIcon sx={{ fontSize: '12px !important' }} />}
                  label="Model"
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '0.6rem',
                    fontWeight: 700,
                    letterSpacing: 0.8,
                    textTransform: 'uppercase',
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main,
                    borderRadius: 1,
                  }}
                />
                {modelType && (
                  <Chip
                    label={modelType}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: '0.6rem',
                      fontWeight: 700,
                      letterSpacing: 0.8,
                      textTransform: 'uppercase',
                      bgcolor: alpha(theme.palette.info.main, 0.1),
                      color: theme.palette.info.dark,
                      borderRadius: 1,
                    }}
                  />
                )}
              </Box>
              <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.2, color: 'text.primary' }}>
                Model Execution
              </Typography>
            </Box>
          </Box>
          <Tooltip title="Close" placement="left">
            <IconButton
              onClick={handleClose}
              size="small"
              sx={{
                color: 'text.secondary',
                bgcolor: 'action.hover',
                borderRadius: 2,
                '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.12), color: 'error.main' },
              }}
            >
              <HighlightOffOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </DialogTitle>

      {/* ── BODY ── */}
      <DialogContent sx={{ p: 0, bgcolor: alpha(theme.palette.grey[500], 0.03) }}>
        <Box sx={{ px: 3.5, pt: 3, pb: 2.5, display: 'flex', flexDirection: 'column', gap: 3 }}>

          {showSuccessMessage && (
            <Alert severity="success" variant="outlined" sx={{ borderRadius: 2.5 }}>
              {successMessage || 'Model executed successfully.'}
            </Alert>
          )}
          {showErrorMessage && (
            <Alert severity="error" variant="outlined" sx={{ borderRadius: 2.5 }}>
              {String(errorMessage) || 'An error occurred.'}
            </Alert>
          )}
          {showWarningMessage && (
            <Alert
              severity="warning"
              variant="outlined"
              onClose={() => setShowWarningMessage(false)}
              sx={{
                borderRadius: 2.5,
                bgcolor: 'rgba(245,158,11,0.05)',
                borderColor: 'rgba(245,158,11,0.3)',
                color: '#b45309',
                fontWeight: 600,
                whiteSpace: 'pre-line',
                '& .MuiAlert-icon': { color: '#d97706' },
              }}
            >
              {warningMessage}
            </Alert>
          )}

          <TextField
            label="Execution Date"
            placeholder="mm/dd/yyyy"
            fullWidth
            required
            value={date}
            onChange={handleChange}
            error={error}
            helperText={error ? 'Invalid date format. Use mm/dd/yyyy.' : 'Enter the execution date in mm/dd/yyyy format.'}
            size="small"
            inputProps={{ style: { fontSize: '0.9rem', fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif' } }}
            InputLabelProps={{ style: { fontSize: '0.9rem', fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif' } }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5, bgcolor: 'background.paper' } }}
          />
        </Box>
      </DialogContent>

      {/* ── FOOTER ── */}
      <DialogActions
        sx={{
          px: 3.5,
          py: 2,
          borderTop: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          justifyContent: 'flex-end',
          gap: 1.25,
        }}
      >
        <Button
          onClick={handleClose}
          variant="text"
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            color: 'text.secondary',
            px: 2.5,
            '&:hover': { bgcolor: 'action.hover' },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleModelExecution}
          variant="contained"
          disabled={!date.trim() || error || submitting || showSuccessMessage || stateStatus === 'loading'}
          startIcon={<PlayArrowIcon />}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 700,
            minWidth: 150,
            px: 3,
            background: '#14213d',
            color: '#fff',
            boxShadow: '0 6px 16px rgba(20,33,61,0.35)',
            '&:hover': { background: '#0d1628', boxShadow: '0 8px 22px rgba(20,33,61,0.45)' },
            '&.Mui-disabled': { background: 'rgba(20,33,61,0.35)', color: '#fff', boxShadow: 'none' },
          }}
        >
          {submitting ? 'Starting…' : stateStatus === 'loading' && !showSuccessMessage ? 'Checking…' : 'Execute Model'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExecuteModel;
