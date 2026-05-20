import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField,
  IconButton, Typography, Tooltip, Box, Stack,
  Chip, Alert, Slide, Paper,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import HighlightOffOutlinedIcon from '@mui/icons-material/HighlightOffOutlined';
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined';
import CheckIcon from '@mui/icons-material/Check';
import { dataloaderApi } from '../services/api-client';
import { useTenant } from "../tenant-context";

const AddAccountTypeDialog = ({ open, onClose, editData }) => {
  const { tenant } = useTenant();
  const theme = useTheme();
  const [accountSubType, setAccountSubType] = useState('');
  const [accountType, setAccountType] = useState('BALANCESHEET');
  const [id, setId] = useState(null);
  const [showErrorMessage, setShowErrorMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const defaultAccountTypes = ['BALANCESHEET', 'INCOMESTATEMENT', 'CLEARING'];
  const accountTypeLabels = {
    BALANCESHEET: 'Balance Sheet',
    INCOMESTATEMENT: 'Income Statement',
    CLEARING: 'Clearing',
  };

  const serviceURL = '/accounttype/add';

  React.useEffect(() => {
    if (editData) {
      setAccountSubType(editData.accountSubType);
      setAccountType(editData.accountType);
      setId(editData.id);
    } else {
      setAccountSubType('');
      setAccountType('BALANCESHEET');
      setId(null);
    }
    setShowErrorMessage(false);
  }, [editData, open]);

  const handleAccountType = async () => {
    setShowErrorMessage(false);
    const oldSubtype = editData ? editData.accountSubType : null;
    const newSubtype = accountSubType.trim();
    const subtypeChanged = !!editData && oldSubtype && oldSubtype !== newSubtype;

    try {
      await dataloaderApi.post(serviceURL, {
        accountSubType: newSubtype,
        accountType,
        id,
      });

      if (subtypeChanged) {
        // Cascade-update subledger mapping and chart of account entries that reference the old subtype
        try {
          const [smlRes, coaRes] = await Promise.all([
            dataloaderApi.get('/subledgermapping/get/all'),
            dataloaderApi.get('/chartofaccount/get/all'),
          ]);

          const oldSubtypeLower = oldSubtype.toLowerCase();

          const smlUpdates = (smlRes.data || [])
            .filter(s => s.accountSubType?.toLowerCase() === oldSubtypeLower)
            .map(sml => dataloaderApi.post('/subledgermapping/add', {
              transactionName: sml.transactionName,
              sign: sml.sign,
              entryType: sml.entryType,
              accountSubType: newSubtype,
              id: sml.id,
            }));

          const coaUpdates = (coaRes.data || [])
            .filter(c => c.accountSubtype?.toLowerCase() === oldSubtypeLower)
            .map(c => dataloaderApi.post('/chartofaccount/add', {
              id: c.id,
              accountNumber: c.accountNumber,
              accountName: c.accountName,
              accountSubtype: newSubtype,
              attributes: c.attributes || {},
            }));

          await Promise.all([...smlUpdates, ...coaUpdates]);
          onClose(true);
        } catch (cascadeErr) {
          console.error('Cascade update failed:', cascadeErr);
          setErrorMessage('Account type saved, but related subledger mapping and chart of account references could not be updated automatically. Please update them manually.');
          setShowErrorMessage(true);
          // Don\'t close — user can close via X (editData will trigger refresh)
        }
      } else {
        onClose(true);
      }
    } catch (error) {
      console.error('Submission failed:', error);
      const status = error.response?.status;
      const responseText = JSON.stringify(error.response?.data ?? '').toLowerCase();
      const isDuplicate =
        status === 409 ||
        responseText.includes('duplicate') ||
        responseText.includes('already exists') ||
        responseText.includes('unique');

      if (isDuplicate) {
        setErrorMessage('Duplicate account subtype found. Account subtypes must be unique.');
      } else if (status === 400) {
        const errorList = error.response.data;
        const formattedMessage = Array.isArray(errorList)
          ? errorList.map(err => err.message).join(' | ')
          : 'Invalid input. Please check your data.';
        setErrorMessage(formattedMessage);
      } else {
        setErrorMessage('Server error. Please try again later.');
      }
      setShowErrorMessage(true);
    }
  };

  const handleClose = () => {
    setShowErrorMessage(false);
    onClose(false);
  };

  const isEditMode = !!editData;
  const subtypeRegex = /^[a-zA-Z0-9_ ]+$/;
  const isSubtypeEmpty = !accountSubType.trim();
  const hasDoubleSpace = accountSubType.includes('  ');
  const hasEdgeSpaces = accountSubType.length > 0 && accountSubType.trim() !== accountSubType;
  const isSubtypeFormatValid = isSubtypeEmpty || (subtypeRegex.test(accountSubType) && !hasDoubleSpace && !hasEdgeSpaces);
  const canSave = !isSubtypeEmpty && isSubtypeFormatValid && !!accountType;

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
          '& .MuiTypography-root, & .MuiInputBase-root, & .MuiButton-root, & .MuiChip-root, & .MuiFormHelperText-root, & *': {
          fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
          },
          },
        },
      }}
    >
      <DialogTitle sx={{ p: 0, flexShrink: 0 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            px: 3, pt: 3, pb: 2.5,
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
                  icon={<AccountBalanceOutlinedIcon sx={{ fontSize: '12px !important' }} />}
                  label="Account Type"
                  size="small"
                  sx={{
                    height: 20, fontSize: '0.6rem', fontWeight: 700,
                    letterSpacing: 0.8, textTransform: 'uppercase',
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main, borderRadius: 1,
                  }}
                />
                {isEditMode && (
                  <Chip label="Edit Mode" size="small" sx={{
                    height: 20, fontSize: '0.6rem', fontWeight: 700,
                    letterSpacing: 0.8, textTransform: 'uppercase',
                    bgcolor: alpha(theme.palette.warning.main, 0.1),
                    color: theme.palette.warning.dark, borderRadius: 1,
                  }} />
                )}
              </Box>
              <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.2, color: 'text.primary' }}>
                {isEditMode ? 'Edit' : 'Add'} Account Type
              </Typography>
            </Box>
          </Box>
          <Tooltip title="Close" placement="left">
            <IconButton onClick={handleClose} size="small" sx={{
              color: 'text.secondary', bgcolor: 'action.hover', borderRadius: 2,
              '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.12), color: 'error.main' },
            }}>
              <HighlightOffOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0, bgcolor: alpha(theme.palette.grey[500], 0.03) }}>
        <Box sx={{ px: 3.5, pt: 3, pb: 2.5, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {showErrorMessage && (
            <Alert severity="error" variant="outlined" sx={{ borderRadius: 2.5, py: 0.5, fontSize: '0.8rem', bgcolor: 'rgba(220,38,38,0.08)', borderColor: 'rgba(220,38,38,0.35)' }}>
              {String(errorMessage) || 'An error occurred.'}
            </Alert>
          )}

          <TextField
            label="Account Subtype"
            fullWidth
            required
            size="small"
            value={accountSubType}
            onChange={(e) => setAccountSubType(e.target.value)}
            placeholder="e.g. Equity, Revenue..."
            error={!isSubtypeFormatValid}
            helperText={!isSubtypeFormatValid
              ? (hasDoubleSpace ? 'Double spacing is not allowed.' : hasEdgeSpaces ? 'Leading or trailing spaces are not allowed.' : 'Special characters are not allowed.')
              : ''}
            inputProps={{ style: { fontSize: '0.9rem', fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif' } }}
            InputLabelProps={{ style: { fontSize: '0.9rem', fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif' } }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5, bgcolor: 'background.paper' } }}
          />

          {/* Account Type chip selector */}
          <Paper elevation={0} sx={{
            borderRadius: 3,
            border: '1px solid',
            borderColor: alpha(theme.palette.divider, 0.7),
            bgcolor: 'background.paper',
            overflow: 'hidden',
          }}>
            <Box sx={{
              px: 2.5, py: 1.25,
              borderBottom: '1px solid',
              borderColor: alpha(theme.palette.divider, 0.6),
              bgcolor: alpha(theme.palette.primary.main, 0.025),
            }}>
              <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.7, color: 'text.secondary', fontSize: '0.67rem' }}>
                Account Type
              </Typography>
            </Box>
            <Box sx={{ px: 2.5, py: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {defaultAccountTypes.map((type) => {
                const selected = accountType === type;
                return (
                  <Chip
                    key={type}
                    label={accountTypeLabels[type] || type}
                    icon={selected ? <CheckIcon sx={{ fontSize: '13px !important' }} /> : undefined}
                    onClick={() => setAccountType(type)}
                    size="small"
                    sx={{
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
                      letterSpacing: 0.2,
                      height: 28,
                      borderRadius: 2,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      bgcolor: selected ? alpha('#16a34a', 0.12) : alpha(theme.palette.grey[500], 0.08),
                      color: selected ? '#16a34a' : 'text.secondary',
                      border: '1.5px solid',
                      borderColor: selected ? '#16a34a' : alpha(theme.palette.text.secondary, 0.2),
                      '& .MuiChip-icon': { color: '#16a34a' },
                      '&:hover': {
                        bgcolor: selected ? alpha('#16a34a', 0.18) : alpha('#16a34a', 0.06),
                        borderColor: '#16a34a',
                        color: '#16a34a',
                      },
                    }}
                  />
                );
              })}
            </Box>
          </Paper>
        </Box>
      </DialogContent>

      <DialogActions sx={{
        px: 3.5, py: 2, borderTop: '1px solid', borderColor: 'divider',
        bgcolor: 'background.paper', justifyContent: 'flex-end', gap: 1.25,
      }}>
        <Button onClick={handleAccountType} variant="contained" disabled={!canSave} sx={{
          borderRadius: 2, textTransform: 'none', fontWeight: 700, minWidth: 130, px: 3,
          background: '#14213d', color: '#fff', boxShadow: '0 6px 16px rgba(20,33,61,0.35)',
          '&:hover': { background: '#0d1628', boxShadow: '0 8px 22px rgba(20,33,61,0.45)' },
          '&.Mui-disabled': { background: 'rgba(20,33,61,0.35)', color: '#fff', boxShadow: 'none' },
        }}>
          {isEditMode ? 'Update Account Type' : 'Save Account Type'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddAccountTypeDialog;
