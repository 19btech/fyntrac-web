import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Switch, FormControlLabel,
  IconButton, Typography, Tooltip, Box, Stack,
  Chip, Alert, Paper, Slide, Collapse,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import HighlightOffOutlinedIcon from '@mui/icons-material/HighlightOffOutlined';
import SwapHorizOutlinedIcon from '@mui/icons-material/SwapHorizOutlined';
import { dataloaderApi } from '../services/api-client';
import { useTenant } from "../tenant-context";

const AddTransactionDialog = ({ open, onClose, editData }) => {
  const { tenant } = useTenant();
  const theme = useTheme();
  const [transactionName, setTransactionName] = useState('');
  const [isExclusive, setIsExclusive] = useState(false);
  const [isReplayable, setIsReplayable] = useState(false);
  const [isGL, setIsGL] = useState(false);
  const [id, setId] = useState(null);
  const [errorSnackbar, setErrorSnackbar] = useState({ open: false, message: '', severity: 'error' });
  const [savedSuccessfully, setSavedSuccessfully] = useState(false);

  React.useEffect(() => {
    if (!open) return;
    if (editData) {
      // Populate form fields with editData if provided
      setTransactionName(editData.name || '');
      setIsExclusive(editData.exclusive === 1 ? true : false);
      setIsGL(editData.isGL === 1 ? true : false);
      setId(editData.id);
      setIsReplayable(editData.isReplayable === 1 ? true : false);
    } else {
      // Clear form fields if no editData (e.g., for adding new transaction)
      setTransactionName('');
      setIsExclusive(false);
      setIsGL(false);
      setIsReplayable(false);
      setId(null);
    }
    setErrorSnackbar({ open: false, message: '', severity: 'error' });
    setSavedSuccessfully(false);
  }, [open, editData]);

  React.useEffect(() => {
    if (!errorSnackbar.open || errorSnackbar.severity === 'warning') return;
    const t = setTimeout(() => setErrorSnackbar(s => ({ ...s, open: false })), 5000);
    return () => clearTimeout(t);
  }, [errorSnackbar.open]);

  // Clear any stale flag-warning when the user changes Reportable/Journal so the warn-then-confirm flow stays in sync
  React.useEffect(() => {
    if (!errorSnackbar.open || errorSnackbar.severity !== 'warning') return;
    const msg = errorSnackbar.message;
    if (msg === WARN_JOURNAL || msg === WARN_REPORTABLE || msg === WARN_BOTH) {
      setErrorSnackbar(s => ({ ...s, open: false }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExclusive, isGL]);

  const WARN_JOURNAL = 'Journal flag is not set. Defaulting value to true.';
  const WARN_REPORTABLE = 'Reportable flag is not set. Defaulting value to true.';
  const WARN_BOTH = 'Both reportable and journal are false. Transaction will not appear in reports or journals.';

  const handleSaveClick = () => {
    const reportableOff = !isExclusive;
    const journalOff = !isGL;

    let warningMsg = null;
    if (reportableOff && journalOff) warningMsg = WARN_BOTH;
    else if (journalOff) warningMsg = WARN_JOURNAL;
    else if (reportableOff) warningMsg = WARN_REPORTABLE;

    // First click with a warning condition: show the warning and wait for confirmation.
    if (warningMsg && errorSnackbar.message !== warningMsg) {
      setErrorSnackbar({ open: true, message: warningMsg, severity: 'warning' });
      return;
    }

    // Second click (or no warning): proceed. Apply documented defaults.
    const effectiveReportable = (warningMsg === WARN_REPORTABLE) ? 1 : (isExclusive ? 1 : 0);
    const effectiveJournal = (warningMsg === WARN_JOURNAL) ? 1 : (isGL ? 1 : 0);
    handleAddTransaction(effectiveReportable, effectiveJournal);
  };

  const handleAddTransaction = async (effectiveReportable, effectiveJournal) => {
    const oldName = editData ? editData.name : null;
    const newName = transactionName.trim();
    const nameChanged = !!editData && oldName && oldName !== newName;

    try {
      await dataloaderApi.post('/transaction/add', {
        name: newName,
        exclusive: effectiveReportable,
        isGL: effectiveJournal,
        isReplayable: isReplayable ? 1 : 0,
        id: id
      });
      setSavedSuccessfully(true);

      if (nameChanged) {
        // Cascade-update aggregation (balance) AND subledger mapping entries that reference the old transaction name
        try {
          const [aggRes, smlRes] = await Promise.all([
            dataloaderApi.get('/aggregation/get/all'),
            dataloaderApi.get('/subledgermapping/get/all'),
          ]);

          const oldNameLower = oldName.toLowerCase();

          const aggUpdates = (aggRes.data || [])
            .filter(a => a.transactionName?.toLowerCase() === oldNameLower)
            .map(agg => dataloaderApi.post('/aggregation/add', {
              transactionName: newName,
              metricName: agg.metricName,
              id: agg.id,
            }));

          const smlUpdates = (smlRes.data || [])
            .filter(s => s.transactionName?.toLowerCase() === oldNameLower)
            .map(sml => dataloaderApi.post('/subledgermapping/add', {
              transactionName: newName,
              sign: sml.sign,
              entryType: sml.entryType,
              accountSubType: sml.accountSubType,
              id: sml.id,
            }));

          await Promise.all([...aggUpdates, ...smlUpdates]);
          onClose(true);
        } catch (cascadeErr) {
          console.error('Cascade update failed:', cascadeErr);
          setErrorSnackbar({
            open: true,
            message: 'Transaction saved, but related balance/subledger references could not be updated automatically. Please update them manually.',
            severity: 'warning',
          });
          // Don't close — user closes via X which will trigger refresh (savedSuccessfully=true)
        }
      } else {
        onClose(true);
      }
    } catch (error) {
      console.log('Submission failed:', error);
      const status = error.response?.status;
      const responseText = JSON.stringify(error.response?.data ?? '').toLowerCase();
      const isDuplicate =
        status === 409 ||
        responseText.includes('duplicate') ||
        responseText.includes('already exists') ||
        responseText.includes('unique');

      if (isDuplicate) {
        setErrorSnackbar({ open: true, message: 'Duplicate transaction name found. Transaction names must be unique.', severity: 'error' });
      } else if (status === 400) {
        const errorList = error.response.data;
        const formattedMessage = Array.isArray(errorList)
          ? errorList.map(err => err.message).join(' | ')
          : 'Invalid input. Please check your data.';
        setErrorSnackbar({ open: true, message: formattedMessage, severity: 'error' });
      } else {
        setErrorSnackbar({ open: true, message: 'Server error. Please try again later.', severity: 'error' });
      }
    }
  };

  const handleClose = () => {
    onClose(savedSuccessfully);
  };

  const isEditMode = !!editData;
  // Align with backend TransactionValidator constraints (allows spaces, but blocks leading/trailing/double-spaces)
  const txNameRegex = /^[a-zA-Z0-9_ ]+$/;
  const isTxNameEmpty = !transactionName.trim();
  const hasDoubleSpace = transactionName.includes('  ');
  const hasEdgeSpaces = transactionName.length > 0 && transactionName.trim() !== transactionName;
  const isTxFormatValid = isTxNameEmpty || (txNameRegex.test(transactionName) && !hasDoubleSpace && !hasEdgeSpaces);
  
  const canSave = !isTxNameEmpty && isTxFormatValid;

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
                  icon={<SwapHorizOutlinedIcon sx={{ fontSize: '12px !important' }} />}
                  label="Transaction"
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
                {isEditMode && (
                  <Chip
                    label="Edit Mode"
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: '0.6rem',
                      fontWeight: 700,
                      letterSpacing: 0.8,
                      textTransform: 'uppercase',
                      bgcolor: alpha(theme.palette.warning.main, 0.1),
                      color: theme.palette.warning.dark,
                      borderRadius: 1,
                    }}
                  />
                )}
              </Box>
              <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.2, color: 'text.primary' }}>
                {isEditMode ? 'Edit' : 'Add'} Transaction
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

      {/* ── Inline error alert ── */}
      <Collapse in={errorSnackbar.open}>
        <Box sx={{ px: 3, pt: 2 }}>
          <Alert
            severity={errorSnackbar.severity || 'error'}
            variant="standard"
            onClose={() => setErrorSnackbar(s => ({ ...s, open: false }))}
            sx={{
              borderRadius: 2, fontSize: '0.85rem', fontWeight: 600,
              bgcolor: errorSnackbar.severity === 'warning' ? 'rgba(245,158,11,0.10)' : 'rgba(220,38,38,0.10)',
              border: errorSnackbar.severity === 'warning' ? '1px solid rgba(245,158,11,0.3)' : '1px solid rgba(220,38,38,0.3)',
              color: errorSnackbar.severity === 'warning' ? '#b45309' : '#dc2626',
              '& .MuiAlert-icon': { color: errorSnackbar.severity === 'warning' ? '#d97706' : '#dc2626' },
            }}
          >
            {errorSnackbar.message}
          </Alert>
        </Box>
      </Collapse>

      {/* ── BODY ── */}
      <DialogContent sx={{ p: 0, bgcolor: alpha(theme.palette.grey[500], 0.03) }}>
        <Box sx={{ px: 3.5, pt: 3, pb: 2.5, display: 'flex', flexDirection: 'column', gap: 3 }}>

          {/* Name field */}
          <TextField
            label="Transaction Name"
            fullWidth
            required
            value={transactionName}
            onChange={(e) => setTransactionName(e.target.value)}
            error={!isTxFormatValid}
            helperText={!isTxFormatValid 
              ? (hasDoubleSpace ? "Double spacing is not allowed." : hasEdgeSpaces ? "Leading or trailing spaces are not allowed." : "Special characters are not allowed.")
              : ""}
            size="small"
            inputProps={{ style: { fontSize: '0.9rem', fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif' } }}
            InputLabelProps={{ style: { fontSize: '0.9rem', fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif' } }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5, bgcolor: 'background.paper' } }}
          />

          {/* Toggle flags */}
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              border: '1px solid',
              borderColor: alpha(theme.palette.divider, 0.7),
              bgcolor: 'background.paper',
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                px: 2.5,
                py: 1.25,
                borderBottom: '1px solid',
                borderColor: alpha(theme.palette.divider, 0.6),
                bgcolor: alpha(theme.palette.primary.main, 0.025),
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.7, color: 'text.secondary', fontSize: '0.67rem' }}>
                Flags
              </Typography>
            </Box>
            <Stack sx={{ px: 2.5, py: 1.5 }} divider={<Box sx={{ borderBottom: '1px solid', borderColor: alpha(theme.palette.divider, 0.5) }} />}>
              {[
                { label: 'Reportable', desc: 'Marks this transaction as reportable in exclusivity rules.', value: isExclusive, onChange: setIsExclusive },
                { label: 'Journal', desc: 'Posts this transaction to the general ledger.', value: isGL, onChange: setIsGL },
                { label: 'Replayable', desc: 'Allows this transaction to be re-processed.', value: isReplayable, onChange: setIsReplayable },
              ].map(({ label, desc, value, onChange }) => (
                <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.25 }}>
                  <Box>
                    <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1.3 }}>{label}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem' }}>{desc}</Typography>
                  </Box>
                  <Switch
                    size="small"
                    checked={value}
                    onChange={(e) => onChange(e.target.checked)}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': { color: '#14213d' },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#14213d' },
                    }}
                  />
                </Box>
              ))}
            </Stack>
          </Paper>
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
          onClick={handleSaveClick}
          variant="contained"
          disabled={!canSave}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 700,
            minWidth: 130,
            px: 3,
            background: '#14213d',
            color: '#fff',
            boxShadow: '0 6px 16px rgba(20,33,61,0.35)',
            '&:hover': { background: '#0d1628', boxShadow: '0 8px 22px rgba(20,33,61,0.45)' },
            '&.Mui-disabled': { background: 'rgba(20,33,61,0.35)', color: '#fff', boxShadow: 'none' },
          }}
        >
          {isEditMode ? 'Update Transaction' : 'Save Transaction'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddTransactionDialog;
