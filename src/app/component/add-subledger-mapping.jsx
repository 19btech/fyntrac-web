import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField,
  IconButton, Typography, Tooltip, Box,
  Chip, Alert, Slide, Stack, Paper,
  Popover, List, ListItemButton, ListItemText, InputAdornment,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import HighlightOffOutlinedIcon from '@mui/icons-material/HighlightOffOutlined';
import SearchIcon from '@mui/icons-material/Search';
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
  const [txPickerAnchor, setTxPickerAnchor] = useState(null);
  const [txPickerSearch, setTxPickerSearch] = useState('');
  const [subtypePickerAnchor, setSubtypePickerAnchor] = useState(null);
  const [subtypePickerSearch, setSubtypePickerSearch] = useState('');
  const filteredTransactionNames = transactionNames.filter(tx =>
    tx.toLowerCase().includes(txPickerSearch.toLowerCase())
  );
  const filteredAccountSubtypes = accountSubtypes.filter(st =>
    st.toLowerCase().includes(subtypePickerSearch.toLowerCase())
  );

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
      setTransactionName(editData.transactionName || '');
      setSign(editData.sign === 'POSITIVE' ? 'AMOUNT > 0' : (editData.sign === 'NEGATIVE' ? 'AMOUNT < 0' : (editData.sign || '')));
      setEntryType(editData.entryType || '');
      setAccountSubType(editData.accountSubType || '');
      setId(editData.id || null);
    } else {
      // Clear form fields if no editData
      setTransactionName('');
      setSign('');
      setEntryType('');
      setAccountSubType('');
      setId(null);
    }
    setShowErrorMessage(false);
    setShowSuccessMessage(false);
  }, [editData, open]);

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
    setShowErrorMessage(false);

    const backendSign = sign === 'AMOUNT > 0' ? 'POSITIVE' : (sign === 'AMOUNT < 0' ? 'NEGATIVE' : sign);

    // ── Pre-save validation ───────────────────────────────────────────────
    try {
      const allRes = await dataloaderApi.get('/subledgermapping/get/all');
      // Exclude the row being edited so self-comparison doesn't false-positive
      const existing = (allRes.data || []).filter(r => !id || r.id !== id);

      const txnLower = transactionName.toLowerCase();
      const signLower = backendSign.toLowerCase();
      const subTypeLower = accountSubType.toLowerCase();
      const entryTypeLower = entryType.toLowerCase();

      const sameTransaction = existing.filter(r => r.transactionName?.toLowerCase() === txnLower);
      const sameSign = sameTransaction.filter(r => r.sign?.toLowerCase() === signLower);
      const signLabel = signLower === 'positive' ? 'Positive' : 'Negative';
      const entryTypeLabel = entryTypeLower === 'debit' ? 'Debit' : 'Credit';

      // Rule 3: Exact duplicate — everything identical
      const isExactDuplicate = sameSign.some(
        r => r.entryType?.toLowerCase() === entryTypeLower && r.accountSubType?.toLowerCase() === subTypeLower
      );
      if (isExactDuplicate) {
        setErrorMessage(`This posting rule already exists for '${transactionName}' (${signLabel}, ${entryTypeLabel}, ${accountSubType}).`);
        setShowErrorMessage(true);
        return;
      }

      // Rule 1: Same transaction + criteria + entry type already exists (different subtype)
      const hasSameEntryType = sameSign.some(r => r.entryType?.toLowerCase() === entryTypeLower);
      if (hasSameEntryType) {
        setErrorMessage(`A ${entryTypeLabel} entry for '${transactionName}' (${signLabel}) already exists.`);
        setShowErrorMessage(true);
        return;
      }

      // Rule 2: Debit and Credit for same transaction + criteria share the same account subtype
      const oppositeEntryType = entryTypeLower === 'debit' ? 'credit' : 'debit';
      const sharesSubType = sameSign.some(
        r => r.entryType?.toLowerCase() === oppositeEntryType && r.accountSubType?.toLowerCase() === subTypeLower
      );
      if (sharesSubType) {
        setErrorMessage(`Debit and Credit entries for '${transactionName}' (${signLabel}) cannot share the same account subtype.`);
        setShowErrorMessage(true);
        return;
      }
    } catch (validationErr) {
      console.error('Pre-save validation fetch failed:', validationErr);
      // If validation fetch fails, proceed with save rather than blocking the user
    }

    try {
      await dataloaderApi.post(serviceURL, {
        transactionName: transactionName,
        sign: backendSign,
        entryType: entryType,
        accountSubType: accountSubType,
        id: id
      });

      // Auto-create opposite entry (flip sign and entry type) for new mappings only
      if (!id) {
        const oppositeSign = backendSign === 'POSITIVE' ? 'NEGATIVE' : 'POSITIVE';
        const oppositeEntryType = entryType === 'DEBIT' ? 'CREDIT' : 'DEBIT';
        try {
          await dataloaderApi.post(serviceURL, {
            transactionName: transactionName,
            sign: oppositeSign,
            entryType: oppositeEntryType,
            accountSubType: accountSubType,
          });
        } catch (oppositeErr) {
          console.warn('Opposite entry could not be created (may already exist):', oppositeErr);
        }
      }

      setSuccessMessage('Mapping saved successfully.');
      setShowSuccessMessage(true);

      setTimeout(() => {
        setShowSuccessMessage(false);
        setShowErrorMessage(false);
        onClose(true);
      }, 2000);
    } catch (error) {
      console.error('Submission failed:', error);

      if (error.response && error.response.status === 400) {
        const errorList = error.response.data;

        const formattedMessage = Array.isArray(errorList)
          ? errorList.map(err => err.message).join(' | ')
          : "Invalid input. Please check your data.";

        setErrorMessage(formattedMessage);
      } else {
        setErrorMessage("Server error. Please try again later.");
      }
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
          <TextField
            fullWidth label="Transaction Name" required size="small"
            value={transactionName}
            onClick={(e) => { setTxPickerAnchor(e.currentTarget); setTxPickerSearch(''); }}
            inputProps={{ readOnly: true, style: { cursor: 'pointer', fontSize: '0.9rem', fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif' } }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5, bgcolor: 'background.paper', fontSize: '0.9rem' }, '& .MuiInputLabel-root': { fontSize: '0.9rem' } }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: 'text.disabled' }} /></InputAdornment>,
              endAdornment: transactionName ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={(e) => { e.stopPropagation(); setTransactionName(''); }} sx={{ color: 'text.disabled', '&:hover': { color: 'error.main' } }}>
                    <HighlightOffOutlinedIcon sx={{ fontSize: '0.95rem' }} />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
          />
          <Popover
            open={Boolean(txPickerAnchor)} anchorEl={txPickerAnchor}
            onClose={() => setTxPickerAnchor(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            slotProps={{ paper: { sx: { mt: 0.75, width: txPickerAnchor?.offsetWidth, borderRadius: 3, boxShadow: '0 8px 32px rgba(15,23,42,0.16)', border: '1px solid', borderColor: 'divider', overflow: 'hidden' } } }}
          >
            <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: alpha(theme.palette.divider, 0.6) }}>
              <TextField autoFocus fullWidth size="small" placeholder="Search transactions..."
                value={txPickerSearch} onChange={(e) => setTxPickerSearch(e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: 'text.disabled' }} /></InputAdornment> }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Box>
            <List dense disablePadding sx={{ maxHeight: 280, overflow: 'auto' }}>
              {filteredTransactionNames.length === 0 ? (
                <ListItemButton disabled sx={{ justifyContent: 'center', py: 2.5 }}>
                  <Typography variant="caption" color="text.disabled">No transactions found.</Typography>
                </ListItemButton>
              ) : filteredTransactionNames.map((tx) => (
                <ListItemButton key={tx} selected={tx === transactionName}
                  onClick={() => { setTransactionName(tx); setTxPickerAnchor(null); }}
                  sx={{ py: 1, px: 2, '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.06) }, '&.Mui-selected': { bgcolor: alpha(theme.palette.primary.main, 0.1) } }}
                >
                  <ListItemText primary={tx} primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 500, fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif' }} />
                </ListItemButton>
              ))}
            </List>
          </Popover>

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
                  const activeColor = isNeg ? '#dc2626' : '#16a34a';
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
                        bgcolor: selected ? alpha(activeColor, 0.12) : alpha(theme.palette.grey[500], 0.08),
                        color: selected ? activeColor : 'text.secondary',
                        border: '1.5px solid',
                        borderColor: selected ? activeColor : alpha(theme.palette.text.secondary, 0.2),
                        '& .MuiChip-icon': { color: activeColor },
                        '&:hover': {
                          bgcolor: selected ? alpha(activeColor, 0.18) : alpha(activeColor, 0.06),
                          borderColor: activeColor,
                          color: activeColor,
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
                  const activeColor = '#1d4ed8';
                  return (
                    <Chip
                      key={et}
                      label={et === 'DEBIT' ? 'Debit' : 'Credit'}
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
                        bgcolor: selected ? alpha(activeColor, 0.10) : alpha(theme.palette.grey[500], 0.08),
                        color: selected ? activeColor : 'text.secondary',
                        border: '1.5px solid',
                        borderColor: selected ? activeColor : alpha(theme.palette.text.secondary, 0.2),
                        '& .MuiChip-icon': { color: activeColor },
                        '&:hover': {
                          bgcolor: selected ? alpha(activeColor, 0.16) : alpha(activeColor, 0.06),
                          borderColor: activeColor,
                          color: activeColor,
                        },
                      }}
                    />
                  );
                })}
              </Box>
            </Paper>
          </Stack>

          {/* Account Subtype */}
          <TextField
            fullWidth label="Account Subtype" required size="small"
            value={accountSubType}
            onClick={(e) => { setSubtypePickerAnchor(e.currentTarget); setSubtypePickerSearch(''); }}
            inputProps={{ readOnly: true, style: { cursor: 'pointer', fontSize: '0.9rem', fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif' } }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5, bgcolor: 'background.paper', fontSize: '0.9rem' }, '& .MuiInputLabel-root': { fontSize: '0.9rem' } }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: 'text.disabled' }} /></InputAdornment>,
              endAdornment: accountSubType ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={(e) => { e.stopPropagation(); setAccountSubType(''); }} sx={{ color: 'text.disabled', '&:hover': { color: 'error.main' } }}>
                    <HighlightOffOutlinedIcon sx={{ fontSize: '0.95rem' }} />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
          />
          <Popover
            open={Boolean(subtypePickerAnchor)} anchorEl={subtypePickerAnchor}
            onClose={() => setSubtypePickerAnchor(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            slotProps={{ paper: { sx: { mt: 0.75, width: subtypePickerAnchor?.offsetWidth, borderRadius: 3, boxShadow: '0 8px 32px rgba(15,23,42,0.16)', border: '1px solid', borderColor: 'divider', overflow: 'hidden' } } }}
          >
            <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: alpha(theme.palette.divider, 0.6) }}>
              <TextField autoFocus fullWidth size="small" placeholder="Search subtypes..."
                value={subtypePickerSearch} onChange={(e) => setSubtypePickerSearch(e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: 'text.disabled' }} /></InputAdornment> }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Box>
            <List dense disablePadding sx={{ maxHeight: 280, overflow: 'auto' }}>
              {filteredAccountSubtypes.length === 0 ? (
                <ListItemButton disabled sx={{ justifyContent: 'center', py: 2.5 }}>
                  <Typography variant="caption" color="text.disabled">No subtypes found.</Typography>
                </ListItemButton>
              ) : filteredAccountSubtypes.map((st) => (
                <ListItemButton key={st} selected={st === accountSubType}
                  onClick={() => { setAccountSubType(st); setSubtypePickerAnchor(null); }}
                  sx={{ py: 1, px: 2, '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.06) }, '&.Mui-selected': { bgcolor: alpha(theme.palette.primary.main, 0.1) } }}
                >
                  <ListItemText primary={st} primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 500, fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif' }} />
                </ListItemButton>
              ))}
            </List>
          </Popover>
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
