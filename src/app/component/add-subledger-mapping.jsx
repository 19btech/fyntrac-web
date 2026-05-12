import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Autocomplete,
  IconButton, Typography, Tooltip, Box,
  Chip, Alert, Slide, Stack, Paper,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import HighlightOffOutlinedIcon from '@mui/icons-material/HighlightOffOutlined';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import CheckIcon from '@mui/icons-material/Check';
import { dataloaderApi } from '../services/api-client';
import { useTenant } from "../tenant-context";

const AddSubledgerMappingDialog = ({ open, onClose, editData }) => {
  const { tenant } = useTenant();
  const theme = useTheme();
  const [transactionName, setTransactionName] = useState('');
  const [sign, setSign] = useState('');
  const [entryType, setEntryType] = useState('');
  const [accountSubType, setAccountSubType] = useState('');
  const [id, setId] = useState(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showErrorMessage, setShowErrorMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [accountSubtypes, setAccountSubtypes] = useState([]);
  const [transactionNames, setTransactionNames] = useState([]);
  const [signs, setSigns] = useState(['AMOUNT < 0', 'AMOUNT > 0']);
  const [entryTypes, setEntryTypes] = useState(['DEBIT', 'CREDIT']);

  const serviceURL = '/subledgermapping/add';
  const sericeGetSubTypeURL = '/accounttype/get/subtypes'
  const serviceGetTransactionNamesURL = '/transaction/get/transactions'

  React.useEffect(() => {
    if (accountSubtypes.length === 0) {
      fetchAccountSubtypes();
    }

    if (transactionNames.length === 0) {
      fetchTransactionNames();
    }

    if (editData) {
      // Populate form fields with editData if provided
      setTransactionName(editData.transactionName);
      setSign(editData.sign);
      setEntryType(editData.entryType);
      setAccountSubType(editData.accountSubType);
      setId(editData.id);
    } else {
      // Clear form fields if no editData (eaccountSubtypes.g., for adding new transaction)
      setTransactionName('');
      setSign('');
      setEntryType('');
      setAccountSubType('');
    }
  }, [editData]);

  const fetchAccountSubtypes = () => {
    console.log('Tenant...', tenant);
    dataloaderApi.get(sericeGetSubTypeURL)
      .then(response => {
        setAccountSubtypes(response.data);
        // Handle success response if needed
      })
      .catch(error => {
        // Handle error if needed
      });
  };

  const fetchTransactionNames = () => {

    dataloaderApi.get(serviceGetTransactionNamesURL)
      .then(response => {
        setTransactionNames(response.data);
      })
      .catch(error => {
        // Handle error if needed
      });
  };

  const handleAddSubledgerMapping = async () => {
    try {
      const response = await dataloaderApi.post(serviceURL, {
        transactionName: transactionName,
        sign: sign,
        entryType: entryType,
        accountSubType: accountSubType,
        id: id
      }
      );
      setSuccessMessage(response.data);
      setShowSuccessMessage(true);

      setTimeout(() => {
        setShowSuccessMessage(false);
        setShowErrorMessage(false);
        onClose(false);
      }, 3000);
    } catch (error) {
      // Handle error if needed
      setErrorMessage(error);
      setShowErrorMessage(true);

    }
  };


  const handleClose = () => {
    setShowErrorMessage(false);
    setShowSuccessMessage(false);
    onClose(false);
  };

  const isEditMode = !!editData;
  const canSave = transactionName && sign && entryType && accountSubType;

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
                  icon={<AccountTreeOutlinedIcon sx={{ fontSize: '12px !important' }} />}
                  label="Subledger Mapping"
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
                {isEditMode ? 'Edit' : 'Add'} Subledger Mapping
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
          {showSuccessMessage && (
            <Alert severity="success" variant="outlined" sx={{ borderRadius: 2.5, py: 0.5, fontSize: '0.8rem', bgcolor: 'rgba(22,163,74,0.08)', borderColor: 'rgba(22,163,74,0.35)' }}>
              {successMessage || 'Mapping saved successfully.'}
            </Alert>
          )}
          {showErrorMessage && (
            <Alert severity="error" variant="outlined" sx={{ borderRadius: 2.5, py: 0.5, fontSize: '0.8rem', bgcolor: 'rgba(220,38,38,0.08)', borderColor: 'rgba(220,38,38,0.35)' }}>
              {String(errorMessage) || 'An error occurred.'}
            </Alert>
          )}

          {/* Transaction Name */}
          <Autocomplete
            fullWidth disablePortal
            options={transactionNames}
            value={transactionName}
            getOptionLabel={(option) => option}
            onChange={(event, newValue) => setTransactionName(newValue)}
            renderOption={(props, option) => (
              <Box component="li" {...props} sx={{ fontSize: '0.82rem !important' }}>{option}</Box>
            )}
            renderInput={(params) => (
              <TextField {...params} label="Transaction Name" required size="small"
                sx={{
                  '& .MuiOutlinedInput-root': { borderRadius: 2.5, bgcolor: 'background.paper', fontSize: '0.9rem' },
                  '& .MuiInputLabel-root': { fontSize: '0.9rem' },
                }}
              />
            )}
          />

          {/* Criteria + Entry Type chip toggles */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>

            {/* Criteria */}
            <Paper elevation={0} sx={{
              flex: 1, borderRadius: 3, border: '1px solid',
              borderColor: alpha(theme.palette.divider, 0.7), bgcolor: 'background.paper', overflow: 'hidden',
            }}>
              <Box sx={{
                px: 2, py: 1,
                borderBottom: '1px solid', borderColor: alpha(theme.palette.divider, 0.6),
                bgcolor: alpha(theme.palette.primary.main, 0.025),
              }}>
                <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.7, color: 'text.secondary', fontSize: '0.67rem' }}>
                  Criteria
                </Typography>
              </Box>
              <Box sx={{ px: 2, py: 1.5, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {signs.map((s) => {
                  const selected = sign === s;
                  const isNeg = s.includes('< 0');
                  return (
                    <Chip
                      key={s}
                      label={isNeg ? 'Negative' : 'Positive'}
                      icon={selected ? <CheckIcon sx={{ fontSize: '13px !important' }} /> : undefined}
                      onClick={() => setSign(s)}
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

            {/* Entry Type */}
            <Paper elevation={0} sx={{
              flex: 1, borderRadius: 3, border: '1px solid',
              borderColor: alpha(theme.palette.divider, 0.7), bgcolor: 'background.paper', overflow: 'hidden',
            }}>
              <Box sx={{
                px: 2, py: 1,
                borderBottom: '1px solid', borderColor: alpha(theme.palette.divider, 0.6),
                bgcolor: alpha(theme.palette.primary.main, 0.025),
              }}>
                <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.7, color: 'text.secondary', fontSize: '0.67rem' }}>
                  Entry Type
                </Typography>
              </Box>
              <Box sx={{ px: 2, py: 1.5, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {entryTypes.map((et) => {
                  const selected = entryType === et;
                  const isDebit = et === 'DEBIT';
                  return (
                    <Chip
                      key={et}
                      label={isDebit ? 'Debit' : 'Credit'}
                      icon={selected ? <CheckIcon sx={{ fontSize: '13px !important' }} /> : undefined}
                      onClick={() => setEntryType(et)}
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
          </Stack>

          {/* Account Subtype */}
          <Autocomplete
            fullWidth disablePortal
            options={accountSubtypes}
            value={accountSubType}
            getOptionLabel={(option) => option}
            onChange={(event, newValue) => setAccountSubType(newValue)}
            renderOption={(props, option) => (
              <Box component="li" {...props} sx={{ fontSize: '0.82rem !important' }}>{option}</Box>
            )}
            renderInput={(params) => (
              <TextField {...params} label="Account Subtype" required size="small"
                sx={{
                  '& .MuiOutlinedInput-root': { borderRadius: 2.5, bgcolor: 'background.paper', fontSize: '0.9rem' },
                  '& .MuiInputLabel-root': { fontSize: '0.9rem' },
                }}
              />
            )}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{
        px: 3.5, py: 2, borderTop: '1px solid', borderColor: 'divider',
        bgcolor: 'background.paper', justifyContent: 'flex-end', gap: 1.25,
      }}>
        <Button onClick={handleClose} variant="text" sx={{
          borderRadius: 2, textTransform: 'none', fontWeight: 600,
          color: 'text.secondary', px: 2.5, '&:hover': { bgcolor: 'action.hover' },
        }}>
          Cancel
        </Button>
        <Button onClick={handleAddSubledgerMapping} variant="contained" disabled={!canSave} sx={{
          borderRadius: 2, textTransform: 'none', fontWeight: 700, minWidth: 140, px: 3,
          background: '#14213d', color: '#fff', boxShadow: '0 6px 16px rgba(20,33,61,0.35)',
          '&:hover': { background: '#0d1628', boxShadow: '0 8px 22px rgba(20,33,61,0.45)' },
          '&.Mui-disabled': { background: 'rgba(20,33,61,0.35)', color: '#fff', boxShadow: 'none' },
        }}>
          {isEditMode ? 'Update Mapping' : 'Save Mapping'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddSubledgerMappingDialog;
