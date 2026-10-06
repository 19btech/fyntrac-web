"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { alpha } from '@mui/material/styles';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import CachedRoundedIcon from '@mui/icons-material/CachedRounded';
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';
import { useTenant } from '../tenant-context';
import AppToast from '../report-explorer/app-toast';
import { ConfirmDialog } from '../user-management/ui';
import ModelExecution from './model-execution';
import AccountingClose from './accounting-close';
import { HEADER_ICON_SX } from './ui';
import {
  defaultClose, defaultModelExecution, errorMessage, fetchAccountingClose, fetchModelExecution, saveAccountingClose, saveModelExecution,
} from './cron-jobs-api';

/**
 * Configuration → Cron Jobs: the tenant's two scheduled jobs — model execution (daily / monthly,
 * any time zone) and the accounting close. Each is configured and switched on or off, never
 * created or deleted. Laid out like Model Management; the settings like Tenant Management.
 */
export default function CronJobs() {
  const { tenant } = useTenant();
  const [model, setModel] = useState(defaultModelExecution);
  const [close, setClose] = useState(defaultClose);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [now, setNow] = useState(() => Date.now());
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
  const [modelDirty, setModelDirty] = useState(false);
  const [closeDirty, setCloseDirty] = useState(false);
  const [confirmRefresh, setConfirmRefresh] = useState(false);

  const showToast = useCallback((message, severity = 'success') => setToast({ open: true, message, severity }), []);

  const loadSeq = useRef(0);
  const load = useCallback(async () => {
    // Until the tenant is known the cards stay in their loading state (so nothing can be saved
    // under no tenant).
    if (!tenant) return;
    const seq = ++loadSeq.current;
    setLoading(true);
    try {
      const [m, c] = await Promise.all([fetchModelExecution(tenant), fetchAccountingClose(tenant)]);
      if (seq !== loadSeq.current) return; // a newer load (e.g. another tenant) has started
      setModel(m);
      setClose(c);
      setError('');
    } catch (err) {
      if (seq !== loadSeq.current) return;
      setError(errorMessage(err, 'Failed to load cron jobs. Please try again.'));
    } finally {
      if (seq === loadSeq.current) {
        setLoading(false);
        setNow(Date.now());
      }
    }
  }, [tenant]);

  useEffect(() => { load(); }, [load]);

  // Next run / close times stay current while the page is open.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  const saveModel = async (config) => {
    try {
      const saved = await saveModelExecution(tenant, config);
      setModel(saved);
      setNow(Date.now());
      showToast(saved.enabled ? 'Model execution job saved.' : 'Model execution job saved and turned off.');
    } catch (err) {
      showToast(errorMessage(err, 'Failed to save model execution job.'), 'error');
    }
  };

  const saveClose = async (config) => {
    try {
      const saved = await saveAccountingClose(tenant, config);
      setClose(saved);
      setNow(Date.now());
      showToast(saved.enabled ? 'Accounting close job saved.' : 'Accounting close job saved and turned off.');
    } catch (err) {
      showToast(errorMessage(err, 'Failed to save accounting close job.'), 'error');
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ pb: 3, textAlign: 'left' }}>

        {/* 1. Header Section */}
        <Box
          sx={{
            p: 1.5,
            borderBottom: '1.5px solid',
            borderColor: (t) => alpha(t.palette.divider, 0.2),
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { sm: 'center' },
            gap: 2,
            mb: 4,
          }}
        >
          <Typography variant="h5" fontWeight={600} color="text.primary" sx={{ letterSpacing: '-0.5px' }}>
            Cron Jobs
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Refresh">
              <IconButton aria-label="Refresh" onClick={() => (modelDirty || closeDirty ? setConfirmRefresh(true) : load())} sx={HEADER_ICON_SX}>
                <CachedRoundedIcon color="action" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* 2. Model execution job */}
        <Box sx={{ mb: 3 }}>
          <ModelExecution config={model} loading={loading} error={error} now={now} onSave={saveModel} onDirtyChange={setModelDirty} />
        </Box>

        {/* 3. Accounting close job */}
        <AccountingClose config={close} loading={loading} error={error} now={now} onSave={saveClose} onDirtyChange={setCloseDirty} />
      </Box>

      <ConfirmDialog
        open={confirmRefresh}
        kind="Cron Jobs"
        kindIcon={<ScheduleRoundedIcon />}
        title="Discard Changes?"
        confirmLabel="Discard & Refresh"
        tone="danger"
        onConfirm={() => { setConfirmRefresh(false); load(); }}
        onClose={() => setConfirmRefresh(false)}
      >
        <Typography variant="body2" color="text.secondary">
          Your {modelDirty && closeDirty ? 'model execution and accounting close' : modelDirty ? 'model execution' : 'accounting close'} job changes have not been saved.
        </Typography>
      </ConfirmDialog>
      <AppToast toast={toast} onClose={() => setToast((t) => ({ ...t, open: false }))} />
    </LocalizationProvider>
  );
}
