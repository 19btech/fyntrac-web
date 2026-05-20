import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Autocomplete,
  IconButton, Typography, Tooltip, Box, Stack,
  Chip, Alert, Slide, Collapse,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import HighlightOffOutlinedIcon from '@mui/icons-material/HighlightOffOutlined';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import { dataloaderApi } from '../services/api-client';
import { useTenant } from "../tenant-context";

const AddAggregationDialog = ({ open, onClose, editData }) => {
  const { tenant } = useTenant();
  const theme = useTheme();
  const [metricName, setMetricName] = useState('');
  const [id, setId] = useState(null);
  const [errorSnackbar, setErrorSnackbar] = useState({ open: false, message: '' });


  const serviceURL = '/aggregation/add';
  const serviceGetTransactionNamesURL = '/transaction/get/transactions'
  const [transactionNames, setTransactionNames] = useState([]);
  const [selectedTransactions, setSelectedTransactions] = useState([]);

  React.useEffect(() => {
    if (!open) return;
    if (transactionNames.length === 0) {
      fetchTransactionNames();
    }
    if (editData) {
      // Populate form fields with editData if provided
      // editData may have transactionNames (array from grouped display) or transactionName (single)
      setSelectedTransactions(
        editData.transactionNames?.length > 0
          ? editData.transactionNames
          : editData.transactionName ? [editData.transactionName] : []
      );
      setMetricName(editData.metricName || '');
      setId(editData.id);
    } else {
      // Clear form fields if no editData (e.g., for adding new transaction)
      setSelectedTransactions([]);
      setMetricName('');
      setId(null);
    }
    setErrorSnackbar({ open: false, message: '' });
  }, [editData, open]);

  React.useEffect(() => {
    if (!errorSnackbar.open) return;
    const t = setTimeout(() => setErrorSnackbar(s => ({ ...s, open: false })), 5000);
    return () => clearTimeout(t);
  }, [errorSnackbar.open]);

  const fetchTransactionNames = () => {

    dataloaderApi.get(serviceGetTransactionNamesURL)
      .then(response => {
        setTransactionNames(response.data);
      })
      .catch(error => {
        // Handle error if needed
      });
  };

  const handleAddAggregation = async () => {
    try {
      const originalTransactions = isEditMode
        ? (editData.transactionNames || (editData.transactionName ? [editData.transactionName] : []))
        : [];

      // Transactions the user removed from the original list
      const toDelete = originalTransactions.filter(tx => !selectedTransactions.includes(tx));
      if (toDelete.length > 0) {
        setErrorSnackbar({ open: true, message: `Removing transactions (${toDelete.join(', ')}) requires a backend delete endpoint — please raise this with your backend team.` });
        return;
      }

      // Only POST transactions that don't already exist for this metric
      const toCreate = selectedTransactions.filter(tx => !originalTransactions.includes(tx));

      if (toCreate.length === 0 && isEditMode) {
        // Nothing new to add — treat as success and close
        onClose(false);
        return;
      }

      await Promise.all(
        toCreate.map((txName) =>
          dataloaderApi.post(serviceURL, {
            transactionName: txName,
            metricName: metricName.trim(),
            id: null,
          })
        )
      );
      onClose(true);
    } catch (error) {
      console.error('Submission failed:', error);
      if (error.response && error.response.status === 400) {
        const errorList = error.response.data;
        const formattedMessage = Array.isArray(errorList)
          ? errorList.map(err => err.message).join(' | ')
          : 'Invalid input. Please check your data.';
        setErrorSnackbar({ open: true, message: formattedMessage });
      } else {
        setErrorSnackbar({ open: true, message: 'Server error. Please try again later.' });
      }
    }
  };


  const handleClose = () => {
    onClose(false);
  };

  const isEditMode = !!editData;
  
  // Strictly alphanumeric and underscores, NO SPACES (Matches backend AggregationValidator constraint)
  const metricRegex = /^[a-zA-Z0-9_]+$/;
  const isMetricEmpty = !metricName.trim();
  const isMetricFormatValid = isMetricEmpty || metricRegex.test(metricName);
  
  const canSave = selectedTransactions.length > 0 && !isMetricEmpty && isMetricFormatValid;

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
                  icon={<BarChartOutlinedIcon sx={{ fontSize: '12px !important' }} />}
                  label="Balance"
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
                {isEditMode ? 'Edit' : 'Add'} Balance
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
            severity="error"
            variant="standard"
            onClose={() => setErrorSnackbar(s => ({ ...s, open: false }))}
            sx={{
              borderRadius: 2, fontSize: '0.85rem', fontWeight: 600,
              bgcolor: 'rgba(220,38,38,0.10)',
              border: '1px solid rgba(220,38,38,0.3)',
              color: '#dc2626',
              '& .MuiAlert-icon': { color: '#dc2626' },
            }}
          >
            {errorSnackbar.message}
          </Alert>
        </Box>
      </Collapse>

      {/* ── BODY ── */}
      <DialogContent sx={{ p: 0, bgcolor: alpha(theme.palette.grey[500], 0.03) }}>
        <Box sx={{ px: 3.5, pt: 3, pb: 2.5, display: 'flex', flexDirection: 'column', gap: 2.5 }}>

          <Autocomplete
            fullWidth
            multiple
            disablePortal
            filterSelectedOptions
            options={transactionNames}
            value={selectedTransactions}
            getOptionLabel={(option) => option}
            onChange={(_, newValue) => setSelectedTransactions(newValue)}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => {
                const { key, ...tagProps } = getTagProps({ index });
                return (
                  <Chip
                    key={key}
                    label={option}
                    size="small"
                    {...tagProps}
                    sx={{
                      height: 22, fontSize: '0.72rem', fontWeight: 700,
                      bgcolor: 'rgba(22,163,74,0.1)', color: '#15803d',
                      border: '1px solid rgba(22,163,74,0.28)', borderRadius: 1.5,
                      '& .MuiChip-deleteIcon': { color: '#15803d', '&:hover': { color: '#166534' } },
                    }}
                  />
                );
              })
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Transaction Name(s)"
                required
                size="small"
                placeholder={selectedTransactions.length === 0 ? 'Select one or more…' : ''}
                inputProps={{ ...params.inputProps, style: { ...params.inputProps?.style, fontSize: '0.9rem', fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif' } }}
                InputLabelProps={{ style: { fontSize: '0.9rem', fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif' } }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5, bgcolor: 'background.paper' } }}
              />
            )}
          />

          <TextField
            label="Metric Name"
            fullWidth
            required
            size="small"
            value={metricName}
            onChange={(e) => setMetricName(e.target.value)}
            error={!isMetricFormatValid}
            helperText={!isMetricFormatValid ? "Only alphanumeric and underscores allowed. Spaces not permitted." : ""}
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
          onClick={handleAddAggregation}
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
          {isEditMode ? 'Update Balance' : 'Save Balance'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddAggregationDialog;
