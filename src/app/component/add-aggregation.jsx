import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField,
  IconButton, Typography, Tooltip, Box, Stack,
  Chip, Alert, Slide, Collapse,
  Popover, List, ListItemButton, ListItemText, InputAdornment, Checkbox,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import HighlightOffOutlinedIcon from '@mui/icons-material/HighlightOffOutlined';
import CheckIcon from '@mui/icons-material/Check';
import SearchIcon from '@mui/icons-material/Search';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import SwapVertRoundedIcon from '@mui/icons-material/SwapVertRounded';
import { dataloaderApi } from '../services/api-client';
import { AppSwitch } from '../user-management/ui';
import { useTenant } from "../tenant-context";
import { apiErrorMessage } from './rules-shared';

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
  const [txPickerAnchor, setTxPickerAnchor] = useState(null);
  const [txPickerSearch, setTxPickerSearch] = useState('');
  // Per transaction: reverse the sign of its amounts in this balance (default false).
  const [signReversal, setSignReversal] = useState({});

  // What this dialog has already saved, so a retry after a partial failure only re-sends the rest:
  // created = { [tx]: signReversal } for records added here; flags = { [tx]: signReversal } for updates.
  const [committed, setCommitted] = useState({ created: {}, flags: {} });
  const anySaved = React.useRef(false);

  // Saved records of the balance being edited, by transaction name: { id, signReversal }.
  const savedTransactions = React.useMemo(() => {
    const map = {};
    (editData?.transactions || []).forEach((t) => { map[t.name] = { id: t.id, signReversal: t.signReversal === true }; });
    return map;
  }, [editData]);

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
      setSignReversal(Object.fromEntries((editData.transactions || []).map((t) => [t.name, t.signReversal === true])));
    } else {
      // Clear form fields if no editData (e.g., for adding new transaction)
      setSelectedTransactions([]);
      setMetricName('');
      setId(null);
      setSignReversal({});
    }
    setErrorSnackbar({ open: false, message: '' });
    setCommitted({ created: {}, flags: {} });
    anySaved.current = false;
  }, [editData, open]);

  React.useEffect(() => {
    if (!errorSnackbar.open) return;
    const t = setTimeout(() => setErrorSnackbar(s => ({ ...s, open: false })), 5000);
    return () => clearTimeout(t);
  }, [errorSnackbar.open]);

  const fetchTransactionNames = () => {

    dataloaderApi.get(serviceGetTransactionNamesURL)
      .then(response => {
        setTransactionNames(Array.isArray(response.data) ? response.data : []);
      })
      .catch(error => {
        setErrorSnackbar({ open: true, message: apiErrorMessage(error, 'Transactions could not be loaded. Close and try again.') });
      });
  };

  const errorText = (error) => apiErrorMessage(error,
    error?.response?.status === 400 ? 'Invalid input. Please check your data.' : 'Server error. Please try again later.');

  const handleAddAggregation = async () => {
    const committedNames = Object.keys(committed.created);
    // Everything already stored for this balance: the edited balance's records plus any this dialog saved.
    const originalTransactions = [
      ...(isEditMode ? (editData.transactionNames || (editData.transactionName ? [editData.transactionName] : [])) : []),
      ...committedNames,
    ];
    const savedFlag = (tx) => (tx in committed.flags ? committed.flags[tx]
      : tx in committed.created ? committed.created[tx]
        : savedTransactions[tx]?.signReversal === true);

    // Transactions the user removed from the stored list
    const toDelete = originalTransactions.filter(tx => !selectedTransactions.includes(tx));
    if (toDelete.length > 0) {
      setErrorSnackbar({ open: true, message: `Removing transactions (${toDelete.join(', ')}) requires a backend delete endpoint — please raise this with your backend team.` });
      return;
    }

    // Only POST transactions that aren't stored yet
    const toCreate = selectedTransactions.filter(tx => !originalTransactions.includes(tx));
    // Stored transactions whose sign reversal was switched: re-post that record (same id).
    const toUpdate = selectedTransactions.filter(
      tx => originalTransactions.includes(tx) && (signReversal[tx] === true) !== savedFlag(tx)
    );

    const missingIds = toUpdate.filter(tx => savedTransactions[tx]?.id == null);
    if (missingIds.length > 0) {
      setErrorSnackbar({ open: true, message: `Changing sign reversal for ${missingIds.join(', ')} needs the record id from the backend — please raise this with your backend team.` });
      return;
    }

    if (toCreate.length === 0 && toUpdate.length === 0) {
      // Nothing left to save — close (refreshing the list if this dialog saved anything)
      onClose(anySaved.current);
      return;
    }

    // The name is fixed once records exist (edit mode, or after a partial save), so every record
    // of this balance shares it.
    const metric = isEditMode ? editData.metricName : metricName.trim();
    const requests = [
      ...toCreate.map((tx) => ({ tx, kind: 'create', body: { transactionName: tx, metricName: metric, id: null, signReversal: signReversal[tx] === true } })),
      ...toUpdate.map((tx) => ({ tx, kind: 'update', body: { transactionName: tx, metricName: metric, id: savedTransactions[tx].id, signReversal: signReversal[tx] === true } })),
    ];

    // Each record is saved independently; record what succeeded before reporting what failed.
    const results = await Promise.allSettled(requests.map((r) => dataloaderApi.post(serviceURL, r.body)));
    const next = { created: { ...committed.created }, flags: { ...committed.flags } };
    const failed = [];
    let firstError = null;
    results.forEach((result, i) => {
      const { tx, kind, body } = requests[i];
      if (result.status === 'fulfilled') {
        if (kind === 'create') next.created[tx] = body.signReversal;
        else next.flags[tx] = body.signReversal;
        anySaved.current = true;
      } else {
        console.error(`Saving ${tx} failed:`, result.reason);
        failed.push(tx);
        firstError = firstError ?? result.reason;
      }
    });
    setCommitted(next);

    if (failed.length === 0) {
      onClose(true);
      return;
    }
    const savedCount = requests.length - failed.length;
    setErrorSnackbar({
      open: true,
      message: `${savedCount > 0 ? `Saved ${savedCount} of ${requests.length}. ` : ''}Could not save ${failed.join(', ')}: ${errorText(firstError)}${savedCount > 0 ? ' Saving again retries only these.' : ''}`,
    });
  };


  const handleClose = () => {
    // Refresh the list if part of this balance was saved before closing.
    onClose(anySaved.current);
  };

  const isEditMode = !!editData;
  
  // Strictly alphanumeric and underscores, NO SPACES (Matches backend AggregationValidator constraint)
  const metricRegex = /^[a-zA-Z0-9_]+$/;
  const isMetricEmpty = !metricName.trim();
  const isMetricFormatValid = isMetricEmpty || metricRegex.test(metricName);
  // Renaming would split the balance (stored records keep the old name), so lock it once records exist.
  const metricLocked = isEditMode || Object.keys(committed.created).length > 0;
  
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

          {(() => {
            const chipSx = { height: 22, fontSize: '0.72rem', fontWeight: 700, borderRadius: 1.5, fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif', bgcolor: 'rgba(22,163,74,0.1)', color: '#15803d', border: '1px solid rgba(22,163,74,0.28)', '& .MuiChip-deleteIcon': { fontSize: '14px', color: '#15803d', '&:hover': { color: '#166534' } } };
            const GREEN = '#15803d';
            const filteredTx = transactionNames.filter(tx => tx.toLowerCase().includes(txPickerSearch.toLowerCase()));
            const cbUnchecked = <Box sx={{ width: 16, height: 16, borderRadius: '3px', border: '1.5px solid', borderColor: 'action.disabled', flexShrink: 0 }} />;
            const cbChecked = <Box sx={{ width: 16, height: 16, borderRadius: '3px', bgcolor: GREEN, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><CheckIcon sx={{ fontSize: 11, color: '#fff' }} /></Box>;
            const cbIndet = <Box sx={{ width: 16, height: 16, borderRadius: '3px', bgcolor: GREEN, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Box sx={{ width: 8, height: 1.5, bgcolor: '#fff', borderRadius: '1px' }} /></Box>;
            return (
              <>
                <TextField
                  fullWidth size="small"
                  label="Transaction Name(s)"
                  required
                  value=""
                  onClick={(e) => { setTxPickerAnchor(e.currentTarget); setTxPickerSearch(''); }}
                  inputProps={{ readOnly: true, style: { width: selectedTransactions.length > 0 ? 0 : undefined, padding: selectedTransactions.length > 0 ? 0 : undefined, cursor: 'pointer', fontSize: '0.9rem', fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif' } }}
                  InputLabelProps={{ shrink: true, style: { fontSize: '0.9rem', fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif' } }}
                  InputProps={{
                    startAdornment: selectedTransactions.length > 0
                      ? selectedTransactions.map((tx, i) => <Chip key={i} label={tx} size="small" sx={chipSx} onDelete={(e) => { e.stopPropagation(); setSelectedTransactions(prev => prev.filter((_, idx) => idx !== i)); }} />)
                      : <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: 'text.disabled' }} /></InputAdornment>,
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5, bgcolor: 'background.paper', ...(selectedTransactions.length > 0 && { flexWrap: 'wrap', gap: 0.5, pt: 2.5, pb: 0.75 }) } }}
                />
                <Popover
                  open={Boolean(txPickerAnchor)} anchorEl={txPickerAnchor}
                  onClose={() => setTxPickerAnchor(null)}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                  slotProps={{ paper: { sx: { mt: 0.75, width: txPickerAnchor?.offsetWidth, borderRadius: 3, boxShadow: '0 8px 32px rgba(15,23,42,0.16)', border: '1px solid', borderColor: 'divider', overflow: 'hidden' } } }}
                >
                  <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: alpha(theme.palette.divider, 0.6) }}>
                    <TextField autoFocus fullWidth size="small" placeholder="Search transactions…"
                      value={txPickerSearch} onChange={(e) => setTxPickerSearch(e.target.value)}
                      InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: 'text.disabled' }} /></InputAdornment> }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                  </Box>
                  <List dense disablePadding sx={{ maxHeight: 280, overflow: 'auto' }}>
                    {filteredTx.length > 0 && (
                      <ListItemButton onClick={() => { const allSel = filteredTx.every(tx => selectedTransactions.includes(tx)); setSelectedTransactions(prev => allSel ? prev.filter(tx => !filteredTx.includes(tx)) : [...prev, ...filteredTx.filter(tx => !prev.includes(tx))]); }} sx={{ py: 0.75, px: 1, borderBottom: '1px solid', borderColor: alpha(theme.palette.divider, 0.5), bgcolor: 'rgba(22,163,74,0.02)' }}>
                        <Checkbox checked={filteredTx.length > 0 && filteredTx.every(tx => selectedTransactions.includes(tx))} indeterminate={filteredTx.some(tx => selectedTransactions.includes(tx)) && !filteredTx.every(tx => selectedTransactions.includes(tx))} size="small" disableRipple icon={cbUnchecked} checkedIcon={cbChecked} indeterminateIcon={cbIndet} sx={{ p: 0.5 }} />
                        <ListItemText primary="Select All" primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 700 }} />
                      </ListItemButton>
                    )}
                    {filteredTx.length === 0
                      ? <ListItemButton disabled sx={{ justifyContent: 'center', py: 2.5 }}><Typography variant="caption" color="text.disabled">No transactions found.</Typography></ListItemButton>
                      : filteredTx.map(tx => {
                          const sel = selectedTransactions.includes(tx);
                          return (
                            <ListItemButton key={tx} onClick={() => setSelectedTransactions(prev => sel ? prev.filter(t => t !== tx) : [...prev, tx])} sx={{ py: 0.5, px: 1, '&:hover': { bgcolor: 'rgba(22,163,74,0.06)' } }}>
                              <Checkbox checked={sel} size="small" disableRipple icon={cbUnchecked} checkedIcon={cbChecked} sx={{ p: 0.5 }} />
                              <ListItemText primary={tx} primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: sel ? 600 : 400, color: sel ? '#15803d' : 'text.primary', fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif' }} />
                            </ListItemButton>
                          );
                        })
                    }
                  </List>
                </Popover>

                {selectedTransactions.length > 0 && (
                  <Box sx={{ borderRadius: 2.5, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', overflow: 'hidden' }}>
                    <Box sx={{ px: 2, py: 1.25, borderBottom: '1px solid', borderColor: 'divider', bgcolor: alpha(theme.palette.grey[500], 0.04) }}>
                      <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: 'text.primary' }}>Sign Reversal</Typography>
                      <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary' }}>
                        Reverse the sign of a transaction's amounts when it rolls into this balance.
                      </Typography>
                    </Box>
                    <Box sx={{ maxHeight: 220, overflow: 'auto' }}>
                      {selectedTransactions.map((tx) => {
                        const reversed = signReversal[tx] === true;
                        return (
                          <Box key={tx} sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 0.5, '&:not(:last-of-type)': { borderBottom: '1px solid', borderColor: alpha(theme.palette.divider, 0.6) } }}>
                            {reversed && <SwapVertRoundedIcon sx={{ fontSize: 16, color: '#b45309' }} />}
                            <Typography noWrap sx={{ flex: 1, minWidth: 0, fontSize: '0.82rem', fontWeight: 600, color: reversed ? '#b45309' : 'text.primary' }}>{tx}</Typography>
                            <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: 'text.secondary', minWidth: 52, textAlign: 'right' }}>
                              {reversed ? 'Reversed' : 'As is'}
                            </Typography>
                            <AppSwitch
                              checked={reversed}
                              onChange={(e) => setSignReversal((prev) => ({ ...prev, [tx]: e.target.checked }))}
                              slotProps={{ input: { 'aria-label': `Reverse sign for ${tx}` } }}
                            />
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>
                )}
              </>
            );
          })()}

          <TextField
            label="Metric Name"
            fullWidth
            required
            size="small"
            value={metricName}
            onChange={(e) => setMetricName(e.target.value)}
            disabled={metricLocked}
            error={!metricLocked && !isMetricFormatValid}
            helperText={metricLocked
              ? "The metric name can't be changed once the balance has been saved."
              : !isMetricFormatValid ? "Only alphanumeric and underscores allowed. Spaces not permitted." : ""}
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
