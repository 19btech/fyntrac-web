import React, { useState } from 'react';
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

const ExecuteModel = ({ open, onClose, modelType }) => {
  const { tenant } = useTenant();
  const theme = useTheme();
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showErrorMessage, setShowErrorMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [date, setDate] = useState('');
  const [error, setError] = useState(false);

  const handleChange = (event) => {
    const value = event.target.value;
    setDate(value);
    const regex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/;
    setError(!regex.test(value));
  };

  const handleClose = () => {
    setShowErrorMessage(false);
    setShowSuccessMessage(false);
    setDate('');
    setError(false);
    onClose(false);
  };

  const handleModelExecution = async () => {
    if (date.length === 0) {
      setError(true);
      return;
    }
    if (error) return;

    const isDsl = modelType === 'DSL' || modelType === 'PYTHON';
    const serviceURL = isDsl ? '/model/execute/dsl' : '/model/execute';

    try {
      const payload = { date };
      const response = await dataloaderApi.post(serviceURL, payload, {
        headers: { 'X-Tenant': tenant, Accept: '*/*' },
      });

      setSuccessMessage(response.data);
      setShowSuccessMessage(true);

      setTimeout(() => {
        setShowSuccessMessage(false);
        setShowErrorMessage(false);
        onClose(false);
      }, 3000);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'An unexpected error occurred.';
      setErrorMessage(msg);
      setShowErrorMessage(true);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      slots={{ transition: Slide }}
      slotProps={{ transition: { direction: 'up' } }}
      PaperProps={{
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
          disabled={!date.trim() || error}
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
          Execute Model
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExecuteModel;
